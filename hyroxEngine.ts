import {
  HyroxBlock,
  HyroxDivision,
  HyroxExperienceLevel,
  HyroxFrequencyOption,
  HyroxLimitantType,
  HyroxObjective,
  HyroxOnboardingData,
  HyroxPerformanceData,
  HyroxRaceCategory,
  HyroxStation,
  HyroxTrainingPlan,
  HyroxWeeklyPlan,
  HyroxWorkoutSession,
  HyroxWorkoutTemplate,
  HyroxBenchmarkBand
} from "./hyroxTypes";
import { HYROX_WORKOUT_LIBRARY, getTemplateById } from "./hyroxLibrary";
import { HYROX_BENCHMARKS, HYROX_DEBUTANTE_RANGE } from "./hyroxBenchmarks";
import { calculateBMI, parseTimeToSeconds, formatSecondsToTime } from "./engines";

export { calculateBMI };

const BAND_ORDER: HyroxBenchmarkBand[] = ["sub60", "sub65", "sub70", "sub75", "sub80", "sub85", "sub90"];

// ============================================================================
// PARTE 2 — HYROX AI DECISION ENGINE: READINESS (fórmula exacta del cerebro)
// ============================================================================

export interface HyroxDailyInput {
  date: string;
  sleepHours: number;
  sleepQuality: "bueno" | "normal" | "malo";
  stress: number;         // 1-5
  fatigueGeneral: number; // 1-5
  musclePain: number;     // 0-10
  jointPain: number;      // 0-10
  jointPainType?: "articular_tendinoso" | "nervioso" | "ninguno";
  motivation: number;     // 1-5
  prevRPE: number;        // 1-10
}

export interface HyroxReadinessResult {
  sleepScore: number;
  readinessFisico: number;
  readinessGeneral: number;
  state: "progresar" | "mantener" | "reducir" | "adaptar" | "recuperacion_activa" | "descanso";
  semaphore: "verde" | "amarillo" | "rojo";
  safetyBlocked: boolean;
  safetyReason?: string;
}

function scoreSleepHours(hours: number): number {
  if (hours >= 8) return 100;
  if (hours >= 7) return 90;
  if (hours >= 6) return 75;
  if (hours >= 5) return 50;
  return 25;
}

function scoreSleepQuality(quality: "bueno" | "normal" | "malo"): number {
  return quality === "bueno" ? 100 : quality === "normal" ? 70 : 30;
}

// Fatiga y estrés comparten la misma escala 1 (mejor) - 5 (peor) según el cerebro.
function scoreScale1to5Inverse(value: number): number {
  const map: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 };
  return map[Math.min(5, Math.max(1, Math.round(value)))] ?? 60;
}

// La motivación no tiene banda explícita en el cerebro: se asume escala ascendente simétrica (1=peor, 5=mejor).
function scoreMotivation(value: number): number {
  const map: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
  return map[Math.min(5, Math.max(1, Math.round(value)))] ?? 60;
}

function scoreMusclePain(pain: number): number {
  if (pain <= 1) return 100;
  if (pain <= 3) return 75;
  if (pain <= 5) return 50;
  if (pain <= 7) return 25;
  return 0;
}

function scorePrevRPE(rpe: number): number {
  if (rpe <= 7) return 100;
  if (rpe === 8) return 85;
  if (rpe === 9) return 65;
  return 40; // RPE 10
}

export function calculateHyroxReadiness(input: HyroxDailyInput): HyroxReadinessResult {
  const sleepScore = scoreSleepHours(input.sleepHours) * 0.7 + scoreSleepQuality(input.sleepQuality) * 0.3;
  const fatigueScore = scoreScale1to5Inverse(input.fatigueGeneral);
  const stressScore = scoreScale1to5Inverse(input.stress);
  const musclePainScore = scoreMusclePain(input.musclePain);
  const rpeScore = scorePrevRPE(input.prevRPE);

  const readinessFisico = sleepScore * 0.35 + fatigueScore * 0.25 + stressScore * 0.15 + musclePainScore * 0.15 + rpeScore * 0.1;
  const readinessGeneral = readinessFisico * 0.85 + scoreMotivation(input.motivation) * 0.15;

  // El dolor articular/tendinoso o nervioso es un bloqueo de seguridad independiente: no se compensa con readiness alto.
  let safetyBlocked = false;
  let safetyReason: string | undefined;
  if (input.jointPainType === "nervioso") {
    safetyBlocked = true;
    safetyReason = "Síntomas nerviosos (hormigueo, pérdida de fuerza o dolor irradiado): no se debe cargar la zona afectada. Se recomienda valoración profesional.";
  } else if (input.jointPain >= 5) {
    safetyBlocked = true;
    safetyReason = "Dolor articular o tendinoso ≥5/10: se elimina el ejercicio o estación afectada. Si no hay alternativa segura, se cancela la sesión.";
  }

  let state: HyroxReadinessResult["state"];
  if (safetyBlocked) state = "descanso";
  else if (readinessGeneral >= 85) state = "progresar";
  else if (readinessGeneral >= 70) state = "mantener";
  else if (readinessGeneral >= 55) state = "reducir";
  else if (readinessGeneral >= 40) state = "adaptar";
  else if (readinessGeneral >= 30) state = "recuperacion_activa";
  else state = "descanso";

  const semaphore: HyroxReadinessResult["semaphore"] =
    safetyBlocked || state === "descanso" || state === "recuperacion_activa"
      ? "rojo"
      : state === "reducir" || state === "adaptar"
      ? "amarillo"
      : "verde";

  return { sleepScore, readinessFisico, readinessGeneral, state, semaphore, safetyBlocked, safetyReason };
}

export interface HyroxAdaptationResult {
  status: "mantener" | "reducido" | "descanso";
  justification: string;
  roundsMultiplier: number; // 0 = sustituir por descanso/movilidad, no solo "mínimo 1"
}

export function adaptHyroxSession(input: HyroxDailyInput | undefined): HyroxAdaptationResult {
  if (!input) {
    return { status: "mantener", justification: "Sin registro de readiness hoy: se mantiene el entreno planificado.", roundsMultiplier: 1 };
  }

  const readiness = calculateHyroxReadiness(input);

  if (readiness.safetyBlocked) {
    return { status: "descanso", justification: readiness.safetyReason!, roundsMultiplier: 0 };
  }

  switch (readiness.state) {
    case "progresar":
    case "mantener":
      return { status: "mantener", justification: "Readiness adecuada: mantenemos el entreno planificado.", roundsMultiplier: 1 };
    case "reducir":
      return { status: "reducido", justification: "Readiness moderada (55-69): reducimos ligeramente el volumen y aumentamos los descansos.", roundsMultiplier: 0.8 };
    case "adaptar":
      return { status: "reducido", justification: "Readiness baja (40-54): reducimos volumen 20-30% y evitamos la intensidad máxima.", roundsMultiplier: 0.7 };
    case "recuperacion_activa":
      return { status: "descanso", justification: "Readiness muy baja (30-39): sustituimos por recuperación activa (movilidad, técnica con carga muy baja).", roundsMultiplier: 0 };
    default:
      return { status: "descanso", justification: "Readiness crítica (<30): cancelamos la sesión estructurada. Prioriza sueño, hidratación y alimentación.", roundsMultiplier: 0 };
  }
}

export function applyRoundsMultiplier(block: HyroxBlock, multiplier: number): HyroxBlock {
  if (!block.rounds || multiplier === 1) return block;
  return { ...block, rounds: Math.max(0, Math.round(block.rounds * multiplier)) };
}

// ============================================================================
// ADHERENCIA Y ESTANCAMIENTO
// ============================================================================

export function classifyAdherence(completed: number, planned: number): { pct: number; tier: "alta" | "conservadora" | "simplificar" | "reestructurar" } {
  const pct = planned > 0 ? Math.round((completed / planned) * 100) : 100;
  if (pct > 85) return { pct, tier: "alta" };
  if (pct >= 70) return { pct, tier: "conservadora" };
  if (pct >= 50) return { pct, tier: "simplificar" };
  return { pct, tier: "reestructurar" };
}

// ============================================================================
// TEST DE VAM Y ZONAS DE ENTRENAMIENTO
// Test estándar de 6 minutos a máximo esfuerzo sostenible. VAM = distancia/tiempo.
// Zonas como % de VAM (estándar de 5 zonas): Z1 <70% · Z2 70-80% · Z3 80-88% · Z4 88-95% · Z5 95%+.
// ============================================================================

export const VAM_TEST_DURATION_MIN = 6;

function formatPaceMinKm(paceMinPerKm: number): string {
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "--:--";
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function calculateVAMFromTest(distanceMeters: number): { vamKmH: number; vamPaceMinKm: string } {
  const km = distanceMeters / 1000;
  const hours = VAM_TEST_DURATION_MIN / 60;
  const vamKmH = hours > 0 ? km / hours : 0;
  const paceMinPerKm = vamKmH > 0 ? 60 / vamKmH : 0;
  return { vamKmH: Math.round(vamKmH * 100) / 100, vamPaceMinKm: formatPaceMinKm(paceMinPerKm) };
}

export interface HyroxTrainingZone {
  key: "z1" | "z2" | "z3" | "z4" | "z5";
  label: string;
  pctRange: string;
  paceRange: string;
  description: string;
}

const ZONE_DEFS: Array<{ key: HyroxTrainingZone["key"]; label: string; pctMin: number; pctMax: number | null; description: string }> = [
  { key: "z1", label: "Z1 · Regenerativo", pctMin: 0, pctMax: 70, description: "Recuperación activa y rodajes muy suaves." },
  { key: "z2", label: "Z2 · Aeróbico", pctMin: 70, pctMax: 80, description: "Base aeróbica, rodajes largos." },
  { key: "z3", label: "Z3 · Umbral aeróbico", pctMin: 80, pctMax: 88, description: "Ritmo controlado, tempo suave." },
  { key: "z4", label: "Z4 · Umbral anaeróbico", pctMin: 88, pctMax: 95, description: "Series de umbral, ritmo objetivo de carrera en Hyrox." },
  { key: "z5", label: "Z5 · VO2max", pctMin: 95, pctMax: null, description: "Series cortas de máxima intensidad." }
];

export function calculateHyroxTrainingZones(vamKmH: number): HyroxTrainingZone[] {
  return ZONE_DEFS.map(z => {
    const fastPace = formatPaceMinKm(60 / (vamKmH * ((z.pctMax ?? 100) / 100)));
    const slowPace = z.pctMin > 0 ? formatPaceMinKm(60 / (vamKmH * (z.pctMin / 100))) : null;

    let paceRange: string;
    if (z.pctMin === 0) {
      paceRange = `Más lento que ${fastPace} /km`;
    } else if (z.pctMax == null) {
      paceRange = `Más rápido que ${slowPace} /km`;
    } else {
      paceRange = `${fastPace} - ${slowPace} /km`;
    }

    return {
      key: z.key,
      label: z.label,
      pctRange: z.pctMax != null ? `${z.pctMin}-${z.pctMax}% VAM` : `${z.pctMin}%+ VAM`,
      paceRange,
      description: z.description
    };
  });
}

// ============================================================================
// PARTE 1 — HYROX MASTER BRAIN: BENCHMARKS Y LIMITANTES
// ============================================================================

const STATION_TO_LIMITANT: Record<Exclude<import("./hyroxTypes").HyroxStationParcial, "run1km" | "roxzoneTotal">, HyroxLimitantType> = {
  skiErg: "fuerza_resistencia",
  sledPush: "fuerza_maxima",
  sledPull: "fuerza_maxima",
  burpeeBroadJump: "fuerza_resistencia",
  row: "fuerza_resistencia",
  farmersCarry: "fuerza_maxima",
  sandbagLunges: "fuerza_resistencia",
  wallBalls: "fuerza_resistencia"
};

function nearestBandIndex(actualSeconds: number, row: Record<HyroxBenchmarkBand, string>): number {
  let bestIdx = BAND_ORDER.length - 1;
  let bestDiff = Infinity;
  BAND_ORDER.forEach((band, idx) => {
    const diff = Math.abs(parseTimeToSeconds(row[band]) - actualSeconds);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

export interface HyroxBenchmarkAnalysis {
  levelBandIndex: number; // 0 = sub60 (más rápido) .. 6 = sub90
  levelBand: HyroxBenchmarkBand;
  mainLimitant: HyroxLimitantType;
  mainLimitantStation: string;
  worstGapSeconds: number;
  strengths: string[];
  weaknesses: string[];
}

export function analyzeHyroxPerformance(category: HyroxRaceCategory, performance: HyroxPerformanceData): HyroxBenchmarkAnalysis {
  const benchmarkRow = HYROX_BENCHMARKS[category];

  const parcialSeconds: Record<string, number> = {
    run1km: performance.runSplits.length > 0
      ? performance.runSplits.reduce((sum, s) => sum + parseTimeToSeconds(s), 0) / performance.runSplits.length
      : 0,
    skiErg: parseTimeToSeconds(performance.skiErg),
    sledPush: parseTimeToSeconds(performance.sledPush),
    sledPull: parseTimeToSeconds(performance.sledPull),
    burpeeBroadJump: parseTimeToSeconds(performance.burpeeBroadJump),
    row: parseTimeToSeconds(performance.row),
    farmersCarry: parseTimeToSeconds(performance.farmersCarry),
    sandbagLunges: parseTimeToSeconds(performance.sandbagLunges),
    wallBalls: parseTimeToSeconds(performance.wallBalls),
    roxzoneTotal: parseTimeToSeconds(performance.roxzoneTotal)
  };

  const bandIndexes: Record<string, number> = {};
  Object.keys(parcialSeconds).forEach(key => {
    if (parcialSeconds[key] > 0) {
      bandIndexes[key] = nearestBandIndex(parcialSeconds[key], (benchmarkRow as any)[key]);
    }
  });

  const indexValues = Object.values(bandIndexes);
  const medianIndex = indexValues.length > 0
    ? indexValues.slice().sort((a, b) => a - b)[Math.floor(indexValues.length / 2)]
    : 3;

  // El limitante principal es la estación con peor banda relativa al resto (mayor índice = más lenta).
  let worstKey = "";
  let worstIdx = -1;
  Object.entries(bandIndexes).forEach(([key, idx]) => {
    if (key !== "roxzoneTotal" && idx > worstIdx) {
      worstIdx = idx;
      worstKey = key;
    }
  });

  const roxzoneGapIdx = bandIndexes["roxzoneTotal"] ?? medianIndex;
  const mainLimitant: HyroxLimitantType =
    roxzoneGapIdx > medianIndex + 1
      ? "transiciones"
      : worstKey === "run1km"
      ? "carrera"
      : (STATION_TO_LIMITANT as any)[worstKey] ?? "carrera";

  const strengths = Object.entries(bandIndexes)
    .filter(([key, idx]) => key !== "roxzoneTotal" && idx < medianIndex)
    .map(([key]) => key);
  const weaknesses = Object.entries(bandIndexes)
    .filter(([key, idx]) => key !== "roxzoneTotal" && idx > medianIndex)
    .map(([key]) => key);

  return {
    levelBandIndex: medianIndex,
    levelBand: BAND_ORDER[medianIndex],
    mainLimitant,
    mainLimitantStation: worstKey,
    worstGapSeconds: worstIdx >= 0 ? Math.abs(parcialSeconds[worstKey] - parseTimeToSeconds((benchmarkRow as any)[worstKey][BAND_ORDER[medianIndex]])) : 0,
    strengths,
    weaknesses
  };
}

export function estimateHyroxFinishTime(data: HyroxOnboardingData): { conservador: string; realista: string; agresivo?: string } {
  if (data.objective === HyroxObjective.PRIMERA_CARRERA) {
    const [min, max] = HYROX_DEBUTANTE_RANGE[data.raceCategory];
    return { conservador: max, realista: formatSecondsToTime((parseTimeToSeconds(min) + parseTimeToSeconds(max)) / 2), agresivo: min };
  }

  if (data.objective === HyroxObjective.MEJORAR_MARCA && data.performance) {
    const analysis = analyzeHyroxPerformance(data.raceCategory, data.performance);
    const realistaIdx = Math.max(0, analysis.levelBandIndex - 1);
    const agresivoIdx = Math.max(0, analysis.levelBandIndex - 2);
    const row = HYROX_BENCHMARKS[data.raceCategory].roxzoneTotal; // referencia auxiliar, no se usa directamente aquí
    return {
      conservador: data.performance.totalTime,
      realista: `Objetivo ${BAND_ORDER[realistaIdx].replace("sub", "Sub ")}`,
      agresivo: `Objetivo ${BAND_ORDER[agresivoIdx].replace("sub", "Sub ")}`
    };
  }

  // Resto de objetivos: sin datos de carrera, estimación conservadora genérica por división.
  let baseSeconds = 6000;
  if (data.division === HyroxDivision.PRO) baseSeconds += 900;
  if (data.division === HyroxDivision.DOUBLES) baseSeconds -= 600;
  return { conservador: formatSecondsToTime(baseSeconds + 600), realista: formatSecondsToTime(baseSeconds) };
}

export function detectHyroxLimitant(data: HyroxOnboardingData): {
  levelEstimated: "Principiante" | "Intermedio" | "Avanzado";
  mainLimitant: string;
  limitantType?: HyroxLimitantType;
  strengths: string[];
  weaknesses: string[];
} {
  const levelEstimated =
    data.experienceLevel === HyroxExperienceLevel.AVANZADO
      ? "Avanzado"
      : data.experienceLevel === HyroxExperienceLevel.INTERMEDIO
      ? "Intermedio"
      : "Principiante";

  if (data.objective === HyroxObjective.MEJORAR_MARCA && data.performance) {
    const analysis = analyzeHyroxPerformance(data.raceCategory, data.performance);
    return {
      levelEstimated,
      mainLimitant: `${STATION_LIMITANT_LABEL[analysis.mainLimitant]} (estación de referencia: ${analysis.mainLimitantStation})`,
      limitantType: analysis.mainLimitant,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses
    };
  }

  if (data.objective === HyroxObjective.PRIMERA_CARRERA) {
    return {
      levelEstimated,
      mainLimitant: "Sin especialización: prioridad en técnica, resistencia y fuerza general con progresión gradual.",
      strengths: [],
      weaknesses: []
    };
  }

  if (data.selfReportedLimitant) {
    return {
      levelEstimated,
      mainLimitant: STATION_LIMITANT_LABEL[data.selfReportedLimitant],
      limitantType: data.selfReportedLimitant,
      strengths: [],
      weaknesses: data.weakStationsSelfReported ?? []
    };
  }

  return {
    levelEstimated,
    mainLimitant: "Enfoque equilibrado: sin un limitante claro reportado.",
    strengths: [],
    weaknesses: []
  };
}

const STATION_LIMITANT_LABEL: Record<HyroxLimitantType, string> = {
  carrera: "Carrera",
  fuerza_maxima: "Fuerza máxima",
  fuerza_resistencia: "Fuerza-resistencia",
  transiciones: "Transiciones",
  tecnica: "Técnica",
  recuperacion: "Recuperación / tolerancia a la carga"
};

// ============================================================================
// PLANIFICACIÓN SEGÚN FRECUENCIA (Parte 1, Paso "Planificación según la frecuencia")
// ============================================================================

type DayFocus = "carrera_calidad" | "carrera_facil" | "fuerza_general" | "fuerza_maxima" | "estaciones" | "hyrox_especifico" | "simulacion" | "descanso";

const FREQUENCY_DAY_PLANS: Record<number, DayFocus[]> = {
  2: ["carrera_calidad", "hyrox_especifico"],
  3: ["carrera_calidad", "fuerza_general", "hyrox_especifico"],
  4: ["carrera_calidad", "fuerza_general", "carrera_facil", "hyrox_especifico"],
  5: ["carrera_calidad", "fuerza_maxima", "carrera_facil", "estaciones", "simulacion"],
  6: ["carrera_calidad", "fuerza_maxima", "carrera_facil", "estaciones", "carrera_calidad", "simulacion"]
};

const FOCUS_TO_CATEGORY: Record<DayFocus, "carrera" | "fuerza" | "acondicionamiento" | "simulacion" | "descanso"> = {
  carrera_calidad: "carrera",
  carrera_facil: "carrera",
  fuerza_general: "fuerza",
  fuerza_maxima: "fuerza",
  estaciones: "acondicionamiento",
  hyrox_especifico: "acondicionamiento",
  simulacion: "simulacion",
  descanso: "descanso"
};

function buildWeekDayIndexes(sessionsPerWeek: number): number[] {
  const patterns: Record<number, number[]> = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5]
  };
  return patterns[sessionsPerWeek] ?? [0, 2, 4];
}

// ============================================================================
// SELECCIÓN DE PLANTILLAS ESTÁTICAS (fallback si no hay generación por Gemini)
// ============================================================================

function templateFitsGymType(template: HyroxWorkoutTemplate, gymType: HyroxOnboardingData["gymType"]): boolean {
  if (gymType === "especializado") return true;
  // Gimnasio convencional: evitamos plantillas que dependan de trineo/ski erg específico como único estímulo.
  return !template.equipment.includes("sled_push") && !template.equipment.includes("sled_pull");
}

function pickTemplate(
  category: "carrera" | "fuerza" | "acondicionamiento" | "simulacion",
  data: HyroxOnboardingData,
  isDescarga: boolean,
  usedIds: Set<string>,
  limitant?: HyroxLimitantType
): HyroxWorkoutTemplate {
  let candidates = HYROX_WORKOUT_LIBRARY.filter(t => t.category === category && templateFitsGymType(t, data.gymType));
  if (candidates.length === 0) candidates = HYROX_WORKOUT_LIBRARY.filter(t => t.category === category);

  if (isDescarga) {
    const lighter = candidates.filter(t => t.difficulty !== "ALTA");
    if (lighter.length > 0) candidates = lighter;
  }

  const unused = candidates.filter(t => !usedIds.has(t.id));
  const pool = unused.length > 0 ? unused : candidates;

  if (limitant) {
    const targetStationsForLimitant: HyroxStation[] =
      limitant === "carrera" ? ["run"]
      : limitant === "fuerza_maxima" ? ["sled_push", "sled_pull", "farmers_carry"]
      : limitant === "fuerza_resistencia" ? ["wall_balls", "burpee_broad_jump", "sandbag_lunges", "row_erg", "ski_erg"]
      : limitant === "transiciones" ? ["run"]
      : [];
    const sorted = [...pool].sort(
      (a, b) =>
        b.targetStations.filter(s => targetStationsForLimitant.includes(s)).length -
        a.targetStations.filter(s => targetStationsForLimitant.includes(s)).length
    );
    return sorted[0] ?? candidates[0];
  }

  return pool[0] ?? candidates[0];
}

// ============================================================================
// GENERACIÓN DEL PLAN
// ============================================================================

function frequencyToNumber(freq: HyroxFrequencyOption): number {
  return Number(freq);
}

function computeDurationWeeks(data: HyroxOnboardingData): number {
  if (data.raceDate) {
    const now = new Date();
    const race = new Date(data.raceDate);
    const diffWeeks = Math.ceil((race.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.min(16, Math.max(2, diffWeeks));
  }
  return 8;
}

export function generateHyroxPlan(data: HyroxOnboardingData): HyroxTrainingPlan {
  const { bmi, category: bmiCategory } = calculateBMI(data.weight, data.height);
  const limitantInfo = detectHyroxLimitant(data);
  const estimatedFinishTime = estimateHyroxFinishTime(data);

  const durationWeeks = computeDurationWeeks(data);
  const sessionsPerWeek = frequencyToNumber(data.frequency);
  const dayIndexes = buildWeekDayIndexes(sessionsPerWeek);
  const focusRotation = FREQUENCY_DAY_PLANS[sessionsPerWeek] ?? FREQUENCY_DAY_PLANS[3];

  const weeks: HyroxWeeklyPlan[] = [];
  let sessionCounter = 0;

  for (let w = 0; w < durationWeeks; w++) {
    const isDescarga = (w + 1) % 4 === 0 && w !== durationWeeks - 1;
    const isRaceWeek = w === durationWeeks - 1 && !!data.raceDate;
    const usedIdsThisWeek = new Set<string>();

    const sessions: HyroxWorkoutSession[] = [];

    for (let d = 0; d < 7; d++) {
      const slot = dayIndexes.indexOf(d);
      if (slot === -1) {
        sessions.push({ id: `hyrox-sess-${w}-${d}`, dayIndex: d, category: "descanso", templateId: null, isCompleted: false });
        continue;
      }

      const focus = isRaceWeek ? "carrera_facil" : focusRotation[slot % focusRotation.length];
      const category = FOCUS_TO_CATEGORY[focus] as "carrera" | "fuerza" | "acondicionamiento" | "simulacion";

      const template = isRaceWeek && slot === dayIndexes.length - 1
        ? getTemplateById("half-hyrox-simulation") ?? pickTemplate("simulacion", data, true, usedIdsThisWeek)
        : pickTemplate(category, data, isDescarga || isRaceWeek, usedIdsThisWeek, limitantInfo.limitantType);

      usedIdsThisWeek.add(template.id);
      sessionCounter++;

      sessions.push({
        id: `hyrox-sess-${w}-${d}-${sessionCounter}`,
        dayIndex: d,
        category: template.category,
        templateId: template.id,
        isCompleted: false
      });
    }

    weeks.push({
      weekNumber: w + 1,
      isDescarga,
      description: isRaceWeek
        ? "Semana de carrera (taper). Volumen mínimo, foco en frescura y repaso de transiciones."
        : isDescarga
        ? "Semana de descarga: reducimos volumen 30-40% para asimilar la carga acumulada."
        : `Semana ${w + 1} de progresión hacia tu objetivo Hyrox.`,
      sessions
    });
  }

  return {
    id: `hyrox-plan-${Date.now()}`,
    objective: data.objective,
    division: data.division,
    createdAt: new Date().toISOString(),
    durationWeeks,
    frequency: data.frequency,
    raceDate: data.raceDate,
    initialDiagnostic: {
      levelEstimated: limitantInfo.levelEstimated,
      mainLimitant: limitantInfo.mainLimitant,
      limitantType: limitantInfo.limitantType,
      strengths: limitantInfo.strengths,
      weaknesses: limitantInfo.weaknesses,
      bmi,
      bmiCategory,
      estimatedFinishTime,
      weakStations: data.weakStationsSelfReported ?? []
    },
    weeks
  };
}

// ============================================================================
// GENERACIÓN DE SESIONES POR GEMINI (mitad "viva" del motor híbrido)
// El esqueleto del plan (arriba) siempre se genera de forma determinista con la
// librería estática, que actúa como fallback silencioso si Gemini no responde
// o no hay GEMINI_API_KEY configurada en Vercel.
// ============================================================================

export interface HyroxSessionGenerationParams {
  category: "carrera" | "fuerza" | "acondicionamiento" | "simulacion";
  objective: HyroxObjective;
  limitantType?: HyroxLimitantType;
  experienceLevel: HyroxExperienceLevel;
  gymType: HyroxOnboardingData["gymType"];
  sessionDurationMin: HyroxOnboardingData["sessionDurationMin"];
  isDescarga: boolean;
  injuryAreas: string[];
  weekNumber: number;
  durationWeeks: number;
}

const GEMINI_CACHE_KEY = "hyrox_gemini_session_cache";

function readGeminiCache(): Record<string, HyroxWorkoutTemplate> {
  try {
    const raw = localStorage.getItem(GEMINI_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeGeminiCache(cache: Record<string, HyroxWorkoutTemplate>) {
  try {
    localStorage.setItem(GEMINI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Almacenamiento no disponible: la variedad por Gemini queda desactivada para esta sesión sin romper el flujo.
  }
}

export function getCachedGeneratedSession(sessionId: string): HyroxWorkoutTemplate | undefined {
  return readGeminiCache()[sessionId];
}

export async function generateHyroxSessionContent(
  sessionId: string,
  params: HyroxSessionGenerationParams
): Promise<HyroxWorkoutTemplate | null> {
  try {
    const response = await fetch("/api/hyrox-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0) return null;

    const template: HyroxWorkoutTemplate = {
      id: `gemini-${sessionId}`,
      name: data.name,
      category: params.category,
      description: data.description,
      durationMin: data.durationMin ?? params.sessionDurationMin,
      difficulty: data.difficulty ?? "MODERADA",
      equipment: data.equipment ?? [],
      targetStations: data.targetStations ?? [],
      blocks: data.blocks,
      source: "gemini"
    };

    const cache = readGeminiCache();
    cache[sessionId] = template;
    writeGeminiCache(cache);
    return template;
  } catch {
    return null;
  }
}

// Punto único de resolución de contenido de sesión: usa la versión de Gemini si ya
// se generó y quedó cacheada para esta sesión; si no, cae en la plantilla estática.
export function resolveHyroxSessionTemplate(session: HyroxWorkoutSession): HyroxWorkoutTemplate | undefined {
  if (!session.templateId) return undefined;
  const cached = getCachedGeneratedSession(session.id);
  if (cached) return cached;
  return getTemplateById(session.templateId);
}

// ============================================================================
// UTILIDADES DE FORMATO PARA LA UI DE EJECUCIÓN
// ============================================================================

export function parseDurationToSeconds(label?: string): number {
  if (!label) return 0;
  const trimmed = label.trim().toLowerCase();

  const minSec = trimmed.match(/^(\d+)\s*m\s*(\d+)?$/);
  if (minSec) {
    const mins = Number(minSec[1]) || 0;
    const secs = Number(minSec[2]) || 0;
    return mins * 60 + secs;
  }

  const segOnly = trimmed.match(/^(\d+)\s*seg$/);
  if (segOnly) return Number(segOnly[1]) || 0;

  const mmss = trimmed.match(/^(\d+):(\d{2})$/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);

  return 0;
}

export function blockFormatLabel(format: HyroxBlock["format"]): string {
  switch (format) {
    case "rounds":
      return "Rondas";
    case "amrap":
      return "AMRAP";
    case "emom":
      return "EMOM";
    case "for_time":
      return "Por Tiempo";
    case "intervals":
      return "Intervalos";
    case "on_off":
      return "ON / OFF";
    default:
      return "";
  }
}

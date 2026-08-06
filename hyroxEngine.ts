import {
  HyroxBlock,
  HyroxDivision,
  HyroxExperienceLevel,
  HyroxFrequencyOption,
  HyroxObjective,
  HyroxOnboardingData,
  HyroxStation,
  HyroxTrainingPlan,
  HyroxWeeklyPlan,
  HyroxWorkoutSession,
  HyroxWorkoutTemplate
} from "./hyroxTypes";
import { HYROX_WORKOUT_LIBRARY, getTemplateById } from "./hyroxLibrary";
import { calculateBMI, calculateReadiness, formatSecondsToTime } from "./engines";
import { DailyReadinessInput, DailyReadinessScore } from "./types";

export { calculateBMI, calculateReadiness };

// ============================================================================
// DIAGNÓSTICO INICIAL
// ============================================================================

export function detectHyroxLimitant(data: HyroxOnboardingData): {
  levelEstimated: "Principiante" | "Intermedio" | "Avanzado";
  mainLimitant: string;
  strengths: string[];
  weaknesses: string[];
} {
  const levelEstimated =
    data.experienceLevel === HyroxExperienceLevel.AVANZADO
      ? "Avanzado"
      : data.experienceLevel === HyroxExperienceLevel.INTERMEDIO
      ? "Intermedio"
      : "Principiante";

  const weakStationLabels = data.weakStations.length > 0 ? data.weakStations : ["run"];
  const mainLimitant =
    weakStationLabels.length > 1
      ? "Transición entre carrera y estaciones (Compromised Running)"
      : `Rendimiento en estación: ${weakStationLabels[0]}`;

  const strengths = ["run", "ski_erg", "sled_push", "sled_pull", "burpee_broad_jump", "row_erg", "farmers_carry", "sandbag_lunges", "wall_balls"]
    .filter(s => !data.weakStations.includes(s as HyroxStation))
    .slice(0, 3);

  return {
    levelEstimated,
    mainLimitant,
    strengths,
    weaknesses: data.weakStations
  };
}

export function estimateHyroxFinishTime(data: HyroxOnboardingData): {
  conservador: string;
  realista: string;
  agresivo?: string;
} {
  // Base finish time (seconds) per division/nivel, sobre una carrera completa (8 estaciones + carrera)
  let baseSeconds = 5400; // 1h30 baseline intermedio open
  if (data.division === HyroxDivision.PRO) baseSeconds += 1200;
  if (data.division === HyroxDivision.DOUBLES) baseSeconds -= 900;

  if (data.experienceLevel === HyroxExperienceLevel.PRINCIPIANTE) baseSeconds += 1500;
  if (data.experienceLevel === HyroxExperienceLevel.AVANZADO) baseSeconds -= 900;

  baseSeconds += data.weakStations.length * 240;

  const conservador = formatSecondsToTime(baseSeconds + 600);
  const realista = formatSecondsToTime(baseSeconds);
  const agresivo = data.experienceLevel !== HyroxExperienceLevel.PRINCIPIANTE
    ? formatSecondsToTime(baseSeconds - 480)
    : undefined;

  return { conservador, realista, agresivo };
}

// ============================================================================
// SELECCIÓN Y FILTRADO DE PLANTILLAS
// ============================================================================

function templateFitsEquipment(template: HyroxWorkoutTemplate, equipmentAccess: HyroxStation[]): boolean {
  if (equipmentAccess.length === 0) return true;
  return template.equipment.every(eq => eq === "run" || equipmentAccess.includes(eq));
}

function scoreTemplateForWeakStations(template: HyroxWorkoutTemplate, weakStations: HyroxStation[]): number {
  return template.targetStations.filter(s => weakStations.includes(s)).length;
}

function pickTemplate(
  category: "carrera" | "fuerza" | "acondicionamiento" | "simulacion",
  data: HyroxOnboardingData,
  isDescarga: boolean,
  usedIds: Set<string>
): HyroxWorkoutTemplate {
  let candidates = HYROX_WORKOUT_LIBRARY.filter(
    t => t.category === category && templateFitsEquipment(t, data.equipmentAccess)
  );

  if (candidates.length === 0) {
    candidates = HYROX_WORKOUT_LIBRARY.filter(t => t.category === category);
  }

  if (isDescarga) {
    const lighter = candidates.filter(t => t.difficulty !== "ALTA");
    if (lighter.length > 0) candidates = lighter;
  }

  const unused = candidates.filter(t => !usedIds.has(t.id));
  const pool = unused.length > 0 ? unused : candidates;

  const sorted = [...pool].sort(
    (a, b) => scoreTemplateForWeakStations(b, data.weakStations) - scoreTemplateForWeakStations(a, data.weakStations)
  );

  return sorted[0] ?? candidates[0];
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
    return Math.min(16, Math.max(4, diffWeeks));
  }
  return 8;
}

function buildWeekDayIndexes(sessionsPerWeek: number): number[] {
  // Distribute sessions evenly across Mon(0)-Sun(6), leaving rest days spread out.
  const patterns: Record<number, number[]> = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 4, 5]
  };
  return patterns[sessionsPerWeek] ?? [0, 2, 4];
}

function categoryRotation(sessionsPerWeek: number): Array<"carrera" | "fuerza" | "acondicionamiento" | "simulacion"> {
  if (sessionsPerWeek <= 2) return ["carrera", "acondicionamiento"];
  if (sessionsPerWeek === 3) return ["carrera", "fuerza", "acondicionamiento"];
  if (sessionsPerWeek === 4) return ["carrera", "fuerza", "acondicionamiento", "simulacion"];
  return ["carrera", "fuerza", "acondicionamiento", "fuerza", "simulacion"];
}

export function generateHyroxPlan(data: HyroxOnboardingData): HyroxTrainingPlan {
  const { bmi, category: bmiCategory } = calculateBMI(data.weight, data.height);
  const limitant = detectHyroxLimitant(data);
  const estimatedFinishTime = estimateHyroxFinishTime(data);

  const durationWeeks = computeDurationWeeks(data);
  const sessionsPerWeek = frequencyToNumber(data.frequency);
  const dayIndexes = buildWeekDayIndexes(sessionsPerWeek);
  const rotation = categoryRotation(sessionsPerWeek);

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
        sessions.push({
          id: `hyrox-sess-${w}-${d}`,
          dayIndex: d,
          category: "descanso",
          templateId: null,
          isCompleted: false
        });
        continue;
      }

      const category = isRaceWeek ? "carrera" : rotation[slot % rotation.length];
      const template = isRaceWeek && slot === dayIndexes.length - 1
        ? getTemplateById("half-hyrox-simulation") ?? pickTemplate("simulacion", data, true, usedIdsThisWeek)
        : pickTemplate(category, data, isDescarga || isRaceWeek, usedIdsThisWeek);

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
        ? "Semana de carrera. Volumen mínimo, foco en frescura y repaso de transiciones."
        : isDescarga
        ? "Semana de descarga. Reducimos dificultad para asimilar la carga acumulada."
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
      levelEstimated: limitant.levelEstimated,
      mainLimitant: limitant.mainLimitant,
      strengths: limitant.strengths,
      weaknesses: limitant.weaknesses,
      bmi,
      bmiCategory,
      estimatedFinishTime,
      weakStations: data.weakStations
    },
    weeks
  };
}

// ============================================================================
// ADAPTACIÓN DIARIA SEGÚN READINESS
// ============================================================================

export interface HyroxAdaptationResult {
  status: "mantener" | "reducido" | "descanso";
  justification: string;
  roundsMultiplier: number; // apply to block.rounds when rendering
}

export function adaptHyroxSession(readiness: DailyReadinessInput | undefined): HyroxAdaptationResult {
  if (!readiness) {
    return { status: "mantener", justification: "Sin registro de readiness hoy, se mantiene el entreno planificado.", roundsMultiplier: 1 };
  }

  const score: DailyReadinessScore = calculateReadiness(readiness);

  if (score.state === "DESCANSO") {
    return {
      status: "descanso",
      justification: "Tu readiness de hoy es muy baja. Sustituimos por movilidad y descanso activo para evitar lesiones.",
      roundsMultiplier: 0
    };
  }

  if (score.state === "RECOVERY") {
    return {
      status: "reducido",
      justification: "Readiness baja: reducimos rondas/volumen para seguir sumando sin comprometer la recuperación.",
      roundsMultiplier: 0.7
    };
  }

  if (score.state === "ADAPTAR") {
    return {
      status: "reducido",
      justification: "Ligeramente fatigado: ajustamos el volumen levemente a la baja.",
      roundsMultiplier: 0.85
    };
  }

  return { status: "mantener", justification: "Readiness óptima, mantenemos el entreno tal y como está planificado.", roundsMultiplier: 1 };
}

export function applyRoundsMultiplier(block: HyroxBlock, multiplier: number): HyroxBlock {
  if (!block.rounds || multiplier === 1) return block;
  return { ...block, rounds: Math.max(1, Math.round(block.rounds * multiplier)) };
}

// ============================================================================
// UTILIDADES DE FORMATO PARA LA UI DE EJECUCIÓN
// ============================================================================

// Parses short duration labels used across the workout library ("2m", "90 seg", "1m30", "8m") into seconds.
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

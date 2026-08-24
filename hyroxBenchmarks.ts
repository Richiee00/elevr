// Hyrox performance benchmark tables. Confirmed by the user against their own real data
// for open_masculina, open_femenina, pro_masculina y pro_femenina (2026-08-18).
import {
  HyroxRaceCategory,
  HyroxBenchmarkBand,
  HyroxOfficialLoadRow,
  HyroxPhase,
  HyroxDivision,
  HyroxExperienceLevel,
  HyroxSessionDurationMin,
  HyroxFrequencyOption
} from "./hyroxTypes";

export interface HyroxBenchmarkRow {
  run1km: Record<HyroxBenchmarkBand, string>;
  skiErg: Record<HyroxBenchmarkBand, string>;
  sledPush: Record<HyroxBenchmarkBand, string>;
  sledPull: Record<HyroxBenchmarkBand, string>;
  burpeeBroadJump: Record<HyroxBenchmarkBand, string>;
  row: Record<HyroxBenchmarkBand, string>;
  farmersCarry: Record<HyroxBenchmarkBand, string>;
  sandbagLunges: Record<HyroxBenchmarkBand, string>;
  wallBalls: Record<HyroxBenchmarkBand, string>;
  roxzoneTotal: Record<HyroxBenchmarkBand, string>;
}

export const HYROX_BENCHMARKS: Record<HyroxRaceCategory, HyroxBenchmarkRow> = {
  open_masculina: {
    run1km: { sub60: "3:49", sub65: "4:10", sub70: "4:25", sub75: "4:45", sub80: "5:05", sub85: "5:25", sub90: "5:45" },
    skiErg: { sub60: "4:13", sub65: "4:35", sub70: "4:55", sub75: "5:15", sub80: "5:35", sub85: "6:00", sub90: "6:20" },
    sledPush: { sub60: "2:50", sub65: "3:05", sub70: "3:20", sub75: "3:30", sub80: "3:45", sub85: "4:00", sub90: "4:15" },
    sledPull: { sub60: "2:59", sub65: "3:15", sub70: "3:30", sub75: "3:45", sub80: "4:00", sub85: "4:15", sub90: "4:30" },
    burpeeBroadJump: { sub60: "2:46", sub65: "3:00", sub70: "3:15", sub75: "3:30", sub80: "3:40", sub85: "3:55", sub90: "4:10" },
    row: { sub60: "4:17", sub65: "4:40", sub70: "5:00", sub75: "5:20", sub80: "5:45", sub85: "6:05", sub90: "6:25" },
    farmersCarry: { sub60: "1:30", sub65: "1:40", sub70: "1:45", sub75: "1:50", sub80: "2:00", sub85: "2:10", sub90: "2:15" },
    sandbagLunges: { sub60: "3:03", sub65: "3:20", sub70: "3:35", sub75: "3:50", sub80: "4:05", sub85: "4:20", sub90: "4:35" },
    wallBalls: { sub60: "4:31", sub65: "4:55", sub70: "5:15", sub75: "5:40", sub80: "6:00", sub85: "6:25", sub90: "6:45" },
    roxzoneTotal: { sub60: "4:00", sub65: "4:20", sub70: "4:40", sub75: "5:00", sub80: "5:20", sub85: "5:40", sub90: "6:00" },
  },
  open_femenina: {
    run1km: { sub60: "3:40", sub65: "3:58", sub70: "4:15", sub75: "4:35", sub80: "4:55", sub85: "5:10", sub90: "5:30" },
    skiErg: { sub60: "4:25", sub65: "4:48", sub70: "5:10", sub75: "5:30", sub80: "5:55", sub85: "6:15", sub90: "6:40" },
    sledPush: { sub60: "2:00", sub65: "2:11", sub70: "2:20", sub75: "2:30", sub80: "2:40", sub85: "2:50", sub90: "3:00" },
    sledPull: { sub60: "3:40", sub65: "4:01", sub70: "4:20", sub75: "4:40", sub80: "4:55", sub85: "5:15", sub90: "5:35" },
    burpeeBroadJump: { sub60: "3:30", sub65: "3:45", sub70: "4:00", sub75: "4:20", sub80: "4:35", sub85: "4:55", sub90: "5:10" },
    row: { sub60: "4:30", sub65: "4:52", sub70: "5:15", sub75: "5:35", sub80: "6:00", sub85: "6:20", sub90: "6:45" },
    farmersCarry: { sub60: "1:30", sub65: "1:35", sub70: "1:40", sub75: "1:50", sub80: "1:55", sub85: "2:05", sub90: "2:10" },
    sandbagLunges: { sub60: "2:35", sub65: "2:48", sub70: "3:00", sub75: "3:15", sub80: "3:25", sub85: "3:40", sub90: "3:55" },
    wallBalls: { sub60: "3:50", sub65: "4:11", sub70: "4:30", sub75: "4:50", sub80: "5:10", sub85: "5:30", sub90: "5:50" },
    roxzoneTotal: { sub60: "3:55", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:55" },
  },
  pro_masculina: {
    run1km: { sub60: "3:39", sub65: "3:55", sub70: "4:15", sub75: "4:35", sub80: "4:50", sub85: "5:10", sub90: "5:30" },
    skiErg: { sub60: "3:55", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:50" },
    sledPush: { sub60: "3:17", sub65: "3:35", sub70: "3:50", sub75: "4:05", sub80: "4:25", sub85: "4:40", sub90: "4:55" },
    sledPull: { sub60: "4:34", sub65: "4:55", sub70: "5:20", sub75: "5:40", sub80: "6:05", sub85: "6:30", sub90: "6:50" },
    burpeeBroadJump: { sub60: "3:03", sub65: "3:20", sub70: "3:35", sub75: "3:50", sub80: "4:05", sub85: "4:20", sub90: "4:35" },
    row: { sub60: "3:55", sub65: "4:15", sub70: "4:35", sub75: "4:55", sub80: "5:15", sub85: "5:35", sub90: "5:50" },
    farmersCarry: { sub60: "1:34", sub65: "1:40", sub70: "1:50", sub75: "2:00", sub80: "2:05", sub85: "2:15", sub90: "2:20" },
    sandbagLunges: { sub60: "3:10", sub65: "3:25", sub70: "3:40", sub75: "3:55", sub80: "4:15", sub85: "4:30", sub90: "4:45" },
    wallBalls: { sub60: "3:45", sub65: "4:05", sub70: "4:25", sub75: "4:40", sub80: "5:00", sub85: "5:20", sub90: "5:40" },
    roxzoneTotal: { sub60: "3:44", sub65: "4:00", sub70: "4:20", sub75: "4:40", sub80: "5:00", sub85: "5:20", sub90: "5:35" },
  },
  pro_femenina: {
    run1km: { sub60: "3:40", sub65: "3:59", sub70: "4:20", sub75: "4:35", sub80: "4:55", sub85: "5:15", sub90: "5:30" },
    skiErg: { sub60: "4:15", sub65: "4:35", sub70: "4:55", sub75: "5:15", sub80: "5:40", sub85: "6:00", sub90: "6:20" },
    sledPush: { sub60: "2:50", sub65: "3:06", sub70: "3:20", sub75: "3:35", sub80: "3:50", sub85: "4:05", sub90: "4:20" },
    sledPull: { sub60: "4:00", sub65: "4:22", sub70: "4:40", sub75: "5:00", sub80: "5:25", sub85: "5:45", sub90: "6:05" },
    burpeeBroadJump: { sub60: "3:00", sub65: "3:17", sub70: "3:30", sub75: "3:45", sub80: "4:00", sub85: "4:20", sub90: "4:35" },
    row: { sub60: "4:20", sub65: "4:42", sub70: "5:05", sub75: "5:25", sub80: "5:45", sub85: "6:10", sub90: "6:30" },
    farmersCarry: { sub60: "1:55", sub65: "2:04", sub70: "2:15", sub75: "2:25", sub80: "2:35", sub85: "2:40", sub90: "2:50" },
    sandbagLunges: { sub60: "2:55", sub65: "3:12", sub70: "3:25", sub75: "3:40", sub80: "3:55", sub85: "4:10", sub90: "4:25" },
    wallBalls: { sub60: "4:10", sub65: "4:31", sub70: "4:50", sub75: "5:10", sub80: "5:35", sub85: "5:55", sub90: "6:15" },
    roxzoneTotal: { sub60: "3:40", sub65: "4:00", sub70: "4:20", sub75: "4:35", sub80: "4:55", sub85: "5:15", sub90: "5:30" },
  },
};

// Rango de tiempo total medio para debutantes (primera carrera), por categoría. [min, max] en "h:mm".
// Las categorías de dobles se retiraron de la app: no había tabla de tiempos real que las respaldara.
export const HYROX_DEBUTANTE_RANGE: Record<HyroxRaceCategory, [string, string]> = {
  open_masculina: ["1:35", "2:00"],
  open_femenina: ["1:45", "2:10"],
  pro_masculina: ["1:25", "1:50"],
  pro_femenina: ["1:35", "2:00"],
};

// ============================================================================
// CEREBRO v3, OBJETIVO 1 — BLOQUE A: cargas oficiales por categoría.
// Verificar contra el reglamento vigente de la temporada: HYROX las revisa periódicamente.
// ============================================================================
export const HYROX_OFFICIAL_LOADS: Record<HyroxRaceCategory, HyroxOfficialLoadRow> = {
  open_femenina: { sledPushKg: 102, sledPullKg: 78, farmersCarryKgPerHand: 16, sandbagLungesKg: 10, wallBallsKg: 4, wallBallsTargetM: 2.74, wallBallsReps: 75 },
  open_masculina: { sledPushKg: 152, sledPullKg: 103, farmersCarryKgPerHand: 24, sandbagLungesKg: 20, wallBallsKg: 6, wallBallsTargetM: 3.05, wallBallsReps: 75 },
  pro_femenina: { sledPushKg: 152, sledPullKg: 103, farmersCarryKgPerHand: 24, sandbagLungesKg: 20, wallBallsKg: 6, wallBallsTargetM: 2.74, wallBallsReps: 100 },
  pro_masculina: { sledPushKg: 202, sledPullKg: 153, farmersCarryKgPerHand: 32, sandbagLungesKg: 30, wallBallsKg: 9, wallBallsTargetM: 3.05, wallBallsReps: 100 },
};

// Progresión de carga por fase (bloque A): fracción de la carga oficial usada en cada fase del
// plan de "Preparar mi primer HYROX". La fase "carrera" (semana final con fecha de competición)
// usa prácticamente el 100% oficial.
export const HYROX_LOAD_PHASE_PCT: Record<HyroxPhase, [number, number]> = {
  base: [0.55, 0.65],
  desarrollo: [0.65, 0.80],
  especifica: [0.80, 0.95],
  carrera: [0.95, 1.00],
};

// ============================================================================
// CEREBRO v3, OBJETIVO 1 — BLOQUE B: escalado por duración de sesión (45/60/90 min).
// El multiplicador de volumen se aplica a rondas/reps/distancia de bloques de acondicionamiento,
// carrera y simulación. Las series y el ajuste de top-set solo aplican al bloque de fuerza.
// ============================================================================
export const HYROX_DURATION_VOLUME_MULTIPLIER: Record<HyroxSessionDurationMin, number> = {
  45: 0.70,
  60: 1.00,
  90: 1.35,
};

export const HYROX_DURATION_STRENGTH_SERIES: Record<HyroxSessionDurationMin, number> = {
  45: 3,
  60: 4,
  90: 5,
};

// Puntos porcentuales sumados/restados sobre el % de fase (tabla A) para el top-set del bloque
// de fuerza principal, no para los bloques accesorios.
export const HYROX_DURATION_TOPSET_ADJUST_PP: Record<HyroxSessionDurationMin, number> = {
  45: -5,
  60: 0,
  90: 5,
};

// ============================================================================
// CEREBRO v3, OBJETIVO 1 — BLOQUE C: escalado por nivel real de base (running/fuerza).
// "rangeExtreme" se traduce en un multiplicador adicional sobre el volumen ya escalado por duración.
// ============================================================================
export interface HyroxLevelRule {
  rirRange: [number, number];
  rpeCeiling: number;
  maxStationsPartialSim: number | "completa";
  rangeExtreme: "bajo" | "medio" | "alto";
  rangeExtremeMultiplier: number;
}

export const HYROX_LEVEL_RULES: Record<HyroxExperienceLevel, HyroxLevelRule> = {
  principiante: { rirRange: [4, 5], rpeCeiling: 6, maxStationsPartialSim: 4, rangeExtreme: "bajo", rangeExtremeMultiplier: 0.85 },
  intermedio: { rirRange: [3, 4], rpeCeiling: 7, maxStationsPartialSim: 6, rangeExtreme: "medio", rangeExtremeMultiplier: 1.00 },
  avanzado: { rirRange: [2, 3], rpeCeiling: 8, maxStationsPartialSim: "completa", rangeExtreme: "alto", rangeExtremeMultiplier: 1.15 },
};

// ============================================================================
// CEREBRO v3, OBJETIVO 1 — BLOQUE D: intensidad por categoría (Open vs Pro).
// ============================================================================
export interface HyroxDivisionBias {
  difficultyBias: 0 | 1; // se suma al nivel de dificultad preferido al elegir plantilla
  zoneOffsetRangeSecPerKm: [number, number]; // offset sobre ritmo umbral
  restReductionPct: number; // reducción de descanso entre series de fuerza
}

export const HYROX_DIVISION_BIAS: Record<HyroxDivision, HyroxDivisionBias> = {
  open: { difficultyBias: 0, zoneOffsetRangeSecPerKm: [15, 35], restReductionPct: 0 },
  pro: { difficultyBias: 1, zoneOffsetRangeSecPerKm: [0, 20], restReductionPct: 12 },
};

// ============================================================================
// CEREBRO v3, OBJETIVO 1 — BLOQUE F: rangos de mejora esperados según frecuencia semanal.
// Orientativos de coaching, nunca una promesa.
// ============================================================================
export const HYROX_IMPROVEMENT_RANGES: Record<"2" | "3-4" | "5-6", { pct8Weeks: [number, number]; pct12Weeks: [number, number] }> = {
  "2": { pct8Weeks: [3, 6], pct12Weeks: [5, 8] },
  "3-4": { pct8Weeks: [6, 10], pct12Weeks: [9, 13] },
  "5-6": { pct8Weeks: [10, 15], pct12Weeks: [13, 18] },
};

export function getHyroxImprovementFrequencyBucket(frequency: HyroxFrequencyOption): "2" | "3-4" | "5-6" {
  const n = Number(frequency);
  if (n <= 2) return "2";
  if (n <= 4) return "3-4";
  return "5-6";
}


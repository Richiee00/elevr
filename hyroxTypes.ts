export enum HyroxObjective {
  PRIMERA_CARRERA = "primera_carrera",           // Objetivo 1: Preparar mi primer HYROX
  MEJORAR_MARCA = "mejorar_marca",               // Objetivo 2: Mejorar mi marca en HYROX
  MEJORAR_ESTACIONES = "mejorar_estaciones",     // Objetivo 3: Mejorar las estaciones funcionales
  MEJORAR_TRANSICIONES = "mejorar_transiciones", // Objetivo 4: Mejorar las transiciones
  VOLVER_PAUSA = "volver_pausa",                 // Objetivo 5: Volver a entrenar tras una pausa
  BASE_GENERAL = "base_general"                  // Objetivo 6: Base de fuerza y resistencia
}

// Objetivos del cerebro que asumen que el atleta ya ha competido en Hyrox al menos una vez.
export const HYROX_OBJECTIVES_ASSUMING_RACE_EXPERIENCE: HyroxObjective[] = [
  HyroxObjective.MEJORAR_MARCA,
  HyroxObjective.MEJORAR_ESTACIONES,
  HyroxObjective.MEJORAR_TRANSICIONES,
  HyroxObjective.VOLVER_PAUSA
];

// Único objetivo que recoge la tabla completa de rendimiento (tiempo total + 8 splits + tiempos por estación).
export const HYROX_OBJECTIVE_WITH_FULL_PERFORMANCE_DATA = HyroxObjective.MEJORAR_MARCA;

export enum HyroxDivision {
  OPEN = "open",
  PRO = "pro"
}

// Categoría oficial de competición: determina qué fila de HYROX_BENCHMARKS / HYROX_DEBUTANTE_RANGE se usa.
// Las categorías de dobles se retiraron de la app: no había tabla de tiempos real que las respaldara.
export type HyroxRaceCategory =
  | "open_masculina"
  | "open_femenina"
  | "pro_masculina"
  | "pro_femenina";

export type HyroxBenchmarkBand = "sub60" | "sub65" | "sub70" | "sub75" | "sub80" | "sub85" | "sub90";

export type HyroxStationParcial =
  | "run1km"
  | "skiErg"
  | "sledPush"
  | "sledPull"
  | "burpeeBroadJump"
  | "row"
  | "farmersCarry"
  | "sandbagLunges"
  | "wallBalls"
  | "roxzoneTotal";

export enum HyroxExperienceLevel {
  PRINCIPIANTE = "principiante", // Nunca he entrenado funcional/crossfit
  INTERMEDIO = "intermedio",     // Entreno funcional pero no he competido
  AVANZADO = "avanzado"          // Ya he competido en Hyrox u oposiciones similares
}

export enum HyroxFrequencyOption {
  FREQ_2 = "2",
  FREQ_3 = "3",
  FREQ_4 = "4",
  FREQ_5 = "5",
  FREQ_6 = "6"
}

export type HyroxSessionDurationMin = 45 | 60 | 90;

// Tipo de gimnasio: determina si se usan las estaciones oficiales o la tabla de sustituciones del cerebro.
export type HyroxGymType = "especializado" | "convencional";

export type HyroxStation =
  | "run"
  | "ski_erg"
  | "sled_push"
  | "sled_pull"
  | "burpee_broad_jump"
  | "row_erg"
  | "farmers_carry"
  | "sandbag_lunges"
  | "wall_balls"
  | "bike_erg"
  | "general";

// Agrupación de limitantes del cerebro (sección "AGRUPACIÓN DE LIMITANTES Y ESTACIONES"): 7 grupos,
// cada uno con una o dos estaciones concretas dentro. Usado para el análisis de splits (Objetivo 2)
// y para priorizar un máximo de dos limitantes por atleta.
export type HyroxLimitantType =
  | "carrera"             // Running
  | "motor_aerobico"      // SkiErg, RowErg
  | "potencia_fuerza"     // Sled Push, Sled Pull
  | "capacidad_muscular"  // Sandbag Lunges, Wall Balls
  | "grip_transporte"     // Farmers Carry
  | "transiciones"        // Burpees + carrera, entradas/salidas de estación
  | "recuperacion";

// Descriptor cualitativo del Objetivo 3 (Mejorar estaciones funcionales): "¿qué tipo de dificultad
// notas más?", eje distinto de HyroxLimitantType (que identifica LA ESTACIÓN, no el tipo de dificultad).
export type HyroxStationLimitingFactor =
  | "fuerza"
  | "fuerza_resistencia"
  | "tecnica"
  | "fatiga_muscular"
  | "falta_estrategia"
  | "no_lo_se";

export type HyroxCategory = "carrera" | "fuerza" | "acondicionamiento" | "simulacion";

export type HyroxBlockFormat = "rounds" | "amrap" | "emom" | "for_time" | "intervals" | "on_off";

export interface HyroxExercise {
  station: HyroxStation;
  name: string;
  reps?: string;      // e.g. "20 rep"
  distance?: string;  // e.g. "500 m"
  duration?: string;  // e.g. "30 seg"
  detail?: string;    // e.g. "75% 1RM", "Máx repeticiones"
}

export interface HyroxBlock {
  format: HyroxBlockFormat;
  label?: string;        // e.g. "Interval 1/4"
  rounds?: number;        // number of rounds/series for this block
  durationCap?: string;   // total time cap, e.g. "30m" for AMRAP
  workDuration?: string;  // work interval duration, e.g. "8m" for on/off rounds
  restBetween?: string;   // rest between rounds/series, e.g. "2m"
  exercises: HyroxExercise[];
}

export interface HyroxWorkoutTemplate {
  id: string;
  name: string;
  category: HyroxCategory;
  description: string;
  durationMin: number;
  difficulty: "BAJA" | "MODERADA" | "ALTA";
  equipment: HyroxStation[];
  targetStations: HyroxStation[]; // stations this workout mainly trains
  blocks: HyroxBlock[];
  source?: "static" | "gemini"; // de dónde vino el contenido de la sesión
}

// Tiempos oficiales de competición cuando el objetivo es "Mejorar mi marca en HYROX".
export interface HyroxPerformanceData {
  totalTime: string;              // tiempo total Hyrox, hh:mm:ss o mm:ss
  runSplits: string[];            // los 8 splits de 1 km, mm:ss cada uno
  skiErg: string;
  sledPush: string;
  sledPull: string;
  burpeeBroadJump: string;
  row: string;
  farmersCarry: string;
  sandbagLunges: string;
  wallBalls: string;
  roxzoneTotal: string;           // tiempo total de transiciones
}

export interface HyroxOnboardingData {
  age: number;
  sex: "M" | "F" | "Otro";
  height: number; // cm
  weight: number; // kg

  objective: HyroxObjective;
  raceCategory: HyroxRaceCategory;
  division: HyroxDivision;
  experienceLevel: HyroxExperienceLevel;
  runningExperience: HyroxExperienceLevel;
  strengthExperience: HyroxExperienceLevel;
  dailyActivityLevel: "sedentario" | "moderado" | "activo";
  raceDate?: string; // ISO date

  gymType: HyroxGymType;
  frequency: HyroxFrequencyOption;
  sessionDurationMin: HyroxSessionDurationMin;

  // Solo si objective === MEJORAR_MARCA
  performance?: HyroxPerformanceData;

  // "Camino" cualitativo para el resto de objetivos (sin pedir splits): cada objetivo usa el subconjunto que le aplica.
  // Solo se usa directamente para MEJORAR_TRANSICIONES ("transiciones"); para MEJORAR_ESTACIONES el/los
  // limitante(s) reales se derivan de weakStationsSelfReported + prioridad del cerebro en detectHyroxLimitant.
  selfReportedLimitant?: HyroxLimitantType;
  // Objetivo 3: "¿qué tipo de dificultad notas más en las estaciones?" (eje cualitativo, no de estación concreta).
  stationLimitingFactor?: HyroxStationLimitingFactor;
  weakStationsSelfReported?: HyroxStation[];
  breakDuration?: "menos_1_mes" | "1_3_meses" | "mas_3_meses";

  activeInjury: boolean;
  injuryAreas: string[];
  injuryNotes?: string;
  completedAt?: string;
}

// Resultado del test de VAM (Velocidad Aeróbica Máxima): test de 6 minutos a máximo esfuerzo sostenible.
export interface HyroxVAMTestResult {
  distanceMeters: number;
  vamKmH: number;
  vamPaceMinKm: string; // ritmo equivalente, formato mm:ss /km
  completedAt: string;
}

export interface HyroxWorkoutSession {
  id: string;
  dayIndex: number; // 0 (Lunes) to 6 (Domingo)
  category: HyroxCategory | "descanso";
  templateId: string | null; // null for rest days, refs a HyroxWorkoutTemplate.id
  isCompleted: boolean;
  feedback?: "perfecto" | "adecuado" | "muy_duro" | "facil" | "incompleto" | "no_realizado";
  rpeGiven?: number;
}

export interface HyroxWeeklyPlan {
  weekNumber: number;
  isDescarga: boolean;
  description: string;
  sessions: HyroxWorkoutSession[];
}

export interface HyroxTrainingPlan {
  id: string;
  objective: HyroxObjective;
  division: HyroxDivision;
  createdAt: string;
  durationWeeks: number;
  frequency: HyroxFrequencyOption;
  raceDate?: string;
  initialDiagnostic: {
    levelEstimated: "Principiante" | "Intermedio" | "Avanzado";
    mainLimitant: string;
    limitantType?: HyroxLimitantType;
    // Segundo limitante según la regla del cerebro: máximo dos limitantes por atleta, priorizados
    // por la lista fija de la sección "LIMITANTES PRINCIPALES" (running siempre incluido si aparece).
    secondaryLimitant?: string;
    secondaryLimitantType?: HyroxLimitantType;
    strengths: string[];
    weaknesses: string[];
    bmi: number;
    bmiCategory: string;
    estimatedFinishTime: {
      conservador: string;
      realista: string;
      agresivo?: string;
    };
    weakStations: HyroxStation[];
  };
  weeks: HyroxWeeklyPlan[];
}

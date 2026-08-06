export enum HyroxObjective {
  PRIMERA_CARRERA = "primera_carrera", // Preparar mi primera carrera Hyrox
  MEJORAR_TIEMPO = "mejorar_tiempo",   // Ya he competido, quiero bajar mi tiempo
  BASE_GENERAL = "base_general"        // Base de fuerza + acondicionamiento funcional, sin carrera fijada
}

export enum HyroxDivision {
  OPEN = "open",
  PRO = "pro",
  DOUBLES = "doubles"
}

export enum HyroxExperienceLevel {
  PRINCIPIANTE = "principiante", // Nunca he entrenado funcional/crossfit
  INTERMEDIO = "intermedio",     // Entreno funcional pero no he competido
  AVANZADO = "avanzado"          // Ya he competido en Hyrox u oposiciones similares
}

export enum HyroxFrequencyOption {
  FREQ_2 = "2",
  FREQ_3 = "3",
  FREQ_4 = "4",
  FREQ_5 = "5"
}

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
}

export interface HyroxOnboardingData {
  age: number;
  sex: "M" | "F" | "Otro";
  height: number; // cm
  weight: number; // kg
  objective: HyroxObjective;
  division: HyroxDivision;
  experienceLevel: HyroxExperienceLevel;
  raceDate?: string; // ISO date
  frequency: HyroxFrequencyOption;
  equipmentAccess: HyroxStation[];
  weakStations: HyroxStation[];
  activeInjury: boolean;
  injuryAreas: string[];
  injuryNotes?: string;
  completedAt?: string;
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

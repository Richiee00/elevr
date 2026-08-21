export enum RunningObjective {
  PRIMER_10K = "primer_10k",
  MEJORAR_10K = "mejorar_10k",
  PRIMER_21K = "primer_21k",
  MEJORAR_21K = "mejorar_21k",
  MEJORAR_RITMO = "mejorar_ritmo",
  MEJORAR_RESISTENCIA = "mejorar_resistencia"
}

export enum ExperienceLevel {
  PRINCIPIANTE_ZERO = "principiante_zero", // Empiezo de 0
  INTERMEDIO_2K = "intermedio_2k",       // Puedo hacer 2 km sin parar
  AVANZADO_5K = "avanzado_5k"           // Puedo hacer 5 km continuos
}

export enum FrequencyOption {
  FREQ_2_2 = "2_2", // 2 carrera + 2 fuerza
  FREQ_3_2 = "3_2", // 3 carrera + 2 fuerza
  FREQ_4_2 = "4_2", // 4 carrera + 2 fuerza
  FREQ_5_2 = "5_2"  // 5 carrera + 2 fuerza
}

export interface OnboardingData {
  age: number;
  sex: "M" | "F" | "Otro";
  height: number; // in cm
  weight: number; // in kg
  objective: RunningObjective;
  
  // Specific inputs depending on objective
  experienceLevel?: ExperienceLevel; // for PRIMER_10K
  frequency: FrequencyOption;
  
  // Performance data (as entered by user)
  time10K?: string; // hh:mm:ss or mm:ss
  time21K?: string; // hh:mm:ss or mm:ss
  vamTestDistance?: number; // meters in 5 minutes
  maxDistanceCurrent?: "less_5" | "5_10" | "10_15" | "more_15"; // for MEJORAR_RESISTENCIA
  resistanceTarget?: "run_10k" | "run_15k" | "run_21k" | "general"; // for MEJORAR_RESISTENCIA
  
  // Injuries
  activeInjury: boolean;
  injuryAreas: string[]; // "rodilla", "tobillo", "cadera", "gemelos", "sóleo", "aquiles", "fascia_plantar", "espalda", "isquios"
  injuryNotes?: string;
  
  completedAt?: string;
}

export interface TrainingZones {
  regenerative?: string;
  suave?: string;
  controlado?: string;
  tempo?: string;
  umbral?: string;
  seriesLargas?: string;
  seriesCortas?: string;
  paceActual?: string;
  rpeDescription?: {
    easy: string;
    aerobic: string;
    tempo: string;
    series: string;
  };
}

export interface WorkoutSession {
  id: string;
  dayIndex: number; // 0 (Lunes) to 6 (Domingo)
  type: "carrera" | "fuerza" | "descanso" | "movilidad";
  name: string;
  objective: string;
  warmup: string;
  mainWork: string;
  intensity: string;
  recovery: string;
  cooldown: string;
  physiologicalExplanation: string;
  fatigueAdaptation: string;
  isCompleted: boolean;
  feedback?: "perfecto" | "adecuado" | "muy_duro" | "facil" | "incompleto" | "no_realizado";
  rpeGiven?: number; // 1-10
  isLongRun?: boolean; // Tirada larga aeróbica: habilita el registro de resultado real para recalcular el predictor de marcas.
}

export interface WeeklyPlan {
  weekNumber: number;
  isDescarga: boolean;
  isTaper: boolean;
  description: string;
  sessions: WorkoutSession[];
}

export interface TrainingPlan {
  id: string;
  objective: RunningObjective;
  createdAt: string;
  durationWeeks: number;
  frequency: FrequencyOption;
  initialDiagnostic: {
    levelEstimated: "Principiante" | "Intermedio" | "Avanzado";
    mainLimitant: string;
    strengths: string[];
    weaknesses: string[];
    bmi: number;
    bmiCategory: string;
    successProbability: string; // "Muy Alta" | "Alta" | "Media" | "Baja"
    estimatedPaces: {
      "5K"?: string;
      "10K"?: string;
      "21K"?: string;
      "42K"?: string;
    };
    targets: {
      conservador: string;
      realista: string;
      agresivo?: string;
    };
  };
  zones: TrainingZones;
  weeks: WeeklyPlan[];
}

export interface DailyReadinessInput {
  date: string; // YYYY-MM-DD
  sleepHours: number; // 1 to 10+
  sleepQuality: "bueno" | "normal" | "malo";
  stress: number; // 1 (bajo) to 5 (alto)
  fatigue: number; // 1 (bajo) to 5 (alto)
  muscleSoreness: number; // 1 (bajo) to 5 (alto) (Dolor muscular)
  jointSoreness?: number; // 1 (bajo) to 5 (alto) (Dolor articular o tendinoso)
  prevRPE: number; // 1 to 10
}

export interface DailyReadinessScore {
  date: string;
  sleepScore: number;
  score: number; // 0 to 100
  state: "PROGRESAR" | "NORMAL" | "ADAPTAR" | "RECOVERY" | "DESCANSO";
}

export interface AdaptedWorkoutResult {
  originalWorkout: WorkoutSession;
  adaptedWorkout: WorkoutSession | null; // null if rest or canceled
  status: "mantener" | "adaptado" | "reducido" | "sustituido" | "cancelado";
  readinessScore: number;
  justification: string;
  injuryRisk: "Bajo" | "Moderado" | "Alto" | "Extremo";
  recoveryRecommendation: string;
}

export interface WorkoutCompletionRecord {
  feedback: string;
  rpe: number;
  date: string;
  actualDistanceKm?: number; // Solo para sesiones isLongRun: distancia realmente recorrida.
  actualTimeSeconds?: number; // Solo para sesiones isLongRun: tiempo total invertido.
}

export interface RunningVAMTestResult {
  distanceMeters: number;
  vamKmH: number;
  vamPaceMinKm: string;
  completedAt: string;
}

export interface AppState {
  onboarding: OnboardingData | null;
  plan: TrainingPlan | null;
  currentWeekIndex: number;
  readinessHistory: Record<string, DailyReadinessInput>; // Key: YYYY-MM-DD
  completedWorkouts: Record<string, WorkoutCompletionRecord>; // Key: workoutId
  activeTab: "landing" | "onboarding" | "dashboard" | "plan" | "today" | "readiness" | "settings";
}

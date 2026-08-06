import {
  RunningObjective,
  ExperienceLevel,
  FrequencyOption,
  OnboardingData,
  TrainingZones,
  WorkoutSession,
  WeeklyPlan,
  TrainingPlan,
  DailyReadinessInput,
  DailyReadinessScore,
  AdaptedWorkoutResult
} from "./types";

// ============================================================================
// HELPER FUNCTIONS FOR PACE AND TIME MANIPULATION
// ============================================================================

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function formatSecondsToTime(totalSecs: number): string {
  if (isNaN(totalSecs) || totalSecs <= 0) return "--:--";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.round(totalSecs % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function paceToSeconds(paceStr: string): number {
  // e.g., "5:30" -> 330 seconds
  if (!paceStr) return 0;
  const parts = paceStr.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function secondsToPace(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

// ============================================================================
// MÓDULO 1 & 6: CALCULO DE READINESS Y COMPOSICIÓN CORPORAL
// ============================================================================

export function calculateBMI(weight: number, heightCm: number): { bmi: number; category: string } {
  const heightM = heightCm / 100;
  if (heightM <= 0) return { bmi: 0, category: "N/A" };
  const bmi = weight / (heightM * heightM);
  let category = "Normal";
  if (bmi < 18.5) category = "Bajo peso";
  else if (bmi >= 25 && bmi < 30) category = "Sobrepeso";
  else if (bmi >= 30) category = "Obesidad";
  
  return { bmi: Math.round(bmi * 10) / 10, category };
}

export function calculateReadiness(input: DailyReadinessInput, history3DaysLess50: boolean = false): DailyReadinessScore {
  // Hours Score
  let hoursScore = 0;
  if (input.sleepHours > 8) hoursScore = 100;
  else if (input.sleepHours >= 7) hoursScore = 90;
  else if (input.sleepHours >= 6) hoursScore = 75;
  else if (input.sleepHours >= 5) hoursScore = 50;
  else if (input.sleepHours >= 4) hoursScore = 35;
  else hoursScore = 20;

  // Quality Modifier
  let qualityMod = 0;
  if (input.sleepQuality === "bueno") qualityMod = 10;
  else if (input.sleepQuality === "malo") qualityMod = -20;

  const sleepScore = Math.min(100, Math.max(0, hoursScore + qualityMod));

  // Fatigue Scale (1 to 5) -> 1 is best, 5 is worst
  const fatigueMap: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 };
  const fatigueScore = fatigueMap[input.fatigue] || 60;

  // Stress Scale (1 to 5) -> 1 is best, 5 is worst
  const stressMap: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 };
  const stressScore = stressMap[input.stress] || 60;

  // Muscle Soreness (1 to 5) -> 1 is best, 5 is worst (Dolor)
  const muscleSorenessMap: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 };
  const soreScore = muscleSorenessMap[input.muscleSoreness] || 60;

  // RPE Scale mapping
  let rpeScore = 100;
  if (input.prevRPE === 9) rpeScore = 70;
  else if (input.prevRPE === 10) rpeScore = 40;

  // Readiness calculation
  let readiness = 
    (sleepScore * 0.30) + 
    (fatigueScore * 0.25) + 
    (stressScore * 0.20) + 
    (soreScore * 0.15) + 
    (rpeScore * 0.10);

  // Extreme cases constraints
  if (input.sleepHours < 4) {
    readiness = Math.min(50, readiness);
  }
  if (input.fatigue === 5) {
    readiness = Math.min(45, readiness);
  }
  if (input.stress === 5 && input.fatigue === 5) {
    readiness = Math.min(35, readiness);
  }

  readiness = Math.round(readiness);

  // State determination
  let state: "PROGRESAR" | "NORMAL" | "ADAPTAR" | "RECOVERY" | "DESCANSO" = "NORMAL";
  
  if (history3DaysLess50) {
    state = "RECOVERY";
  } else if (readiness >= 85) {
    state = "PROGRESAR";
  } else if (readiness >= 70) {
    state = "NORMAL";
  } else if (readiness >= 55) {
    // Reducir volumen
    state = "NORMAL"; // Will trigger -1 series
  } else if (readiness >= 40) {
    state = "ADAPTAR";
  } else {
    state = "DESCANSO";
  }

  return {
    date: input.date,
    sleepScore,
    score: readiness,
    state
  };
}

// ============================================================================
// MÓDULO 5: DETECCIÓN DE LIMITANTE PRINCIPAL
// ============================================================================

export function detectLimitant(data: OnboardingData): {
  mainLimitant: string;
  strengths: string[];
  weaknesses: string[];
} {
  let mainLimitant = "Base aeróbica";
  let strengths: string[] = [];
  let weaknesses: string[] = [];

  const { bmi } = calculateBMI(data.weight, data.height);

  if (data.activeInjury) {
    mainLimitant = "Recuperación";
    strengths.push("Compromiso preventivo");
    weaknesses.push(`Dolor activo en zona: ${data.injuryAreas.join(", ")}`);
  } else if (data.objective === RunningObjective.PRIMER_10K && data.experienceLevel === ExperienceLevel.PRINCIPIANTE_ZERO) {
    mainLimitant = "Base aeróbica";
    strengths.push("Entusiasmo inicial");
    weaknesses.push("Falta de adaptación neuromuscular", "Bajo volumen de carrera semanal");
  } else if (data.objective === RunningObjective.MEJORAR_RITMO) {
    mainLimitant = "Velocidad";
    strengths.push("Resistencia general aceptable");
    weaknesses.push("Ritmos lentos en umbral", "Economía de carrera mejorable");
  } else if (data.objective === RunningObjective.MEJORAR_RESISTENCIA) {
    mainLimitant = "Base aeróbica";
    strengths.push("Tolerancia al esfuerzo constante");
    weaknesses.push("Fatiga cardiovascular temprana", "Poco volumen acumulado");
  } else if (bmi > 26) {
    mainLimitant = "Resistencia muscular";
    strengths.push("Capacidad de empuje");
    weaknesses.push("Alto impacto articular", "Fatiga muscular en piernas");
  } else {
    mainLimitant = "Umbral";
    strengths.push("Disciplina aeróbica");
    weaknesses.push("Caída de ritmo en segunda mitad de carrera", "Tolerancia al lactato");
  }

  // General fills based on other data
  if (data.frequency === FrequencyOption.FREQ_4_2 || data.frequency === FrequencyOption.FREQ_5_2) {
    strengths.push("Alta adherencia y disponibilidad semanal");
  } else {
    weaknesses.push("Tiempo limitado para entrenar carrera");
  }

  if (data.injuryAreas.length > 0 && !strengths.includes("Atención preventiva")) {
    weaknesses.push(`Historial de molestias: ${data.injuryAreas.join(", ")}`);
  }

  return { mainLimitant, strengths, weaknesses };
}

// ============================================================================
// MÓDULO 8 & 9: PROBABILIDAD DE ÉXITO Y PREDICTOR DE MARCAS
// ============================================================================

export function estimateSuccessProbability(data: OnboardingData): "Muy Alta" | "Alta" | "Media" | "Baja" {
  let score = 70; // start neutral
  
  if (data.activeInjury) score -= 25;
  if (data.injuryAreas.length > 0) score -= 10;
  
  if (data.frequency === FrequencyOption.FREQ_4_2 || data.frequency === FrequencyOption.FREQ_5_2) score += 15;
  if (data.frequency === FrequencyOption.FREQ_2_2) score -= 10;
  
  if (data.objective === RunningObjective.PRIMER_10K && data.experienceLevel === ExperienceLevel.AVANZADO_5K) score += 15;
  if (data.objective === RunningObjective.PRIMER_10K && data.experienceLevel === ExperienceLevel.PRINCIPIANTE_ZERO) score -= 5;
  
  const bmi = data.weight / ((data.height / 100) * (data.height / 100));
  if (bmi > 27) score -= 10;
  if (bmi >= 19 && bmi <= 24) score += 10;

  if (score > 80) return "Muy Alta";
  if (score >= 60) return "Alta";
  if (score >= 40) return "Media";
  return "Baja";
}

export function predictMarks(data: OnboardingData): Record<string, string> {
  let referenceSecs = 0;
  let referenceDistance = 0;

  if (data.time10K) {
    referenceSecs = parseTimeToSeconds(data.time10K);
    referenceDistance = 10;
  } else if (data.time21K) {
    referenceSecs = parseTimeToSeconds(data.time21K);
    referenceDistance = 21.1;
  } else if (data.vamTestDistance) {
    // VAM Test: 5 minutes. Estimate 5K, 10K based on VAM
    const vamKmh = (data.vamTestDistance / 300) * 3.6; // Speed in km/h
    // Estimate 10K as running at 80% VAM
    const est10KSpeed = vamKmh * 0.82;
    referenceSecs = (10 / est10KSpeed) * 3600;
    referenceDistance = 10;
  } else {
    // Standard defaults based on objective/experience
    if (data.experienceLevel === ExperienceLevel.PRINCIPIANTE_ZERO) {
      referenceSecs = 70 * 60; // 1h 10m for 10K
    } else if (data.experienceLevel === ExperienceLevel.INTERMEDIO_2K) {
      referenceSecs = 58 * 60; // 58m for 10K
    } else {
      referenceSecs = 50 * 60; // 50m for 10K
    }
    referenceDistance = 10;
  }

  // Riegel's formula: T2 = T1 * (D2/D1)^1.06
  const predictTime = (targetDist: number): string => {
    const secs = referenceSecs * Math.pow(targetDist / referenceDistance, 1.06);
    return formatSecondsToTime(secs);
  };

  return {
    "5K": predictTime(5),
    "10K": predictTime(10),
    "21K": predictTime(21.1),
    "42K": predictTime(42.2)
  };
}

// ============================================================================
// CALCULATE TRAINING PACE ZONES
// ============================================================================

export function calculateTrainingZones(data: OnboardingData): TrainingZones {
  let basePaceSecs = 330; // default 5:30/km
  let hasData = false;

  if (data.time10K) {
    const totalSecs = parseTimeToSeconds(data.time10K);
    basePaceSecs = totalSecs / 10;
    hasData = true;
  } else if (data.time21K) {
    const totalSecs = parseTimeToSeconds(data.time21K);
    // Pace 21K + estimate 10k pace (about 21K pace - 20 seconds)
    basePaceSecs = (totalSecs / 21.1) - 20;
    hasData = true;
  } else if (data.vamTestDistance) {
    // VAM speed -> 10K pace estimate
    const vamKmh = (data.vamTestDistance / 5) * 0.06; // e.g., 1000m -> 12km/h
    const testPaceSecs = 3600 / vamKmh; // pace in sec/km
    basePaceSecs = testPaceSecs / 0.85; // estimate 10k pace at 85% VAM
    hasData = true;
  }

  if (!hasData) {
    // Default based on experience level
    if (data.experienceLevel === ExperienceLevel.PRINCIPIANTE_ZERO) {
      basePaceSecs = 420; // 7:00/km
    } else if (data.experienceLevel === ExperienceLevel.INTERMEDIO_2K) {
      basePaceSecs = 345; // 5:45/km
    } else if (data.experienceLevel === ExperienceLevel.AVANZADO_5K) {
      basePaceSecs = 300; // 5:00/km
    }
  }

  // Apply formulas based on 10K base pace
  // 1. Rodaje regenerativo: Pace + 75 to +105 s
  const regenMin = secondsToPace(basePaceSecs + 105);
  const regenMax = secondsToPace(basePaceSecs + 75);

  // 2. Rodaje suave: Pace + 45 to +75 s
  const suaveMin = secondsToPace(basePaceSecs + 75);
  const suaveMax = secondsToPace(basePaceSecs + 45);

  // 3. Rodaje controlado: Pace + 20 to + 40 s
  const ctrlMin = secondsToPace(basePaceSecs + 40);
  const ctrlMax = secondsToPace(basePaceSecs + 20);

  // 4. Tempo: Pace ± 10 s
  const tempoMin = secondsToPace(basePaceSecs + 10);
  const tempoMax = secondsToPace(basePaceSecs - 10);

  // 5. Umbral: Pace -15 to -25 s
  const umbralMin = secondsToPace(basePaceSecs - 15);
  const umbralMax = secondsToPace(basePaceSecs - 25);

  // 6. Series largas: Pace -20 to -40 s
  const seriesLMin = secondsToPace(basePaceSecs - 20);
  const seriesLMax = secondsToPace(basePaceSecs - 40);

  // 7. Series cortas: Pace -30 to -60 s
  const seriesCMin = secondsToPace(basePaceSecs - 30);
  const seriesCMax = secondsToPace(basePaceSecs - 60);

  return {
    paceActual: secondsToPace(basePaceSecs),
    regenerative: `${regenMin} a ${regenMax}`,
    suave: `${suaveMin} a ${suaveMax}`,
    controlado: `${ctrlMin} a ${ctrlMax}`,
    tempo: `${tempoMin} a ${tempoMax}`,
    umbral: `${umbralMin} a ${umbralMax}`,
    seriesLargas: `${seriesLMin} a ${seriesLMax}`,
    seriesCortas: `${seriesCMin} a ${seriesCMax}`,
    rpeDescription: {
      easy: "Suave / Cómodo: RPE 2-4. Se puede mantener una conversación fluida sin problemas.",
      aerobic: "Aeróbico medio: RPE 5-6. Respiración constante, conversación en frases cortas.",
      tempo: "Ritmo de Tempo / Umbral: RPE 7-8. Esfuerzo duro pero controlable. Concentración requerida.",
      series: "Intervalos / Máximo: RPE 9-10. Ritmo muy exigente. Respiración agitada, no se puede hablar."
    }
  };
}

// ============================================================================
// STRENGTH WORKOUT DEFINITIONS (FUERZA A & FUERZA B)
// ============================================================================

const FUERZA_A_TEMPLATE = {
  name: "Fuerza A: Potencia + Cadena Posterior",
  objective: "Desarrollar fuerza en glúteo mayor, isquios, core y tobillos para mejorar potencia de zancada y economía de carrera.",
  warmup: "90/90 (2x8 por lado), World's Greatest Stretch (2x5 por lado), Knee To Wall (2x10 por lado), Tibialis Raises (2x15), Monster Walk (2x12 pasos por lado), Puente de glúteo (2x12).",
  mainWork: "Bloque 1: Sentadilla Goblet (3x10) + Dead Bug (3x10 por lado). Bloque 2: Peso Muerto Rumano (3x10) + Plancha frontal (3x40s). Bloque 3: Step Up en cajón (3x10 por pierna) + Bird Dog (3x10 por lado). Bloque 4: Hip Thrust con peso (3x12) + Pallof Press con banda (3x12 por lado).",
  intensity: "Esfuerzo moderado-alto. Dejar siempre 2 repeticiones en recámara (RIR 2). Evitar llegar al fallo.",
  recovery: "Descansar 60 segundos entre superseries.",
  cooldown: "Estiramiento suave de isquiotibiales y flexores de cadera + 5 minutos de respiración profunda.",
  physiologicalExplanation: "La sentadilla goblet recluta cuádriceps y glúteo para sostener la postura erguida. El peso muerto rumano y el hip thrust fortalecen la cadena posterior, encargada de impulsarte hacia adelante de forma eficiente.",
  fatigueAdaptation: "Si tienes fatiga muscular alta (>3/5), reduce las series a 2 por ejercicio y elimina peso externo. Mantén solo el peso corporal."
};

const FUERZA_B_TEMPLATE = {
  name: "Fuerza B: Estabilidad + Unilateral + Prevención",
  objective: "Reforzar glúteo medio, isquios excéntricos, estabilidad monopodal y tobillo para prevenir lesiones comunes (cintilla, rodilla, fascitis).",
  warmup: "Cossack Squat (2x8 por lado), 90/90 Switches (2x8 por lado), Tobillo Mobility Rock (2x10 por lado), Elevaciones de gemelo lentas (2x15), Clamshell (2x12 por lado), Single Leg Glute Bridge (2x10 por lado).",
  mainWork: "Bloque 1: Zancada Búlgara unilateral (3x10 por pierna) + Side Plank (3x30s por lado). Bloque 2: Curl Nórdico Asistido excéntrico lento (3x5) + Hollow Hold (3x25s). Bloque 3: Monster Walk lateral (3x15 pasos) + Plancha con toques de hombro (3x20). Bloque 4: Peso Muerto Rumano Monopodal (3x10 por pierna) + Farmer Carry (3x40 metros).",
  intensity: "Control y equilibrio. Centrarse en la fase excéntrica (bajada lenta de 3 segundos).",
  recovery: "Descansar 60 segundos entre superseries.",
  cooldown: "Movilidad de tobillo + automasaje con pelota/foam roller en fascia plantar e isquios.",
  physiologicalExplanation: "Correr es un deporte monopodal (siempre estás sobre un pie). La zancada búlgara y el peso muerto monopodal entrenan la estabilidad de rodilla y pelvis, evitando que colapse la rodilla hacia adentro (valgo).",
  fatigueAdaptation: "Si hay molestia articular (>2/5), sustituye zancada búlgara por puentes de glúteo bipodales y elimina la fase excéntrica pesada."
};

// ============================================================================
// CEREBRO MAESTRO RUNNING DEFINITIVO (MASTER_BRAIN)
// ============================================================================

export function generateTrainingPlan(data: OnboardingData): TrainingPlan {
  const zones = calculateTrainingZones(data);
  const limitants = detectLimitant(data);
  const successProb = estimateSuccessProbability(data);
  const estimatedPaces = predictMarks(data);
  const bmiCalc = calculateBMI(data.weight, data.height);

  let durationWeeks = 8;
  let levelEstimated: "Principiante" | "Intermedio" | "Avanzado" = "Intermedio";

  // Determine Duration and Level
  if (data.objective === RunningObjective.PRIMER_10K) {
    if (data.experienceLevel === ExperienceLevel.PRINCIPIANTE_ZERO) {
      durationWeeks = 12;
      levelEstimated = "Principiante";
    } else if (data.experienceLevel === ExperienceLevel.INTERMEDIO_2K) {
      durationWeeks = 8;
      levelEstimated = "Intermedio";
    } else {
      durationWeeks = 8;
      levelEstimated = "Avanzado";
    }
  } else if (data.objective === RunningObjective.MEJORAR_10K) {
    durationWeeks = data.frequency === FrequencyOption.FREQ_3_2 ? 8 : 10;
    const paceSec = parseTimeToSeconds(data.time10K || "55:00") / 10;
    if (paceSec > 360) levelEstimated = "Principiante";
    else if (paceSec >= 270) levelEstimated = "Intermedio";
    else levelEstimated = "Avanzado";
  } else if (data.objective === RunningObjective.PRIMER_21K) {
    durationWeeks = 12; // default
    levelEstimated = "Intermedio";
  } else if (data.objective === RunningObjective.MEJORAR_21K) {
    durationWeeks = 12; // default
    const paceSec = parseTimeToSeconds(data.time21K || "02:00:00") / 21.1;
    if (paceSec > 360) levelEstimated = "Principiante";
    else if (paceSec >= 270) levelEstimated = "Intermedio";
    else levelEstimated = "Avanzado";
  } else if (data.objective === RunningObjective.MEJORAR_RITMO) {
    durationWeeks = 8;
    levelEstimated = "Intermedio";
  } else if (data.objective === RunningObjective.MEJORAR_RESISTENCIA) {
    durationWeeks = 10;
    if (data.maxDistanceCurrent === "less_5") levelEstimated = "Principiante";
    else if (data.maxDistanceCurrent === "5_10") levelEstimated = "Intermedio";
    else levelEstimated = "Avanzado";
  }

  // Set target paces based on objective
  let targets = { conservador: "", realista: "", agresivo: "" };
  if (data.objective === RunningObjective.PRIMER_10K) {
    targets.conservador = "Completar la distancia corriendo de forma continua.";
    targets.realista = "Completar los 10K sintiendo control y con RPE <6.";
    targets.agresivo = "Acercarse a un tiempo sub-60 minutos.";
  } else if (data.objective === RunningObjective.MEJORAR_10K && data.time10K) {
    const totalSecs = parseTimeToSeconds(data.time10K);
    const improvement = levelEstimated === "Principiante" ? 0.06 : levelEstimated === "Intermedio" ? 0.04 : 0.02;
    targets.conservador = formatSecondsToTime(totalSecs * (1 - improvement * 0.5));
    targets.realista = formatSecondsToTime(totalSecs * (1 - improvement));
    targets.agresivo = formatSecondsToTime(totalSecs * (1 - improvement * 1.5));
  } else if (data.objective === RunningObjective.PRIMER_21K) {
    targets.conservador = "Cruzar la meta corriendo y sin lesiones.";
    targets.realista = "Correr cómodamente, con tiempo estimado de: " + (estimatedPaces["21K"] || "2:05:00");
    targets.agresivo = "Lograr una marca por debajo de 2 horas.";
  } else if (data.objective === RunningObjective.MEJORAR_21K && data.time21K) {
    const totalSecs = parseTimeToSeconds(data.time21K);
    const improvement = levelEstimated === "Principiante" ? 0.07 : levelEstimated === "Intermedio" ? 0.05 : 0.025;
    targets.conservador = formatSecondsToTime(totalSecs * (1 - improvement * 0.5));
    targets.realista = formatSecondsToTime(totalSecs * (1 - improvement));
    targets.agresivo = formatSecondsToTime(totalSecs * (1 - improvement * 1.5));
  } else {
    targets.conservador = "Mejorar la tolerancia a la velocidad aeróbica.";
    targets.realista = "Reducir el ritmo de carrera de fondo en 15-20 seg/km.";
    targets.agresivo = "Mejorar un 5% el ritmo promedio del test de 5K.";
  }

  // Generate weeks
  const weeks: WeeklyPlan[] = [];

  for (let w = 1; w <= durationWeeks; w++) {
    // Determine periodization type
    let isDescarga = false;
    let isTaper = false;
    let periodName = "Construcción";

    if (durationWeeks === 12) {
      if (w === 4 || w === 8) isDescarga = true;
      if (w === 12) isTaper = true;
      periodName = w <= 4 ? "Fase Base Aeróbica" : w <= 8 ? "Fase de Construcción Específica" : w <= 11 ? "Fase de Intensidad y Pico" : "Taper y Competición";
    } else if (durationWeeks === 8) {
      if (w === 4) isDescarga = true;
      if (w === 8) isTaper = true;
      periodName = w <= 3 ? "Fase Inicial" : w <= 6 ? "Fase Específica" : w === 7 ? "Pico de Carga" : "Taper y Test";
    } else if (durationWeeks === 10) {
      if (w === 4 || w === 8) isDescarga = true;
      if (w === 10) isTaper = true;
      periodName = w <= 4 ? "Base Aeróbica" : w <= 7 ? "Bloque de Fuerza y Ritmo" : w <= 9 ? "Pico Específico" : "Taper y Carrera";
    }

    const sessions: WorkoutSession[] = [];
    const runSessionsCount = 
      data.frequency === FrequencyOption.FREQ_2_2 ? 2 :
      data.frequency === FrequencyOption.FREQ_3_2 ? 3 :
      data.frequency === FrequencyOption.FREQ_4_2 ? 4 : 5;

    // Generate days of the week 0 (Lunes) to 6 (Domingo)
    for (let d = 0; d < 7; d++) {
      const sessionId = `w${w}-d${d}`;
      
      // Let's decide what session to put on each day based on structures described in the manuals
      let type: "carrera" | "fuerza" | "descanso" | "movilidad" = "descanso";
      let name = "Descanso activo";
      let objective = "Reposo para supercompensación y asimilación del entrenamiento.";
      let warmup = "5-10 minutos de movilidad articular suave.";
      let mainWork = "Descanso total o caminata ligera de 20-30 minutos.";
      let intensity = "Baja. Sin impacto.";
      let recovery = "N/A";
      let cooldown = "Rutina de estiramientos ligeros.";
      let physiologicalExplanation = "Las adaptaciones cardiovasculares y musculares ocurren durante el descanso, no durante la carrera. El cuerpo repara los microdesgarros musculares y llena los depósitos de glucógeno.";
      let fatigueAdaptation = "Si te sientes con energía, puedes añadir 20 min de caminata o estiramientos de yoga suave.";

      // Force Days Allocation (Common for almost all plans)
      const forceDay1 = 0; // Lunes: Fuerza A
      const forceDay2 = 3; // Jueves: Fuerza B

      if (isTaper && d === forceDay2) {
        // Last week Taper: lighter force or mobility instead of Fuerza B
        type = "movilidad";
        name = "Movilidad y Activación Pre-Carrera";
        objective = "Mantener activas las fibras musculares sin generar fatiga ni agujetas.";
        warmup = "10 minutos de movilidad general dinámica.";
        mainWork = "Activación de glúteos (2x15 monster walk), core suave (2x30s plancha), estiramientos activos dinámicos de cadera y tobillo.";
        intensity = "Muy baja. Cero fatiga.";
        recovery = "N/A";
        cooldown = "Caminata de 10 min + respiración.";
        physiologicalExplanation = "Mantiene los rangos de movimiento y la conexión mente-músculo lista sin mermar tus reservas de glucógeno para la prueba final.";
        fatigueAdaptation = "Si notas tensión, dedícale más tiempo a la movilidad de tobillos.";
      } else if (d === forceDay1) {
        type = "fuerza";
        name = FUERZA_A_TEMPLATE.name;
        objective = FUERZA_A_TEMPLATE.objective;
        warmup = FUERZA_A_TEMPLATE.warmup;
        mainWork = isDescarga ? FUERZA_A_TEMPLATE.mainWork.replace(/3x10/g, "2x8").replace(/3x12/g, "2x10").replace(/3x40s/g, "2x30s") : FUERZA_A_TEMPLATE.mainWork;
        intensity = isDescarga ? "Carga reducida para regeneración (volumen -30%)." : FUERZA_A_TEMPLATE.intensity;
        recovery = FUERZA_A_TEMPLATE.recovery;
        cooldown = FUERZA_A_TEMPLATE.cooldown;
        physiologicalExplanation = FUERZA_A_TEMPLATE.physiologicalExplanation;
        fatigueAdaptation = FUERZA_A_TEMPLATE.fatigueAdaptation;
      } else if (d === forceDay2) {
        type = "fuerza";
        name = FUERZA_B_TEMPLATE.name;
        objective = FUERZA_B_TEMPLATE.objective;
        warmup = FUERZA_B_TEMPLATE.warmup;
        mainWork = isDescarga ? FUERZA_B_TEMPLATE.mainWork.replace(/3x10/g, "2x8").replace(/3x25s/g, "2x20s").replace(/3x30s/g, "2x20s") : FUERZA_B_TEMPLATE.mainWork;
        intensity = isDescarga ? "Volumen de fuerza rebajado un 25% para recuperación." : FUERZA_B_TEMPLATE.intensity;
        recovery = FUERZA_B_TEMPLATE.recovery;
        cooldown = FUERZA_B_TEMPLATE.cooldown;
        physiologicalExplanation = FUERZA_B_TEMPLATE.physiologicalExplanation;
        fatigueAdaptation = FUERZA_B_TEMPLATE.fatigueAdaptation;
      } else {
        // Carrera Days Allocation
        // Depending on Frecuencia Option
        let isRunDay = false;
        
        if (data.frequency === FrequencyOption.FREQ_2_2) {
          // Tue (1) and Fri (4) or Sun (6)
          if (d === 1 || d === 5) isRunDay = true;
        } else if (data.frequency === FrequencyOption.FREQ_3_2) {
          // Tue (1), Fri (4), Sun (6)
          if (d === 1 || d === 4 || d === 6) isRunDay = true;
        } else if (data.frequency === FrequencyOption.FREQ_4_2) {
          // Tue (1), Wed (2), Fri (4), Sun (6)
          if (d === 1 || d === 2 || d === 4 || d === 6) isRunDay = true;
        } else {
          // FREQ_5_2: Tue (1), Wed (2), Fri (4), Sat (5), Sun (6)
          if (d === 1 || d === 2 || d === 4 || d === 5 || d === 6) isRunDay = true;
        }

        if (isRunDay) {
          type = "carrera";
          
          // Let's decide run session details based on the objective and day of run
          if (data.objective === RunningObjective.PRIMER_10K) {
            if (data.experienceLevel === ExperienceLevel.PRINCIPIANTE_ZERO) {
              // Run/walk strategy. Focus on volume, low intensity
              const walkRatio = Math.max(1, 3 - Math.floor(w / 3)); // Decreases as weeks progress
              const runRatio = Math.min(10, w); // Increases
              const reps = 6 + Math.floor(w / 2);
              
              if (d === 6) {
                // Tirada Larga
                name = `Tirada Larga Run/Walk - S${w}`;
                objective = "Incrementar progresivamente la duración en movimiento continuo de forma segura.";
                warmup = "10 minutos de movilidad articular dinámica y caminata rápida.";
                mainWork = isDescarga 
                  ? `${reps - 2} series de [${runRatio} min corriendo fácil + ${walkRatio} min caminando].`
                  : `${reps} series de [${runRatio} min corriendo fácil + ${walkRatio} min caminando].`;
                intensity = `Ritmo fácil / Regenerativo (Zonas RPE 2-3). Ritmo recomendado: ${zones.regenerative}`;
                recovery = "Caminata activa integrada en la serie.";
                cooldown = "5 minutos de caminata muy lenta de vuelta a la calma.";
                physiologicalExplanation = "El método Ca-Co (Caminar-Correr) permite acumular volumen limitando el impacto músculo-esquelético, estimulando adaptaciones de tendones y capilares.";
                fatigueAdaptation = "Si se siente muy duro, aumenta el tramo de caminata en 1 minuto.";
              } else {
                name = `Rodaje Suave Run/Walk - S${w}`;
                objective = "Mejorar la base de resistencia aeróbica y adaptación neuromuscular.";
                warmup = "10 minutos de movilidad y caminata rápida.";
                mainWork = `${reps - 2} series de [${runRatio} min corriendo suave + ${walkRatio} min caminando].`;
                intensity = `Fácil y sin ahogo: ${zones.suave} (RPE 3-4).`;
                recovery = "Caminata activa.";
                cooldown = "5 minutos de caminata + estiramientos.";
                physiologicalExplanation = "Mantiene los niveles de lactato muy bajos en sangre y promueve el uso de grasas como fuente de energía principal.";
                fatigueAdaptation = "Si las pulsaciones suben demasiado, reduce el ritmo de carrera y camina un poco más.";
              }
            } else {
              // Primer 10k but has background (Intermedio/Avanzado)
              if (d === 6) {
                // Tirada larga
                const baseKms = data.experienceLevel === ExperienceLevel.INTERMEDIO_2K ? 5 : 7;
                const dist = isDescarga ? baseKms : baseKms + Math.min(5, Math.floor(w * 0.7));
                name = `Tirada Larga Aeróbica - ${dist}K`;
                objective = "Desarrollar la tolerancia del volumen y resistencia muscular de las piernas.";
                warmup = "10 minutos de estiramientos dinámicos y zancadas lentas.";
                mainWork = `Correr de forma continua durante ${dist} km a ritmo controlado.`;
                intensity = `Ritmo suave: ${zones.suave} (RPE 3-4).`;
                recovery = "N/A (Esfuerzo continuo).";
                cooldown = "5 minutos de caminata lenta + foam roller en gemelos.";
                physiologicalExplanation = "Incrementa la densidad de mitocondrias en las fibras musculares de tipo I (lentas) y optimiza el almacenamiento de glucógeno en el músculo.";
                fatigueAdaptation = "Si te sientes fatigado, reduce el volumen a los kilómetros mínimos de la semana anterior.";
              } else if (d === 1) {
                // Calidad moderada o series (solo en semanas medias)
                if (w > 2 && !isDescarga && !isTaper) {
                  const reps = w <= 5 ? 4 : 6;
                  name = `Intervalos de Adaptación - ${reps}x500m`;
                  objective = "Introducir velocidad controlada y mejorar el umbral de lactato de forma progresiva.";
                  warmup = "15 minutos de rodaje suave + 3 progresivos de 60 metros.";
                  mainWork = `${reps} series de 500 metros a ritmo rápido con recuperación estática.`;
                  intensity = `Ritmo de series largas: ${zones.seriesLargas} (RPE 7-8).`;
                  recovery = "Descansar 90 segundos parado o caminando lento.";
                  cooldown = "10 minutos de trote muy suave regenerativo.";
                  physiologicalExplanation = "Eleva el VO2 máximo de manera moderada y ayuda a reclutar fibras rápidas sin sobrecargar las articulaciones.";
                  fatigueAdaptation = "Si es tu primer contacto con series, haz solo 3 repeticiones de 400m.";
                } else {
                  name = "Rodaje Fácil de Recuperación";
                  objective = "Facilitar la circulación sanguínea para reparar tejidos sin añadir estrés mecánico.";
                  warmup = "Movilidad articular general.";
                  mainWork = "Trote continuo y fluido de 25-35 minutos.";
                  intensity = `Tono muy fácil / regenerativo: ${zones.regenerative} (RPE 2-3).`;
                  recovery = "N/A";
                  cooldown = "Estiramientos generales.";
                  physiologicalExplanation = "El movimiento ligero aumenta el riego de nutrientes a los músculos fatigados por la sesión de fuerza anterior, acelerando el drenaje celular.";
                  fatigueAdaptation = "Si hay molestias articulares, camina a paso ligero durante 35 minutos.";
                }
              } else {
                // Rodaje intermedio
                const duration = 30 + Math.min(15, w * 2);
                name = "Rodaje de Resistencia Aeróbica";
                objective = "Construir volumen de carrera general semanal de forma equilibrada.";
                warmup = "5 minutos de movilidad + caminata activa.";
                mainWork = `Trote continuo y constante de ${duration} minutos.`;
                intensity = `Ritmo suave o controlado: ${zones.suave} (RPE 4).`;
                recovery = "N/A";
                cooldown = "5 minutos de caminata rápida a lenta.";
                physiologicalExplanation = "Fortalece las articulaciones del tobillo y la rodilla mediante el impacto repetitivo controlado.";
                fatigueAdaptation = "Si no dispones de tiempo, puedes dividir la sesión en 2 bloques con 2 minutos de caminata.";
              }
            }
          } else if (data.objective === RunningObjective.MEJORAR_10K) {
            // Highly Structured 10K Plan
            if (isTaper && w === durationWeeks && d === 6) {
              // Final race test
              name = "Test de Competencia Final: 10K!";
              objective = "Buscar tu nueva marca personal en la distancia de 10 kilómetros.";
              warmup = "15 minutos de trote progresivo + 4 rectas dinámicas de 50m + movilidad articular.";
              mainWork = "10 kilómetros al máximo esfuerzo controlado (carrera oficial o test en ruta).";
              intensity = `Ritmo objetivo: ${zones.paceActual} o superior. Buscar Ritmo de Tempo: ${zones.tempo}.`;
              recovery = "Caminata y mucha hidratación al finalizar.";
              cooldown = "10 minutos de trote extremadamente suave + estiramientos.";
              physiologicalExplanation = "Culminación del programa donde pones a prueba la optimización cardiovascular y la eficiencia de carrera ganada.";
              fatigueAdaptation = "Ajusta tu estrategia corriendo en negativo (primera mitad 5 segundos más lenta que la segunda).";
            } else if (d === 1) {
              // Martes: Series de calidad según la tabla del manual
              let repsText = "6x400m";
              let ritText = zones.seriesCortas;
              let recText = "Descanso de 90 segundos parado.";
              
              if (w === 1) { repsText = "6x400m"; ritText = zones.seriesCortas; }
              else if (w === 2) { repsText = "8x400m"; ritText = zones.seriesCortas; }
              else if (w === 3) { repsText = "5x800m"; ritText = zones.seriesLargas; recText = "Descanso de 2 minutos."; }
              else if (w === 4) { repsText = "6x400m (Descarga)"; ritText = zones.seriesCortas; recText = "Descanso de 2 minutos."; }
              else if (w === 5) { repsText = "6x800m"; ritText = zones.seriesLargas; recText = "Descanso de 2 minutos."; }
              else if (w === 6) { repsText = "4x1000m"; ritText = zones.umbral; recText = "Descanso de 2 min trote suave."; }
              else if (w === 7) { repsText = "3x1600m"; ritText = zones.umbral; recText = "Descanso de 2 min 30 s parado."; }
              else if (w === 8) { repsText = "5x400m (Taper)"; ritText = zones.seriesCortas; recText = "Descanso de 2 min."; }
              else { repsText = "4x1000m"; ritText = zones.umbral; }

              name = `Series de Calidad: ${repsText}`;
              objective = "Mejorar el volumen de oxígeno máximo (VO2 Max) y la tolerancia neuromuscular al ritmo rápido.";
              warmup = "15 minutos de rodaje suave progresivo + técnica de carrera + 3 rectas.";
              mainWork = `Realizar ${repsText} en pista o asfalto plano con recuperación estática.`;
              intensity = `Ritmo: ${ritText}.`;
              recovery = recText;
              cooldown = "10 minutos de trote muy suave regenerativo.";
              physiologicalExplanation = "Las series cortas incrementan la capacidad buffer del músculo ante la acidez del lactato. Las series largas optimizan la eficiencia aeróbica e incrementan el umbral anaeróbico.";
              fatigueAdaptation = "Si el readiness diario es menor a 55, sustituye inmediatamente por rodaje suave.";
            } else if (d === 4) {
              // Viernes: Tempo / Umbral según el manual
              let kms = 4;
              if (w === 1) kms = 4;
              else if (w === 2) kms = 5;
              else if (w === 3) kms = 6;
              else if (w === 4) kms = 4; // descarga
              else if (w === 5) kms = 7;
              else if (w === 6) kms = 7;
              else if (w === 7) kms = 8;
              else kms = 4; // taper

              name = `Tempo de Ritmo de Umbral - ${kms}K`;
              objective = "Desarrollar la capacidad de sostener un ritmo elevado de forma constante durante más tiempo.";
              warmup = "10 minutos de trote suave + movilidad dinámica rápida.";
              mainWork = `Carrera continua sin pausa durante ${kms} kilómetros a ritmo tempo estable.`;
              intensity = `Ritmo de Tempo: ${zones.tempo} (RPE 7-8).`;
              recovery = "N/A (Esfuerzo continuo).";
              cooldown = "5 minutos de trote suave de vuelta a la calma + estiramientos.";
              physiologicalExplanation = "Entrena el cuerpo para reciclar el lactato y usarlo como combustible, retrasando la aparición de la fatiga a ritmos exigentes.";
              fatigueAdaptation = "Si vas forzado, puedes dividirlo en 2 bloques con 1 minuto de caminata en medio.";
            } else if (d === 6) {
              // Domingo: Tirada larga según el manual
              let kms = 10;
              if (w === 1) kms = 10;
              else if (w === 2) kms = 11;
              else if (w === 3) kms = 12;
              else if (w === 4) kms = 9; // descarga
              else if (w === 5) kms = 12;
              else if (w === 6) kms = 13;
              else if (w === 7) kms = 10;
              else kms = 6; // taper

              name = `Tirada Larga de Resistencia - ${kms}K`;
              objective = "Mejorar la base de fondo, resiliencia estructural de tendones y articulaciones.";
              warmup = "10 minutos de trote suave + movilidad activa general.";
              mainWork = `Carrera continua de fondo cubriendo ${kms} kilómetros.`;
              intensity = `Ritmo suave: ${zones.suave} (RPE 3-4).`;
              recovery = "N/A";
              cooldown = "5 minutos de trote regenerativo + estiramientos dinámicos.";
              physiologicalExplanation = "Incrementa la capilarización y el número de vasos sanguíneos que llegan a los músculos, mejorando el aporte de oxígeno.";
              fatigueAdaptation = "Si tus articulaciones sufren, realiza la tirada larga un 5% más lento.";
            } else {
              // Miércoles u otro día: Rodaje suave para recuperar carga
              name = "Rodaje de Base e Hidratación";
              objective = "Recuperar activamente entre sesiones de calidad, acumulando kilómetros base.";
              warmup = "5 minutos de movilidad articular de cadera.";
              mainWork = "Trote suave continuo y cómodo de 30 a 45 minutos.";
              intensity = `Ritmo regenerativo: ${zones.regenerative} (RPE 2-3).`;
              recovery = "N/A";
              cooldown = "Estiramientos suaves de pantorrillas y cuádriceps.";
              physiologicalExplanation = "Estimula la eliminación de toxinas musculares mediante un riego sanguíneo constante a baja intensidad.";
              fatigueAdaptation = "Si estás exhausto, camina 40 minutos rápido en lugar de correr.";
            }
          } else if (data.objective === RunningObjective.PRIMER_21K || data.objective === RunningObjective.MEJORAR_21K) {
            // Media Maratón
            if (isTaper && w === durationWeeks && d === 6) {
              name = "¡Día de Media Maratón (21.1K)!";
              objective = "Completar la carrera de fondo y cumplir tu meta con sensaciones óptimas.";
              warmup = "10 minutos de movilidad general, caminata rápida y un leve trote de activación.";
              mainWork = "Corre los 21.1 kilómetros dosificados de inicio a fin.";
              intensity = `Ritmo objetivo: ${zones.tempo} (para mejorar) o RPE 5-6 controlado.`;
              recovery = "Cuidado con la hidratación inicial con sales e ingesta de carbohidratos.";
              cooldown = "Paseo suave y felicitaciones.";
              physiologicalExplanation = "Demostración de la mejora de eficiencia energética de grasas y carbohidratos construida durante el plan.";
              fatigueAdaptation = "Sal conservador en los primeros 5 km. La carrera de 21K se decide después del kilómetro 15.";
            } else if (d === 6) {
              // Tirada Larga de 21K
              const baseTL = 12;
              const kms = isDescarga ? Math.floor(baseTL * 0.8) : baseTL + Math.min(6, w);
              name = `Tirada Larga Progresiva - ${kms}K`;
              objective = "Consolidar la resistencia de fondo y probar la nutrición de geles/hidratación.";
              warmup = "10 minutos de trote muy suave + movilidad de cadera.";
              mainWork = `Carrera continua de ${kms} km. Si te sientes bien, corre los últimos 2 km a ritmo objetivo de carrera.`;
              intensity = `Ritmo suave: ${zones.suave}. Paso por km: ${zones.suave}`;
              recovery = "N/A";
              cooldown = "10 minutos de estiramientos dinámicos y ducha fría en piernas.";
              physiologicalExplanation = "Estrecha la conexión de tus fibras musculares, entrena el sistema gastrointestinal para absorber agua y carbohidratos en carrera.";
              fatigueAdaptation = "Si notas molestias articulares, haz los últimos 2 kilómetros caminando.";
            } else if (d === 1) {
              // Series largas o cuestas
              const reps = 3 + Math.floor(w / 3);
              name = `Series de Resistencia Aeróbica - ${reps}x1000m`;
              objective = "Desarrollar la potencia aeróbica máxima y el umbral de lactato.";
              warmup = "15 minutos de trote progresivo + técnica de carrera.";
              mainWork = `Realizar ${reps} series de 1000m recuperando parado.`;
              intensity = `Ritmo de series largas: ${zones.seriesLargas}.`;
              recovery = "Descanso de 2 minutos parado.";
              cooldown = "10 minutos de trote muy fácil.";
              physiologicalExplanation = "Aumenta la fuerza de contracción cardíaca, expandiendo el volumen sistólico del ventrículo izquierdo.";
              fatigueAdaptation = "Si te sientes muy fatigado, haz tramos más cortos de 800m.";
            } else {
              name = "Tempo Controlado de Media Maratón";
              objective = "Fijar el ritmo específico de carrera de fondo.";
              warmup = "10 minutos de trote suave.";
              mainWork = `Trote de ${25 + w * 2} minutos con bloques centrales a ritmo objetivo de media maratón.`;
              intensity = `Ritmo controlado: ${zones.controlado} (RPE 5-6).`;
              recovery = "N/A";
              cooldown = "5 minutos de estiramientos.";
              physiologicalExplanation = "Enseña al cuerpo a acumular fatiga sin desestabilizar la técnica de zancada eficiente.";
              fatigueAdaptation = "Si las pulsaciones están disparadas, mantente solo en ritmo suave.";
            }
          } else if (data.objective === RunningObjective.MEJORAR_RITMO) {
            // Speed improvement
            if (d === 1) {
              // Cortas
              name = `Series Cortas de Velocidad - 8x200m`;
              objective = "Mejorar la velocidad punta, el reclutamiento de fibras rápidas y la eficiencia biomecánica.";
              warmup = "15 minutos de trote suave + técnica activa + 4 rectas acelerando.";
              mainWork = "8 series de 200 metros en asfalto llano a intensidad máxima controlada.";
              intensity = `Ritmo de series cortas: ${zones.seriesCortas} (RPE 9).`;
              recovery = "Descanso de 2 minutos caminando lento.";
              cooldown = "10 minutos de trote lento.";
              physiologicalExplanation = "Aumenta el reclutamiento muscular rápido e incrementa la rigidez del tendón de Aquiles, mejorando el retorno de energía de cada pisada.";
              fatigueAdaptation = "Si notas algún tirón en los isquios o gemelos, aborta y camina.";
            } else if (d === 4) {
              // Tempo Intenso
              name = "Tempo Intenso de Umbral de Lactato";
              objective = "Subir el umbral láctico y tolerar esfuerzos de ritmo alto continuo.";
              warmup = "10 minutos de trote progresivo.";
              mainWork = `Corre continuamente por 20 minutos a ritmo de Tempo fuerte.`;
              intensity = `Ritmo de Tempo: ${zones.tempo} (RPE 8).`;
              recovery = "N/A";
              cooldown = "10 minutos de vuelta a la calma muy suave.";
              physiologicalExplanation = "Al entrenar justo debajo del umbral de lactato, enseñas a tus células a asimilar la acidosis muscular de forma más eficiente.";
              fatigueAdaptation = "Si no puedes sostenerlo, haz bloques de 5 minutos con 1 minuto de trote muy fácil.";
            } else {
              name = "Rodaje Fácil Regenerativo";
              objective = "Recuperar el sistema neuromuscular tras la sesión de velocidad.";
              warmup = "5 minutos de movilidad general.";
              mainWork = "Trote suave de 30-40 minutos sin mirar el reloj.";
              intensity = `Ritmo muy suave / regenerativo: ${zones.regenerative} (RPE 3).`;
              recovery = "N/A";
              cooldown = "Movilidad articular general de cadera.";
              physiologicalExplanation = "La baja intensidad estimula la hormona de crecimiento y el flujo sanguíneo reparador, limpiando metabolitos residuales.";
              fatigueAdaptation = "Si estás cansado mentalmente, realiza una sesión alternativa de ciclismo suave o elíptica.";
            }
          } else {
            // MEJORAR_RESISTENCIA
            if (d === 6) {
              // Tirada larga es clave
              const baseEndurance = 8;
              const kms = isDescarga ? Math.floor(baseEndurance * 0.8) : baseEndurance + Math.floor(w * 1.05); // increases 5% approx
              name = `Tirada Larga Aeróbica - ${kms}K`;
              objective = "Aumentar el límite de resistencia y acondicionamiento estructural.";
              warmup = "10 minutos de movilidad articular de tobillos y rodillas.";
              mainWork = `Carrera continua y cómoda cubriendo ${kms} kilómetros de forma regular.`;
              intensity = `Ritmo suave / fácil: ${zones.suave} (RPE 3-4).`;
              recovery = "N/A";
              cooldown = "Caminata de 5 min + hidratación completa.";
              physiologicalExplanation = "Promueve la biogénesis mitocondrial y aumenta la capilarización en las piernas, dándole más gasolina a tus músculos de fondo.";
              fatigueAdaptation = "Si tus piernas pesan demasiado, camina durante 1 minuto por cada 5 kilómetros.";
            } else if (d === 1) {
              name = "Tempo Moderado por Intervalos";
              objective = "Desarrollar la fuerza aeróbica y resistencia cardiovascular.";
              warmup = "10 minutos de trote muy fácil.";
              mainWork = `Realizar 3 bloques de 8 minutos a ritmo controlado con 2 minutos de caminata entre bloques.`;
              intensity = `Ritmo controlado: ${zones.controlado} (RPE 5-6).`;
              recovery = "2 minutos de caminata lenta entre intervalos.";
              cooldown = "5 minutos de trote suave.";
              physiologicalExplanation = "Divide el esfuerzo para mantener una intensidad de umbral adecuada sin fatiga extrema del sistema nervioso central.";
              fatigueAdaptation = "Si te sientes cansado, acorta los bloques a 6 minutos.";
            } else {
              name = "Rodaje Suave de Base Aeróbica";
              objective = "Incrementar de forma segura el kilometraje semanal de base.";
              warmup = "5 minutos de movilidad activa.";
              mainWork = `Trote continuo y fluido de 40 minutos.`;
              intensity = `Ritmo suave: ${zones.suave} (RPE 3-4).`;
              recovery = "N/A";
              cooldown = "Toma de pulsaciones y estiramientos suaves.";
              physiologicalExplanation = "Estimula la adaptación de los huesos y tendones para tolerar las fuerzas de impacto repetidas del running.";
              fatigueAdaptation = "Si hay molestias o dolor leve, detén el trote y camina.";
            }
          }
        }
      }

      sessions.push({
        id: sessionId,
        dayIndex: d,
        type,
        name,
        objective,
        warmup,
        mainWork,
        intensity,
        recovery,
        cooldown,
        physiologicalExplanation,
        fatigueAdaptation,
        isCompleted: false
      });
    }

    weeks.push({
      weekNumber: w,
      isDescarga,
      isTaper,
      description: isTaper 
        ? "Semana de descarga y supercompensación. Reducción drástica del volumen (-40%) para asimilar el entrenamiento y llegar con frescura total al test final."
        : isDescarga 
          ? "Semana de asimilación y descarga activa. Reducimos el volumen un 25-30% para disipar la fatiga acumulada de las semanas anteriores."
          : `Semana de carga progresiva enfocada en desarrollar ${limitants.mainLimitant.toLowerCase()} de forma segura.`,
      sessions
    });
  }

  return {
    id: `plan-${Date.now()}`,
    objective: data.objective,
    createdAt: new Date().toISOString(),
    durationWeeks,
    frequency: data.frequency,
    initialDiagnostic: {
      levelEstimated,
      mainLimitant: limitants.mainLimitant,
      strengths: limitants.strengths,
      weaknesses: limitants.weaknesses,
      bmi: bmiCalc.bmi,
      bmiCategory: bmiCalc.category,
      successProbability: successProb,
      estimatedPaces,
      targets
    },
    zones,
    weeks
  };
}

// ============================================================================
// RUNNING DAILY EXECUTION ENGINE (DAILY_EXECUTION_ENGINE)
// ============================================================================

export function runDailyExecutionEngine(
  originalWorkout: WorkoutSession,
  readinessScore: number,
  activeInjury: boolean,
  injuryAreas: string[],
  jointSorenessScore: number = 1, // Dolor articular o tendinoso
  muscleSorenessScore: number = 1 // Dolor muscular
): AdaptedWorkoutResult {
  
  let adaptedWorkout: WorkoutSession | null = { ...originalWorkout };
  let status: "mantener" | "adaptado" | "reducido" | "sustituido" | "cancelado" = "mantener";
  let justification = "El nivel de Readiness es óptimo y no se reportan dolores o lesiones que impidan la sesión. Mantener la planificación original.";
  let injuryRisk: "Bajo" | "Moderado" | "Alto" | "Extremo" = "Bajo";
  let recoveryRecommendation = "Mantener hidratación estándar y estiramientos de vuelta a la calma usuales.";

  // Calculate Injury Risk first
  if (activeInjury || jointSorenessScore >= 4) {
    injuryRisk = "Extremo";
  } else if (jointSorenessScore >= 3 || muscleSorenessScore >= 4 || readinessScore < 40) {
    injuryRisk = "Alto";
  } else if (jointSorenessScore >= 2 || muscleSorenessScore >= 3 || readinessScore < 55) {
    injuryRisk = "Moderado";
  }

  // REGLA 1: READINESS MANDA
  // Let's analyze rules based on Readiness score and Dolor muscular/articular

  // If descanso or movilidad, keep as is unless injured
  if (originalWorkout.type === "descanso") {
    justification = "Día de descanso programado. Es vital respetarlo para asegurar la recuperación de las fibras musculares.";
    return {
      originalWorkout,
      adaptedWorkout: originalWorkout,
      status: "mantener",
      readinessScore,
      justification,
      injuryRisk,
      recoveryRecommendation: "Baño de contraste (frío/calor), automasaje con rodillo y descanso de calidad."
    };
  }

  // DOLOR ARTICULAR VS DOLOR MUSCULAR
  // Si dolor articular o tendinoso > 2/5:
  // - Eliminar calidad. Reducir impacto. Sustituir por movilidad, caminata o descanso. Priorizar seguridad.
  if (jointSorenessScore > 2 && originalWorkout.type === "carrera") {
    status = "sustituido";
    adaptedWorkout = {
      ...originalWorkout,
      name: "Sesión de Movilidad y Caminata Suave (Adaptado por dolor articular)",
      objective: "Cuidar las articulaciones afectadas limitando el impacto mecánico del running.",
      warmup: "10 minutos de movilidad suave y sin carga.",
      mainWork: "30 minutos de caminata muy suave en terreno plano + 15 minutos de movilidad de tobillo/cadera.",
      intensity: "Muy baja. Cero impacto de salto.",
      recovery: "Parar inmediatamente si hay dolor punzante.",
      cooldown: "Hielo local en la articulación sensible durante 15 minutos.",
      physiologicalExplanation: "El dolor articular o tendinoso persistente (>2/5) indica estrés localizado. Seguir corriendo bajo impacto puede cronificar una tendinitis o provocar daño estructural.",
      fatigueAdaptation: "Si el dolor aumenta al caminar, suspende la sesión por completo y descansa con la pierna en alto."
    };
    justification = `Se detecta dolor articular o tendinoso de nivel ${jointSorenessScore}/5. Para priorizar tu seguridad, se elimina por completo la sesión de carrera para evitar impactos y se sustituye por caminata y movilidad.`;
    recoveryRecommendation = "Hielo en la zona dolorida, compresión ligera, elevar extremidad y evitar calzado rígido hoy.";
    return { originalWorkout, adaptedWorkout, status, readinessScore, justification, injuryRisk, recoveryRecommendation };
  }

  // Si dolor muscular > 3/5:
  // - Reducir volumen. Mantener solo intensidad baja. Evitar fuerza pesada.
  if (muscleSorenessScore > 3) {
    status = "reducido";
    if (originalWorkout.type === "carrera") {
      adaptedWorkout = {
        ...originalWorkout,
        name: originalWorkout.name + " (Adaptado por dolor muscular)",
        objective: "Facilitar la asimilación del lactato residual con tramos suaves, reduciendo la carga mecánica.",
        mainWork: "Rodaje regenerativo de 25-30 minutos con tramos de caminata si las piernas pesan.",
        intensity: "Intensidad baja / ritmo fácil. No realizar cambios de ritmo ni series.",
        physiologicalExplanation: "El dolor muscular severo (>3/5) representa microdesgarros de fibras que necesitan reparación. Trote suave y buena irrigación sanguínea acelera este proceso sin dañarlas más.",
        fatigueAdaptation: "No intentes forzar el ritmo de carrera de hoy."
      };
      justification = `Dolor muscular elevado (${muscleSorenessScore}/5). Se reduce el volumen de carrera a un trote regenerativo muy suave para favorecer el flujo de sangre y la recuperación sin añadir microlesiones.`;
      recoveryRecommendation = "Masaje de descarga con crema recuperadora, estiramientos pasivos suaves e hidratación rica en aminoácidos.";
    } else if (originalWorkout.type === "fuerza") {
      adaptedWorkout = {
        ...originalWorkout,
        name: originalWorkout.name + " (Adaptado por dolor muscular)",
        objective: "Mantener movilidad de fuerza con el peso corporal únicamente.",
        mainWork: "Realizar los mismos ejercicios con el peso corporal, reduciendo las series de 3 a 2, y enfocándose puramente en la técnica.",
        intensity: "Baja carga. Sin pesos adicionales.",
        physiologicalExplanation: "Evitamos sobrecargar el músculo fatigado con peso extra, favoreciendo la irrigación y el rango articular cómodo.",
        fatigueAdaptation: "Si un ejercicio te genera molestia aguda, sáltatelo."
      };
      justification = `Dolor muscular elevado (${muscleSorenessScore}/5). Se elimina el peso externo de la sesión de fuerza, reduciendo las series a 2 para permitir la recuperación de las fibras musculares.`;
      recoveryRecommendation = "Ducha caliente relajante, descanso muscular y nutrición reparadora.";
    }
    return { originalWorkout, adaptedWorkout, status, readinessScore, justification, injuryRisk, recoveryRecommendation };
  }

  // REGLA 3: RECUPERACIÓN EXTREMA (Readiness < 40)
  if (readinessScore < 40) {
    status = "sustituido";
    adaptedWorkout = {
      ...originalWorkout,
      name: "Sesión de Movilidad y Estiramientos Pasivos",
      objective: "Disipar la fatiga severa del sistema nervioso y acelerar la recuperación general.",
      warmup: "5 minutos de respiración profunda diafragmática.",
      mainWork: "20 minutos de movilidad de cadera en colchoneta (90/90, gato-camello), postura del niño y estiramientos suaves de cadena posterior.",
      intensity: "Nula. Relajación total.",
      recovery: "N/A",
      cooldown: "10 minutos tumbado con las piernas elevadas apoyadas en la pared.",
      physiologicalExplanation: "Un readiness extremadamente bajo (<40) expone al corredor a un riesgo crítico de lesión por falta de coordinación neuromuscular y fatiga del sistema nervioso central.",
      fatigueAdaptation: "Si te sientes extremadamente cansado, sustitúyelo por descanso total en cama."
    };
    justification = `Tu nivel de Readiness es muy bajo (${readinessScore}/100), indicando fatiga acumulada severa. Entrenar hoy multiplicaría el riesgo de lesión. El Readiness manda: sustituido por movilidad activa pasiva.`;
    recoveryRecommendation = "Dormir al menos 8 horas hoy, cenar carbohidratos complejos de fácil digestión y evitar pantallas antes de dormir.";
    return { originalWorkout, adaptedWorkout, status, readinessScore, justification, injuryRisk, recoveryRecommendation };
  }

  // REGLA 2: CALIDAD (Series/Tempo/Cuestas) Y Readiness < 55
  const isCalidad = 
    originalWorkout.name.toLowerCase().includes("series") ||
    originalWorkout.name.toLowerCase().includes("tempo") ||
    originalWorkout.name.toLowerCase().includes("intervalos") ||
    originalWorkout.name.toLowerCase().includes("umbral");

  if (isCalidad && readinessScore < 55) {
    status = "sustituido";
    adaptedWorkout = {
      ...originalWorkout,
      name: "Trote Fácil de Recuperación (Sustitución de Calidad)",
      objective: "Mantener volumen aeróbico muy cómodo, protegiendo al sistema nervioso de la fatiga láctica.",
      warmup: "5 minutos de caminata rápida.",
      mainWork: "Trote continuo y uniforme de 25-30 minutos en terreno blando (césped o tierra).",
      intensity: "Ritmo regenerativo: Zona fácil cómoda. Sensación RPE 2-3.",
      recovery: "N/A",
      cooldown: "5 minutos de caminata muy pausada.",
      physiologicalExplanation: "Correr a intensidades altas con un Readiness bajo (<55) sabotea la asimilación del entrenamiento, genera fatiga crónica y eleva el riesgo de microrroturas articulares.",
      fatigueAdaptation: "Mantén el ritmo al menos 40 segundos más lento por kilómetro que de costumbre."
    };
    justification = `Readiness bajo (${readinessScore}/100) para sesión de calidad programada. Las series exigen un sistema neuromuscular fresco. Se sustituyen por un trote regenerativo de recuperación.`;
    recoveryRecommendation = "Ducha tibia de descarga, hidratación constante y reposo de calidad.";
    return { originalWorkout, adaptedWorkout, status, readinessScore, justification, injuryRisk, recoveryRecommendation };
  }

  // REGLA: REDUCIR VOLUMEN SI READINESS ENTRE 55 y 69
  if (readinessScore >= 55 && readinessScore <= 69) {
    status = "reducido";
    
    if (originalWorkout.type === "carrera") {
      let mainWorkAdapted = originalWorkout.mainWork;
      
      if (originalWorkout.mainWork.includes("series") || originalWorkout.mainWork.includes("series")) {
        // e.g. "8 series de..." -> "6 series de..."
        mainWorkAdapted = "Reducir en 1 o 2 series el volumen total planificado. Ej: " + originalWorkout.mainWork + " (hacer 1-2 series menos).";
      } else if (originalWorkout.name.toLowerCase().includes("larga")) {
        // Reduce long run volume by 20%
        mainWorkAdapted = originalWorkout.mainWork + " (Reducido un 20% en volumen total por Readiness moderado).";
      } else {
        mainWorkAdapted = originalWorkout.mainWork + " (Hacer 5-10 minutos menos de lo planificado).";
      }

      adaptedWorkout = {
        ...originalWorkout,
        name: originalWorkout.name + " (Volumen Reducido)",
        objective: "Adaptar el volumen total de carrera para reducir la fatiga sin perder el estímulo aeróbico.",
        mainWork: mainWorkAdapted,
        physiologicalExplanation: "Un nivel de readiness intermedio requiere moderar el volumen de impacto para asegurar que el cuerpo pueda asimilar la sesión cómodamente y supercompensar.",
        fatigueAdaptation: "Presta atención a tu postura. Si tus hombros se tensan o arrastras los pies, detén el entrenamiento."
      };
      justification = `Tu Readiness es moderado (${readinessScore}/100). Reducimos el volumen total un 15-20% para no acumular fatiga excesiva, manteniendo intacto el objetivo principal de la sesión de hoy.`;
      recoveryRecommendation = "Añadir estiramientos extras de pantorrillas y cuádriceps, hidratarte con sales minerales.";
    } else if (originalWorkout.type === "fuerza") {
      adaptedWorkout = {
        ...originalWorkout,
        name: originalWorkout.name + " (Volumen Reducido)",
        mainWork: "Reducir todas las series a 2 en lugar de 3. Mantener el mismo peso y técnica de los ejercicios.",
        physiologicalExplanation: "Reducir la cantidad de series mitiga la fatiga muscular acumulada en el tejido conectivo.",
        fatigueAdaptation: "No vayas al fallo en ningún ejercicio."
      };
      justification = `Readiness moderado (${readinessScore}/100). Se reduce el volumen de fuerza quitando una serie a cada ejercicio para evitar agujetas severas que afecten tus próximos rodajes.`;
      recoveryRecommendation = "Asegurar un aporte proteico óptimo después de la sesión y descansar bien las piernas.";
    }
    return { originalWorkout, adaptedWorkout, status, readinessScore, justification, injuryRisk, recoveryRecommendation };
  }

  // REGLA 4: LESIONES - SI DOLOR > 3/5 REDUCIR IMPACTO O ELIMINAR CALIDAD
  if (activeInjury && originalWorkout.type === "carrera") {
    status = "adaptado";
    adaptedWorkout = {
      ...originalWorkout,
      name: originalWorkout.name + " (Prevención de Lesión)",
      objective: "Entrenar de forma adaptada cuidando las estructuras sensibles reportadas.",
      mainWork: `Realizar un trote extremadamente suave alternado con caminata. Evitar cualquier cuesta o velocidad. Prestar atención a: ${injuryAreas.join(", ")}.`,
      intensity: "Muy baja. RPE 2-3.",
      physiologicalExplanation: `Con molestias activas en ${injuryAreas.join(", ")}, el cuerpo tiende a compensar pisando de forma asimétrica, lo cual puede desencadenar molestias en otras zonas de la cadena biomecánica.`,
      fatigueAdaptation: "Si notas cualquier pinchazo agudo, detén la sesión de inmediato y camina a casa."
    };
    justification = `Reportas una lesión o molestia activa en: ${injuryAreas.join(", ")}. Adaptamos la sesión para correr muy suave y evitar que empeore la molestia o se produzcan compensaciones biomecánicas perjudiciales.`;
    recoveryRecommendation = "Ejercicios específicos de movilidad de tobillo/cadera y estiramiento excéntrico de gemelo/isquios de forma controlada.";
    return { originalWorkout, adaptedWorkout, status, readinessScore, justification, injuryRisk, recoveryRecommendation };
  }

  // DEFAULT: MANTENER PLANIFICACIÓN ORIGINAL
  return {
    originalWorkout,
    adaptedWorkout,
    status,
    readinessScore,
    justification,
    injuryRisk,
    recoveryRecommendation
  };
}

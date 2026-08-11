import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  TrainingPlan, 
  DailyReadinessInput, 
  WorkoutSession, 
  DailyReadinessScore 
} from "./types";
import { 
  runDailyExecutionEngine, 
  calculateReadiness 
} from "./engines";
import { 
  Activity, 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle, 
  Smile, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  Volume2, 
  HelpCircle, 
  Heart,
  Dumbbell,
  Moon,
  Compass,
  CornerDownRight,
  ClipboardList,
  Info,
  Lock
} from "lucide-react";

function getSleepQualityColor(q: "bueno" | "normal" | "malo", isSelected: boolean): string {
  if (!isSelected) return "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700";
  if (q === "bueno") return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
  if (q === "normal") return "bg-blue-600 text-white border-blue-600 shadow-sm";
  return "bg-rose-600 text-white border-rose-600 shadow-sm";
}

function getScale1to5Color(val: number, isSelected: boolean): string {
  if (!isSelected) return "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700";
  if (val === 1 || val === 2) return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
  if (val === 3) return "bg-blue-600 text-white border-blue-600 shadow-sm";
  if (val === 4) return "bg-orange-500 text-white border-orange-500 shadow-sm";
  return "bg-rose-600 text-white border-rose-600 shadow-sm";
}

function parseWarmup(text: string): string[] {
  let cleanText = text.trim();
  if (cleanText.endsWith(".")) {
    cleanText = cleanText.slice(0, -1);
  }
  const items = cleanText.split(/,(?![^(]*\))/);
  return items.map(item => item.trim()).filter(Boolean);
}

function parseMainWork(text: string): Array<{ title: string; exercises: string[] }> {
  const cleanText = text.trim();
  if (!cleanText.includes("Bloque")) {
    const rawExercises = cleanText.split(/[.,]\s*/).map(s => s.trim()).filter(Boolean);
    return [{ title: "", exercises: rawExercises }];
  }

  const parts = cleanText.split(/\.\s*(?=Bloque)/i);
  return parts.map(part => {
    const cleanPart = part.trim().replace(/\.$/, "");
    const match = cleanPart.match(/^(Bloque\s+\d+)\s*:\s*(.*)$/i);
    if (match) {
      const title = match[1];
      const content = match[2];
      const exercises = content.split("+").map(e => e.trim()).filter(Boolean);
      return { title, exercises };
    }
    return { title: "", exercises: [cleanPart] };
  }).filter(p => p.exercises.length > 0);
}

function formatExercise(exercise: string): string {
  const match = exercise.match(/^(.*?)\s*[\(\[]([^\]\)]*)[\)\]]$/);
  if (match) {
    const name = match[1].trim();
    const details = match[2].trim();
    const detailsMatch = details.match(/^(\d+\s*[x×*]\s*\d+)\s*(.*)$/);
    if (detailsMatch) {
      const reps = detailsMatch[1].replace(/[×*]/g, "x").trim();
      const extra = detailsMatch[2].trim();
      return `${name}: ${reps}${extra ? ` (${extra})` : ""}`;
    }
    return `${name}: (${details})`;
  }
  return exercise;
}

function parseExerciseDetails(exercise: string): { name: string; details: string } {
  const match = exercise.match(/^(.*?)\s*[\(\[]([^\]\)]*)[\)\]]$/);
  if (match) {
    return {
      name: match[1].trim(),
      details: match[2].trim()
    };
  }
  if (exercise.includes(":")) {
    const parts = exercise.split(":");
    return {
      name: parts[0].trim(),
      details: parts.slice(1).join(":").trim()
    };
  }
  return {
    name: exercise.trim(),
    details: ""
  };
}

interface TodayWorkoutViewProps {
  plan: TrainingPlan;
  currentWeekIndex?: number;
  readiness: DailyReadinessInput | undefined;
  onSaveReadiness: (input: DailyReadinessInput) => void;
  onLogWorkoutCompletion: (workoutId: string, feedback: string, rpe: number) => void;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
  activeInjury: boolean;
  injuryAreas: string[];
}

export default function TodayWorkoutView({
  plan,
  currentWeekIndex,
  readiness,
  onSaveReadiness,
  onLogWorkoutCompletion,
  completedWorkouts,
  activeInjury,
  injuryAreas
}: TodayWorkoutViewProps) {
   // Questionnaire states
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [sleepQuality, setSleepQuality] = useState<"bueno" | "normal" | "malo">("normal");
  const [stress, setStress] = useState<number>(2);
  const [fatigue, setFatigue] = useState<number>(2);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(2);
  const [jointSoreness, setJointSoreness] = useState<number>(1);
  const [prevRpe, setPrevRpe] = useState<number>(5);

  // Completion logging states
  const [feedback, setFeedback] = useState<string>("adecuado");
  const [loggedRpe, setLoggedRpe] = useState<number>(5);

  // Session steps tracking state: preview, questionnaire, adapted, executing, feedback
  const [sessionSteps, setSessionSteps] = useState<Record<string, "preview" | "questionnaire" | "adapted" | "executing" | "feedback">>({});
  const [currentExecIdx, setCurrentExecIdx] = useState<number>(0);
  const [activeCompletedSteps, setActiveCompletedSteps] = useState<Record<number, boolean>>({});

  const getLocalDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const checkWorkoutAvailability = (sessionId: string, sessionType: string) => {
    if (completedWorkouts[sessionId]) {
      return { allowed: true, reason: "" };
    }

    if (sessionType === "descanso") {
      return { allowed: true, reason: "" };
    }

    const todayStr = getLocalDateString(new Date());
    
    const todayCompleted = Object.entries(completedWorkouts)
      .map(([id, info]) => {
        let foundType: string = "";
        for (const week of plan.weeks) {
          const s = week.sessions.find(item => item.id === id);
          if (s) {
            foundType = s.type;
            break;
          }
        }
        return {
          id,
          type: foundType,
          ...info
        };
      })
      .filter(item => getLocalDateString(item.date) === todayStr);

    if (todayCompleted.length === 0) {
      return { allowed: true, reason: "" };
    }

    if (todayCompleted.length >= 2) {
      return {
        allowed: false,
        reason: "Ya has completado dos entrenamientos hoy. No está permitido realizar más sesiones por hoy."
      };
    }

    const first = todayCompleted[0];

    if (sessionType === "fuerza" && first.type === "fuerza") {
      return {
        allowed: false,
        reason: "No está permitido realizar dos entrenamientos de fuerza en el mismo día."
      };
    }

    if (sessionType === "carrera" && first.type === "carrera") {
      return {
        allowed: false,
        reason: "No está permitido realizar dos entrenamientos de carrera en el mismo día."
      };
    }

    if (first.rpe >= 3) {
      return {
        allowed: false,
        reason: `Ya has realizado un entrenamiento de ${first.type === "fuerza" ? "fuerza" : first.type === "carrera" ? "carrera" : "entrenamiento"} hoy con un RPE de ${first.rpe}/10 (igual o superior a 3). Solo se permite doblar sesión si la primera tiene un RPE menor a 3.`
      };
    }

    if ((first.type === "fuerza" && sessionType === "carrera") || (first.type === "carrera" && sessionType === "fuerza")) {
      return { allowed: true, reason: "" };
    }

    return {
      allowed: false,
      reason: `Solo se permite realizar un entrenamiento de fuerza y uno de carrera en el mismo día si el primero tuvo un RPE menor a 3. Ya completaste una sesión de ${first.type === "fuerza" ? "fuerza" : first.type === "carrera" ? "carrera" : first.type || "entrenamiento"}.`
    };
  };

  const todayStr = getLocalDateString(new Date());
  const todayCompleted = Object.entries(completedWorkouts)
    .map(([id, info]) => {
      let foundType: string = "";
      for (const week of plan.weeks) {
        const s = week.sessions.find(item => item.id === id);
        if (s) {
          foundType = s.type;
          break;
        }
      }
      return {
        id,
        type: foundType,
        ...info
      };
    })
    .filter(item => getLocalDateString(item.date) === todayStr);

  // Identify today's day index (Lunes is 0, Domingo is 6)
  const localDay = new Date().getDay();
  const dayIndex = localDay === 0 ? 6 : localDay - 1;

  // Select week
  const activeWeekIndex = currentWeekIndex !== undefined ? currentWeekIndex : 0;
  const activeWeek = plan.weeks[activeWeekIndex] || plan.weeks[0];

  // Default selection is today's workout
  const defaultWorkout = activeWeek.sessions[dayIndex] || activeWeek.sessions[0];
  
  // State for expanded/selected session ID (defaults to empty string to show list first)
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const hasLoggedReadiness = !!readiness;

  const getSessionStep = (sessionId: string) => {
    return sessionSteps[sessionId] || "preview";
  };

  const handleReadinessSubmit = (e: React.FormEvent, sessionId: string) => {
    e.preventDefault();
    const input: DailyReadinessInput = {
      date: new Date().toISOString().split("T")[0],
      sleepHours,
      sleepQuality,
      stress,
      fatigue,
      muscleSoreness,
      jointSoreness,
      prevRPE: prevRpe
    };
    onSaveReadiness(input);
    setSessionSteps(prev => ({ ...prev, [sessionId]: "adapted" }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDayName = (idx: number) => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return days[idx] || "Hoy";
  };

  const getSessionTypeBadge = (type: string) => {
    switch (type) {
      case "carrera":
        return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-blue-200"><Activity className="w-3 h-3" /> Carrera</span>;
      case "fuerza":
        return <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-orange-200"><Dumbbell className="w-3 h-3" /> Fuerza</span>;
      case "movilidad":
        return <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-teal-200"><Compass className="w-3 h-3" /> Movilidad</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-zinc-200"><Moon className="w-3 h-3" /> Descanso</span>;
    }
  };

  if (!selectedSessionId) {
    return (
      <div className="max-w-4xl mx-auto pb-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900 mt-1">
              Entrenamiento de Hoy
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Selecciona la sesión que deseas realizar. Adaptaremos sus bloques y ritmos al instante según tus sensaciones corporales.
            </p>
          </div>
          <div className="px-4 py-2 bg-white border border-zinc-200/80 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl font-mono shrink-0 shadow-sm">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Status Banner */}
        {todayCompleted.length > 0 && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed text-left ${
            todayCompleted.length === 1 && todayCompleted[0].rpe < 3 && (todayCompleted[0].type === "fuerza" || todayCompleted[0].type === "carrera")
              ? "bg-blue-50/80 border-blue-200 text-blue-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            {todayCompleted.length === 1 && todayCompleted[0].rpe < 3 && (todayCompleted[0].type === "fuerza" || todayCompleted[0].type === "carrera") ? (
              <>
                <Zap className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 animate-pulse" />
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-0.5 text-blue-600">Doble Sesión Permitida Excepcionalmente</span>
                  <p className="font-medium text-zinc-700">
                    Has completado tu sesión de <strong className="text-blue-600">{todayCompleted[0].type === "fuerza" ? "Fuerza" : "Carrera"}</strong> hoy con un esfuerzo muy bajo (RPE {todayCompleted[0].rpe}/10). Por lo tanto, hoy puedes realizar también tu sesión de <strong className="text-blue-600">{todayCompleted[0].type === "fuerza" ? "carrera" : "fuerza"}</strong>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-0.5 text-rose-600">Límite Diario Alcanzado / Sesiones Bloqueadas</span>
                  <p className="font-medium text-zinc-700">
                    {todayCompleted.length >= 2 ? (
                      `¡Excelente trabajo! Has completado el límite máximo de 2 entrenamientos para hoy. Descansa y recupérate para asimilar las cargas de entrenamiento.`
                    ) : (
                      `Ya has completado una sesión de ${todayCompleted[0].type === "fuerza" ? "Fuerza" : todayCompleted[0].type === "carrera" ? "Carrera" : todayCompleted[0].type || "entrenamiento"} hoy con un RPE de ${todayCompleted[0].rpe}/10 (igual o superior a 3). Las demás sesiones de fuerza y carrera han sido bloqueadas hasta mañana para evitar el sobreentrenamiento y prevenir lesiones.`
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sessions Grid / List */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">
            Tus sesiones programadas para esta semana
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeWeek.sessions.map((session, idx) => {
              const isCompleted = !!completedWorkouts[session.id];
              const dayName = getDayName(idx);
              const isToday = idx === dayIndex;
              const availability = checkWorkoutAvailability(session.id, session.type);
              
              return (
                <button
                  key={session.id}
                  id={`session-card-${session.id}`}
                  onClick={() => {
                    if (!availability.allowed) return;
                    setSelectedSessionId(session.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={!availability.allowed && !isCompleted}
                  className={`p-5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden flex flex-col justify-between group h-48 shadow-sm ${
                    isCompleted
                      ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 cursor-pointer"
                      : !availability.allowed
                        ? "bg-zinc-50 border-zinc-200/50 opacity-50 cursor-not-allowed select-none"
                        : isToday
                          ? "bg-white border-blue-600 ring-2 ring-blue-600/10 hover:border-blue-700 cursor-pointer"
                          : "bg-white border-zinc-200/80 hover:border-zinc-300 cursor-pointer"
                  }`}
                >
                  {isToday && !isCompleted && availability.allowed && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                      Sesión Recomendada Hoy
                    </div>
                  )}

                  {!isCompleted && !availability.allowed && (
                    <div className="absolute top-0 right-0 bg-rose-50 text-rose-600 text-[8px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider border-l border-b border-rose-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Bloqueado hoy
                    </div>
                  )}

                  <div className="w-full flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? "text-emerald-700" : isToday && availability.allowed ? "text-blue-600" : "text-zinc-400"}`}>
                      Día {idx + 1} • {dayName}
                    </span>
                    {getSessionTypeBadge(session.type)}
                  </div>
                  
                  <div className="mt-4 space-y-1.5">
                    <h4 className="text-base font-bold text-zinc-900 uppercase tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
                      {session.name}
                    </h4>
                    {!availability.allowed && !isCompleted ? (
                      <p className="text-[10.5px] text-rose-600 font-medium leading-relaxed font-sans line-clamp-2">
                        {availability.reason}
                      </p>
                    ) : session.objective ? (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-sans font-medium">
                        {session.objective}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic font-sans">
                        Sin objetivo específico definido.
                      </p>
                    )}
                  </div>

                  <div className="w-full border-t border-zinc-100 pt-3 mt-4 flex items-center justify-between">
                    {isCompleted ? (
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        ✓ Completada • RPE {completedWorkouts[session.id]?.rpe}/10
                      </span>
                    ) : !availability.allowed ? (
                      <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3" /> No disponible hoy
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1 ${isToday ? "text-blue-600" : "text-zinc-400"}`}>
                        Empezar Sesión <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const session = activeWeek.sessions.find(s => s.id === selectedSessionId);
  if (!session) {
    return null;
  }

  const isCompleted = !!completedWorkouts[session.id];
  const idx = activeWeek.sessions.findIndex(s => s.id === selectedSessionId);
  const dayName = getDayName(idx);
  const step = getSessionStep(session.id);

  // Calculate readiness and adaptation if expanded and readiness exists
  let sessionReadinessScore: DailyReadinessScore | null = null;
  let sessionAdaptationResult: ReturnType<typeof runDailyExecutionEngine> | null = null;
  
  if (hasLoggedReadiness && readiness) {
    sessionReadinessScore = calculateReadiness(readiness);
    sessionAdaptationResult = runDailyExecutionEngine(
      session,
      sessionReadinessScore.score,
      activeInjury,
      injuryAreas,
      readiness.jointSoreness || 1,
      readiness.muscleSoreness
    );
  }

  const workoutToExecute = (sessionAdaptationResult && sessionAdaptationResult.adaptedWorkout) 
    ? sessionAdaptationResult.adaptedWorkout 
    : session;

  const executionSteps: Array<{
    type: "objective" | "warmup" | "mainWork" | "cooldown";
    title: string;
    name: string;
    details?: string;
    blockTitle?: string;
    originalIndex?: number;
    totalInPhase?: number;
  }> = [];

  if (workoutToExecute) {
    // 1. Objective step
    executionSteps.push({
      type: "objective",
      title: "Objetivo de la Sesión",
      name: workoutToExecute.objective || "Completar la sesión de entrenamiento del día."
    });

    // 2. Warmup steps
    if (workoutToExecute.warmup) {
      const warmupExercises = parseWarmup(workoutToExecute.warmup);
      warmupExercises.forEach((ex, idx) => {
        const parsed = parseExerciseDetails(ex);
        executionSteps.push({
          type: "warmup",
          title: `Calentamiento (${idx + 1}/${warmupExercises.length})`,
          name: parsed.name,
          details: parsed.details,
          originalIndex: idx,
          totalInPhase: warmupExercises.length
        });
      });
    }

    // 3. Main Work steps
    if (workoutToExecute.mainWork) {
      const mainBlocks = parseMainWork(workoutToExecute.mainWork);
      const mainWorkExercises: Array<{ name: string; details: string; blockTitle: string }> = [];
      mainBlocks.forEach(block => {
        block.exercises.forEach(ex => {
          const parsed = parseExerciseDetails(ex);
          mainWorkExercises.push({
            name: parsed.name,
            details: parsed.details,
            blockTitle: block.title
          });
        });
      });

      mainWorkExercises.forEach((ex, idx) => {
        executionSteps.push({
          type: "mainWork",
          title: `Trabajo Principal (${idx + 1}/${mainWorkExercises.length})`,
          name: ex.name,
          details: ex.details,
          blockTitle: ex.blockTitle,
          originalIndex: idx,
          totalInPhase: mainWorkExercises.length
        });
      });
    }

    // 4. Cooldown step
    if (workoutToExecute.cooldown) {
      executionSteps.push({
        type: "cooldown",
        title: "Vuelta a la Calma",
        name: workoutToExecute.cooldown
      });
    }
  }

  const currentStep = executionSteps[currentExecIdx];
  const activePhase = currentStep?.type;
  const existingPhases = Array.from(new Set(executionSteps.map(s => s.type)));

  const phaseLabels: Record<string, string> = {
    objective: "Objetivo",
    warmup: "Calentamiento",
    mainWork: "Trabajo",
    cooldown: "Vuelta a la Calma"
  };

  const handleNext = () => {
    if (currentExecIdx < executionSteps.length - 1) {
      setCurrentExecIdx(currentExecIdx + 1);
    } else {
      setSessionSteps(prev => ({ ...prev, [session.id]: "feedback" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentExecIdx > 0) {
      setCurrentExecIdx(currentExecIdx - 1);
    } else {
      setSessionSteps(prev => ({ ...prev, [session.id]: "adapted" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCompleteCurrent = () => {
    setActiveCompletedSteps(prev => ({ ...prev, [currentExecIdx]: true }));
    handleNext();
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      
      {/* Back Button */}
      {step === "preview" && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => {
              setSelectedSessionId("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer bg-white px-4 py-2 border border-zinc-200/80 rounded-xl shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a las sesiones
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${
        isCompleted
          ? "bg-emerald-50/40 border-emerald-200"
          : "bg-white border-zinc-200/80"
      }`}>
        {/* Header */}
        {step === "preview" && (
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 flex items-center justify-between text-left">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${
                isCompleted 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-blue-50 text-blue-600"
              }`}>
                {session.type === "carrera" ? (
                  <Activity className="w-5 h-5" />
                ) : session.type === "fuerza" ? (
                  <Dumbbell className="w-5 h-5" />
                ) : session.type === "movilidad" ? (
                  <Compass className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  isCompleted ? "text-emerald-700" : "text-blue-600"
                }`}>
                  Día {idx + 1} • {dayName}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 uppercase tracking-tight mt-0.5">
                  {session.name}
                </h4>
                {isCompleted && (
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                    ✓ Completada • RPE {completedWorkouts[session.id]?.rpe}/10
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {getSessionTypeBadge(session.type)}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="px-4 pb-6 pt-5 sm:px-6 sm:pb-8 space-y-6">
          {/* CASE 1: IF COMPLETED */}
          {isCompleted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">¡Entrenamiento Realizado!</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed font-sans text-left font-medium">
                Ya has completado y registrado este entrenamiento de manera exitosa. La percepción de esfuerzo (RPE) reportada fue de: <strong className="text-emerald-700">{completedWorkouts[session.id]?.rpe}/10</strong> con sensación general <strong className="text-emerald-700">"{completedWorkouts[session.id]?.feedback}"</strong>. ¡Sigue así!
              </p>
            </div>
          ) : session.type === "descanso" ? (
            
            /* CASE 2: REST DAY */
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-6 text-center space-y-3">
              <Moon className="w-8 h-8 text-zinc-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Día de Descanso / Descarga Activa</h4>
                <p className="text-xs text-zinc-500 font-medium max-w-md mx-auto mt-1 font-sans">
                  Aprovecha hoy para estirar, hidratarte bien y asimilar las cargas de entrenamiento acumuladas. El descanso es parte del rendimiento.
                </p>
              </div>
            </div>
          ) : (
            
            /* CASE 3: ACTIVE WORKOUT STEP-BY-STEP FLOW */
            <>
              {/* STEP A: PREVIEW */}
              {step === "preview" && (
                <div className="space-y-6">
                  {session.objective && (
                    <div className="space-y-1 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 text-left">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Objetivo de la sesión:</span>
                      <p className="text-xs text-zinc-800 font-medium leading-relaxed font-sans">
                        {session.objective}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-zinc-700">
                    {/* Left Column: Warmup & Cooldown */}
                    <div className="space-y-4 text-left">
                      {session.warmup && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Calentamiento Planificado:</span>
                          <ul className="space-y-1 pl-2 border-l border-zinc-200">
                            {parseWarmup(session.warmup).map((ex, exIdx) => (
                              <li key={exIdx} className="text-xs text-zinc-800 font-medium">
                                - {formatExercise(ex)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {session.cooldown && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Vuelta a la Calma:</span>
                          <p className="text-zinc-600 pl-2 border-l border-zinc-200 font-sans">{session.cooldown}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Main Work Preview */}
                    <div className="space-y-4 text-left">
                      {session.mainWork && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Trabajo Principal Previsto:</span>
                          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 space-y-2">
                            {parseMainWork(session.mainWork).slice(0, 2).map((block, bIdx) => (
                              <div key={bIdx} className="space-y-1">
                                {block.title && <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">{block.title}:</p>}
                                <div className="pl-2 border-l border-zinc-200 space-y-0.5">
                                  {block.exercises.map((ex, exIdx) => (
                                    <p key={exIdx} className="text-[11px] text-zinc-600 truncate">- {formatExercise(ex)}</p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        const nextStep = hasLoggedReadiness ? "adapted" : "questionnaire";
                        setSessionSteps(prev => ({ ...prev, [session.id]: nextStep }));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition shadow-sm cursor-pointer duration-200"
                    >
                      Empezar Entrenamiento
                    </button>
                  </div>
                </div>
              )}

              {/* STEP B: QUESTIONNAIRE */}
              {step === "questionnaire" && (
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-5 sm:p-6 space-y-6 text-left">
                  <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                      <BrainCircuit className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-tight text-zinc-900">Cuestionario de Readiness Diario</h3>
                      <p className="text-xs text-zinc-500 font-medium font-sans">Completa tus indicadores de hoy para adaptar los ritmos y cargas de esta sesión.</p>
                    </div>
                  </div>

                  <form onSubmit={(e) => handleReadinessSubmit(e, session.id)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Horas de Sueño */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Horas de Sueño Anoche</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="3" 
                            max="10" 
                            value={sleepHours}
                            onChange={(e) => setSleepHours(Number(e.target.value))}
                            className="w-full accent-blue-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-mono font-bold text-xs text-blue-600 bg-white px-2.5 py-1 rounded-md shrink-0 border border-zinc-200 shadow-sm">
                            {sleepHours} Horas
                          </span>
                        </div>
                      </div>

                      {/* Calidad de Sueño */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Calidad del Sueño</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["bueno", "normal", "malo"] as const).map(q => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setSleepQuality(q)}
                              className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition cursor-pointer ${getSleepQualityColor(q, sleepQuality === q)}`}
                            >
                              {q === "bueno" ? "Bueno" : q === "normal" ? "Normal" : "Malo"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Estrés */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block flex justify-between font-sans">
                          <span>Estrés Mental</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">1: Bajo | 5: Alto</span>
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setStress(v)}
                              className={`py-2 rounded-lg border font-mono text-xs font-bold cursor-pointer transition ${getScale1to5Color(v, stress === v)}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fatiga */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block flex justify-between font-sans">
                          <span>Fatiga General</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">1: Fresco | 5: Exhausto</span>
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setFatigue(v)}
                              className={`py-2 rounded-lg border font-mono text-xs font-bold cursor-pointer transition ${getScale1to5Color(v, fatigue === v)}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dolor Muscular */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block flex justify-between font-sans">
                          <span>Dolor Muscular (Agujetas)</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">1: Ninguno | 5: Severo</span>
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setMuscleSoreness(v)}
                              className={`py-2 rounded-lg border font-mono text-xs font-bold cursor-pointer transition ${getScale1to5Color(v, muscleSoreness === v)}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dolor Articular / Tendinoso */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block flex justify-between font-sans">
                          <span>Dolor Articular / Tendinoso</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">1: Ninguno | 5: Severo</span>
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setJointSoreness(v)}
                              className={`py-2 rounded-lg border font-mono text-xs font-bold cursor-pointer transition ${getScale1to5Color(v, jointSoreness === v)}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* RPE anterior */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Esfuerzo de tu última sesión de entrenamiento (RPE 1-10)</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={prevRpe}
                            onChange={(e) => setPrevRpe(Number(e.target.value))}
                            className="w-full accent-blue-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-mono font-bold text-xs text-zinc-900 bg-white px-3 py-1 rounded-md shrink-0 border border-zinc-200 shadow-sm">
                            RPE {prevRpe}/10
                          </span>
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end pt-4 border-t border-zinc-200">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-sm"
                      >
                        Calcular Readiness & Ajustar Entrenamiento
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP C: ADAPTED WORKOUT VIEW */}
              {step === "adapted" && (
                <div className="space-y-6">
                  
                  {/* Score visualizer */}
                  {sessionReadinessScore && (
                    <div className="flex justify-center items-center py-2">
                      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden w-full max-w-xs shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-3 font-sans">Índice de Readiness</span>
                        
                        {/* Dial SVG */}
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle 
                              cx="64" cy="64" r="50" 
                              className="stroke-zinc-100" strokeWidth="8" fill="transparent" 
                            />
                            <circle 
                              cx="64" cy="64" r="50" 
                              className="stroke-blue-600 transition-all duration-1000" strokeWidth="8" fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 50}`}
                              strokeDashoffset={`${2 * Math.PI * 50 * (1 - sessionReadinessScore.score / 100)}`}
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black text-zinc-900 font-mono">{sessionReadinessScore.score}</span>
                            <span className="text-[9px] font-bold text-zinc-400 tracking-wider font-mono">/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {sessionAdaptationResult && (
                    <div className="space-y-6 text-left">
                      {/* Decision and Status banner */}
                      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                        sessionAdaptationResult.status === "mantener"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : sessionAdaptationResult.status === "reducido"
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-rose-50 border-rose-200 text-rose-900"
                      }`}>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider block font-sans text-zinc-500">Decisión del Motor Adaptativo</span>
                          <h4 className="text-lg font-black uppercase tracking-wider flex items-center gap-1.5 text-zinc-900">
                            <Smile className="w-5 h-5 text-blue-600" />
                            Entrenamiento: {sessionAdaptationResult.status.toUpperCase()}
                          </h4>
                          <p className="text-xs text-zinc-600 font-medium leading-relaxed max-w-2xl font-sans">
                            {sessionAdaptationResult.justification}
                          </p>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 font-mono">
                          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Riesgo de Lesión</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            sessionAdaptationResult.injuryRisk === "Bajo" 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                              : sessionAdaptationResult.injuryRisk === "Moderado" 
                                ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                : "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                          }`}>
                            {sessionAdaptationResult.injuryRisk}
                          </span>
                        </div>
                      </div>

                      {/* Comparison Cards: solo si el entrenamiento realmente cambió respecto al plan original */}
                      {sessionAdaptationResult.status === "mantener" ? (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3 text-left">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                            Tu readiness es buena hoy: se mantiene <strong>{session.name}</strong> tal y como estaba planificado, sin cambios.
                          </p>
                        </div>
                      ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Original Scheduled - marcado como descartado */}
                        <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-5 space-y-3 text-left shadow-sm">
                          <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block font-sans">1. Previsto en Plan Original (descartado hoy)</span>
                            <span className="text-[8px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Plan Original</span>
                          </div>
                          <h4 className="font-bold text-rose-700 uppercase tracking-wider text-sm">{session.name}</h4>

                          <div className="space-y-4 pt-3 border-t border-rose-100 text-xs text-rose-900/70 font-medium">
                            {session.intensity && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block font-sans">• Ritmos Planificados:</span>
                                <p className="pl-1 font-sans">{session.intensity}</p>
                              </div>
                            )}

                            {session.warmup && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block font-sans">• Calentamiento:</span>
                                <div className="space-y-1 mt-1 font-sans pl-1">
                                  {parseWarmup(session.warmup).map((ex, exIdx) => (
                                    <p key={exIdx} className="text-xs">- {formatExercise(ex)}</p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {session.mainWork && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block font-sans">• Trabajo Principal:</span>
                                <div className="bg-white/60 p-3 rounded-xl border border-rose-200/80 space-y-3 mt-1 font-sans">
                                  {parseMainWork(session.mainWork).map((block, bIdx) => (
                                    <div key={bIdx} className="space-y-1">
                                      {block.title && <p className="text-[11px] font-bold text-rose-700 uppercase">{block.title}:</p>}
                                      <div className="space-y-0.5 pl-2 border-l border-rose-200">
                                        {block.exercises.map((ex, exIdx) => (
                                          <p key={exIdx} className="text-xs">- {formatExercise(ex)}</p>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {session.cooldown && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block font-sans">• Vuelta a la Calma:</span>
                                <p className="pl-1 font-sans">{session.cooldown}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Final Recommended */}
                        <div className="bg-white border border-blue-600/40 rounded-2xl pt-8 pb-5 px-5 space-y-4 shadow-sm relative overflow-hidden text-left ring-2 ring-blue-600/5">
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider font-mono">
                            Adaptado a tu estado de hoy
                          </div>
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block font-sans">2. Entrenamiento Final Recomendado</span>
                          </div>

                          {sessionAdaptationResult.adaptedWorkout ? (
                            <div className="space-y-4 font-medium text-xs">
                              <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-sm">{sessionAdaptationResult.adaptedWorkout.name}</h4>
                              
                              {/* Ritmo Recomendado */}
                              {sessionAdaptationResult.adaptedWorkout.intensity && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Ritmo Recomendado:</span>
                                  <p className="text-blue-600 font-mono font-bold text-xs sm:text-sm bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl inline-block mt-1">
                                    {sessionAdaptationResult.adaptedWorkout.intensity}
                                  </p>
                                </div>
                              )}

                              {/* Calentamiento */}
                              {sessionAdaptationResult.adaptedWorkout.warmup && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Calentamiento Preventivo:</span>
                                  <div className="space-y-1 mt-1 font-sans pl-1">
                                    {parseWarmup(sessionAdaptationResult.adaptedWorkout.warmup).map((ex, exIdx) => (
                                      <p key={exIdx} className="text-xs text-zinc-800 font-medium">- {formatExercise(ex)}</p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Trabajo Principal Reajustado */}
                              {sessionAdaptationResult.adaptedWorkout.mainWork && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block font-sans">• Trabajo Principal Reajustado:</span>
                                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-4 font-sans mt-1">
                                    {parseMainWork(sessionAdaptationResult.adaptedWorkout.mainWork).map((block, bIdx) => (
                                      <div key={bIdx} className="space-y-2">
                                        {block.title && <p className="text-xs font-bold text-blue-600 uppercase">{block.title}:</p>}
                                        <div className="space-y-1 pl-2.5 border-l border-zinc-200">
                                          {block.exercises.map((ex, exIdx) => (
                                            <p key={exIdx} className="text-xs text-zinc-800 leading-relaxed">- {formatExercise(ex)}</p>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Vuelta a la Calma */}
                              {sessionAdaptationResult.adaptedWorkout.cooldown && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Vuelta a la Calma:</span>
                                  <p className="text-zinc-700 pl-1 font-sans">{sessionAdaptationResult.adaptedWorkout.cooldown}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-8 text-center space-y-2">
                              <p className="text-zinc-500 text-xs font-medium font-sans">Se recomienda descanso total absoluto hoy para asimilar fatiga.</p>
                              <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Descanso Obligatorio</span>
                            </div>
                          )}
                        </div>
                      </div>
                      )}

                      {/* Recovery Tips */}
                      <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 space-y-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Recomendación de Recuperación Preventiva:</span>
                        <p className="text-xs text-zinc-700 font-medium leading-relaxed font-sans">
                          {sessionAdaptationResult.recoveryRecommendation}
                        </p>
                      </div>

                      {/* Empezar Training Button */}
                      <div className="flex justify-center pt-4 border-t border-zinc-200">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentExecIdx(0);
                            setActiveCompletedSteps({});
                            setSessionSteps(prev => ({ ...prev, [session.id]: "executing" }));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="w-full sm:w-auto px-12 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition shadow-sm cursor-pointer duration-200"
                        >
                          Empezar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP C.2: EXECUTING WORKOUT */}
              {step === "executing" && currentStep && (
                <div className="space-y-6">
                  {/* Stepper progress */}
                  <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full justify-around py-1">
                      {existingPhases.map((phase, pIdx) => {
                        const isCurrent = activePhase === phase;
                        const isPast = existingPhases.indexOf(activePhase) > pIdx;
                        
                        return (
                          <div key={phase} className="flex items-center gap-2 shrink-0">
                            <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              isCurrent 
                                ? "bg-blue-600 ring-4 ring-blue-100 scale-110" 
                                : isPast 
                                  ? "bg-emerald-500" 
                                  : "bg-zinc-200"
                            }`} />
                            <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                              isCurrent 
                                ? "text-blue-600" 
                                : isPast 
                                  ? "text-emerald-700" 
                                  : "text-zinc-400"
                            }`}>
                              {phaseLabels[phase]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step counter / progress bar */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <span>{currentStep.title}</span>
                      <span>Paso {currentExecIdx + 1} de {executionSteps.length}</span>
                    </div>
                    {/* Visual progress bar */}
                    <div className="w-full h-2 bg-zinc-100 border border-zinc-200/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${((currentExecIdx + 1) / executionSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Exercise Detail Card */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden shadow-sm min-h-[220px] flex flex-col justify-center">
                    <div className="space-y-4 relative z-10">
                      {/* Category Badge */}
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-bold uppercase tracking-wider border ${
                          currentStep.type === "objective"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : currentStep.type === "warmup"
                              ? "bg-orange-50 text-orange-600 border-orange-200"
                              : currentStep.type === "mainWork"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-teal-50 text-teal-600 border-teal-200"
                        }`}>
                          {currentStep.type === "objective" && "Objetivo del Entrenamiento"}
                          {currentStep.type === "warmup" && "Calentamiento Activo"}
                          {currentStep.type === "mainWork" && `Trabajo Principal${currentStep.blockTitle ? ` • ${currentStep.blockTitle}` : ""}`}
                          {currentStep.type === "cooldown" && "Vuelta a la Calma / Estiramientos"}
                        </span>
                      </div>

                      {/* Main Name / Instruction */}
                      <h3 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight leading-snug max-w-2xl mx-auto">
                        {currentStep.name}
                      </h3>

                      {/* Series / Reps or Details Badge */}
                      {currentStep.details ? (
                        <div className="inline-flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200/80 px-6 py-4 rounded-2xl mt-2">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                            Prescripción / Repeticiones
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tracking-wider">
                            {currentStep.details}
                          </span>
                        </div>
                      ) : currentStep.type === "mainWork" && (
                        <div className="inline-flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200/80 px-5 py-3 rounded-2xl mt-2">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                            Intensidad del Bloque
                          </span>
                          <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">
                            {workoutToExecute.intensity || "Sostener esfuerzo"}
                          </span>
                        </div>
                      )}

                      {/* Checkmark showing if already completed during this session */}
                      {activeCompletedSteps[currentExecIdx] && (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-[10px] font-bold uppercase tracking-wider animate-fade-in mt-3">
                          <CheckCircle className="w-4 h-4 shrink-0" /> Completado
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2 Buttons Navigation Control Bar */}
                  <div className="flex items-center justify-between gap-4 border-t border-zinc-200/80 pt-6 mt-6">
                    {/* Botón Atrás */}
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition duration-200 text-zinc-700 cursor-pointer text-xs uppercase tracking-wider font-bold font-sans shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" /> Atrás
                    </button>

                    {/* Botón Siguiente o Terminar */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentExecIdx < executionSteps.length - 1) {
                          handleNext();
                        } else {
                          handleCompleteCurrent();
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition duration-200 font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      {currentExecIdx === executionSteps.length - 1 ? (
                        <>Terminar <CheckCircle className="w-4 h-4" /></>
                      ) : (
                        <>Siguiente <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP D: FEEDBACK (REPORT COMPLETION) */}
              {step === "feedback" && (
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-6 text-left shadow-sm">
                  <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Reportar Finalización de Sesión</h4>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 font-medium leading-relaxed font-sans">
                      ¿Has terminado el entrenamiento recomendado? Guarda tu feedback para acumular memoria adaptativa y que el plan aprenda de tu rendimiento real.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Feedback select */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Sensación General:</label>
                        <select
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full bg-white border border-zinc-200/80 text-zinc-900 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-600 cursor-pointer font-semibold"
                        >
                          <option value="perfecto">Excelente / Perfecto</option>
                          <option value="adecuado">Adecuado / Bien</option>
                          <option value="muy_duro">Muy duro / Agotador</option>
                          <option value="facil">Demasiado fácil</option>
                          <option value="incompleto">Incompleto / Abandono</option>
                        </select>
                      </div>

                      {/* RPE slider */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Percepción de Esfuerzo de esta sesión (RPE 1-10):</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={loggedRpe}
                            onChange={(e) => setLoggedRpe(Number(e.target.value))}
                            className="w-full accent-blue-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-mono font-bold text-xs text-blue-600 bg-zinc-50 px-2.5 py-1 rounded-md shrink-0 border border-zinc-200/80">
                            {loggedRpe}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLogWorkoutCompletion(session.id, feedback, loggedRpe);
                          setSelectedSessionId("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-sm"
                      >
                        Guardar & Registrar Sesión Realizada
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

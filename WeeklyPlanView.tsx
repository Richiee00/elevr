import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrainingPlan, WorkoutSession, WeeklyPlan, DailyReadinessInput, DailyReadinessScore } from "./types";
import { calculateReadiness, runDailyExecutionEngine, formatDateEU } from "./engines";
import { 
  Calendar, 
  Dumbbell, 
  Activity, 
  Moon, 
  Compass, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  Info,
  Lock,
  Play,
  X,
  BrainCircuit,
  Smile,
  ArrowRight,
  ArrowLeft
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
  return { name: exercise.trim(), details: "" };
}

// Separa "3x10" / "3x10 por lado" / "3x40s" en el número de series (rounds) y el resto de la
// prescripción (reps). Ambos ejercicios de una biserie comparten el mismo número de series: se toma
// el primero que aparezca en el bloque.
function splitRoundsAndReps(details: string): { rounds: string | null; reps: string } {
  const match = details.match(/^(\d+)\s*[x×*]\s*(.+)$/i);
  if (match) {
    return { rounds: match[1], reps: match[2].trim() };
  }
  return { rounds: null, reps: details };
}

interface WeeklyPlanViewProps {
  plan: TrainingPlan;
  currentWeekIndex: number;
  onSetCurrentWeek: (idx: number) => void;
  onLogWorkoutCompletion: (workoutId: string, feedback: string, rpe: number) => void;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
  readiness?: DailyReadinessInput;
  onSaveReadiness?: (input: DailyReadinessInput) => void;
  activeInjury?: boolean;
  injuryAreas?: string[];
}

export default function WeeklyPlanView({
  plan,
  currentWeekIndex,
  onSetCurrentWeek,
  onLogWorkoutCompletion,
  completedWorkouts,
  readiness,
  onSaveReadiness,
  activeInjury = false,
  injuryAreas = []
}: WeeklyPlanViewProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  
  // Execution tracking state per session
  const [sessionSteps, setSessionSteps] = useState<Record<string, "preview" | "adapted" | "executing" | "feedback">>({});
  const [activeExecutingSessionId, setActiveExecutingSessionId] = useState<string | null>(null);
  const [activeReadinessSessionId, setActiveReadinessSessionId] = useState<string | null>(null);
  const [currentExecIdx, setCurrentExecIdx] = useState<number>(0);
  const [activeCompletedSteps, setActiveCompletedSteps] = useState<Record<number, boolean>>({});
  const [showOriginalPlan, setShowOriginalPlan] = useState<Record<string, boolean>>({});

  // Questionnaire Modal States
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [sleepQuality, setSleepQuality] = useState<"bueno" | "normal" | "malo">("normal");
  const [stress, setStress] = useState<number>(2);
  const [fatigue, setFatigue] = useState<number>(2);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(2);
  const [jointSoreness, setJointSoreness] = useState<number>(1);
  const [prevRpe, setPrevRpe] = useState<number>(5);

  // Feedback form states
  const [selectedFeedback, setSelectedFeedback] = useState<string>("adecuado");
  const [selectedRpe, setSelectedRpe] = useState<number>(5);

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

  const toggleExplanation = (sessionId: string) => {
    setShowExplanation(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const activeWeek: WeeklyPlan = plan.weeks[currentWeekIndex];

  const getWeeklyTotalWorkouts = (freq: string): number => {
    if (!freq) return 5;
    const clean = freq.replace("_", "+");
    if (clean.includes("2+2") || clean.includes("2_2")) return 4;
    if (clean.includes("3+2") || clean.includes("3_2")) return 5;
    if (clean.includes("4+2") || clean.includes("4_2")) return 6;
    if (clean.includes("5+2") || clean.includes("5_2")) return 7;
    
    const match = clean.match(/(\d+)\D+(\d+)/);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      if (!isNaN(a) && !isNaN(b)) {
        return a + b;
      }
    }
    return 5;
  };

  const activeSessions = activeWeek.sessions.filter(s => s.type !== "descanso");
  const totalWorkouts = getWeeklyTotalWorkouts(plan.frequency);
  const completedCount = activeSessions.filter(s => !!completedWorkouts[s.id]).length;
  const completionPercentage = totalWorkouts > 0 ? Math.min(100, Math.round((completedCount / totalWorkouts) * 100)) : 0;

  const getDayName = (dayIdx: number) => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return days[dayIdx] || "Día";
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

  const toggleExpand = (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
      setSelectedFeedback("adecuado");
      setSelectedRpe(5);
    }
  };

  const handleConfirmReadinessModal = () => {
    if (!activeReadinessSessionId) return;

    const todayStr = getLocalDateString(new Date());
    const input: DailyReadinessInput = {
      date: todayStr,
      sleepHours,
      sleepQuality,
      stress,
      fatigue,
      muscleSoreness,
      jointSoreness,
      prevRPE: prevRpe
    };

    if (onSaveReadiness) {
      onSaveReadiness(input);
    }

    setActiveExecutingSessionId(activeReadinessSessionId);
    setCurrentExecIdx(0);
    setActiveCompletedSteps({});
    setSessionSteps(prev => ({
      ...prev,
      [activeReadinessSessionId]: "adapted"
    }));

    setActiveReadinessSessionId(null);
  };

  const isExecutionActive = Boolean(
    activeExecutingSessionId && 
    sessionSteps[activeExecutingSessionId] && 
    sessionSteps[activeExecutingSessionId] !== "preview"
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {isExecutionActive ? (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <button
            type="button"
            onClick={() => {
              if (activeExecutingSessionId) {
                setSessionSteps(prev => ({ ...prev, [activeExecutingSessionId]: "preview" }));
                setActiveExecutingSessionId(null);
              }
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer font-sans"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Plan Semanal
          </button>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">Modo Entrenamiento Activo</span>
        </div>
      ) : (
        <>
          {/* Week Selector Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Cronograma del Plan</h3>
            <p className="text-xs text-zinc-500 font-medium">Selecciona la semana que deseas auditar:</p>
          </div>
        </div>

        {/* Scrollable button pills for weeks */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none max-w-full">
          {plan.weeks.map((w, idx) => {
            const isSelected = idx === currentWeekIndex;
            return (
              <button
                key={w.weekNumber}
                onClick={() => {
                  onSetCurrentWeek(idx);
                  setExpandedSessionId(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex flex-col items-center gap-0.5 shrink-0 min-w-[56px] cursor-pointer border ${
                  isSelected 
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                    : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-600"
                }`}
              >
                <span>S{w.weekNumber}</span>
                {w.isDescarga && (
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-100" : "text-amber-600"}`}>
                    Desc
                  </span>
                )}
                {w.isTaper && (
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-100" : "text-rose-600"}`}>
                    Taper
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Header Description */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-sm text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-zinc-900">Semana {activeWeek.weekNumber} de {plan.durationWeeks}</span>
          {activeWeek.isDescarga && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-amber-200">
              Semana de Descarga Activa (Deload)
            </span>
          )}
          {activeWeek.isTaper && (
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-rose-200">
              Semana de Taper & Puesta a Punto
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-600 font-medium leading-relaxed max-w-3xl font-sans">
          {activeWeek.description}
        </p>
      </div>

      {/* Week Progress Bar & Completion Counter */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${completionPercentage === 100 ? "bg-emerald-500 animate-bounce" : "bg-blue-600 animate-pulse"}`} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">
              Progreso semanal: <span className="text-blue-600 font-mono font-bold ml-1 text-xs">{completedCount} / {totalWorkouts}</span>
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-zinc-100 h-5 rounded-full overflow-hidden p-[2px] border border-zinc-200/80 relative flex items-center">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full bg-blue-600 rounded-full flex items-center justify-center ${completionPercentage > 0 ? "min-w-[2.5rem]" : ""}`}
          >
            <span className="text-[10px] font-bold text-white font-mono uppercase tracking-wider">
              {completionPercentage}%
            </span>
          </motion.div>
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-medium text-zinc-500 font-sans">
          <span>Frecuencia semanal: {plan.frequency.replace("_", "+")} ({totalWorkouts} entrenamientos totales)</span>
          {completionPercentage === 100 ? (
            <span className="text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">¡Semana completada con éxito! 🎉</span>
          ) : (
            <span>Llevas el {completionPercentage}% completado</span>
          )}
        </div>
      </div>
      </>
      )}

      {/* Days of the Week List */}
      <div className="space-y-3">
        {(isExecutionActive ? activeWeek.sessions.filter(s => s.id === activeExecutingSessionId) : activeWeek.sessions).map((session, dayIdx) => {
          const isCompleted = !!completedWorkouts[session.id];
          const loggedFeedback = completedWorkouts[session.id];
          const isExpanded = isExecutionActive ? true : (expandedSessionId === session.id);
          const availability = checkWorkoutAvailability(session.id, session.type);
          const currentStep = sessionSteps[session.id] || "preview";

          // Calculate readiness and adaptation if readiness exists
          let sessionReadinessScore: DailyReadinessScore | null = null;
          let sessionAdaptationResult: ReturnType<typeof runDailyExecutionEngine> | null = null;
          
          if (readiness) {
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
            // Solo para mainWork: la biserie completa del bloque, para mostrar todos sus ejercicios
            // juntos en el mismo paso en vez de partirlos uno por pantalla.
            exercises?: Array<{ name: string; reps: string }>;
            rounds?: string | null;
          }> = [];

          if (workoutToExecute) {
            executionSteps.push({
              type: "objective",
              title: "Objetivo de la Sesión",
              name: workoutToExecute.objective || "Completar la sesión de entrenamiento del día."
            });

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

            if (workoutToExecute.mainWork) {
              // Un paso por BLOQUE (biserie), no por ejercicio — así se ve que los ejercicios de un
              // mismo bloque van seguidos y juntos forman una sola serie a repetir.
              const mainBlocks = parseMainWork(workoutToExecute.mainWork);

              mainBlocks.forEach((block, idx) => {
                const parsedExercises = block.exercises.map(ex => {
                  const { name, details } = parseExerciseDetails(ex);
                  return { name, ...splitRoundsAndReps(details) };
                });
                const rounds = parsedExercises.find(e => e.rounds)?.rounds ?? null;

                executionSteps.push({
                  type: "mainWork",
                  title: `Trabajo Principal (${idx + 1}/${mainBlocks.length})`,
                  name: block.title || `Bloque ${idx + 1}`,
                  blockTitle: block.title,
                  exercises: parsedExercises.map(e => ({ name: e.name, reps: e.reps })),
                  rounds,
                  originalIndex: idx,
                  totalInPhase: mainBlocks.length
                });
              });
            }

            if (workoutToExecute.cooldown) {
              executionSteps.push({
                type: "cooldown",
                title: "Vuelta a la Calma",
                name: workoutToExecute.cooldown
              });
            }
          }

          const activeExecStep = executionSteps[currentExecIdx] || executionSteps[0];
          const activePhase = activeExecStep?.type;
          const existingPhases = Array.from(new Set(executionSteps.map(s => s.type)));

          const phaseLabels: Record<string, string> = {
            objective: "Objetivo",
            warmup: "Calentamiento",
            mainWork: "Trabajo",
            cooldown: "Vuelta a la Calma"
          };

          const handleNextStep = () => {
            if (currentExecIdx < executionSteps.length - 1) {
              setCurrentExecIdx(currentExecIdx + 1);
            } else {
              setSessionSteps(prev => ({ ...prev, [session.id]: "feedback" }));
            }
          };

          const handlePrevStep = () => {
            if (currentExecIdx > 0) {
              setCurrentExecIdx(currentExecIdx - 1);
            } else {
              setSessionSteps(prev => ({ ...prev, [session.id]: "adapted" }));
            }
          };

          const handleCompleteCurrentStep = () => {
            setActiveCompletedSteps(prev => ({ ...prev, [currentExecIdx]: true }));
            handleNextStep();
          };

          return (
            <div 
              key={session.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 text-left shadow-sm ${
                isCompleted 
                  ? "bg-emerald-50/50 border-emerald-200" 
                  : isExpanded 
                    ? "bg-white border-blue-600 ring-2 ring-blue-600/10" 
                    : "bg-white border-zinc-200/80 hover:border-zinc-300"
              }`}
            >
              {/* Day Header */}
              <div 
                onClick={() => toggleExpand(session.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-left">
                    <span className="text-zinc-400 text-[9px] uppercase font-bold block tracking-wider">
                      Día {dayIdx + 1}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                      {getDayName(dayIdx)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-zinc-200 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      {getSessionTypeBadge(session.type)}
                      {session.isVamRetest && !isCompleted && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold rounded-md uppercase tracking-wider border border-amber-200">
                          Test VAM
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-bold rounded-md uppercase tracking-wider flex items-center gap-0.5 border border-emerald-200">
                          <CheckCircle className="w-2.5 h-2.5" /> Completado
                        </span>
                      )}
                      {!isCompleted && !availability.allowed && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-bold rounded-md uppercase tracking-wider flex items-center gap-0.5 border border-rose-200">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado hoy
                        </span>
                      )}
                      {!isCompleted && currentStep !== "preview" && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded-md uppercase tracking-wider flex items-center gap-0.5 border border-blue-200">
                          <Zap className="w-2.5 h-2.5 animate-bounce" /> En Curso
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate max-w-[280px] sm:max-w-[400px]">
                      {session.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isCompleted && session.type !== "descanso" && (
                    <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                      Ver detalles
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Day Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-zinc-100 pt-5 bg-zinc-50/50 space-y-5">
                  
                  {/* IF COMPLETED */}
                  {isCompleted && loggedFeedback ? (
                    <div className="max-w-2xl mx-auto p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium font-sans">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Reportado como <strong className="text-emerald-700 capitalize">{loggedFeedback.feedback.replace("_", " ")}</strong> con RPE de <strong className="text-emerald-700">{loggedFeedback.rpe}/10</strong>.
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-mono">
                        {formatDateEU(loggedFeedback.date)}
                      </span>
                    </div>
                  ) : session.type === "descanso" ? (
                    /* REST DAY */
                    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 text-center space-y-3">
                      <Moon className="w-8 h-8 text-zinc-400 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Día de Descanso / Descarga Activa</h4>
                        <p className="text-xs text-zinc-500 font-medium max-w-md mx-auto mt-1 font-sans">
                          Aprovecha hoy para estirar, hidratarte bien y asimilar las cargas de entrenamiento acumuladas. El descanso es parte del rendimiento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* ACTIVE SESSION FLOW */
                    <div className="max-w-2xl mx-auto space-y-5">
                      
                      {/* STEP 1: PREVIEW MODE */}
                      {currentStep === "preview" && (
                        <div className="space-y-5 text-xs font-medium">
                          {/* Objetivo Fisiológico / Target */}
                          {(session.objective || session.intensity) && (
                            <div className="space-y-3 pb-3 border-b border-zinc-200/80">
                              {session.objective && (
                                <div className="pb-1">
                                  <div 
                                    onClick={() => toggleExplanation(session.id)}
                                    className="flex items-center justify-between gap-4 cursor-pointer group select-none py-1"
                                  >
                                    <div>
                                      <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider block font-sans">Objetivo Fisiológico</span>
                                    </div>
                                    <div className="text-zinc-400 group-hover:text-blue-600 transition-colors duration-200 p-1 shrink-0">
                                      {showExplanation[session.id] ? (
                                        <ChevronUp className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Objective & Physiological Explanation */}
                                  {showExplanation[session.id] && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="mt-3 p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3"
                                    >
                                      <p className="text-zinc-900 font-medium text-xs leading-relaxed font-sans">
                                        {session.objective}
                                      </p>
                                      {session.physiologicalExplanation && (
                                        <div className="text-[11px] text-blue-900 border-t border-blue-200/60 pt-2.5 mt-2.5 leading-relaxed font-medium">
                                          <strong className="text-blue-600 font-bold block mb-1 uppercase text-[9px] tracking-wider flex items-center gap-1.5 font-sans">
                                            <Info className="w-3.5 h-3.5 shrink-0" /> Explicación fisiológica:
                                          </strong>
                                          {session.physiologicalExplanation}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              )}

                              {session.intensity && (
                                <div className="pt-1">
                                  <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider block font-sans">Intensidad / Ritmos</span>
                                  <p className="text-blue-600 font-mono font-bold text-xs sm:text-sm mt-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl inline-block">
                                    {session.intensity}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Timeline Column */}
                          <div className="relative pl-5 border-l border-zinc-200 space-y-6">
                            {/* Calentamiento */}
                            {session.warmup && (
                              <div className="relative">
                                <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 border-2 border-white" />
                                <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider block mb-2 font-sans">• Calentamiento Preventivo:</span>
                                <div className="space-y-1.5 text-zinc-700 leading-relaxed pl-1 font-sans">
                                  {parseWarmup(session.warmup).map((ex, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <span className="text-zinc-400 mt-0.5 font-bold">-</span>
                                      <span className="font-medium text-xs text-zinc-800">
                                        {formatExercise(ex)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Trabajo Principal */}
                            {session.mainWork && (
                              <div className="relative">
                                <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                                <span className="text-blue-600 font-bold uppercase text-[10px] tracking-wider block mb-2 font-sans">• Trabajo Principal:</span>
                                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-4 shadow-sm">
                                  {parseMainWork(session.mainWork).map((block, idx) => (
                                    <div key={idx} className="space-y-2">
                                      {block.title && (
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                          {block.title}:
                                        </p>
                                      )}
                                      <div className="space-y-1.5 pl-2.5 border-l border-zinc-200 font-sans">
                                        {block.exercises.map((ex, exIdx) => (
                                          <div key={exIdx} className="flex items-start gap-2">
                                            <span className="text-zinc-300 mt-0.5 font-bold">-</span>
                                            <span className="text-xs text-zinc-800 font-medium leading-relaxed">
                                              {formatExercise(ex)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Vuelta a la Calma */}
                            {session.cooldown && (
                              <div className="relative">
                                <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 border-2 border-white" />
                                <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider block mb-1 font-sans">• Vuelta a la Calma:</span>
                                <p className="text-zinc-700 leading-relaxed pl-1 font-sans">{session.cooldown}</p>
                              </div>
                            )}
                          </div>

                          {/* "EMPEZAR ENTRENAMIENTO" button */}
                          <div className="pt-2">
                            {!availability.allowed ? (
                              <div className="p-4 bg-white rounded-2xl border border-rose-200 space-y-2 text-left shadow-sm">
                                <div className="flex items-start gap-2.5 text-xs text-rose-600 font-medium">
                                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                                  <div className="space-y-1">
                                    <span className="font-bold uppercase tracking-wider block text-rose-600">Sesión bloqueada hoy</span>
                                    <p className="text-zinc-600 font-medium font-sans leading-relaxed">{availability.reason}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (readiness) {
                                      setActiveExecutingSessionId(session.id);
                                      setCurrentExecIdx(0);
                                      setActiveCompletedSteps({});
                                      setSessionSteps(prev => ({ ...prev, [session.id]: "adapted" }));
                                    } else {
                                      setActiveReadinessSessionId(session.id);
                                    }
                                  }}
                                  className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-2xl text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-2 duration-200 hover:scale-[1.01]"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  <span>EMPEZAR ENTRENAMIENTO</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* STEP 2: ADAPTED VIEW */}
                      {currentStep === "adapted" && (
                        <div className="space-y-6">
                          {/* Readiness dial */}
                          {sessionReadinessScore && (
                            <div className="flex justify-center items-center py-2">
                              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden w-full max-w-xs shadow-sm">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-3 font-sans">Índice de Readiness</span>
                                
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
                              {/* Decision Banner */}
                              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                                sessionAdaptationResult.status === "mantener"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                  : sessionAdaptationResult.status === "reducido"
                                    ? "bg-amber-50 border-amber-200 text-amber-900"
                                    : "bg-rose-50 border-rose-200 text-rose-900"
                              }`}>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider block font-sans text-zinc-500">Decisión del Motor Adaptativo</span>
                                  <h4 className="text-base font-black uppercase tracking-wider flex items-center gap-1.5 text-zinc-900">
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

                              {/* Comparison Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Original Scheduled */}
                                <div 
                                  onClick={() => setShowOriginalPlan(prev => ({ ...prev, [session.id]: !prev[session.id] }))}
                                  className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3 cursor-pointer select-none hover:border-zinc-300 transition-all text-left shadow-sm"
                                >
                                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">1. Previsto en Plan Original</span>
                                    <div className="text-zinc-400">
                                      {showOriginalPlan[session.id] ? (
                                        <ChevronUp className="w-4 h-4 text-zinc-600" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-zinc-600" />
                                      )}
                                    </div>
                                  </div>
                                  <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-xs sm:text-sm">{session.name}</h4>
                                  
                                  {showOriginalPlan[session.id] && (
                                    <div className="space-y-4 pt-3 border-t border-zinc-100 text-xs text-zinc-700 font-medium">
                                      {session.intensity && (
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Ritmos Planificados:</span>
                                          <p className="text-zinc-800 pl-1 font-sans">{session.intensity}</p>
                                        </div>
                                      )}

                                      {session.warmup && (
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Calentamiento:</span>
                                          <div className="space-y-1 mt-1 font-sans pl-1">
                                            {parseWarmup(session.warmup).map((ex, exIdx) => (
                                              <p key={exIdx} className="text-xs text-zinc-700">- {formatExercise(ex)}</p>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {session.mainWork && (
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Trabajo Principal:</span>
                                          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 space-y-3 mt-1 font-sans">
                                            {parseMainWork(session.mainWork).map((block, bIdx) => (
                                              <div key={bIdx} className="space-y-1">
                                                {block.title && <p className="text-[11px] font-bold text-zinc-900 uppercase">{block.title}:</p>}
                                                <div className="space-y-0.5 pl-2 border-l border-zinc-200">
                                                  {block.exercises.map((ex, exIdx) => (
                                                    <p key={exIdx} className="text-xs text-zinc-600">- {formatExercise(ex)}</p>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {session.cooldown && (
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">• Vuelta a la Calma:</span>
                                          <p className="text-zinc-700 pl-1 font-sans">{session.cooldown}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
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
                                      <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-xs sm:text-sm">{sessionAdaptationResult.adaptedWorkout.name}</h4>
                                      
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
                                  }}
                                  className="w-full sm:w-auto px-12 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition shadow-sm cursor-pointer duration-200 flex items-center justify-center gap-2"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  <span>Empezar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 3: EXECUTING STEP-BY-STEP */}
                      {currentStep === "executing" && activeExecStep && (
                        <div className="space-y-6">
                          {/* Stepper Header */}
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
                              <span>{activeExecStep.title}</span>
                              <span>Paso {currentExecIdx + 1} de {executionSteps.length}</span>
                            </div>
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
                                  activeExecStep.type === "objective"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : activeExecStep.type === "warmup"
                                      ? "bg-orange-50 text-orange-600 border-orange-200"
                                      : activeExecStep.type === "mainWork"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-teal-50 text-teal-600 border-teal-200"
                                }`}>
                                  {activeExecStep.type === "objective" && "Objetivo del Entrenamiento"}
                                  {activeExecStep.type === "warmup" && "Calentamiento Activo"}
                                  {activeExecStep.type === "mainWork" && `Trabajo Principal${activeExecStep.blockTitle ? ` • ${activeExecStep.blockTitle}` : ""}`}
                                  {activeExecStep.type === "cooldown" && "Vuelta a la Calma / Estiramientos"}
                                </span>
                              </div>

                              {activeExecStep.type === "mainWork" && activeExecStep.exercises && activeExecStep.exercises.length > 0 ? (
                                // Bloque completo (biserie): todos sus ejercicios se muestran juntos,
                                // en el orden en que hay que hacerlos, con las series a repetir.
                                <div className="space-y-4">
                                  {activeExecStep.rounds && (
                                    <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                                      {activeExecStep.rounds} Series
                                    </div>
                                  )}
                                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 uppercase tracking-tight leading-snug max-w-2xl mx-auto">
                                    {activeExecStep.name}
                                  </h3>
                                  <div className="max-w-md mx-auto space-y-2 text-left">
                                    {activeExecStep.exercises.map((ex, exIdx) => (
                                      <React.Fragment key={exIdx}>
                                        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3">
                                          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                                            {exIdx + 1}
                                          </span>
                                          <div className="min-w-0">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{ex.name}</p>
                                            {ex.reps && (
                                              <p className="text-xs font-mono font-bold text-blue-600">{ex.reps}</p>
                                            )}
                                          </div>
                                        </div>
                                        {activeExecStep.exercises && exIdx < activeExecStep.exercises.length - 1 && (
                                          <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 py-0.5">
                                            ↓ luego, sin descanso
                                          </div>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                  {activeExecStep.exercises.length > 1 && (
                                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
                                      Haz estos {activeExecStep.exercises.length} ejercicios seguidos, en este orden: eso es{" "}
                                      <strong className="text-zinc-900">1 serie</strong>.{" "}
                                      {activeExecStep.rounds
                                        ? `Repite el bloque completo ${activeExecStep.rounds} veces`
                                        : "Repite el bloque completo"}, descansando entre series.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {/* Main Name / Instruction */}
                                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight leading-snug max-w-2xl mx-auto">
                                    {activeExecStep.name}
                                  </h3>

                                  {/* Details */}
                                  {activeExecStep.details ? (
                                    <div className="inline-flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200/80 px-6 py-4 rounded-2xl mt-2">
                                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                                        Prescripción / Repeticiones
                                      </span>
                                      <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tracking-wider">
                                        {activeExecStep.details}
                                      </span>
                                    </div>
                                  ) : activeExecStep.type === "mainWork" && (
                                    <div className="inline-flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200/80 px-5 py-3 rounded-2xl mt-2">
                                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                                        Intensidad del Bloque
                                      </span>
                                      <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono">
                                        {workoutToExecute.intensity || "Sostener esfuerzo"}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}

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
                              onClick={handlePrevStep}
                              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 transition duration-200 text-zinc-700 cursor-pointer text-xs uppercase tracking-wider font-bold font-sans shadow-sm"
                            >
                              <ArrowLeft className="w-4 h-4" /> Atrás
                            </button>

                            {/* Botón Siguiente o Terminar */}
                            <button
                              type="button"
                              onClick={() => {
                                if (currentExecIdx < executionSteps.length - 1) {
                                  handleNextStep();
                                } else {
                                  setSessionSteps(prev => ({ ...prev, [session.id]: "feedback" }));
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

                      {/* STEP 4: FEEDBACK STEP */}
                      {currentStep === "feedback" && (
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
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Sensación General:</label>
                                <select
                                  value={selectedFeedback}
                                  onChange={(e) => setSelectedFeedback(e.target.value)}
                                  className="w-full bg-white border border-zinc-200/80 text-zinc-900 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-600 cursor-pointer font-semibold"
                                >
                                  <option value="perfecto">Excelente / Perfecto</option>
                                  <option value="adecuado">Adecuado / Bien</option>
                                  <option value="muy_duro">Muy duro / Agotador</option>
                                  <option value="facil">Demasiado fácil</option>
                                  <option value="incompleto">Incompleto / Abandono</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-sans">Percepción de Esfuerzo (RPE 1-10):</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={selectedRpe}
                                    onChange={(e) => setSelectedRpe(Number(e.target.value))}
                                    className="w-full accent-blue-600 bg-zinc-200 h-1.5 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="font-mono font-bold text-xs text-blue-600 bg-zinc-50 px-2.5 py-1 rounded-md shrink-0 border border-zinc-200/80">
                                    {selectedRpe}/10
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onLogWorkoutCompletion(session.id, selectedFeedback, selectedRpe);
                                  setSessionSteps(prev => ({ ...prev, [session.id]: "preview" }));
                                  setActiveExecutingSessionId(null);
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition cursor-pointer shadow-sm"
                              >
                                Guardar & Registrar Sesión Realizada
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* READINESS POP-UP MODAL */}
      <AnimatePresence>
        {activeReadinessSessionId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-xl w-full p-6 space-y-6 text-left my-8 relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <BrainCircuit className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-tight text-zinc-900">Cuestionario de Readiness Diario</h3>
                    <p className="text-xs text-zinc-500 font-medium font-sans">Completa tus indicadores de hoy para calcular tu adaptación.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReadinessSessionId(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
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
                      <span className="font-mono font-bold text-xs text-blue-600 bg-zinc-50 px-2.5 py-1 rounded-md shrink-0 border border-zinc-200 shadow-2xs">
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
                      <span className="font-mono font-bold text-xs text-zinc-900 bg-zinc-50 px-3 py-1 rounded-md shrink-0 border border-zinc-200 shadow-2xs">
                        RPE {prevRpe}/10
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setActiveReadinessSessionId(null)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReadinessModal}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm"
                >
                  Calcular Readiness & Ajustar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

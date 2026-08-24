import React, { useState } from "react";
import { motion } from "motion/react";
import { HyroxTrainingPlan, HyroxCategory, HyroxWorkoutSession, HyroxOnboardingData } from "./hyroxTypes";
import { HyroxDailyInput, adaptHyroxSession, resolveHyroxSessionTemplate } from "./hyroxEngine";
import { CATEGORY_LABELS } from "./hyroxLibrary";
import HyroxWorkoutCard from "./HyroxWorkoutCard";
import HyroxWorkoutDetail from "./HyroxWorkoutDetail";
import HyroxReadinessCard from "./HyroxReadinessCard";
import { Calendar, Moon, BrainCircuit, ChevronDown, ChevronUp } from "lucide-react";

interface HyroxWeeklyPlanViewProps {
  plan: HyroxTrainingPlan;
  onboarding: HyroxOnboardingData | null;
  vamKmH?: number;
  currentWeekIndex: number;
  onSetCurrentWeek: (idx: number) => void;
  onLogWorkoutCompletion: (sessionId: string, feedback: string, rpe: number) => void;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
  readiness?: HyroxDailyInput;
  onSaveReadiness?: (input: HyroxDailyInput) => void;
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const FILTERS: Array<{ val: "all" | HyroxCategory; label: string }> = [
  { val: "all", label: "Todos" },
  { val: "carrera", label: CATEGORY_LABELS.carrera },
  { val: "fuerza", label: CATEGORY_LABELS.fuerza },
  { val: "acondicionamiento", label: CATEGORY_LABELS.acondicionamiento },
  { val: "simulacion", label: CATEGORY_LABELS.simulacion }
];

export default function HyroxWeeklyPlanView({
  plan,
  onboarding,
  vamKmH,
  currentWeekIndex,
  onSetCurrentWeek,
  onLogWorkoutCompletion,
  completedWorkouts,
  readiness,
  onSaveReadiness
}: HyroxWeeklyPlanViewProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | HyroxCategory>("all");
  const [showReadiness, setShowReadiness] = useState(false);

  const activeWeek = plan.weeks[currentWeekIndex];
  const activeSessions = activeWeek.sessions.filter(s => s.category !== "descanso");
  const completedCount = activeSessions.filter(s => !!completedWorkouts[s.id]).length;
  const completionPercentage = activeSessions.length > 0 ? Math.round((completedCount / activeSessions.length) * 100) : 0;

  const adaptation = adaptHyroxSession(readiness);

  const visibleSessions = activeWeek.sessions.filter(
    s => categoryFilter === "all" || s.category === categoryFilter || s.category === "descanso"
  );

  return (
    <div className="space-y-5">
      {/* Week Nav */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 text-white rounded-xl shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Plan de Entrenamiento Hyrox</h3>
            <p className="text-xs text-zinc-500 font-medium">Selecciona la semana que quieres ver:</p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full sm:ml-auto">
          {plan.weeks.map((w, idx) => {
            const isSelected = idx === currentWeekIndex;
            return (
              <button
                key={w.weekNumber}
                onClick={() => {
                  onSetCurrentWeek(idx);
                  setExpandedSessionId(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex flex-col items-center gap-0.5 shrink-0 min-w-[52px] cursor-pointer border ${
                  isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-600"
                }`}
              >
                <span>S{w.weekNumber}</span>
                {w.isDescarga && (
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-100" : "text-amber-600"}`}>Desc</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Description + Progress */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-zinc-900">
            Semana {activeWeek.weekNumber} de {plan.durationWeeks}
          </span>
          {activeWeek.isDescarga && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-amber-200">
              Semana de Descarga
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-600 font-medium leading-relaxed">{activeWeek.description}</p>

        <div className="w-full bg-zinc-100 h-4 rounded-full overflow-hidden p-[2px] border border-zinc-200/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Progreso: <span className="text-blue-600 font-mono">{completedCount} / {activeSessions.length}</span>
        </p>
      </div>

      {/* Readiness Toggle */}
      <button
        onClick={() => setShowReadiness(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-3 bg-white border border-zinc-200/80 rounded-2xl shadow-xs cursor-pointer hover:border-zinc-300 transition"
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700">
          <BrainCircuit className="w-4 h-4 text-blue-600" />
          {readiness ? "Readiness registrada hoy" : "Registrar readiness de hoy"}
        </span>
        {showReadiness ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>

      {showReadiness && onSaveReadiness && (
        <HyroxReadinessCard
          onSave={input => {
            onSaveReadiness(input);
            setShowReadiness(false);
          }}
        />
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <button
            key={f.val}
            onClick={() => setCategoryFilter(f.val)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer transition shrink-0 ${
              categoryFilter === f.val ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200/80 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Day Sessions */}
      <div className="space-y-3">
        {visibleSessions.map(session => {
          const isExpanded = expandedSessionId === session.id;
          const isCompleted = !!completedWorkouts[session.id];
          const loggedFeedback = completedWorkouts[session.id];

          if (session.category === "descanso") {
            return (
              <div key={session.id} className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center gap-3 opacity-70">
                <Moon className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{DAY_NAMES[session.dayIndex]}</p>
                  <p className="text-xs font-bold text-zinc-600">Descanso / Movilidad</p>
                </div>
              </div>
            );
          }

          const template = onboarding
            ? resolveHyroxSessionTemplate(session, { onboarding, weekNumber: activeWeek.weekNumber, durationWeeks: plan.durationWeeks, vamKmH })
            : resolveHyroxSessionTemplate(session);
          if (!template) return null;

          return (
            <div key={session.id} className="space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-16 shrink-0 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{DAY_NAMES[session.dayIndex].slice(0, 3)}</p>
                </div>
                <div className="flex-1">
                  <HyroxWorkoutCard
                    template={template}
                    isCompleted={isCompleted}
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="ml-0 sm:ml-[76px]">
                  <HyroxWorkoutDetail
                    template={template}
                    roundsMultiplier={adaptation.roundsMultiplier}
                    adaptationNote={adaptation.status !== "mantener" ? adaptation.justification : undefined}
                    isCompleted={isCompleted}
                    loggedFeedback={loggedFeedback}
                    onClose={() => setExpandedSessionId(null)}
                    onLogCompletion={(feedback, rpe) => {
                      onLogWorkoutCompletion(session.id, feedback, rpe);
                      setExpandedSessionId(null);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

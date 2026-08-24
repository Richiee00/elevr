import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { HyroxOnboardingData, HyroxTrainingPlan } from "./hyroxTypes";
import { HyroxDailyInput, adaptHyroxSession, generateHyroxSessionContent, getCachedGeneratedSession, resolveHyroxSessionTemplate, buildHyroxLoadContextNote } from "./hyroxEngine";
import { CATEGORY_LABELS } from "./hyroxLibrary";
import HyroxWorkoutDetail from "./HyroxWorkoutDetail";
import HyroxReadinessCard from "./HyroxReadinessCard";
import { Moon, Flame, BrainCircuit, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react";

interface HyroxTodayWorkoutViewProps {
  plan: HyroxTrainingPlan;
  onboarding: HyroxOnboardingData | null;
  currentWeekIndex: number;
  readiness?: HyroxDailyInput;
  onSaveReadiness: (input: HyroxDailyInput) => void;
  onLogWorkoutCompletion: (sessionId: string, feedback: string, rpe: number) => void;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function HyroxTodayWorkoutView({
  plan,
  onboarding,
  currentWeekIndex,
  readiness,
  onSaveReadiness,
  onLogWorkoutCompletion,
  completedWorkouts
}: HyroxTodayWorkoutViewProps) {
  const [showReadiness, setShowReadiness] = useState(false);
  const [generatedVersion, setGeneratedVersion] = useState(0);

  const localDay = new Date().getDay();
  const dayIndex = localDay === 0 ? 6 : localDay - 1;

  const activeWeek = plan.weeks[currentWeekIndex] || plan.weeks[0];

  // La pestaña "Hoy" siempre abre el entrenamiento del día correspondiente en el plan; las flechas
  // permiten hojear el resto de días de la semana por si el usuario prefiere hacer otro.
  const [viewedDayIndex, setViewedDayIndex] = useState<number>(dayIndex);
  const clampedDayIndex = Math.max(0, Math.min(activeWeek.sessions.length - 1, viewedDayIndex));
  const viewedSession = activeWeek.sessions[clampedDayIndex] || activeWeek.sessions[0];
  const isViewingToday = clampedDayIndex === dayIndex;

  const isCompleted = !!completedWorkouts[viewedSession.id];
  const loggedFeedback = completedWorkouts[viewedSession.id];
  const adaptation = adaptHyroxSession(readiness);

  useEffect(() => {
    if (!onboarding || !viewedSession.templateId || viewedSession.category === "descanso") return;
    if (getCachedGeneratedSession(viewedSession.id)) return;

    let cancelled = false;
    generateHyroxSessionContent(viewedSession.id, {
      category: viewedSession.category as "carrera" | "fuerza" | "acondicionamiento" | "simulacion",
      objective: onboarding.objective,
      limitantType: plan.initialDiagnostic.limitantType,
      experienceLevel: onboarding.experienceLevel,
      gymType: onboarding.gymType,
      sessionDurationMin: onboarding.sessionDurationMin,
      isDescarga: activeWeek.isDescarga,
      injuryAreas: onboarding.activeInjury ? onboarding.injuryAreas : [],
      weekNumber: activeWeek.weekNumber,
      durationWeeks: plan.durationWeeks,
      raceCategory: onboarding.raceCategory,
      division: onboarding.division,
      loadContextNote: buildHyroxLoadContextNote(onboarding, activeWeek.weekNumber, plan.durationWeeks)
    }).then(result => {
      if (!cancelled && result) setGeneratedVersion(v => v + 1);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedSession.id]);

  const template = onboarding
    ? resolveHyroxSessionTemplate(viewedSession, { onboarding, weekNumber: activeWeek.weekNumber, durationWeeks: plan.durationWeeks })
    : resolveHyroxSessionTemplate(viewedSession);
  // generatedVersion se referencia únicamente para forzar el re-render cuando Gemini termina de generar.
  void generatedVersion;

  const goToDay = (targetIdx: number) => {
    setViewedDayIndex(Math.max(0, Math.min(activeWeek.sessions.length - 1, targetIdx)));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => goToDay(clampedDayIndex - 1)}
            disabled={clampedDayIndex <= 0}
            aria-label="Día anterior"
            className="p-2.5 rounded-xl border border-zinc-200/80 text-zinc-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-600 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            {DAY_NAMES[clampedDayIndex]} · Semana {activeWeek.weekNumber}{isViewingToday ? " · Hoy" : ""}
          </div>

          <button
            type="button"
            onClick={() => goToDay(clampedDayIndex + 1)}
            disabled={clampedDayIndex >= activeWeek.sessions.length - 1}
            aria-label="Día siguiente"
            className="p-2.5 rounded-xl border border-zinc-200/80 text-zinc-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-600 shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-zinc-900 text-center">
          {template ? template.name : "Día de Descanso"}
        </h3>
        {template && (
          <p className="text-xs text-zinc-500 font-medium max-w-2xl mt-2 leading-relaxed text-center mx-auto">
            {CATEGORY_LABELS[template.category]} · {template.durationMin} minutos · {template.description}
          </p>
        )}
      </div>

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

      {showReadiness && (
        <HyroxReadinessCard
          onSave={input => {
            onSaveReadiness(input);
            setShowReadiness(false);
          }}
        />
      )}

      {!template ? (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 text-center space-y-3">
          <Moon className="w-8 h-8 text-zinc-400 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Día de Descanso / Movilidad</h4>
            <p className="text-xs text-zinc-500 font-medium max-w-md mx-auto mt-1">
              Aprovecha para estirar e hidratarte. La recuperación forma parte del rendimiento en Hyrox.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
          <HyroxWorkoutDetail
            template={template}
            roundsMultiplier={adaptation.roundsMultiplier}
            adaptationNote={adaptation.status !== "mantener" ? adaptation.justification : undefined}
            isCompleted={isCompleted}
            loggedFeedback={loggedFeedback}
            onLogCompletion={(feedback, rpe) => onLogWorkoutCompletion(viewedSession.id, feedback, rpe)}
          />
        </div>
      )}
    </div>
  );
}

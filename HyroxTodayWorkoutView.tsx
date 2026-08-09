import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { HyroxOnboardingData, HyroxTrainingPlan } from "./hyroxTypes";
import { HyroxDailyInput, adaptHyroxSession, generateHyroxSessionContent, getCachedGeneratedSession, resolveHyroxSessionTemplate } from "./hyroxEngine";
import { CATEGORY_LABELS } from "./hyroxLibrary";
import HyroxWorkoutDetail from "./HyroxWorkoutDetail";
import HyroxReadinessCard from "./HyroxReadinessCard";
import { Moon, Flame, BrainCircuit, ChevronDown, ChevronUp } from "lucide-react";

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
  const todaySession = activeWeek.sessions[dayIndex] || activeWeek.sessions[0];

  const isCompleted = !!completedWorkouts[todaySession.id];
  const loggedFeedback = completedWorkouts[todaySession.id];
  const adaptation = adaptHyroxSession(readiness);

  useEffect(() => {
    if (!onboarding || !todaySession.templateId || todaySession.category === "descanso") return;
    if (getCachedGeneratedSession(todaySession.id)) return;

    let cancelled = false;
    generateHyroxSessionContent(todaySession.id, {
      category: todaySession.category as "carrera" | "fuerza" | "acondicionamiento" | "simulacion",
      objective: onboarding.objective,
      limitantType: plan.initialDiagnostic.limitantType,
      experienceLevel: onboarding.experienceLevel,
      gymType: onboarding.gymType,
      sessionDurationMin: onboarding.sessionDurationMin,
      isDescarga: activeWeek.isDescarga,
      injuryAreas: onboarding.activeInjury ? onboarding.injuryAreas : [],
      weekNumber: activeWeek.weekNumber,
      durationWeeks: plan.durationWeeks
    }).then(result => {
      if (!cancelled && result) setGeneratedVersion(v => v + 1);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySession.id]);

  const template = resolveHyroxSessionTemplate(todaySession);
  // generatedVersion se referencia únicamente para forzar el re-render cuando Gemini termina de generar.
  void generatedVersion;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Flame className="w-4 h-4" />
          {DAY_NAMES[dayIndex]} · Semana {activeWeek.weekNumber}
        </div>
        <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-zinc-900">
          {template ? template.name : "Día de Descanso"}
        </h3>
        {template && (
          <p className="text-xs text-zinc-500 font-medium max-w-2xl mt-2 leading-relaxed">
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
            onLogCompletion={(feedback, rpe) => onLogWorkoutCompletion(todaySession.id, feedback, rpe)}
          />
        </div>
      )}
    </div>
  );
}

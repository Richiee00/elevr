import React, { useState } from "react";
import { HyroxTrainingPlan, HyroxObjective, HyroxVAMTestResult } from "./hyroxTypes";
import { STATION_LABELS, PARCIAL_LABELS } from "./hyroxLibrary";
import HyroxVAMTestCard from "./HyroxVAMTestCard";
import { Activity, TrendingUp, Award, ShieldAlert, Zap, Calendar, Layers, Target, Flag, Gauge } from "lucide-react";

const IMC_UNLOCK_WORKOUTS = 10;

interface HyroxDashboardProps {
  plan: HyroxTrainingPlan;
  activeInjury: boolean;
  injuryAreas: string[];
  completedWorkoutsCount: number;
  vamTest: HyroxVAMTestResult | null;
  onSaveVAMTest: (result: HyroxVAMTestResult) => void;
}

export default function HyroxDashboard({ plan, activeInjury, injuryAreas, completedWorkoutsCount, vamTest, onSaveVAMTest }: HyroxDashboardProps) {
  const { initialDiagnostic } = plan;
  const [showVamTest, setShowVamTest] = useState(false);

  const renderBMIWidget = (bmi: number, category: string) => {
    if (completedWorkoutsCount < IMC_UNLOCK_WORKOUTS) {
      return (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Composición Corporal (IMC)</h4>
          </div>
          <div className="py-5 text-center">
            <p className="text-2xl font-black text-zinc-400 italic">Analizando…</p>
          </div>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Disponible al completar {IMC_UNLOCK_WORKOUTS} entrenamientos ({completedWorkoutsCount}/{IMC_UNLOCK_WORKOUTS} completados).
          </p>
        </div>
      );
    }

    const pct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));
    let barColor = "bg-blue-600";
    if (category === "Sobrepeso") barColor = "bg-amber-500";
    if (category === "Obesidad" || category === "Bajo peso") barColor = "bg-rose-500";

    return (
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Composición Corporal (IMC)</h4>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div className="text-4xl font-black text-zinc-900">{bmi}</div>
          <div className="px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-700">
            {category}
          </div>
        </div>
        <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className={`absolute left-0 top-0 h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
          <span>Delgado</span>
          <span>Normal</span>
          <span>Sobrepeso</span>
          <span>Obeso</span>
        </div>
      </div>
    );
  };

  const getObjectiveFriendlyName = (obj: HyroxObjective) => {
    switch (obj) {
      case HyroxObjective.PRIMERA_CARRERA:
        return "Mi Primera Carrera Hyrox";
      case HyroxObjective.MEJORAR_MARCA:
        return "Mejorar Mi Marca en Hyrox";
      case HyroxObjective.MEJORAR_ESTACIONES:
        return "Mejorar las Estaciones Funcionales";
      case HyroxObjective.MEJORAR_TRANSICIONES:
        return "Mejorar las Transiciones";
      case HyroxObjective.VOLVER_PAUSA:
        return "Volver a Entrenar tras una Pausa";
      case HyroxObjective.BASE_GENERAL:
        return "Base de Fuerza y Resistencia";
      default:
        return "Plan Hyrox Adaptativo";
    }
  };

  const daysToRace = plan.raceDate
    ? Math.max(0, Math.ceil((new Date(plan.raceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              Plan Generado por Master Brain Hyrox
            </div>
            <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-zinc-900">
              {getObjectiveFriendlyName(plan.objective)}
            </h3>
            <p className="text-xs text-zinc-500 font-medium max-w-2xl mt-2 leading-relaxed">
              Este panel reúne tu diagnóstico inicial, tu tiempo objetivo de carrera y las estaciones que priorizaremos en tu plan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[220px]">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-center">
              <Calendar className="w-4 h-4 text-blue-600 mx-auto mb-1.5" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Duración</p>
              <p className="text-base font-black text-zinc-900">{plan.durationWeeks} Semanas</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-center">
              <Layers className="w-4 h-4 text-blue-600 mx-auto mb-1.5" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Frecuencia</p>
              <p className="text-base font-black text-zinc-900">{plan.frequency}x / semana</p>
            </div>
          </div>
        </div>

        {daysToRace !== null && (
          <div className="mt-5 pt-5 border-t border-zinc-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <Flag className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-700 font-medium">
              Quedan <span className="font-black text-blue-600">{daysToRace} días</span> para tu carrera Hyrox.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Diagnóstico del Atleta</h4>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Nivel Estimado</p>
              <p className="text-xl font-black text-zinc-900">{initialDiagnostic.levelEstimated}</p>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Limitante Principal</p>
              <p className="text-sm font-black text-zinc-900 leading-snug">{initialDiagnostic.mainLimitant}</p>
              {initialDiagnostic.secondaryLimitant && (
                <p className="text-xs text-blue-700/80 font-bold mt-1.5 leading-snug">2º limitante: {initialDiagnostic.secondaryLimitant}</p>
              )}
              <p className="text-xs text-zinc-500 font-medium mt-2 leading-relaxed">
                El plan priorizará estas debilidades (máximo dos) para evitar estancamientos el día de la carrera.
              </p>
            </div>

            {activeInjury && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Molestia Activa</p>
                </div>
                <p className="text-xs text-zinc-800 font-bold">Zonas: {injuryAreas.join(", ")}</p>
                <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                  El motor bloqueará estaciones de riesgo en estas zonas si reportas dolor agudo hoy.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div>{renderBMIWidget(initialDiagnostic.bmi, initialDiagnostic.bmiCategory)}</div>

          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Tiempo Objetivo de Carrera</h4>
            </div>

            {!initialDiagnostic.estimatedFinishTime.agresivo ? (
              <>
                <div className="py-5 text-center">
                  <p className="text-2xl font-black text-zinc-400 italic">Analizando…</p>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">
                  Disponible al completar el Test VAM: calcula tu velocidad aeróbica máxima y desbloquea tus zonas de ritmo reales en el Perfil.
                </p>
                {!showVamTest ? (
                  <button
                    type="button"
                    onClick={() => setShowVamTest(true)}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[11px] cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <Gauge className="w-4 h-4" />
                    Realizar Test VAM
                  </button>
                ) : (
                  <HyroxVAMTestCard
                    onComplete={result => {
                      onSaveVAMTest(result);
                      setShowVamTest(false);
                    }}
                    onCancel={() => setShowVamTest(false)}
                  />
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-5">
                  {vamTest
                    ? `Estimación calculada en base a tu nivel, división y estaciones débiles reportadas. Ritmo VAM: ${vamTest.vamPaceMinKm} /km (${vamTest.vamKmH} km/h).`
                    : "Estimación calculada en base a tu categoría de competición y los datos de rendimiento que aportaste."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Conservador</p>
                    <p className="text-xl sm:text-2xl font-black text-zinc-900 font-mono mt-1">{initialDiagnostic.estimatedFinishTime.conservador}</p>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Realista</p>
                    <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono mt-1">{initialDiagnostic.estimatedFinishTime.realista}</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Agresivo</p>
                    <p className="text-xl sm:text-2xl font-black text-zinc-900 font-mono mt-1">{initialDiagnostic.estimatedFinishTime.agresivo}</p>
                  </div>
                </div>

                {initialDiagnostic.expectedImprovement && (
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-4">
                    Mejora esperable con tu frecuencia semanal: {initialDiagnostic.expectedImprovement.pct8Weeks[0]}-{initialDiagnostic.expectedImprovement.pct8Weeks[1]}%
                    en 8 semanas, {initialDiagnostic.expectedImprovement.pct12Weeks[0]}-{initialDiagnostic.expectedImprovement.pct12Weeks[1]}% en 12 semanas. Es una
                    expectativa orientativa, no una promesa.
                  </p>
                )}

                {!vamTest && (
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-4">
                    Completa el Test VAM en cualquier momento para desbloquear además tus zonas de ritmo reales en el Perfil.
                  </p>
                )}
              </>
            )}

            <div className="mt-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">Estaciones a Priorizar</p>
              </div>
              {initialDiagnostic.weakStations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {initialDiagnostic.weakStations.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                      {STATION_LABELS[s]}
                    </span>
                  ))}
                </div>
              ) : initialDiagnostic.weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {initialDiagnostic.weaknesses.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                      {PARCIAL_LABELS[s as keyof typeof PARCIAL_LABELS]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-medium">No reportaste estaciones débiles. El plan mantendrá un enfoque equilibrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

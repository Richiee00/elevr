import React from "react";
import { TrainingPlan, RunningObjective } from "./types";
import {
  Activity,
  TrendingUp,
  Award,
  ShieldCheck,
  Info,
  Zap,
  ShieldAlert,
  Flame,
  Calendar,
  Layers,
  Target
} from "lucide-react";

interface DashboardProps {
  plan: TrainingPlan;
  activeInjury: boolean;
  injuryAreas: string[];
}

export default function Dashboard({ plan, activeInjury, injuryAreas }: DashboardProps) {
  const { initialDiagnostic, zones } = plan;

  const renderBMIWidget = (bmi: number, category: string) => {
    const pct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));

    let barColor = "bg-blue-600";
    if (category === "Sobrepeso") barColor = "bg-amber-500";
    if (category === "Obesidad" || category === "Bajo peso") barColor = "bg-rose-500";

    return (
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Composición Corporal (IMC)
          </h4>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div className="text-4xl font-black text-zinc-900">{bmi}</div>
          <div className="px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-700">
            {category}
          </div>
        </div>

        <p className="text-xs text-zinc-500 font-medium mb-4">
          Calculado en base a tu altura y peso corporal.
        </p>

        <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
            style={{ width: `${pct}%` }}
          />
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

  const getObjectiveFriendlyName = (obj: RunningObjective) => {
    switch (obj) {
      case RunningObjective.PRIMER_10K:
        return "Mi Primer 10K";
      case RunningObjective.MEJORAR_10K:
        return "Mejorar Marca de 10K";
      case RunningObjective.PRIMER_21K:
        return "Mi Primer 21K (Media Maratón)";
      case RunningObjective.MEJORAR_21K:
        return "Mejorar Marca de 21K";
      case RunningObjective.MEJORAR_RITMO:
        return "Aumento de Ritmo & Velocidad";
      case RunningObjective.MEJORAR_RESISTENCIA:
        return "Acondicionamiento y Resistencia";
      default:
        return "Plan de Running Adaptativo";
    }
  };

  const getFrequencyLabel = () => {
    if (plan.frequency === "2_2") return "2+2";
    if (plan.frequency === "3_2") return "3+2";
    if (plan.frequency === "4_2") return "4+2";
    return "5+2";
  };

  const getZoneColors = (label: string) => {
    switch (label) {
      case "Rodaje Regenerativo":
        return {
          text: "text-cyan-700",
          border: "border-cyan-200",
          bg: "bg-cyan-50/50"
        };
      case "Rodaje Suave (Z2)":
        return {
          text: "text-emerald-700",
          border: "border-emerald-200",
          bg: "bg-emerald-50/50"
        };
      case "Rodaje Controlado":
        return {
          text: "text-blue-700",
          border: "border-blue-200",
          bg: "bg-blue-50/50"
        };
      case "Tempo / Umbral":
        return {
          text: "text-purple-700",
          border: "border-purple-200",
          bg: "bg-purple-50/50"
        };
      case "Series Largas (800-2000m)":
        return {
          text: "text-amber-700",
          border: "border-amber-200",
          bg: "bg-amber-50/50"
        };
      case "Series Cortas (200-400m)":
        return {
          text: "text-rose-700",
          border: "border-rose-200",
          bg: "bg-rose-50/50"
        };
      default:
        return {
          text: "text-blue-600",
          border: "border-blue-200",
          bg: "bg-blue-50/50"
        };
    }
  };

  const zoneItems = [
    {
      label: "Rodaje Regenerativo",
      value: zones.regenerative,
      desc: "Para asimilar carga y recuperación activa tras series fuertes."
    },
    {
      label: "Rodaje Suave (Z2)",
      value: zones.suave,
      desc: "Zona de base aeróbica principal. Ideal para tus tiradas largas."
    },
    {
      label: "Rodaje Controlado",
      value: zones.controlado,
      desc: "Ritmo de crucero alegre. Desarrolla resistencia muscular."
    },
    {
      label: "Tempo",
      value: zones.tempo,
      desc: "Ritmo sostenido justo por debajo del umbral. Mejora la resistencia a la fatiga."
    },
    {
      label: "Umbral",
      value: zones.umbral,
      desc: "Mejora el aclaramiento de lactato para correr rápido por más tiempo."
    },
    {
      label: "Series Largas (800-2000m)",
      value: zones.seriesLargas,
      desc: "Estímulo directo sobre tu consumo máximo de oxígeno (VO2Max)."
    },
    {
      label: "Series Cortas (200-400m)",
      value: zones.seriesCortas,
      desc: "Mejora reclutamiento rápido, velocidad pura y eficiencia de zancada."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              Plan Generado por Master Brain
            </div>

            <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-zinc-900">
              {getObjectiveFriendlyName(plan.objective)}
            </h3>

            <p className="text-xs text-zinc-500 font-medium max-w-2xl mt-2 leading-relaxed">
              Este panel reúne tu diagnóstico de rendimiento inicial y zonas de ritmo metabólico calculadas. El plan adaptará cada día tus entrenamientos en base a tu fatiga.
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
              <p className="text-base font-black text-zinc-900">{getFrequencyLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Diagnóstico del Corredor
            </h4>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                Nivel Estimado
              </p>
              <p className="text-xl font-black text-zinc-900">
                {initialDiagnostic.levelEstimated}
              </p>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                Limitante Principal
              </p>
              <p className="text-xl font-black text-zinc-900">
                {initialDiagnostic.mainLimitant}
              </p>
              <p className="text-xs text-zinc-500 font-medium mt-2 leading-relaxed">
                El plan priorizará el estímulo que solucione esta limitación para evitar estancamientos.
              </p>
            </div>

            {activeInjury && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                    Molestia Activa
                  </p>
                </div>
                <p className="text-xs text-zinc-800 font-bold">
                  Zonas: {injuryAreas.join(", ")}
                </p>
                <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                  El motor bloqueará entrenamientos pesados en estas zonas si se reporta dolor agudo hoy.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div>
            {renderBMIWidget(initialDiagnostic.bmi, initialDiagnostic.bmiCategory)}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Objetivo de Carrera
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Conservador</p>
                <p className="text-sm sm:text-base font-black text-zinc-900 mt-1.5 leading-snug">
                  {initialDiagnostic.targets.conservador}
                </p>
              </div>
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Realista</p>
                <p className="text-sm sm:text-base font-black text-blue-700 mt-1.5 leading-snug">
                  {initialDiagnostic.targets.realista}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Agresivo</p>
                <p className="text-sm sm:text-base font-black text-zinc-900 mt-1.5 leading-snug">
                  {initialDiagnostic.targets.agresivo}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Zonas de Ritmo Calculadas
              </h4>
            </div>

            <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-5">
              Cálculos fisiológicos automáticos basados en tu ritmo actual de carrera de{" "}
              <span className="text-blue-600 font-bold">{zones.paceActual}</span>.
            </p>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 mb-5">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                Pace de referencia
              </p>
              <p className="text-2xl font-black text-blue-600">{zones.paceActual}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zoneItems.filter(item => item.value).map(item => {
                const colors = getZoneColors(item.label);
                return (
                  <div
                    key={item.label}
                    className={`${colors.bg} border ${colors.border} rounded-2xl p-4`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                      {item.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-zinc-900 font-mono mt-1 mb-2 tracking-wide whitespace-nowrap">
                      {item.value}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Glosario de Esfuerzos RPE
                </p>
              </div>

              <div className="space-y-3 text-xs text-zinc-600 font-medium leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-bold text-zinc-900">RPE 2-4:</span> {zones.rpeDescription?.easy}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-bold text-zinc-900">RPE 5-6:</span> {zones.rpeDescription?.aerobic}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-orange-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-bold text-zinc-900">RPE 7-8:</span> {zones.rpeDescription?.tempo}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-bold text-zinc-900">RPE 9-10:</span> {zones.rpeDescription?.series}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

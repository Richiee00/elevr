import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { OnboardingData, RunningObjective, TrainingPlan } from "./types";
import {
  User,
  Scale,
  Ruler,
  Activity,
  Award,
  Check,
  Undo,
  Calendar,
  Sparkles,
  TrendingUp,
  Info,
  Flame,
  Dumbbell
} from "lucide-react";
import { calculateBMI } from "./engines";

interface ProfileViewProps {
  onboarding: OnboardingData;
  plan: TrainingPlan;
  onUpdateProfile: (updated: OnboardingData) => void;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
}

export default function ProfileView({ onboarding, plan, onUpdateProfile, completedWorkouts }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [age, setAge] = useState<string>(String(onboarding.age ?? ""));
  const [height, setHeight] = useState<string>(String(onboarding.height ?? ""));
  const [weight, setWeight] = useState<string>(String(onboarding.weight ?? ""));
  const [sex, setSex] = useState<"M" | "F">(onboarding.sex === "F" ? "F" : "M");

  const [saveSuccess, setSaveSuccess] = useState(false);

  const cleanNumericInput = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    return onlyDigits.replace(/^0+(?=\d)/, "");
  };

  const getSafeNumber = (value: string, fallback: number) => {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const parsedAge = getSafeNumber(age, onboarding.age || 30);
  const parsedHeight = getSafeNumber(height, onboarding.height || 175);
  const parsedWeight = getSafeNumber(weight, onboarding.weight || 70);

  const handleSave = () => {
    const updated: OnboardingData = {
      ...onboarding,
      age: parsedAge,
      height: parsedHeight,
      weight: parsedWeight,
      sex
    };

    onUpdateProfile(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    setAge(String(onboarding.age ?? ""));
    setHeight(String(onboarding.height ?? ""));
    setWeight(String(onboarding.weight ?? ""));
    setSex(onboarding.sex === "F" ? "F" : "M");
    setIsEditing(false);
  };

  const bmiData = calculateBMI(parsedWeight, parsedHeight);

  const getObjectiveLabel = (obj: RunningObjective) => {
    switch (obj) {
      case RunningObjective.PRIMER_10K:
        return "Mi Primer 10K";
      case RunningObjective.MEJORAR_10K:
        return "Mejorar marca de 10K";
      case RunningObjective.PRIMER_21K:
        return "Mi Primer Medio Maratón (21K)";
      case RunningObjective.MEJORAR_21K:
        return "Mejorar marca de 21K";
      case RunningObjective.MEJORAR_RITMO:
        return "Mejorar Ritmo / Velocidad";
      case RunningObjective.MEJORAR_RESISTENCIA:
        return "Mejorar Resistencia General";
      default:
        return obj;
    }
  };

  const estimatedPaces = plan.initialDiagnostic.estimatedPaces;

  const predictorItems = [
    { label: "Distancia 5K", value: estimatedPaces["5K"] || "24:30" },
    { label: "Distancia 10K", value: estimatedPaces["10K"] || "51:00" },
    { label: "Media Maratón (21.1K)", value: estimatedPaces["21K"] || "01:54:30" },
    { label: "Maratón Completa (42.2K)", value: estimatedPaces["42K"] || "04:05:00" }
  ];

  const stats = useMemo(() => {
    const isWeekFullyCompleted = (weekIndex: number) => {
      if (weekIndex < 0 || weekIndex >= plan.weeks.length) return false;
      const week = plan.weeks[weekIndex];
      const activeSessions = week.sessions.filter((s) => s.type !== "descanso");
      if (activeSessions.length === 0) return false;
      return activeSessions.every((s) => !!completedWorkouts[s.id]);
    };

    const completedSessions = Object.entries(completedWorkouts).map(([id]) => {
      let sessionType: "carrera" | "fuerza" | "descanso" | "movilidad" = "descanso";
      for (let wIdx = 0; wIdx < plan.weeks.length; wIdx++) {
        const week = plan.weeks[wIdx];
        const s = week.sessions.find((item) => item.id === id);
        if (s) {
          sessionType = s.type;
          break;
        }
      }
      return { type: sessionType };
    });

    const totalCompleted = completedSessions.length;
    const runningCompleted = completedSessions.filter((s) => s.type === "carrera").length;
    const strengthCompleted = completedSessions.filter((s) => s.type === "fuerza").length;
    const perfectWeeks = plan.weeks.filter((_, idx) => isWeekFullyCompleted(idx)).length;

    return {
      totalCompleted,
      runningCompleted,
      strengthCompleted,
      perfectWeeks
    };
  }, [completedWorkouts, plan]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-left">
      <div>
        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          Mi Perfil Fisiológico
        </h3>
        <p className="text-sm text-zinc-500 font-medium font-sans mt-2">
          Gestiona tus datos personales, métricas de rendimiento y marcas estimadas.
        </p>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          ¡Perfil actualizado con éxito! Los ritmos de entrenamiento se han recalculado.
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Estado físico
                </h4>
              </div>
              <p className="text-xs text-zinc-500 font-medium font-sans">
                Métricas principales
              </p>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-blue-600 transition cursor-pointer shadow-xs"
              >
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-rose-600 transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Undo className="w-3 h-3" />
                  Cancelar
                </button>

                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  Guardar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Edad
                </p>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-blue-600 font-bold"
                />
              ) : (
                <p className="text-xl font-bold text-zinc-900">{parsedAge} Años</p>
              )}
            </div>

            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Altura
                </p>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => setHeight(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-blue-600 font-bold"
                />
              ) : (
                <p className="text-xl font-bold text-zinc-900">{parsedHeight} cm</p>
              )}
            </div>

            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Peso
                </p>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-blue-600 font-bold"
                />
              ) : (
                <p className="text-xl font-bold text-zinc-900">{parsedWeight} kg</p>
              )}
            </div>

            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Sexo Biológico
                </p>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {(["M", "F"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`py-2 text-center rounded-lg border font-bold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                        sex === s
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                          : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600"
                      }`}
                    >
                      {s === "M" ? "Masc" : "Fem"}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xl font-bold text-zinc-900">
                  {sex === "M" ? "Masculino" : "Femenino"}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-sans">
                Composición Corporal Calculada
              </p>
            </div>
            <p className="text-lg font-bold text-blue-600 font-mono">
              IMC: {bmiData.bmi} ({bmiData.category})
            </p>
            <p className="text-[11px] text-zinc-500 font-medium mt-1 font-sans">
              Fórmula Estándar
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-sans">
              Programa y Objetivo
            </h4>
          </div>

          <div className="space-y-4 font-sans">
            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                Objetivo del plan
              </p>
              <p className="text-lg font-bold text-zinc-900">
                {getObjectiveLabel(onboarding.objective)}
              </p>
            </div>

            <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                Frecuencia seleccionada
              </p>
              <p className="text-lg font-bold text-zinc-900">
                {onboarding.frequency === "2_2" && "2 carrera + 2 fuerza"}
                {onboarding.frequency === "3_2" && "3 carrera + 2 fuerza"}
                {onboarding.frequency === "4_2" && "4 carrera + 2 fuerza"}
                {onboarding.frequency === "5_2" && "5 carrera + 2 fuerza"}
              </p>
            </div>

            {onboarding.activeInjury && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1">
                  Lesión Activa Reportada
                </p>
                <p className="text-sm text-zinc-800 font-medium">
                  Zonas con molestias: {onboarding.injuryAreas.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-sans">
            Predictor de Marcas Estimadas
          </h4>
        </div>

        <p className="text-xs text-zinc-500 font-medium leading-relaxed font-sans">
          Estimaciones calculadas mediante la fórmula de fatiga aeróbica de Riegel en base a tus datos de onboarding.
        </p>

        <div className="space-y-3 font-sans">
          {predictorItems.map(item => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
            >
              <span className="text-xs text-zinc-700 font-medium">
                {item.label}
              </span>
              <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs font-mono border border-blue-200">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 font-medium leading-relaxed font-sans">
            Estas marcas asumen que completas el plan entrenando de forma consistente y asimilando las descargas.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-sans">
            Estadísticas Personales
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 leading-none font-sans">
              Total Completados
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-zinc-900 font-mono">{stats.totalCompleted}</span>
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 leading-none font-sans">
              Entrenamientos Carrera
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-blue-600 font-mono">{stats.runningCompleted}</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 leading-none font-sans">
              Entrenamientos Fuerza
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-orange-600 font-mono">{stats.strengthCompleted}</span>
              <Dumbbell className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 leading-none font-sans">
              Semanas Perfectas
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-emerald-600 font-mono">{stats.perfectWeeks}</span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

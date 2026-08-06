import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { HyroxOnboardingData, HyroxObjective, HyroxTrainingPlan } from "./hyroxTypes";
import { STATION_LABELS } from "./hyroxLibrary";
import { calculateBMI } from "./hyroxEngine";
import { User, Activity, Check, Calendar, TrendingUp, Flag, Dumbbell } from "lucide-react";

interface HyroxProfileViewProps {
  onboarding: HyroxOnboardingData;
  plan: HyroxTrainingPlan;
  onUpdateProfile: (updated: HyroxOnboardingData) => void;
  completedWorkouts: Record<string, { feedback: string; rpe: number; date: string }>;
}

export default function HyroxProfileView({ onboarding, plan, onUpdateProfile, completedWorkouts }: HyroxProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState<string>(String(onboarding.age ?? ""));
  const [height, setHeight] = useState<string>(String(onboarding.height ?? ""));
  const [weight, setWeight] = useState<string>(String(onboarding.weight ?? ""));
  const [sex, setSex] = useState<"M" | "F">(onboarding.sex === "F" ? "F" : "M");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const cleanNumericInput = (value: string) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const getSafeNumber = (value: string, fallback: number) => {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const parsedAge = getSafeNumber(age, onboarding.age || 30);
  const parsedHeight = getSafeNumber(height, onboarding.height || 175);
  const parsedWeight = getSafeNumber(weight, onboarding.weight || 75);

  const handleSave = () => {
    onUpdateProfile({ ...onboarding, age: parsedAge, height: parsedHeight, weight: parsedWeight, sex });
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

  const getObjectiveLabel = (obj: HyroxObjective) => {
    switch (obj) {
      case HyroxObjective.PRIMERA_CARRERA:
        return "Mi Primera Carrera Hyrox";
      case HyroxObjective.MEJORAR_TIEMPO:
        return "Mejorar Mi Tiempo Hyrox";
      case HyroxObjective.BASE_GENERAL:
        return "Base de Fuerza y Acondicionamiento";
      default:
        return "Plan Hyrox";
    }
  };

  const stats = useMemo(() => {
    const isWeekFullyCompleted = (weekIndex: number) => {
      const week = plan.weeks[weekIndex];
      if (!week) return false;
      const active = week.sessions.filter(s => s.category !== "descanso");
      if (active.length === 0) return false;
      return active.every(s => !!completedWorkouts[s.id]);
    };

    let carrera = 0, fuerza = 0, acondicionamiento = 0, simulacion = 0;
    plan.weeks.forEach(week => {
      week.sessions.forEach(s => {
        if (!completedWorkouts[s.id] || s.category === "descanso") return;
        if (s.category === "carrera") carrera++;
        if (s.category === "fuerza") fuerza++;
        if (s.category === "acondicionamiento") acondicionamiento++;
        if (s.category === "simulacion") simulacion++;
      });
    });

    return {
      total: carrera + fuerza + acondicionamiento + simulacion,
      carrera,
      fuerza,
      acondicionamiento,
      simulacion,
      perfectWeeks: plan.weeks.filter((_, idx) => isWeekFullyCompleted(idx)).length
    };
  }, [completedWorkouts, plan]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-left">
      <div>
        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          Mi Perfil Hyrox
        </h3>
        <p className="text-sm text-zinc-500 font-medium mt-2">Gestiona tus datos personales y consulta tu progreso hacia tu objetivo.</p>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          ¡Perfil actualizado! Tu plan recalculará el diagnóstico con estos datos.
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Datos Físicos</h4>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleCancel} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  Cancelar
                </button>
                <button onClick={handleSave} className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 cursor-pointer">
                  Guardar
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Edad</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={e => setAge(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Sexo</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["M", "F"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`py-2.5 rounded-xl border font-black uppercase text-xs cursor-pointer transition ${
                        sex === s ? "bg-black border-black text-white" : "bg-white border-zinc-200/80 text-zinc-600"
                      }`}
                    >
                      {s === "M" ? "Masc" : "Fem"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Altura (cm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={height}
                  onChange={e => setHeight(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Peso (kg)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weight}
                  onChange={e => setWeight(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Edad</p>
                <p className="font-black text-zinc-900">{onboarding.age} años</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sexo</p>
                <p className="font-black text-zinc-900">{onboarding.sex === "F" ? "Femenino" : "Masculino"}</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Altura</p>
                <p className="font-black text-zinc-900">{onboarding.height} cm</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Peso</p>
                <p className="font-black text-zinc-900">{onboarding.weight} kg</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">IMC Actual</span>
            <span className="text-lg font-black text-blue-700">{bmiData.bmi} · {bmiData.category}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Tu Objetivo</h4>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
            <p className="text-base font-black text-zinc-900">{getObjectiveLabel(onboarding.objective)}</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">División: {onboarding.division.toUpperCase()}</p>
            {onboarding.raceDate && (
              <p className="text-xs text-zinc-500 font-medium mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Carrera el {new Date(onboarding.raceDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {onboarding.weakStations.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Estaciones a mejorar</p>
              <div className="flex flex-wrap gap-1.5">
                {onboarding.weakStations.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    {STATION_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Progreso Total</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
            <span className="text-2xl font-black text-zinc-900 font-mono">{stats.total}</span>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Entrenos</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
            <span className="text-2xl font-black text-blue-600 font-mono">{stats.carrera}</span>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Carrera</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
            <span className="text-2xl font-black text-purple-600 font-mono">{stats.fuerza}</span>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Fuerza</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
            <span className="text-2xl font-black text-orange-600 font-mono">{stats.acondicionamiento}</span>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Cond.</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
            <span className="text-2xl font-black text-emerald-600 font-mono">{stats.perfectWeeks}</span>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Semanas 100%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

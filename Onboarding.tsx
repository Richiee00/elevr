import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RunningObjective,
  ExperienceLevel,
  FrequencyOption,
  OnboardingData
} from "./types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Target,
  Settings,
  ShieldAlert,
  Flame,
  Heart,
  Activity
} from "lucide-react";

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onCancel: () => void;
  baseProfile?: { age: number; sex: "M" | "F"; height: number; weight: number };
  stepOffset?: number;
}

export default function Onboarding({ onComplete, onCancel, baseProfile, stepOffset = 0 }: OnboardingProps) {
  const firstStep = baseProfile ? 2 : 1;
  const [step, setStep] = useState<number>(firstStep);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const stepLabel = (n: number) => n + stepOffset;

  // State for onboarding data
  // Importante: estos campos son string para evitar bugs tipo 032, 0175 o volver a 0 al borrar.
  const [age, setAge] = useState<string>(baseProfile ? String(baseProfile.age) : "30");
  const [sex, setSex] = useState<"M" | "F">(baseProfile?.sex ?? "M");
  const [height, setHeight] = useState<string>(baseProfile ? String(baseProfile.height) : "175");
  const [weight, setWeight] = useState<string>(baseProfile ? String(baseProfile.weight) : "70");

  const [objective, setObjective] = useState<RunningObjective>(RunningObjective.PRIMER_10K);

  // Specific inputs
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(ExperienceLevel.INTERMEDIO_2K);
  const [time10K, setTime10K] = useState<string>("50:00");
  const [time21K, setTime21K] = useState<string>("01:55:00");
  const [vamTestDistance, setVamTestDistance] = useState<string>("");
  const [maxDistanceCurrent, setMaxDistanceCurrent] = useState<"less_5" | "5_10" | "10_15" | "more_15">("5_10");
  const [resistanceTarget, setResistanceTarget] = useState<"run_10k" | "run_15k" | "run_21k" | "general">("run_10k");

  // Frequency & Injuries
  const [frequency, setFrequency] = useState<FrequencyOption>(FrequencyOption.FREQ_3_2);
  const [activeInjury, setActiveInjury] = useState<boolean>(false);
  const [injuryAreas, setInjuryAreas] = useState<string[]>([]);
  const [injuryNotes, setInjuryNotes] = useState<string>("");

  useEffect(() => {
    if (objective === RunningObjective.PRIMER_10K && frequency === FrequencyOption.FREQ_5_2) {
      setFrequency(FrequencyOption.FREQ_3_2);
    }
  }, [objective, frequency]);

  const cleanNumericInput = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    return onlyDigits.replace(/^0+(?=\d)/, "");
  };

  const getSafeNumber = (value: string, fallback: number) => {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      const parsedAge = getSafeNumber(age, 30);
      const parsedHeight = getSafeNumber(height, 175);
      const parsedWeight = getSafeNumber(weight, 70);

      const data: OnboardingData = {
        age: parsedAge,
        sex,
        height: parsedHeight,
        weight: parsedWeight,
        objective,
        frequency,
        activeInjury,
        injuryAreas,
        injuryNotes: injuryNotes || undefined,
        vamTestDistance: vamTestDistance ? Number(vamTestDistance) : undefined,
        completedAt: new Date().toISOString()
      };

      if (objective === RunningObjective.PRIMER_10K) {
        data.experienceLevel = experienceLevel;
      } else if (objective === RunningObjective.MEJORAR_10K) {
        data.time10K = time10K;
      } else if (objective === RunningObjective.PRIMER_21K) {
        data.time10K = time10K;
      } else if (objective === RunningObjective.MEJORAR_21K) {
        data.time21K = time21K;
        data.time10K = time10K;
      } else if (objective === RunningObjective.MEJORAR_RITMO) {
        data.time10K = time10K;
      } else if (objective === RunningObjective.MEJORAR_RESISTENCIA) {
        data.maxDistanceCurrent = maxDistanceCurrent;
        data.resistanceTarget = resistanceTarget;
      }

      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > firstStep) {
      setStep(prev => prev - 1);
    } else {
      onCancel();
    }
  };

  const toggleInjuryArea = (area: string) => {
    if (injuryAreas.includes(area)) {
      setInjuryAreas(prev => prev.filter(a => a !== area));
    } else {
      setInjuryAreas(prev => [...prev, area]);
    }
  };

  const renderObjectiveCard = (objVal: RunningObjective, title: string, desc: string, icon: React.ReactNode) => {
    const isSelected = objective === objVal;

    return (
      <div
        onClick={() => setObjective(objVal)}
        className={`p-4 rounded-2xl border text-left cursor-pointer transition flex items-start gap-4 ${
          isSelected
            ? "bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm"
            : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-700"
        }`}
      >
        <div className={`p-2 rounded-xl ${isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>
          {icon}
        </div>
        <div>
          <h4 className={`font-black uppercase tracking-wide mb-1 text-xs sm:text-sm ${isSelected ? "text-blue-900" : "text-zinc-900"}`}>
            {title}
          </h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full text-zinc-800 relative py-2 sm:py-4">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                {stepLabel(1)}. PERFIL FISIOLÓGICO
              </h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Tu plan no será estático.
                  <span className="block font-bold text-blue-600 uppercase tracking-wider mt-0.5">Queremos conocerte mejor.</span>
                </p>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Conocer tu perfil nos permite adaptarlo a tu estado físico, nivel de energía, recuperación y progreso diario.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                  Edad (Años)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(cleanNumericInput(e.target.value))}
                  placeholder=""
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                  Sexo Biológico
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["M", "F"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`py-3 text-center rounded-xl border font-black uppercase tracking-wider text-xs transition cursor-pointer ${
                        sex === s
                          ? "bg-black border-black text-white"
                          : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
                      }`}
                    >
                      {s === "M" ? "Masc" : "Fem"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                  Altura (cm)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => setHeight(cleanNumericInput(e.target.value))}
                  placeholder=""
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                  Peso (kg)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(cleanNumericInput(e.target.value))}
                  placeholder=""
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                {stepLabel(2)}. OBJETIVO PRINCIPAL
              </h3>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                Selecciona la meta de entrenamiento que deseas abordar hoy. Esto determinará la lógica y estructura de tu plan completo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderObjectiveCard(
                RunningObjective.PRIMER_10K,
                "Preparar mi primer 10K",
                "Ideal si empiezas de 0 o quieres correr 10 km continuos por primera vez.",
                <Flame className="w-5 h-5" />
              )}

              {renderObjectiveCard(
                RunningObjective.MEJORAR_10K,
                "Mejorar mi marca 10K",
                "Si ya completas un 10K y buscas bajar tus tiempos con series y tempo.",
                <User className="w-5 h-5" />
              )}

              {renderObjectiveCard(
                RunningObjective.PRIMER_21K,
                "Preparar mi primer 21K",
                "Tu primera media maratón. Enfoque en volumen, fondo y asimilación gradual.",
                <Heart className="w-5 h-5" />
              )}

              {renderObjectiveCard(
                RunningObjective.MEJORAR_21K,
                "Mejorar mi marca 21K",
                "Para bajar de tiempo en 21.1 km con series de umbral y tiradas exigentes.",
                <Settings className="w-5 h-5" />
              )}

              {renderObjectiveCard(
                RunningObjective.MEJORAR_RITMO,
                "Mejorar ritmo de carrera",
                "Si quieres correr más rápido en distancias cortas e intermedias de forma general.",
                <Flame className="w-5 h-5" />
              )}

              {renderObjectiveCard(
                RunningObjective.MEJORAR_RESISTENCIA,
                "Mejorar resistencia general",
                "Si quieres aguantar más tiempo corriendo o acumular más base aeróbica.",
                <Activity className="w-5 h-5" />
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-blue-600" />
                {stepLabel(3)}. DATOS DE RENDIMIENTO
              </h3>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                Ajustemos las métricas específicas para tu objetivo:{" "}
                <strong className="text-blue-600 uppercase text-xs">
                  {String(objective).replace("_", " ")}
                </strong>.
              </p>
            </div>

            <div className="space-y-5">
              {objective === RunningObjective.PRIMER_10K && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                    ¿Cuál es tu nivel actual?
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { val: ExperienceLevel.PRINCIPIANTE_ZERO, label: "Principiante: Empiezo de 0 / Correr y caminar" },
                      { val: ExperienceLevel.INTERMEDIO_2K, label: "Intermedio: Puedo correr 2 km seguidos sin parar" },
                      { val: ExperienceLevel.AVANZADO_5K, label: "Avanzado: Puedo correr 5 km seguidos sin parar" }
                    ].map(x => (
                      <button
                        key={x.val}
                        type="button"
                        onClick={() => setExperienceLevel(x.val)}
                        className={`px-4 py-3.5 rounded-xl border text-left text-xs uppercase tracking-wider font-bold transition cursor-pointer flex justify-between items-center ${
                          experienceLevel === x.val
                            ? "bg-blue-50 border-blue-600 text-blue-900"
                            : "bg-white border-zinc-200/80 text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        {x.label}
                        {experienceLevel === x.val && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(objective === RunningObjective.MEJORAR_10K ||
                objective === RunningObjective.PRIMER_21K ||
                objective === RunningObjective.MEJORAR_RITMO) && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                    Tiempo actual en 10K (Formato mm:ss o hh:mm:ss)
                  </label>
                  <input
                    type="text"
                    value={time10K}
                    onChange={(e) => setTime10K(e.target.value)}
                    placeholder="e.g. 52:45"
                    className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-mono font-bold"
                  />
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                    Esto se usará para derivar tu velocidad actual promedio y estructurar tus ritmos de entrenamiento de series, tempo y tiradas largas.
                  </p>
                </div>
              )}

              {objective === RunningObjective.MEJORAR_21K && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                      Tiempo actual en 21K (hh:mm:ss)
                    </label>
                    <input
                      type="text"
                      value={time21K}
                      onChange={(e) => setTime21K(e.target.value)}
                      placeholder="e.g. 01:54:30"
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                      Tiempo actual en 10K (mm:ss)
                    </label>
                    <input
                      type="text"
                      value={time10K}
                      onChange={(e) => setTime10K(e.target.value)}
                      placeholder="e.g. 50:15"
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {objective === RunningObjective.MEJORAR_RESISTENCIA && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                      ¿Cuál es tu distancia máxima actual corriendo?
                    </label>
                    <select
                      value={maxDistanceCurrent}
                      onChange={(e) => setMaxDistanceCurrent(e.target.value as any)}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition cursor-pointer font-bold"
                    >
                      <option value="less_5">Menos de 5 km seguidos</option>
                      <option value="5_10">De 5 a 10 km seguidos</option>
                      <option value="10_15">De 10 a 15 km seguidos</option>
                      <option value="more_15">Más de 15 km seguidos</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                      ¿Qué objetivo de resistencia tienes?
                    </label>
                    <select
                      value={resistanceTarget}
                      onChange={(e) => setResistanceTarget(e.target.value as any)}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition cursor-pointer font-bold"
                    >
                      <option value="run_10k">Correr 10 km de forma continua</option>
                      <option value="run_15k">Correr 15 km de forma continua</option>
                      <option value="run_21k">Correr 21 km (Media maratón) por primera vez</option>
                      <option value="general">Mejorar resistencia cardiovascular general</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-2 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-between gap-2">
                  <span>Test de VAM (Velocidad Aeróbica Máxima) - Opcional</span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
                    Recomendado
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={vamTestDistance}
                  onChange={(e) => setVamTestDistance(cleanNumericInput(e.target.value))}
                  placeholder="Metros recorridos en 5 minutos (e.g. 1150)"
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                />
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Si has hecho un test de 5 minutos al máximo, introduce la distancia en metros. La app calculará tus zonas con precisión científica de laboratorio.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                {stepLabel(4)}. DISPONIBILIDAD Y LESIONES
              </h3>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                Ajustemos la frecuencia semanal de running e historial de molestias para evitar lesiones en tu plan.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                  Frecuencia Semanal de Running (+ Fuerza)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    { val: FrequencyOption.FREQ_2_2, label: "2 + 2", desc: "2 carrera + 2 fuerza" },
                    { val: FrequencyOption.FREQ_3_2, label: "3 + 2", desc: "3 carrera + 2 fuerza" },
                    { val: FrequencyOption.FREQ_4_2, label: "4 + 2", desc: "4 carrera + 2 fuerza" },
                    { val: FrequencyOption.FREQ_5_2, label: "5 + 2", desc: "5 carrera + 2 fuerza" }
                  ]
                    .filter(f => objective !== RunningObjective.PRIMER_10K || f.val !== FrequencyOption.FREQ_5_2)
                    .map(f => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => setFrequency(f.val)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        frequency === f.val
                          ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm"
                          : "bg-white border-zinc-200/80 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <span className="font-black text-base text-zinc-900">{f.label}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 font-medium leading-tight">{f.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  Todas las opciones incluyen por defecto 2 días de fuerza para potenciar tu economía de carrera y proteger tus articulaciones.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      ¿Tienes alguna lesión o dolor muscular/articular activo?
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-medium leading-normal">
                      Permite modular la intensidad de carga al inicio del plan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInjury(!activeInjury);
                      if (activeInjury) setInjuryAreas([]);
                    }}
                    className={`px-4 py-2 rounded-xl border font-bold uppercase tracking-wider text-[10px] cursor-pointer transition shrink-0 ${
                      activeInjury
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {activeInjury ? "SÍ, TENGO" : "NO, SANO"}
                  </button>
                </div>

                {activeInjury && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-3 border-t border-zinc-100"
                  >
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">
                      Selecciona las zonas sensibles o de molestias:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "rodilla",
                        "tobillo",
                        "cadera",
                        "gemelos",
                        "sóleo",
                        "aquiles",
                        "fascia_plantar",
                        "espalda",
                        "isquios"
                      ].map(area => {
                        const isSel = injuryAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleInjuryArea(area)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer transition ${
                              isSel
                                ? "bg-rose-500 text-white border-rose-500"
                                : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                            }`}
                          >
                            {area.replace("_", " ")}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      placeholder="Describe brevemente tus molestias actuales..."
                      value={injuryNotes}
                      onChange={(e) => setInjuryNotes(e.target.value)}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-600 transition h-16 resize-none font-medium"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-200/80">
        <button
          onClick={handleBack}
          className="px-5 py-3 rounded-xl border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-extrabold uppercase tracking-widest text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          {step === 4 ? "Generar Plan" : "Continuar"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

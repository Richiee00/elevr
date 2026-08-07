import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HyroxObjective,
  HyroxDivision,
  HyroxExperienceLevel,
  HyroxFrequencyOption,
  HyroxOnboardingData,
  HyroxStation
} from "./hyroxTypes";
import { STATION_LABELS, HYROX_STATIONS_ORDER } from "./hyroxLibrary";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Target,
  Gauge,
  Dumbbell,
  ShieldAlert
} from "lucide-react";

interface HyroxOnboardingProps {
  onComplete: (data: HyroxOnboardingData) => void;
  onCancel: () => void;
  baseProfile?: { age: number; sex: "M" | "F"; height: number; weight: number };
  stepOffset?: number;
}

export default function HyroxOnboarding({ onComplete, onCancel, baseProfile, stepOffset = 0 }: HyroxOnboardingProps) {
  const firstStep = baseProfile ? 2 : 1;
  const [step, setStep] = useState<number>(firstStep);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const stepLabel = (n: number) => n + stepOffset;

  const [age, setAge] = useState<string>(baseProfile ? String(baseProfile.age) : "30");
  const [sex, setSex] = useState<"M" | "F">(baseProfile?.sex ?? "M");
  const [height, setHeight] = useState<string>(baseProfile ? String(baseProfile.height) : "175");
  const [weight, setWeight] = useState<string>(baseProfile ? String(baseProfile.weight) : "75");

  const [objective, setObjective] = useState<HyroxObjective>(HyroxObjective.PRIMERA_CARRERA);
  const [division, setDivision] = useState<HyroxDivision>(HyroxDivision.OPEN);

  const [experienceLevel, setExperienceLevel] = useState<HyroxExperienceLevel>(HyroxExperienceLevel.INTERMEDIO);
  const [raceDate, setRaceDate] = useState<string>("");

  const [equipmentAccess, setEquipmentAccess] = useState<HyroxStation[]>([...HYROX_STATIONS_ORDER, "bike_erg", "general"]);
  const [weakStations, setWeakStations] = useState<HyroxStation[]>([]);

  const [frequency, setFrequency] = useState<HyroxFrequencyOption>(HyroxFrequencyOption.FREQ_3);
  const [activeInjury, setActiveInjury] = useState<boolean>(false);
  const [injuryAreas, setInjuryAreas] = useState<string[]>([]);
  const [injuryNotes, setInjuryNotes] = useState<string>("");

  const cleanNumericInput = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    return onlyDigits.replace(/^0+(?=\d)/, "");
  };

  const getSafeNumber = (value: string, fallback: number) => {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const toggleStationInList = (list: HyroxStation[], setList: (v: HyroxStation[]) => void, station: HyroxStation) => {
    if (list.includes(station)) {
      setList(list.filter(s => s !== station));
    } else {
      setList([...list, station]);
    }
  };

  const toggleInjuryArea = (area: string) => {
    if (injuryAreas.includes(area)) {
      setInjuryAreas(prev => prev.filter(a => a !== area));
    } else {
      setInjuryAreas(prev => [...prev, area]);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      const data: HyroxOnboardingData = {
        age: getSafeNumber(age, 30),
        sex,
        height: getSafeNumber(height, 175),
        weight: getSafeNumber(weight, 75),
        objective,
        division,
        experienceLevel,
        raceDate: raceDate || undefined,
        frequency,
        equipmentAccess,
        weakStations,
        activeInjury,
        injuryAreas,
        injuryNotes: injuryNotes || undefined,
        completedAt: new Date().toISOString()
      };
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

  const renderObjectiveCard = (objVal: HyroxObjective, title: string, desc: string) => {
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
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h4 className={`font-black uppercase tracking-wide mb-1 text-xs sm:text-sm ${isSelected ? "text-blue-900" : "text-zinc-900"}`}>
            {title}
          </h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">{desc}</p>
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
                  Tu plan Hyrox no será estático.
                </p>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Conocer tu perfil nos permite calibrar cargas de fuerza, máquinas y carrera a tu nivel real.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Edad (Años)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Sexo Biológico</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["M", "F"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`py-3 text-center rounded-xl border font-black uppercase tracking-wider text-xs transition cursor-pointer ${
                        sex === s ? "bg-black border-black text-white" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
                      }`}
                    >
                      {s === "M" ? "Masc" : "Fem"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Altura (cm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => setHeight(cleanNumericInput(e.target.value))}
                  className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Peso (kg)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(cleanNumericInput(e.target.value))}
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
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Selecciona la meta que quieres abordar. Esto determinará la estructura de tu plan completo.
              </p>
            </div>

            <div className="space-y-3">
              {renderObjectiveCard(HyroxObjective.PRIMERA_CARRERA, "Preparar mi primera carrera Hyrox", "Ideal si nunca has competido y quieres llegar a la línea de salida con garantías.")}
              {renderObjectiveCard(HyroxObjective.MEJORAR_TIEMPO, "Mejorar mi tiempo en Hyrox", "Si ya has competido y buscas bajar tu marca con series de umbral y estaciones específicas.")}
              {renderObjectiveCard(HyroxObjective.BASE_GENERAL, "Base de fuerza y acondicionamiento", "Sin carrera fijada. Quiero mejorar mi condición física funcional en general.")}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">División</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: HyroxDivision.OPEN, label: "Open" },
                  { val: HyroxDivision.PRO, label: "Pro" },
                  { val: HyroxDivision.DOUBLES, label: "Doubles" }
                ].map(d => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setDivision(d.val)}
                    className={`py-3 text-center rounded-xl border font-black uppercase tracking-wider text-xs transition cursor-pointer ${
                      division === d.val ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
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
                <Gauge className="w-5 h-5 text-blue-600" />
                {stepLabel(3)}. EXPERIENCIA Y FECHA
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Cuéntanos tu nivel actual de entrenamiento funcional y, si la tienes, la fecha de tu carrera.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { val: HyroxExperienceLevel.PRINCIPIANTE, label: "Principiante", desc: "Nunca he entrenado funcional / crossfit de forma estructurada." },
                { val: HyroxExperienceLevel.INTERMEDIO, label: "Intermedio", desc: "Entreno funcional regularmente pero no he competido en Hyrox." },
                { val: HyroxExperienceLevel.AVANZADO, label: "Avanzado", desc: "Ya he competido en Hyrox u oposiciones/pruebas similares." }
              ].map(x => (
                <button
                  key={x.val}
                  type="button"
                  onClick={() => setExperienceLevel(x.val)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-left transition cursor-pointer flex justify-between items-center gap-3 ${
                    experienceLevel === x.val ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-white border-zinc-200/80 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">{x.label}</span>
                    <span className="text-[11px] text-zinc-500 font-medium leading-relaxed">{x.desc}</span>
                  </div>
                  {experienceLevel === x.val && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-2 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-between gap-2">
                <span>Fecha de tu carrera Hyrox (Opcional)</span>
                <span className="text-[9px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-100">Recomendado</span>
              </label>
              <input
                type="date"
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
              />
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Si la indicas, calculamos la duración exacta del plan hasta esa fecha. Si no, generamos un bloque estándar de 8 semanas.
              </p>
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
                <Dumbbell className="w-5 h-5 text-blue-600" />
                {stepLabel(4)}. EQUIPO Y ESTACIONES
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Indica a qué equipamiento tienes acceso y en qué estaciones te sientes más débil.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Equipamiento disponible en tu gimnasio</label>
              <div className="flex flex-wrap gap-1.5">
                {HYROX_STATIONS_ORDER.filter(s => s !== "run").map(station => {
                  const isSel = equipmentAccess.includes(station);
                  return (
                    <button
                      key={station}
                      type="button"
                      onClick={() => toggleStationInList(equipmentAccess, setEquipmentAccess, station)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer transition ${
                        isSel ? "bg-blue-600 text-white border-blue-600" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {STATION_LABELS[station]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-3 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                ¿En qué estaciones te sientes más débil?
              </label>
              <p className="text-[11px] text-zinc-500 font-medium leading-normal">
                El motor priorizará entrenamientos que trabajen estas estaciones para nivelar tu rendimiento.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {HYROX_STATIONS_ORDER.map(station => {
                  const isSel = weakStations.includes(station);
                  return (
                    <button
                      key={station}
                      type="button"
                      onClick={() => toggleStationInList(weakStations, setWeakStations, station)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer transition ${
                        isSel ? "bg-rose-500 text-white border-rose-500" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {STATION_LABELS[station]}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                {stepLabel(5)}. FRECUENCIA Y LESIONES
              </h3>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                Ajustemos la frecuencia semanal e historial de molestias para evitar lesiones en tu plan.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Frecuencia Semanal de Entrenamiento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: HyroxFrequencyOption.FREQ_2, label: "2 días" },
                    { val: HyroxFrequencyOption.FREQ_3, label: "3 días" },
                    { val: HyroxFrequencyOption.FREQ_4, label: "4 días" },
                    { val: HyroxFrequencyOption.FREQ_5, label: "5 días" }
                  ].map(f => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => setFrequency(f.val)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        frequency === f.val ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <span className="font-black text-base text-zinc-900">{f.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  Repartimos automáticamente carrera, fuerza, acondicionamiento y simulación entre los días elegidos.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">¿Tienes alguna lesión o dolor activo?</h4>
                    <p className="text-[11px] text-zinc-500 font-medium leading-normal">Permite modular la intensidad de carga al inicio del plan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInjury(!activeInjury);
                      if (activeInjury) setInjuryAreas([]);
                    }}
                    className={`px-4 py-2 rounded-xl border font-bold uppercase tracking-wider text-[10px] cursor-pointer transition shrink-0 ${
                      activeInjury ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {activeInjury ? "SÍ, TENGO" : "NO, SANO"}
                  </button>
                </div>

                {activeInjury && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-3 border-t border-zinc-100">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Selecciona las zonas sensibles:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["rodilla", "tobillo", "hombro", "lumbar", "muñeca", "codo", "isquios", "cadera"].map(area => {
                        const isSel = injuryAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleInjuryArea(area)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer transition ${
                              isSel ? "bg-rose-500 text-white border-rose-500" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                            }`}
                          >
                            {area}
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
          {step === 5 ? "Generar Plan" : "Continuar"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

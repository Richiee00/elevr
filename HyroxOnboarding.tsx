import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HyroxDivision,
  HyroxExperienceLevel,
  HyroxFrequencyOption,
  HyroxGymType,
  HyroxLimitantType,
  HyroxObjective,
  HyroxOnboardingData,
  HyroxPerformanceData,
  HyroxRaceCategory,
  HyroxSessionDurationMin,
  HyroxStation,
  HyroxStationLimitingFactor,
  HyroxVAMTestResult
} from "./hyroxTypes";
import { STATION_LABELS, HYROX_STATIONS_ORDER } from "./hyroxLibrary";
import { calculateVAMFromTest, VAM_TEST_DURATION_MIN } from "./hyroxEngine";
import { WheelTimeInput } from "./WheelPicker";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Target,
  Gauge,
  Dumbbell,
  ShieldAlert,
  Flag,
  Timer,
  Compass
} from "lucide-react";

interface HyroxOnboardingProps {
  // El Test VAM viaja junto a los datos del onboarding cuando el objetivo es "Preparar mi primer
  // HYROX": es obligatorio en ese flujo (única forma de calcular un tiempo objetivo de carrera real
  // y ritmos de sesión reales, en vez de la tabla genérica de debutantes). Para el resto de
  // objetivos sigue siendo opcional y se puede hacer más tarde desde el Dashboard.
  onComplete: (data: HyroxOnboardingData, vamTest?: HyroxVAMTestResult) => void;
  onCancel: () => void;
  stepOffset?: number;
}

type StepKey = "objetivo" | "categoria" | "experiencia" | "fecha" | "rendimiento" | "camino" | "gimnasio" | "frecuencia_lesiones" | "vam" | "perfil";

const CAMINO_OBJECTIVES = [HyroxObjective.MEJORAR_ESTACIONES, HyroxObjective.VOLVER_PAUSA];

function getStepsForObjective(objective: HyroxObjective): StepKey[] {
  const steps: StepKey[] = ["objetivo"];
  if (objective !== HyroxObjective.BASE_GENERAL) steps.push("categoria");
  steps.push("experiencia");
  if (objective !== HyroxObjective.BASE_GENERAL) steps.push("fecha");
  if (objective === HyroxObjective.MEJORAR_MARCA) steps.push("rendimiento");
  else if (CAMINO_OBJECTIVES.includes(objective)) steps.push("camino");
  steps.push("gimnasio", "frecuencia_lesiones");
  if (objective === HyroxObjective.PRIMERA_CARRERA) steps.push("vam");
  steps.push("perfil");
  return steps;
}

const STEP_TITLES: Record<StepKey, string> = {
  objetivo: "OBJETIVO PRINCIPAL",
  categoria: "CATEGORÍA DE COMPETICIÓN",
  experiencia: "EXPERIENCIA Y ACTIVIDAD",
  fecha: "FECHA DE COMPETICIÓN",
  rendimiento: "DATOS DE RENDIMIENTO",
  camino: "TU SITUACIÓN ACTUAL",
  gimnasio: "TU GIMNASIO",
  frecuencia_lesiones: "FRECUENCIA Y LESIONES",
  vam: "TEST VAM (OBLIGATORIO)",
  perfil: "PERFIL FISIOLÓGICO"
};

// Las categorías de dobles se retiraron: no había tabla de tiempos real que las respaldara.
const RACE_CATEGORY_OPTIONS: Array<{ val: HyroxRaceCategory; label: string; group: string }> = [
  { val: "open_masculina", label: "Open Masculina", group: "Open" },
  { val: "open_femenina", label: "Open Femenina", group: "Open" },
  { val: "pro_masculina", label: "Pro Masculina", group: "Pro" },
  { val: "pro_femenina", label: "Pro Femenina", group: "Pro" }
];

function deriveDivision(category: HyroxRaceCategory): HyroxDivision {
  if (category.startsWith("pro")) return HyroxDivision.PRO;
  return HyroxDivision.OPEN;
}

const OBJECTIVE_OPTIONS: Array<{ val: HyroxObjective; title: string; desc: string }> = [
  { val: HyroxObjective.PRIMERA_CARRERA, title: "Preparar mi primer HYROX", desc: "Nunca he competido. Quiero llegar a la línea de salida con garantías." },
  { val: HyroxObjective.MEJORAR_MARCA, title: "Mejorar mi marca en HYROX", desc: "Ya he competido y tengo mis tiempos. Quiero bajar mi tiempo total." },
  { val: HyroxObjective.MEJORAR_ESTACIONES, title: "Mejorar las estaciones funcionales", desc: "Las estaciones me cuestan más que la carrera." },
  { val: HyroxObjective.MEJORAR_TRANSICIONES, title: "Mejorar las transiciones", desc: "Pierdo mucho tiempo al entrar y salir de cada estación." },
  { val: HyroxObjective.VOLVER_PAUSA, title: "Volver a entrenar tras una pausa", desc: "He estado un tiempo parado y quiero retomar con cabeza." },
  { val: HyroxObjective.BASE_GENERAL, title: "Base de fuerza y resistencia", desc: "Sin carrera fijada. Quiero mejorar mi condición física de base." }
];

function formatEUDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  let out = day;
  if (month) out += "/" + month;
  if (year) out += "/" + year;
  return out;
}

function parseEUDateToISO(value: string): string | undefined {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function ThreeTierSelector<T extends string>({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ val: T; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map(o => (
          <button
            key={o.val}
            type="button"
            onClick={() => onChange(o.val)}
            className={`py-2.5 text-center rounded-xl border font-bold uppercase tracking-wider text-[11px] transition cursor-pointer ${
              value === o.val ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Input de tiempo por celdas (hh/mm/ss o mm/ss): el usuario nunca escribe ":", solo rellena cada celda.
export function SegmentedTimeInput({
  label,
  value,
  onChange,
  mode = "ms"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mode?: "ms" | "hms";
}) {
  const segments: Array<"h" | "m" | "s"> = mode === "hms" ? ["h", "m", "s"] : ["m", "s"];
  const raw = value ? value.split(":") : [];
  const cellValues: string[] =
    mode === "hms"
      ? raw.length === 3
        ? raw
        : raw.length === 2
        ? ["", raw[0], raw[1]]
        : ["", "", ""]
      : raw.length === 2
      ? raw
      : raw.length === 3
      ? [raw[1], raw[2]]
      : ["", ""];

  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (idx: number, next: string) => {
    const digits = next.replace(/\D/g, "").slice(0, 2);
    const updated = [...cellValues];
    updated[idx] = digits;
    onChange(updated.join(":"));
    if (digits.length === 2 && idx < segments.length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && cellValues[idx] === "" && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const segmentLabel: Record<"h" | "m" | "s", string> = { h: "h", m: "m", s: "s" };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">{label}</label>
      <div className="flex items-center gap-1">
        {segments.map((seg, idx) => (
          <React.Fragment key={seg}>
            {idx > 0 && <span className="text-zinc-400 font-bold pb-4">:</span>}
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <input
                ref={el => (refs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                value={cellValues[idx]}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                placeholder="00"
                maxLength={2}
                className="w-full bg-white border border-zinc-200/80 rounded-xl px-1 py-2.5 text-center text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold font-mono text-sm"
              />
              <span className="text-[9px] text-zinc-400 font-bold uppercase">{segmentLabel[seg]}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function HyroxOnboarding({ onComplete, onCancel, stepOffset = 0 }: HyroxOnboardingProps) {
  const [objective, setObjective] = useState<HyroxObjective>(HyroxObjective.PRIMERA_CARRERA);
  const steps = useMemo(() => getStepsForObjective(objective), [objective]);
  const [stepIdx, setStepIdx] = useState(0);
  const stepKey = steps[stepIdx];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stepIdx]);

  useEffect(() => {
    // Si cambia el objetivo y el paso actual ya no existe en la nueva secuencia, volvemos al principio del contenido restante.
    setStepIdx(prev => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  const stepLabel = (n: number) => n + stepOffset;

  const [raceCategory, setRaceCategory] = useState<HyroxRaceCategory>("open_masculina");
  const [experienceLevel, setExperienceLevel] = useState<HyroxExperienceLevel>(HyroxExperienceLevel.INTERMEDIO);
  const [runningExperience, setRunningExperience] = useState<HyroxExperienceLevel>(HyroxExperienceLevel.INTERMEDIO);
  const [strengthExperience, setStrengthExperience] = useState<HyroxExperienceLevel>(HyroxExperienceLevel.INTERMEDIO);
  const [dailyActivityLevel, setDailyActivityLevel] = useState<"sedentario" | "moderado" | "activo">("moderado");
  const [raceDateInput, setRaceDateInput] = useState<string>("");

  // Rendimiento (solo MEJORAR_MARCA)
  const [totalTime, setTotalTime] = useState("");
  const [runSplits, setRunSplits] = useState<string[]>(Array(8).fill(""));
  const [skiErg, setSkiErg] = useState("");
  const [sledPush, setSledPush] = useState("");
  const [sledPull, setSledPull] = useState("");
  const [burpeeBroadJump, setBurpeeBroadJump] = useState("");
  const [row, setRow] = useState("");
  const [farmersCarry, setFarmersCarry] = useState("");
  const [sandbagLunges, setSandbagLunges] = useState("");
  const [wallBalls, setWallBalls] = useState("");
  const [roxzoneTotal, setRoxzoneTotal] = useState("");

  // Camino cualitativo (resto de objetivos)
  const [estacionesTipo, setEstacionesTipo] = useState<HyroxStationLimitingFactor>("fuerza");
  const [breakDuration, setBreakDuration] = useState<"menos_1_mes" | "1_3_meses" | "mas_3_meses">("1_3_meses");
  const [weakStationsSelfReported, setWeakStationsSelfReported] = useState<HyroxStation[]>([]);

  const [gymType, setGymType] = useState<HyroxGymType>("especializado");
  const [frequency, setFrequency] = useState<HyroxFrequencyOption>(HyroxFrequencyOption.FREQ_3);
  const [sessionDurationMin, setSessionDurationMin] = useState<HyroxSessionDurationMin>(60);
  const [activeInjury, setActiveInjury] = useState(false);
  const [injuryAreas, setInjuryAreas] = useState<string[]>([]);
  const [injuryNotes, setInjuryNotes] = useState("");

  // Test VAM (solo Objetivo 1: "Preparar mi primer HYROX", ver getStepsForObjective).
  const [vamTestDistance, setVamTestDistance] = useState("");

  const [age, setAge] = useState("30");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("75");

  const cleanNumericInput = (value: string) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const getSafeNumber = (value: string, fallback: number) => {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const toggleInjuryArea = (area: string) => {
    setInjuryAreas(prev => (prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]));
  };

  const toggleWeakStation = (station: HyroxStation) => {
    setWeakStationsSelfReported(prev => (prev.includes(station) ? prev.filter(s => s !== station) : [...prev, station]));
  };

  const vamMeters = Number(vamTestDistance);
  const isVamStepValid = vamTestDistance.trim() !== "" && vamMeters > 0;

  const handleNext = () => {
    if (stepKey === "vam" && !isVamStepValid) return;

    if (stepIdx < steps.length - 1) {
      setStepIdx(prev => prev + 1);
      return;
    }

    // El limitante real para "Mejorar estaciones" se deriva más adelante (detectHyroxLimitant) a partir
    // de weakStationsSelfReported con la prioridad fija del cerebro; aquí solo guardamos el descriptor
    // cualitativo (stationLimitingFactor) que el usuario reportó.
    let selfReportedLimitant: HyroxLimitantType | undefined;
    if (objective === HyroxObjective.MEJORAR_TRANSICIONES) selfReportedLimitant = "transiciones";

    const performance: HyroxPerformanceData | undefined =
      objective === HyroxObjective.MEJORAR_MARCA
        ? { totalTime, runSplits, skiErg, sledPush, sledPull, burpeeBroadJump, row, farmersCarry, sandbagLunges, wallBalls, roxzoneTotal }
        : undefined;

    const data: HyroxOnboardingData = {
      age: getSafeNumber(age, 30),
      sex,
      height: getSafeNumber(height, 175),
      weight: getSafeNumber(weight, 75),
      objective,
      raceCategory,
      division: deriveDivision(raceCategory),
      experienceLevel,
      runningExperience,
      strengthExperience,
      dailyActivityLevel,
      raceDate: parseEUDateToISO(raceDateInput),
      gymType,
      frequency,
      sessionDurationMin,
      performance,
      selfReportedLimitant,
      stationLimitingFactor: objective === HyroxObjective.MEJORAR_ESTACIONES ? estacionesTipo : undefined,
      weakStationsSelfReported: objective === HyroxObjective.MEJORAR_ESTACIONES ? weakStationsSelfReported : undefined,
      breakDuration: objective === HyroxObjective.VOLVER_PAUSA ? breakDuration : undefined,
      activeInjury,
      injuryAreas,
      injuryNotes: injuryNotes || undefined,
      completedAt: new Date().toISOString()
    };

    if (objective === HyroxObjective.PRIMERA_CARRERA && isVamStepValid) {
      const { vamKmH, vamPaceMinKm } = calculateVAMFromTest(vamMeters);
      const vamTest: HyroxVAMTestResult = { distanceMeters: vamMeters, vamKmH, vamPaceMinKm, completedAt: new Date().toISOString() };
      onComplete(data, vamTest);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) setStepIdx(prev => prev - 1);
    else onCancel();
  };

  const displayNumber = stepLabel(stepIdx + 1);

  const renderObjectiveCard = (opt: { val: HyroxObjective; title: string; desc: string }) => {
    const isSelected = objective === opt.val;
    return (
      <div
        key={opt.val}
        onClick={() => setObjective(opt.val)}
        className={`p-4 rounded-2xl border text-left cursor-pointer transition flex items-start gap-4 ${
          isSelected ? "bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-700"
        }`}
      >
        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h4 className={`font-black uppercase tracking-wide mb-1 text-xs sm:text-sm ${isSelected ? "text-blue-900" : "text-zinc-900"}`}>{opt.title}</h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">{opt.desc}</p>
        </div>
      </div>
    );
  };

  const stepIcon: Record<StepKey, React.ReactNode> = {
    objetivo: <Target className="w-5 h-5 text-blue-600" />,
    categoria: <Flag className="w-5 h-5 text-blue-600" />,
    experiencia: <Gauge className="w-5 h-5 text-blue-600" />,
    fecha: <Timer className="w-5 h-5 text-blue-600" />,
    rendimiento: <Gauge className="w-5 h-5 text-blue-600" />,
    camino: <Compass className="w-5 h-5 text-blue-600" />,
    gimnasio: <Dumbbell className="w-5 h-5 text-blue-600" />,
    frecuencia_lesiones: <ShieldAlert className="w-5 h-5 text-blue-600" />,
    vam: <Gauge className="w-5 h-5 text-blue-600" />,
    perfil: <User className="w-5 h-5 text-blue-600" />
  };

  return (
    <div className="w-full text-zinc-800 relative py-2 sm:py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
              {stepIcon[stepKey]}
              {displayNumber}. {STEP_TITLES[stepKey]}
            </h3>
          </div>

          {stepKey === "objetivo" && (
            <>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Selecciona la meta que quieres abordar. Esto determinará la estructura de tu plan completo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{OBJECTIVE_OPTIONS.map(renderObjectiveCard)}</div>
            </>
          )}

          {stepKey === "categoria" && (
            <>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Indica la categoría de competición. La usamos para calcular tu diagnóstico y tiempos objetivo con precisión.
              </p>
              {["Open", "Pro"].map(group => (
                <div key={group} className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">{group}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {RACE_CATEGORY_OPTIONS.filter(o => o.group === group).map(o => (
                      <button
                        key={o.val}
                        type="button"
                        onClick={() => setRaceCategory(o.val)}
                        className={`py-2.5 px-2 text-center rounded-xl border font-bold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                          raceCategory === o.val ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {stepKey === "experiencia" && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Cuéntanos tu nivel actual. El motor calibra la carga inicial según tu experiencia real, no solo los años entrenando.
              </p>
              <ThreeTierSelector
                label="Experiencia en HYROX"
                value={experienceLevel}
                onChange={setExperienceLevel}
                options={[
                  { val: HyroxExperienceLevel.PRINCIPIANTE, label: "Principiante" },
                  { val: HyroxExperienceLevel.INTERMEDIO, label: "Intermedio" },
                  { val: HyroxExperienceLevel.AVANZADO, label: "Avanzado" }
                ]}
              />
              <ThreeTierSelector
                label="Experiencia en running"
                value={runningExperience}
                onChange={setRunningExperience}
                options={[
                  { val: HyroxExperienceLevel.PRINCIPIANTE, label: "Principiante" },
                  { val: HyroxExperienceLevel.INTERMEDIO, label: "Intermedio" },
                  { val: HyroxExperienceLevel.AVANZADO, label: "Avanzado" }
                ]}
              />
              <ThreeTierSelector
                label="Experiencia en fuerza"
                value={strengthExperience}
                onChange={setStrengthExperience}
                options={[
                  { val: HyroxExperienceLevel.PRINCIPIANTE, label: "Principiante" },
                  { val: HyroxExperienceLevel.INTERMEDIO, label: "Intermedio" },
                  { val: HyroxExperienceLevel.AVANZADO, label: "Avanzado" }
                ]}
              />
              <ThreeTierSelector
                label="Nivel de actividad diaria"
                value={dailyActivityLevel}
                onChange={setDailyActivityLevel}
                options={[
                  { val: "sedentario", label: "Sedentario" },
                  { val: "moderado", label: "Moderado" },
                  { val: "activo", label: "Activo" }
                ]}
              />
            </div>
          )}

          {stepKey === "fecha" && (
            <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-2 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-between gap-2">
                <span>Fecha de tu carrera Hyrox (Opcional)</span>
                <span className="text-[9px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-100">Recomendado</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={raceDateInput}
                onChange={e => setRaceDateInput(formatEUDateInput(e.target.value))}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold font-mono"
              />
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Calculamos la duración exacta del plan hasta esa fecha, incluyendo la semana de taper. Sin fecha, generamos un bloque estándar de 8 semanas.
              </p>
            </div>
          )}

          {stepKey === "rendimiento" && (
            <div className="space-y-6">
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Con tus tiempos reales podemos detectar tu limitante principal comparándolos con la tabla de referencia de tu categoría. Desliza cada rueda hasta tu tiempo.
              </p>
              <WheelTimeInput label="Tiempo total Hyrox" value={totalTime} onChange={setTotalTime} mode="hms" />
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Splits de carrera (8 x 1 km)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2">
                  {runSplits.map((s, i) => (
                    <div key={i}>
                      <WheelTimeInput
                        label={`Km ${i + 1}`}
                        value={s}
                        onChange={v => setRunSplits(prev => prev.map((val, idx) => (idx === i ? v : val)))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <WheelTimeInput label="Ski Erg" value={skiErg} onChange={setSkiErg} />
                <WheelTimeInput label="Sled Push" value={sledPush} onChange={setSledPush} />
                <WheelTimeInput label="Sled Pull" value={sledPull} onChange={setSledPull} />
                <WheelTimeInput label="Burpee Broad Jump" value={burpeeBroadJump} onChange={setBurpeeBroadJump} />
                <WheelTimeInput label="Row" value={row} onChange={setRow} />
                <WheelTimeInput label="Farmers Carry" value={farmersCarry} onChange={setFarmersCarry} />
                <WheelTimeInput label="Sandbag Lunges" value={sandbagLunges} onChange={setSandbagLunges} />
                <WheelTimeInput label="Wall Balls" value={wallBalls} onChange={setWallBalls} />
              </div>
              <WheelTimeInput label="Tiempo total de transiciones (Roxzone)" value={roxzoneTotal} onChange={setRoxzoneTotal} />
            </div>
          )}

          {stepKey === "camino" && (
            <div className="space-y-5">
              {objective === HyroxObjective.MEJORAR_ESTACIONES && (
                <>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">¿Qué tipo de dificultad notas más en las estaciones?</p>
                  <div className="space-y-2.5">
                    {[
                      { val: "fuerza" as HyroxStationLimitingFactor, label: "Fuerza", desc: "Sled Push/Pull o Farmers Carry se me hacen muy pesados." },
                      { val: "fuerza_resistencia" as HyroxStationLimitingFactor, label: "Resistencia muscular", desc: "Puedo hacer la estación, pero no repetir el esfuerzo (Wall Balls, Burpees)." },
                      { val: "tecnica" as HyroxStationLimitingFactor, label: "Técnica", desc: "Pierdo eficiencia por la forma de ejecutar el movimiento." },
                      { val: "fatiga_muscular" as HyroxStationLimitingFactor, label: "Fatiga muscular", desc: "Empiezo bien, pero me vengo abajo con la fatiga acumulada." },
                      { val: "falta_estrategia" as HyroxStationLimitingFactor, label: "Falta de estrategia", desc: "No sé fraccionar bien los esfuerzos ni gestionar las pausas." },
                      { val: "no_lo_se" as HyroxStationLimitingFactor, label: "No lo sé", desc: "No tengo claro cuál es mi mayor dificultad en estaciones." }
                    ].map(o => (
                      <button
                        key={o.val}
                        type="button"
                        onClick={() => setEstacionesTipo(o.val)}
                        className={`w-full px-4 py-3.5 rounded-xl border text-left transition cursor-pointer flex justify-between items-center gap-3 ${
                          estacionesTipo === o.val ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-white border-zinc-200/80 text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider block">{o.label}</span>
                          <span className="text-[11px] text-zinc-500 font-medium leading-relaxed">{o.desc}</span>
                        </div>
                        {estacionesTipo === o.val && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">¿Qué estaciones concretas te cuestan más?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {HYROX_STATIONS_ORDER.filter(s => s !== "run").map(station => {
                        const isSel = weakStationsSelfReported.includes(station);
                        return (
                          <button
                            key={station}
                            type="button"
                            onClick={() => toggleWeakStation(station)}
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
                </>
              )}

              {objective === HyroxObjective.VOLVER_PAUSA && (
                <>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">¿Cuánto tiempo llevas sin entrenar de forma regular?</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { val: "menos_1_mes" as const, label: "Menos de 1 mes" },
                      { val: "1_3_meses" as const, label: "Entre 1 y 3 meses" },
                      { val: "mas_3_meses" as const, label: "Más de 3 meses" }
                    ].map(o => (
                      <button
                        key={o.val}
                        type="button"
                        onClick={() => setBreakDuration(o.val)}
                        className={`py-3 px-4 text-left rounded-xl border font-bold uppercase tracking-wider text-xs transition cursor-pointer ${
                          breakDuration === o.val ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {stepKey === "gimnasio" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Si tu gimnasio no tiene equipamiento oficial de Hyrox, adaptamos automáticamente cada ejercicio por su sustituto más parecido.
              </p>
              {[
                { val: "especializado" as HyroxGymType, label: "Gimnasio especializado Hyrox", desc: "Tengo acceso a trineo, Ski Erg, Wall Balls, Row, Farmers, Sandbag..." },
                { val: "convencional" as HyroxGymType, label: "Gimnasio convencional", desc: "Gimnasio normal, sin estaciones oficiales de Hyrox." }
              ].map(o => (
                <button
                  key={o.val}
                  type="button"
                  onClick={() => setGymType(o.val)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-left transition cursor-pointer flex justify-between items-center gap-3 ${
                    gymType === o.val ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-white border-zinc-200/80 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">{o.label}</span>
                    <span className="text-[11px] text-zinc-500 font-medium leading-relaxed">{o.desc}</span>
                  </div>
                  {gymType === o.val && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {stepKey === "frecuencia_lesiones" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Frecuencia Semanal de Entrenamiento</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { val: HyroxFrequencyOption.FREQ_2, label: "2 días" },
                    { val: HyroxFrequencyOption.FREQ_3, label: "3 días" },
                    { val: HyroxFrequencyOption.FREQ_4, label: "4 días" },
                    { val: HyroxFrequencyOption.FREQ_5, label: "5 días" },
                    { val: HyroxFrequencyOption.FREQ_6, label: "6 días" }
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
                {frequency === HyroxFrequencyOption.FREQ_6 && (
                  <p className="text-[11px] text-amber-600 leading-relaxed font-bold">
                    6 días/semana solo se recomienda con buena recuperación, alta adherencia y experiencia suficiente.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Duración máxima por sesión</label>
                <div className="grid grid-cols-3 gap-2">
                  {[45, 60, 90].map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setSessionDurationMin(min as HyroxSessionDurationMin)}
                      className={`py-3 text-center rounded-xl border font-black uppercase tracking-wider text-xs transition cursor-pointer ${
                        sessionDurationMin === min ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-600"
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">¿Tienes alguna lesión o dolor activo?</h4>
                    <p className="text-[11px] text-zinc-500 font-medium leading-normal">Permite modular la intensidad de carga al inicio del plan.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveInjury(false);
                        setInjuryAreas([]);
                      }}
                      className={`px-4 py-2 rounded-xl border font-bold uppercase tracking-wider text-[10px] cursor-pointer transition ${
                        !activeInjury ? "bg-black border-black text-white" : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInjury(true)}
                      className={`px-4 py-2 rounded-xl border font-bold uppercase tracking-wider text-[10px] cursor-pointer transition ${
                        activeInjury ? "bg-rose-600 border-rose-600 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      Sí
                    </button>
                  </div>
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
                      onChange={e => setInjuryNotes(e.target.value)}
                      className="w-full bg-white border border-zinc-200/80 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-blue-600 transition h-16 resize-none font-medium"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {stepKey === "vam" && (
            <div className="space-y-6">
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Es la única forma de calcular un tiempo objetivo de carrera real y ritmos de entrenamiento reales,
                en vez de una tabla genérica para tu categoría. Sin este dato, tu diagnóstico inicial usará un rango
                más amplio y menos preciso.
              </p>
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 space-y-4 shadow-sm">
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                  Corre al máximo esfuerzo que puedas sostener durante{" "}
                  <span className="font-bold text-zinc-900">{VAM_TEST_DURATION_MIN} minutos</span> (pista, cinta o
                  exterior llano) y registra la distancia total recorrida. Si nunca has corrido, puedes alternar
                  carrera y caminata: lo importante es dar tu máximo esfuerzo sostenible.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Distancia recorrida (metros)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={vamTestDistance}
                    onChange={e => setVamTestDistance(cleanNumericInput(e.target.value))}
                    placeholder="Ej. 1150"
                    className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  Podrás repetir este test más adelante desde el Dashboard para mantener tus tiempos y ritmos siempre actualizados.
                </p>
              </div>
            </div>
          )}

          {stepKey === "perfil" && (
            <div className="space-y-6">
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Conocer tu perfil nos permite calibrar cargas de fuerza, máquinas y carrera a tu nivel real.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Edad (Años)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={age}
                    onChange={e => setAge(cleanNumericInput(e.target.value))}
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
                    onChange={e => setHeight(cleanNumericInput(e.target.value))}
                    className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block">Peso (kg)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={weight}
                    onChange={e => setWeight(cleanNumericInput(e.target.value))}
                    className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
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
          disabled={stepKey === "vam" && !isVamStepValid}
          className={`px-6 py-3 rounded-xl font-extrabold uppercase tracking-widest text-xs transition flex items-center gap-1.5 shadow-md ${
            stepKey === "vam" && !isVamStepValid
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : "bg-black hover:bg-zinc-800 text-white cursor-pointer"
          }`}
        >
          {stepIdx === steps.length - 1 ? "Generar Plan" : "Continuar"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { HyroxDailyInput } from "./hyroxEngine";
import { BrainCircuit, Check } from "lucide-react";

function getSleepQualityColor(q: "bueno" | "normal" | "malo", isSelected: boolean): string {
  if (!isSelected) return "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700";
  if (q === "bueno") return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
  if (q === "normal") return "bg-blue-600 text-white border-blue-600 shadow-sm";
  return "bg-rose-600 text-white border-rose-600 shadow-sm";
}

function getScale1to5Color(val: number, isSelected: boolean): string {
  if (!isSelected) return "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700";
  if (val === 1 || val === 2) return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
  if (val === 3) return "bg-blue-600 text-white border-blue-600 shadow-sm";
  if (val === 4) return "bg-orange-500 text-white border-orange-500 shadow-sm";
  return "bg-rose-600 text-white border-rose-600 shadow-sm";
}

interface HyroxReadinessCardProps {
  onSave: (input: HyroxDailyInput) => void;
}

export default function HyroxReadinessCard({ onSave }: HyroxReadinessCardProps) {
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState<"bueno" | "normal" | "malo">("normal");
  const [stress, setStress] = useState(2);
  const [fatigueGeneral, setFatigueGeneral] = useState(2);
  const [musclePain, setMusclePain] = useState(1);
  const [jointPain, setJointPain] = useState(0);
  const [jointPainType, setJointPainType] = useState<"articular_tendinoso" | "nervioso" | "ninguno">("ninguno");
  const [motivation, setMotivation] = useState(4);
  const [prevRPE, setPrevRPE] = useState(6);

  const handleSave = () => {
    onSave({
      date: new Date().toISOString().split("T")[0],
      sleepHours,
      sleepQuality,
      stress,
      fatigueGeneral,
      musclePain,
      jointPain,
      jointPainType: jointPain > 0 ? jointPainType : "ninguno",
      motivation,
      prevRPE
    });
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-blue-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">¿Cómo te encuentras hoy?</h4>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Horas de sueño: {sleepHours}h</label>
        <input type="range" min={3} max={10} value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))} className="w-full cursor-pointer" />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Calidad del sueño</label>
        <div className="grid grid-cols-3 gap-2">
          {(["bueno", "normal", "malo"] as const).map(q => (
            <button
              key={q}
              onClick={() => setSleepQuality(q)}
              className={`py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${getSleepQualityColor(q, sleepQuality === q)}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Estrés</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} onClick={() => setStress(v)} className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${getScale1to5Color(v, stress === v)}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Fatiga general</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              onClick={() => setFatigueGeneral(v)}
              className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${getScale1to5Color(v, fatigueGeneral === v)}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Motivación</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              onClick={() => setMotivation(v)}
              className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${getScale1to5Color(6 - v, motivation === v)}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Dolor muscular (0-10): {musclePain}</label>
        <input type="range" min={0} max={10} value={musclePain} onChange={e => setMusclePain(Number(e.target.value))} className="w-full cursor-pointer" />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Dolor articular o tendinoso (0-10): {jointPain}</label>
        <input type="range" min={0} max={10} value={jointPain} onChange={e => setJointPain(Number(e.target.value))} className="w-full cursor-pointer" />
        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
          Este dolor no se compensa con buen sueño o baja fatiga: bloquea la sesión de forma independiente si es relevante.
        </p>
      </div>

      {jointPain > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Tipo de dolor</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { val: "articular_tendinoso" as const, label: "Articular / tendinoso" },
              { val: "nervioso" as const, label: "Nervioso (hormigueo, pérdida de fuerza)" }
            ]).map(o => (
              <button
                key={o.val}
                onClick={() => setJointPainType(o.val)}
                className={`py-2.5 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                  jointPainType === o.val ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">RPE del último entreno: {prevRPE}/10</label>
        <input type="range" min={1} max={10} value={prevRPE} onChange={e => setPrevRPE(Number(e.target.value))} className="w-full cursor-pointer" />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Check className="w-4 h-4" />
        Guardar Readiness de Hoy
      </button>
    </div>
  );
}

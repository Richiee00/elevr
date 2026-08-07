import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, User } from "lucide-react";

export interface BaseProfile {
  age: number;
  sex: "M" | "F";
  height: number;
  weight: number;
}

interface ProfileStepProps {
  onNext: (profile: BaseProfile) => void;
  onBack: () => void;
}

export default function ProfileStep({ onNext, onBack }: ProfileStepProps) {
  const [age, setAge] = useState<string>("30");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [height, setHeight] = useState<string>("175");
  const [weight, setWeight] = useState<string>("70");

  const cleanNumericInput = (value: string) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const getSafeNumber = (value: string, fallback: number) => {
    if (value.trim() === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const handleNext = () => {
    onNext({
      age: getSafeNumber(age, 30),
      sex,
      height: getSafeNumber(height, 175),
      weight: getSafeNumber(weight, 70)
    });
  };

  return (
    <div className="w-full text-zinc-800 relative py-2 sm:py-4">
      <motion.div
        key="profile-step"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-blue-600" />
            1. PERFIL FISIOLÓGICO
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

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-200/80">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-extrabold uppercase tracking-widest text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Zap, Compass, Dumbbell, HeartPulse } from "lucide-react";

export type Discipline = "running" | "hyrox" | "gym" | "salud";

interface DisciplineSelectProps {
  onSelect: (discipline: Discipline) => void;
  onBack: () => void;
}

const OPTIONS: Array<{ val: Discipline; title: string; desc: string; icon: React.ReactNode; enabled: boolean }> = [
  {
    val: "running",
    title: "Running",
    desc: "Planes adaptativos de carrera: 10K, 21K, ritmo o resistencia.",
    icon: <Compass className="w-5 h-5" />,
    enabled: true
  },
  {
    val: "hyrox",
    title: "Hyrox",
    desc: "Carrera, fuerza, máquinas y simulación de las 8 estaciones oficiales.",
    icon: <Zap className="w-5 h-5" />,
    enabled: true
  },
  {
    val: "gym",
    title: "Gym",
    desc: "Planes de fuerza y musculación en el gimnasio.",
    icon: <Dumbbell className="w-5 h-5" />,
    enabled: false
  },
  {
    val: "salud",
    title: "Salud",
    desc: "Movilidad, bienestar general y hábitos saludables.",
    icon: <HeartPulse className="w-5 h-5" />,
    enabled: false
  }
];

export default function DisciplineSelect({ onSelect, onBack }: DisciplineSelectProps) {
  return (
    <div className="w-full text-zinc-800 relative py-2 sm:py-4">
      <motion.div
        key="discipline-step"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2 mb-2">
            <Compass className="w-5 h-5 text-blue-600" />
            1. DISCIPLINA
          </h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Selecciona qué quieres entrenar. Esto determinará el resto de tu plan personalizado.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS.map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => opt.enabled && onSelect(opt.val)}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-4 ${
                opt.enabled
                  ? "bg-white border-zinc-200/80 hover:border-blue-600 hover:shadow-sm cursor-pointer text-zinc-700"
                  : "bg-zinc-50 border-zinc-200/60 text-zinc-400 cursor-not-allowed opacity-70"
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${opt.enabled ? "bg-zinc-100 text-zinc-500" : "bg-zinc-100 text-zinc-400"}`}>
                {opt.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-black uppercase tracking-wide text-xs sm:text-sm ${opt.enabled ? "text-zinc-900" : "text-zinc-400"}`}>
                    {opt.title}
                  </h4>
                  {!opt.enabled && (
                    <span className="px-1.5 py-0.5 bg-zinc-200 text-zinc-500 text-[8px] font-bold rounded uppercase tracking-wider">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          ))}
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
      </div>
    </div>
  );
}

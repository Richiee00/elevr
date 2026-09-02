import React from "react";
import { motion } from "motion/react";
import { BrainCircuit } from "lucide-react";

export default function AnalyzingDataScreen() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl py-16 px-6 flex flex-col items-center justify-center text-center gap-6 shadow-sm min-h-[320px]">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-100"
          style={{ borderTopColor: "#2563eb" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrainCircuit className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Analizando datos…</h3>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
          Cruzando tu readiness de hoy con la planificación del Master Brain.
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-600"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

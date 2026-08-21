import React, { useState } from "react";
import { RunningVAMTestResult } from "./types";
import { calculateVAMFromRunningTest, RUNNING_VAM_TEST_DURATION_MIN } from "./engines";
import { Check, X } from "lucide-react";

interface RunningVAMTestCardProps {
  onComplete: (result: RunningVAMTestResult) => void;
  onCancel: () => void;
}

export default function RunningVAMTestCard({ onComplete, onCancel }: RunningVAMTestCardProps) {
  const [distance, setDistance] = useState("");

  const meters = Number(distance);
  const canSubmit = distance.trim() !== "" && meters > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const { vamKmH, vamPaceMinKm } = calculateVAMFromRunningTest(meters);
    onComplete({ distanceMeters: meters, vamKmH, vamPaceMinKm, completedAt: new Date().toISOString() });
  };

  return (
    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 space-y-4">
      <p className="text-xs text-zinc-600 font-medium leading-relaxed">
        Corre al máximo esfuerzo que puedas sostener durante <span className="font-bold text-zinc-900">{RUNNING_VAM_TEST_DURATION_MIN} minutos</span> (pista, cinta o
        exterior llano) y registra la distancia total recorrida.
      </p>
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Distancia recorrida (metros)</label>
        <input
          type="text"
          inputMode="numeric"
          value={distance}
          onChange={e => setDistance(e.target.value.replace(/\D/g, ""))}
          placeholder="Ej. 1150"
          className="w-full bg-white border border-zinc-200/80 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-blue-600 transition font-bold font-mono"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-600 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-zinc-100 transition flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition flex items-center justify-center gap-1.5 ${
            canSubmit ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          Calcular VAM
        </button>
      </div>
    </div>
  );
}

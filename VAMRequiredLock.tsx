import React from "react";
import { Gauge, Lock } from "lucide-react";

interface VAMRequiredLockProps {
  onGoToDiagnostico: () => void;
}

export default function VAMRequiredLock({ onGoToDiagnostico }: VAMRequiredLockProps) {
  return (
    <div className="max-w-lg mx-auto py-12 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-blue-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900">Completa el Test VAM para empezar</h3>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
          Para no basar tu plan en un tiempo antiguo, necesitamos tu Test VAM (Velocidad Aeróbica Máxima) antes de desbloquear tus entrenamientos. Solo lleva 5 minutos.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToDiagnostico}
        className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-xl text-xs transition shadow-sm cursor-pointer inline-flex items-center gap-2"
      >
        <Gauge className="w-4 h-4" />
        Ir a Diagnóstico y hacer el Test VAM
      </button>
    </div>
  );
}

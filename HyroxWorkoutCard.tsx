import React from "react";
import { HyroxWorkoutTemplate } from "./hyroxTypes";
import { STATION_LABELS, CATEGORY_LABELS } from "./hyroxLibrary";
import { Clock, Dumbbell, CheckCircle, ChevronRight } from "lucide-react";

interface HyroxWorkoutCardProps {
  template: HyroxWorkoutTemplate;
  isCompleted?: boolean;
  onClick: () => void;
}

const difficultyDot: Record<HyroxWorkoutTemplate["difficulty"], string> = {
  BAJA: "bg-emerald-500",
  MODERADA: "bg-amber-500",
  ALTA: "bg-rose-500"
};

export default function HyroxWorkoutCard({ template, isCompleted, onClick }: HyroxWorkoutCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-zinc-300 hover:shadow-sm transition shadow-xs flex items-start justify-between gap-3"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-blue-100">
            {CATEGORY_LABELS[template.category]}
          </span>
          {isCompleted && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-md uppercase tracking-wider flex items-center gap-0.5 border border-emerald-200">
              <CheckCircle className="w-2.5 h-2.5" /> Completado
            </span>
          )}
        </div>

        <h4 className="text-sm sm:text-base font-bold text-zinc-900 truncate">{template.name}</h4>
        <p className="text-xs text-zinc-500 font-medium mt-1 line-clamp-2 leading-relaxed">{template.description}</p>

        <div className="flex items-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {template.durationMin}m
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${difficultyDot[template.difficulty]}`} />
            {template.difficulty}
          </span>
          <span className="flex items-center gap-1 truncate">
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{template.equipment.map(e => STATION_LABELS[e]).join(", ")}</span>
          </span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0 mt-1" />
    </button>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HyroxBlock, HyroxExercise, HyroxWorkoutTemplate } from "./hyroxTypes";
import { STATION_LABELS, CATEGORY_LABELS } from "./hyroxLibrary";
import { blockFormatLabel, parseDurationToSeconds } from "./hyroxEngine";
import {
  Clock,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Info,
  CalendarClock,
  Smile,
  Frown,
  Meh
} from "lucide-react";

interface ExecStep {
  key: string;
  header: string;
  exercises: HyroxExercise[];
  restAfterSeconds: number;
}

function buildExecSteps(blocks: HyroxBlock[]): ExecStep[] {
  const steps: ExecStep[] = [];

  blocks.forEach((block, bIdx) => {
    if (block.format === "amrap") {
      steps.push({
        key: `b${bIdx}`,
        header: `AMRAP${block.durationCap ? ` ${block.durationCap}` : ""}`,
        exercises: block.exercises,
        restAfterSeconds: 0
      });
      return;
    }

    const roundsCount = Math.max(1, block.rounds ?? 1);

    for (let r = 0; r < roundsCount; r++) {
      const header = block.label
        ? block.label
        : roundsCount > 1
        ? `${blockFormatLabel(block.format)} · Ronda ${r + 1}/${roundsCount}`
        : blockFormatLabel(block.format);

      steps.push({
        key: `b${bIdx}-r${r}`,
        header,
        exercises: block.exercises,
        restAfterSeconds: r < roundsCount - 1 ? parseDurationToSeconds(block.restBetween) : 0
      });
    }
  });

  return steps;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft > 0]);

  return {
    secondsLeft,
    isRunning,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    reset: () => {
      setIsRunning(false);
      setSecondsLeft(initialSeconds);
    }
  };
}

function exerciseLine(ex: HyroxExercise): string {
  const parts = [ex.reps, ex.distance, ex.duration, ex.detail].filter(Boolean);
  return parts.join(" · ");
}

interface HyroxWorkoutDetailProps {
  template: HyroxWorkoutTemplate;
  roundsMultiplier?: number;
  adaptationNote?: string;
  isCompleted?: boolean;
  loggedFeedback?: { feedback: string; rpe: number; date: string };
  onClose?: () => void;
  onLogCompletion?: (feedback: string, rpe: number) => void;
}

export default function HyroxWorkoutDetail({
  template,
  roundsMultiplier = 1,
  adaptationNote,
  isCompleted,
  loggedFeedback,
  onClose,
  onLogCompletion
}: HyroxWorkoutDetailProps) {
  const [phase, setPhase] = useState<"preview" | "executing" | "feedback">("preview");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState<string>("adecuado");
  const [selectedRpe, setSelectedRpe] = useState<number>(6);

  const adjustedBlocks = useMemo(
    () =>
      template.blocks.map(b =>
        b.rounds ? { ...b, rounds: Math.max(1, Math.round(b.rounds * roundsMultiplier)) } : b
      ),
    [template, roundsMultiplier]
  );

  const steps = useMemo(() => buildExecSteps(adjustedBlocks), [adjustedBlocks]);
  const currentStep = steps[currentStepIdx] ?? steps[0];
  const timer = useCountdown(currentStep?.restAfterSeconds || 0);

  const goNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(idx => idx + 1);
    } else {
      setPhase(onLogCompletion ? "feedback" : "preview");
    }
  };

  const goPrev = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(idx => idx - 1);
  };

  return (
    <div className="bg-zinc-50/50 border-t border-zinc-100 rounded-b-2xl">
      <div className="max-w-2xl mx-auto p-5 space-y-5">
        {/* Header actions */}
        {(onClose || phase !== "preview") && (
          <div className="flex items-center justify-between">
            {onClose ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" /> Cerrar
              </button>
            ) : (
              <span />
            )}
            {phase !== "preview" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Paso {currentStepIdx + 1} de {steps.length}
              </span>
            )}
          </div>
        )}

        {isCompleted && loggedFeedback && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium">
            <span>
              Reportado como <strong className="text-emerald-700 capitalize">{loggedFeedback.feedback.replace("_", " ")}</strong> con RPE de{" "}
              <strong className="text-emerald-700">{loggedFeedback.rpe}/10</strong>.
            </span>
            <span className="text-[10px] text-emerald-600 font-mono">{new Date(loggedFeedback.date).toLocaleDateString()}</span>
          </div>
        )}

        {adaptationNote && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 font-medium leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>{adaptationNote}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {template.durationMin}m
                </span>
                <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded-md text-zinc-600">{CATEGORY_LABELS[template.category]}</span>
                <span className="flex items-center gap-1 truncate">
                  <Dumbbell className="w-3.5 h-3.5 shrink-0" />
                  {template.equipment.map(e => STATION_LABELS[e]).join(", ")}
                </span>
              </div>

              <p className="text-xs text-zinc-600 font-medium leading-relaxed">{template.description}</p>

              <div className="space-y-3">
                {adjustedBlocks.map((block, bIdx) => (
                  <div key={bIdx} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {block.label ?? blockFormatLabel(block.format)}
                        {block.rounds && block.rounds > 1 ? ` · ${block.rounds} rondas` : ""}
                      </span>
                      {(block.durationCap || block.workDuration) && (
                        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {block.durationCap || block.workDuration}
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {block.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="flex items-center gap-3 px-4 py-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {exIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-zinc-900">{ex.name}</p>
                            <p className="text-xs text-zinc-500 font-medium">{exerciseLine(ex)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {block.restBetween && (
                      <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Descanso entre rondas: {block.restBetween}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!isCompleted && (
                <div className="flex items-center gap-3 pt-2">
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="flex-1 py-3.5 bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-700 font-bold uppercase tracking-wider text-xs rounded-2xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CalendarClock className="w-4 h-4" />
                      Programar para más tarde
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCurrentStepIdx(0);
                      setPhase("executing");
                    }}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs rounded-2xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    Empezar
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {phase === "executing" && currentStep && (
            <motion.div key="executing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider border border-blue-100">
                  {currentStep.header}
                </span>

                <div className="space-y-3">
                  {currentStep.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {exIdx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{ex.name}</p>
                        <p className="text-xs text-zinc-500 font-medium">{exerciseLine(ex)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {currentStep.restAfterSeconds > 0 && (
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Descanso</p>
                      <p className="text-2xl font-black text-zinc-900 font-mono">{formatClock(timer.secondsLeft)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={timer.reset}
                        className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={timer.isRunning ? timer.pause : timer.start}
                        className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm"
                      >
                        {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={goPrev}
                  disabled={currentStepIdx === 0}
                  className="px-4 py-3 rounded-xl border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold uppercase tracking-widest text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {currentStepIdx === steps.length - 1 ? "Finalizar" : "Siguiente"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {phase === "feedback" && (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-black uppercase tracking-tight text-zinc-900">¿Cómo ha ido?</h4>
                <p className="text-xs text-zinc-500 font-medium">Tu feedback ajusta la dificultad de tus próximos entrenamientos.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "facil", label: "Fácil", icon: Smile },
                  { val: "adecuado", label: "Adecuado", icon: Meh },
                  { val: "muy_duro", label: "Muy duro", icon: Frown },
                  { val: "incompleto", label: "Incompleto", icon: X }
                ].map(f => {
                  const Icon = f.icon;
                  const isSel = selectedFeedback === f.val;
                  return (
                    <button
                      key={f.val}
                      onClick={() => setSelectedFeedback(f.val)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition ${
                        isSel ? "bg-blue-50 border-blue-600 text-blue-900" : "bg-white border-zinc-200/80 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{f.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 block text-center">RPE (Esfuerzo Percibido): {selectedRpe}/10</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={selectedRpe}
                  onChange={e => setSelectedRpe(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  onLogCompletion?.(selectedFeedback, selectedRpe);
                  setPhase("preview");
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs rounded-2xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Guardar y Finalizar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

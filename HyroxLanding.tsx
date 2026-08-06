import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HyroxLandingProps {
  onStartOnboarding: () => void;
  hasPlan: boolean;
  onGoToDashboard: () => void;
}

export default function HyroxLanding({ onStartOnboarding, hasPlan, onGoToDashboard }: HyroxLandingProps) {
  const [stage, setStage] = useState<"splash" | "welcome">("splash");

  useEffect(() => {
    const timer = setTimeout(() => setStage("welcome"), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center text-zinc-900 overflow-hidden px-4 py-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {stage === "splash" ? (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center space-y-4 text-center z-10 min-h-[60vh]"
          >
            <div className="p-4 bg-black rounded-2xl text-white shadow-sm">
              <svg viewBox="288.527 380.141 676.258 393.617" className="w-16 h-10 fill-current text-white">
                <path d="M 675.773438 578.882812 C 711.902344 578.882812 746.109375 579 780.316406 578.824219 C 793.289062 578.757812 806.367188 580.195312 819.222656 577.78125 C 850.214844 571.953125 871.574219 543.621094 868.824219 512.472656 C 866.070312 481.328125 839.976562 457.769531 808.132812 457.765625 C 684.382812 457.746094 560.636719 457.714844 436.890625 457.886719 C 430.375 457.894531 426.015625 456.421875 421.882812 450.890625 C 405.9375 429.554688 389.359375 408.691406 372.390625 386.839844 C 376.128906 386.652344 378.800781 386.398438 381.472656 386.398438 C 525.21875 386.390625 668.96875 386.140625 812.710938 386.53125 C 875.414062 386.699219 925.347656 425.277344 937.0625 483.972656 C 947.835938 537.960938 935.59375 585.769531 891.125 621.949219 C 876.78125 633.617188 859.925781 640.457031 840.207031 644.792969 C 880.324219 685.542969 919.585938 725.429688 958.785156 765.25 C 957.378906 767.757812 955.414062 766.769531 953.886719 766.773438 C 924.136719 766.859375 894.386719 766.796875 864.640625 766.949219 C 860.867188 766.96875 858.105469 766.003906 855.425781 763.25 C 796.828125 703.085938 738.152344 643 679.492188 582.894531 C 678.675781 582.054688 677.894531 581.175781 675.773438 578.882812" />
                <path d="M 675.6875 766.613281 L 295.410156 766.613281 C 294.527344 764.195312 296.832031 763.199219 297.890625 761.832031 C 313.785156 741.300781 329.859375 720.902344 345.679688 700.3125 C 348.242188 696.972656 350.949219 695.839844 355.066406 695.847656 C 439.257812 695.964844 523.449219 695.941406 607.640625 695.96875 C 610.539062 695.972656 613.347656 695.5625 615.78125 698.363281 C 635.265625 720.746094 654.910156 742.988281 675.6875 766.613281" />
                <path d="M 372.246094 613.074219 C 390.425781 589.695312 407.929688 567.300781 425.253906 544.765625 C 427.765625 541.496094 430.886719 542.101562 434.023438 542.097656 C 496.730469 542.058594 559.4375 542.050781 622.144531 542.039062 C 639.292969 542.035156 656.441406 542.039062 675.050781 542.039062 C 666.066406 553.257812 657.886719 563.445312 649.734375 573.65625 C 640.230469 585.558594 630.667969 597.417969 621.316406 609.441406 C 619.164062 612.210938 617.070312 613.660156 613.339844 613.652344 C 534.144531 613.507812 454.945312 613.503906 375.75 613.464844 C 375.046875 613.464844 374.347656 613.3125 372.246094 613.074219" />
              </svg>
            </div>
            <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full font-extrabold tracking-widest uppercase">HYROX</span>
          </motion.div>
        ) : (
          <motion.div
            key="intermediate-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-lg w-full text-center z-10 flex flex-col items-center space-y-7"
          >
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-800 leading-snug">
                8 estaciones. 8 km de carrera.
                <span className="font-black text-zinc-900 block mt-1">Un solo plan que se adapta a ti.</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-2.5 max-w-md mx-auto leading-relaxed">
                ELEVR HYROX combina carrera, fuerza y máquinas en un plan que evoluciona con tu readiness diaria.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs w-full space-y-4 text-left">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-2.5">
                ¿QUÉ INCLUYE TU PLAN?
              </h3>
              <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 divide-y divide-zinc-200/60">
                <div className="pb-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">1.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Diagnóstico de tus estaciones débiles</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">Priorizamos lo que más te frena en carrera.</p>
                  </div>
                </div>
                <div className="py-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">2.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Carrera, fuerza, acondicionamiento y simulación</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">Rondas, AMRAP, EMOM e intervalos, como en competición.</p>
                  </div>
                </div>
                <div className="py-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">3.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Se adapta a tu readiness diaria</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">Ajustamos volumen si llegas fatigado a entrenar.</p>
                  </div>
                </div>
                <div className="pt-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">4.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Cuenta atrás hasta tu carrera</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">Si nos dices la fecha, calculamos la duración exacta.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={onStartOnboarding}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs rounded-2xl shadow-sm transition-all duration-200 hover:scale-[1.01] cursor-pointer flex items-center justify-center"
              >
                <span>EMPEZAR MI PLAN HYROX</span>
              </button>

              {hasPlan && (
                <button
                  onClick={onGoToDashboard}
                  className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-700 font-bold uppercase tracking-wider text-xs rounded-2xl transition cursor-pointer shadow-xs"
                >
                  IR DIRECTO A MI PLAN EXISTENTE
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

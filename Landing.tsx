import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LandingProps {
  onStartOnboarding: () => void;
  hasPlan: boolean;
  onGoToDashboard: () => void;
}

export default function Landing({ onStartOnboarding, hasPlan, onGoToDashboard }: LandingProps) {
  const [stage, setStage] = useState<"splash" | "welcome">("splash");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("welcome");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center text-zinc-900 overflow-hidden px-4 py-8">
      {/* Background Decorative Gradient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {stage === "splash" ? (
          /* Pantalla 1: Únicamente el logotipo completo en negro sobre fondo transparente */
          <motion.div
            key="splash-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center space-y-6 text-center z-10 min-h-[60vh]"
          >
            {/* Logotipo Símbolo ER y Texto ELEVR */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col items-center space-y-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="535"
                height="325"
                viewBox="0 0 535 325"
                className="w-40 sm:w-52 h-auto text-black fill-current"
                role="img"
                aria-label="ELEVR ER symbol"
              >
                <path
                  d="M78 25 L407 25 C467 25 509 69 509 127 C509 184 469 220 433 222 L524 313 L448 313 L309 170 L408 170 C436 170 455 151 455 126 C455 99 435 80 407 80 L121 80 C113 80 109 78 104 71 L78 25 Z"
                  fill="#000000"
                />
                <path
                  d="M120 144 L308 144 L266 198 L78 198 L120 144 Z"
                  fill="#000000"
                />
                <path
                  d="M60 261 L261 261 L309 313 L20 313 L60 261 Z"
                  fill="#000000"
                />
              </svg>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1326.039"
                height="141.574"
                viewBox="225.207 372.574 1326.039 141.574"
                className="w-64 sm:w-80 h-auto text-black fill-current"
                role="img"
                aria-label="ELEVR wordmark"
              >
                <path d="M 1183.773438 480.5 C 1194.808594 461.085938 1205.320312 442.554688 1215.867188 424.042969 C 1223.78125 410.15625 1231.785156 396.316406 1239.640625 382.394531 C 1241.019531 379.945312 1242.597656 378.875 1245.527344 378.96875 C 1252.683594 379.199219 1259.851562 379.027344 1267.015625 379.050781 C 1272.332031 379.070312 1272.34375 379.101562 1269.726562 383.640625 C 1252.269531 413.929688 1234.800781 444.210938 1217.355469 474.507812 C 1211.621094 484.464844 1205.886719 494.425781 1200.3125 504.476562 C 1198.957031 506.917969 1197.511719 508.148438 1194.535156 508.058594 C 1187.210938 507.839844 1179.871094 507.863281 1172.546875 508.0625 C 1169.804688 508.136719 1168.425781 507.082031 1167.117188 504.785156 C 1144.347656 464.882812 1121.488281 425.035156 1098.660156 385.167969 C 1095.175781 379.082031 1095.214844 379.050781 1102.40625 379.039062 C 1108.90625 379.03125 1115.414062 379.265625 1121.894531 378.941406 C 1125.300781 378.773438 1126.890625 380.179688 1128.4375 382.933594 C 1146.0625 414.269531 1163.800781 445.539062 1181.511719 476.824219 C 1182.058594 477.792969 1182.679688 478.722656 1183.773438 480.5" fill="#000000"/>
                <path d="M 1371.390625 379.09375 C 1374.019531 379.09375 1375.140625 379.09375 1376.265625 379.09375 C 1416.921875 379.085938 1457.578125 378.960938 1498.230469 379.121094 C 1519.433594 379.203125 1535.761719 392.257812 1540.308594 412.128906 C 1545.246094 433.6875 1536.378906 454.210938 1517.980469 463.398438 C 1514.617188 465.078125 1510.921875 466.09375 1506.691406 467.675781 C 1512.667969 474.46875 1518.414062 481.089844 1524.261719 487.621094 C 1530.097656 494.132812 1536.03125 500.554688 1542.792969 507.972656 C 1531.535156 507.972656 1521.609375 507.960938 1511.683594 507.980469 C 1510.144531 507.984375 1509.304688 506.984375 1508.410156 505.992188 C 1490.65625 486.339844 1472.894531 466.6875 1455.152344 447.023438 C 1454.84375 446.683594 1454.691406 446.199219 1454.335938 445.546875 C 1456.09375 444.476562 1457.949219 444.941406 1459.660156 444.933594 C 1471.324219 444.855469 1482.988281 444.945312 1494.652344 444.832031 C 1507.394531 444.707031 1517.355469 435.222656 1517.152344 423.59375 C 1516.949219 411.890625 1507.425781 403.304688 1494.46875 403.277344 C 1461.308594 403.203125 1428.152344 403.113281 1394.996094 403.21875 C 1390.878906 403.230469 1388.167969 401.925781 1385.839844 398.578125 C 1381.484375 392.324219 1376.78125 386.316406 1371.390625 379.09375" fill="#000000"/>
                <path d="M 615.171875 508.050781 C 593.84375 508.050781 572.519531 508.003906 551.191406 508.105469 C 548.023438 508.121094 546.472656 507.679688 546.488281 503.863281 C 546.636719 464.210938 546.683594 424.558594 546.496094 384.910156 C 546.472656 379.988281 547.945312 378.574219 552.695312 378.960938 C 557.824219 379.378906 563.039062 379.320312 568.175781 378.941406 C 572.644531 378.613281 574.113281 379.894531 574.082031 384.617188 C 573.878906 415.4375 573.992188 446.257812 574.015625 477.078125 C 574.023438 485.085938 573.617188 483.855469 580.574219 483.867188 C 613.066406 483.910156 645.554688 484.011719 678.046875 483.761719 C 683.054688 483.722656 684.359375 485.242188 683.960938 489.90625 C 683.578125 494.375 683.628906 498.914062 683.949219 503.390625 C 684.222656 507.214844 682.8125 508.097656 679.152344 508.070312 C 657.828125 507.902344 636.5 507.988281 615.171875 507.988281 Z M 615.171875 508.050781" fill="#000000"/>
                <path d="M 231.207031 507.664062 C 237.34375 499.839844 242.972656 492.679688 248.578125 485.496094 C 249.898438 483.804688 251.714844 483.867188 253.5625 483.867188 C 296.214844 483.875 338.863281 483.878906 381.515625 483.882812 C 383.175781 483.882812 384.863281 483.710938 386.109375 485.214844 C 392.136719 492.472656 398.179688 499.714844 404.804688 507.664062 Z M 231.207031 507.664062" fill="#000000"/>
                <path d="M 965.441406 507.851562 L 791.636719 507.851562 C 797.96875 499.820312 803.746094 492.433594 809.605469 485.105469 C 810.769531 483.648438 812.613281 483.90625 814.273438 483.90625 C 856.589844 483.898438 898.902344 483.894531 941.21875 483.878906 C 943.242188 483.878906 945.113281 483.910156 946.625 485.714844 C 952.578125 492.832031 958.636719 499.867188 965.441406 507.851562" fill="#000000"/>
                <path d="M 255.328125 379.292969 L 423.011719 379.292969 C 416.535156 387.328125 410.660156 394.652344 404.742188 401.9375 C 403.417969 403.570312 401.445312 403.300781 399.636719 403.300781 C 359.191406 403.328125 318.746094 403.316406 278.300781 403.398438 C 274.992188 403.40625 272.738281 402.351562 270.765625 399.617188 C 266.007812 393.019531 260.941406 386.644531 255.328125 379.292969" fill="#000000"/>
                <path d="M 814.804688 379.246094 L 981.328125 379.246094 C 977.210938 384.453125 973.203125 388.628906 970.257812 393.449219 C 965.257812 401.632812 958.523438 403.691406 949.089844 403.535156 C 912.777344 402.941406 876.453125 403.226562 840.132812 403.398438 C 835.152344 403.421875 831.769531 402.074219 828.914062 397.804688 C 824.804688 391.65625 819.988281 385.988281 814.804688 379.246094" fill="#000000"/>
                <path d="M 818.390625 455.570312 C 824.304688 447.996094 829.820312 440.960938 835.296875 433.898438 C 836.410156 432.460938 837.78125 431.855469 839.585938 431.859375 C 871.027344 431.898438 902.464844 431.914062 933.90625 431.953125 C 934.335938 431.953125 934.765625 432.207031 935.871094 432.554688 C 929.785156 440.222656 923.945312 447.582031 918.097656 454.933594 C 917.171875 456.097656 915.847656 456.230469 914.484375 456.230469 C 883.210938 456.1875 851.9375 456.148438 820.664062 456.09375 C 820.195312 456.09375 819.726562 455.886719 818.390625 455.570312" fill="#000000"/>
                <path d="M 257.917969 455.683594 C 263.925781 447.949219 269.523438 440.773438 275.082031 433.566406 C 276.386719 431.871094 278.15625 431.832031 280.023438 431.832031 C 310.351562 431.828125 340.679688 431.804688 371.007812 431.8125 C 372.117188 431.8125 373.621094 431.300781 374.257812 432.363281 C 375.15625 433.875 373.417969 434.679688 372.679688 435.628906 C 368.070312 441.539062 363.324219 447.34375 358.726562 453.261719 C 357.300781 455.09375 355.777344 456.179688 353.316406 456.175781 C 322.324219 456.089844 291.328125 456.082031 260.335938 456.042969 C 259.847656 456.039062 259.359375 455.902344 257.917969 455.683594" fill="#000000"/>
              </svg>
            </motion.div>
          </motion.div>
        ) : (
          /* Pantalla 2: Punto Intermedio entre Inicio y Onboarding */
          <motion.div
            key="intermediate-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-lg w-full text-center z-10 flex flex-col items-center space-y-7"
          >
            {/* Encabezado sin logotipo (removido según solicitud del usuario) */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-800 leading-snug">
                Tu cuerpo cambia cada día.
                <span className="font-black text-zinc-900 block mt-1">¿Por qué tu plan de entrenamiento no?</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium font-sans mt-2.5 max-w-md mx-auto leading-relaxed">
                ELEVR no es un plan rígido. Cada entrenamiento se adapta a cómo te encuentras.
              </p>
            </div>

            {/* Tarjeta Informativa del Punto Intermedio: compacta en una sola tarjeta */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs w-full space-y-4 text-left">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-900 font-sans border-b border-zinc-100 pb-2.5">
                ¿POR QUÉ SOMOS ÚNICOS?
              </h3>

              <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 divide-y divide-zinc-200/60 font-sans">
                {/* Paso 1 */}
                <div className="pb-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">1.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                      Antes de entrenar, queremos saber como te encuentras
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">
                      Nos dices como te sientes
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="py-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">2.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Nosotros tomamos la decisión</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">
                      Reajustamos el plan según tu feedback
                    </p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="py-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">3.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Tú solo preocúpate de correr</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">
                      Adaptamos el plan a lo que tu cuerpo necesita
                    </p>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="pt-3 flex items-start gap-3">
                  <span className="text-sm font-bold text-blue-600 shrink-0 leading-none mt-0.5">4.</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">Cada entrenamiento nos hace más precisos</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-0.5">
                      Aprendemos de tu feedback y mejoramos el plan la próxima vez.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Acción para Iniciar Onboarding */}
            <div className="w-full space-y-3">
              <button
                onClick={onStartOnboarding}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs rounded-2xl shadow-sm transition-all duration-200 hover:scale-[1.01] cursor-pointer flex items-center justify-center"
              >
                <span>EMPEZAR CON MI PLAN</span>
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

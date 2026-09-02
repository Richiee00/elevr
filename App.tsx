import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  OnboardingData,
  TrainingPlan,
  DailyReadinessInput,
  RunningObjective,
  RunningVAMTestResult,
  WorkoutCompletionRecord
} from "./types";
import { generateTrainingPlan, calculateTrainingZones, estimateTargetsFromVAM, NEEDS_VAM_OBJECTIVES } from "./engines";

// View components
import Dashboard from "./Dashboard";
import WeeklyPlanView from "./WeeklyPlanView";
import TodayWorkoutView from "./TodayWorkoutView";
import ProfileView from "./ProfileView";
import CalendarView from "./CalendarView";
import VAMRequiredLock from "./VAMRequiredLock";

// Icons
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Flame,
  LogOut,
  User,
  ArrowLeftRight,
  Lock
} from "lucide-react";

interface AppProps {
  onSwitchDiscipline?: () => void;
  onResetToLanding: () => void;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error loading localStorage key "${key}":`, e);
    return fallback;
  }
}

export default function App({ onSwitchDiscipline, onResetToLanding }: AppProps) {
  // Root.tsx solo monta App cuando ya existe un plan de running guardado, así que este componente
  // no necesita sus propias pantallas de landing/onboarding: se inicializa directamente con los
  // datos persistidos (lazy init, sin useEffect posterior) para no mostrar ningún flash intermedio.
  // Si el Test VAM sigue pendiente, arranca directamente en Diagnóstico (nunca en Hoy/Mi Plan/
  // Calendario, que están bloqueados hasta completarlo) para no mostrar ni un frame bloqueado.
  const [activeTab, setActiveTab] = useState<"dashboard" | "today" | "plan" | "profile" | "calendar">(() => {
    const savedOnboarding = loadJSON<OnboardingData | null>("run_plan_onboarding", null);
    const savedVamTest = loadJSON<RunningVAMTestResult | null>("run_plan_vam_test", null);
    if (savedOnboarding && NEEDS_VAM_OBJECTIVES.has(savedOnboarding.objective) && !savedVamTest) return "dashboard";
    return "today";
  });

  const [onboarding, setOnboarding] = useState<OnboardingData | null>(() => loadJSON("run_plan_onboarding", null));
  const [plan, setPlan] = useState<TrainingPlan | null>(() => loadJSON("run_plan_data", null));
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(() => Number(localStorage.getItem("run_plan_current_week") || "0"));
  const [readinessHistory, setReadinessHistory] = useState<Record<string, DailyReadinessInput>>(() => loadJSON("run_plan_readiness", {}));
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, WorkoutCompletionRecord>>(() =>
    loadJSON("run_plan_completed_workouts", {})
  );
  const [vamTest, setVamTest] = useState<RunningVAMTestResult | null>(() => loadJSON("run_plan_vam_test", null));

  // El plan solo se puede entrenar (Hoy/Mi Plan/Calendario) una vez completado el Test VAM real:
  // ningún cálculo debe basarse en un tiempo introducido en el onboarding que puede ser antiguo.
  const vamRequired = !!onboarding && NEEDS_VAM_OBJECTIVES.has(onboarding.objective) && !vamTest;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  useEffect(() => {
    if (vamRequired && activeTab === "today") {
      setActiveTab("dashboard");
    }
  }, [vamRequired, activeTab]);

  const handleSetCurrentWeekIndex = (idx: number) => {
    setCurrentWeekIndex(idx);
    localStorage.setItem("run_plan_current_week", String(idx));
  };

  const handleUpdateProfile = (data: OnboardingData) => {
    const newPlan = generateTrainingPlan(data);

    setOnboarding(data);
    setPlan(newPlan);

    localStorage.setItem("run_plan_onboarding", JSON.stringify(data));
    localStorage.setItem("run_plan_data", JSON.stringify(newPlan));
  };

  const handleSaveReadiness = (input: DailyReadinessInput) => {
    const todayKey = new Date().toISOString().split("T")[0];
    const newHistory = { ...readinessHistory };

    if (input === undefined) {
      delete newHistory[todayKey];
    } else {
      newHistory[todayKey] = input;
    }

    setReadinessHistory(newHistory);
    localStorage.setItem("run_plan_readiness", JSON.stringify(newHistory));
  };

  const handleLogWorkoutCompletion = (
    workoutId: string,
    feedback: string,
    rpe: number,
    actualDistanceKm?: number,
    actualTimeSeconds?: number
  ) => {
    const newCompleted: Record<string, WorkoutCompletionRecord> = {
      ...completedWorkouts,
      [workoutId]: {
        feedback,
        rpe,
        date: new Date().toISOString(),
        actualDistanceKm,
        actualTimeSeconds
      }
    };

    setCompletedWorkouts(newCompleted);
    localStorage.setItem("run_plan_completed_workouts", JSON.stringify(newCompleted));
  };

  const handleSaveVAMTest = (result: RunningVAMTestResult) => {
    setVamTest(result);
    localStorage.setItem("run_plan_vam_test", JSON.stringify(result));

    // Mi Primer 10K, Mejorar 10K, Mi Primer 21K, Mejorar 21K y Mejorar Ritmo dependen del Test VAM:
    // es la única marca de referencia fiable (no un tiempo introducido que puede ser antiguo), así
    // que solo al completarlo se calculan sus zonas de ritmo y objetivos de carrera reales.
    if (plan && onboarding && NEEDS_VAM_OBJECTIVES.has(onboarding.objective)) {
      const zones = calculateTrainingZones({
        ...onboarding,
        time10K: undefined,
        time21K: undefined,
        vamTestDistance: result.distanceMeters
      });
      const raceDistance =
        onboarding.objective === RunningObjective.PRIMER_21K || onboarding.objective === RunningObjective.MEJORAR_21K
          ? "21K"
          : "10K";
      const { targets, estimatedPaces } = estimateTargetsFromVAM(result.vamKmH, plan.initialDiagnostic.levelEstimated, raceDistance);
      const updatedPlan: TrainingPlan = {
        ...plan,
        zones,
        initialDiagnostic: {
          ...plan.initialDiagnostic,
          targets,
          estimatedPaces
        }
      };
      setPlan(updatedPlan);
      localStorage.setItem("run_plan_data", JSON.stringify(updatedPlan));
    }
  };

  const handleResetAll = () => {
    localStorage.removeItem("run_plan_onboarding");
    localStorage.removeItem("run_plan_data");
    localStorage.removeItem("run_plan_current_week");
    localStorage.removeItem("run_plan_readiness");
    localStorage.removeItem("run_plan_completed_workouts");
    localStorage.removeItem("run_plan_vam_test");
    onResetToLanding();
  };

  const todayKey = new Date().toISOString().split("T")[0];
  const todayReadiness = readinessHistory[todayKey];

  const bottomNavButtonClass = (tab: "today" | "dashboard" | "plan" | "profile" | "calendar", locked: boolean = false) =>
    `py-1.5 px-2 text-[9px] font-bold uppercase tracking-wider transition flex flex-col items-center justify-center gap-1 relative text-center min-w-0 ${
      locked
        ? "text-zinc-300 cursor-not-allowed"
        : activeTab === tab
        ? "text-black font-extrabold cursor-pointer"
        : "text-zinc-400 hover:text-zinc-700 cursor-pointer"
    }`;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 flex flex-col font-sans select-none antialiased">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
          >
            <div className="p-2 bg-black rounded-xl text-white shadow-sm shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg 
                viewBox="288.527 380.141 676.258 393.617" 
                className="w-5 h-3 fill-current text-white"
              >
                <path d="M 675.773438 578.882812 C 711.902344 578.882812 746.109375 579 780.316406 578.824219 C 793.289062 578.757812 806.367188 580.195312 819.222656 577.78125 C 850.214844 571.953125 871.574219 543.621094 868.824219 512.472656 C 866.070312 481.328125 839.976562 457.769531 808.132812 457.765625 C 684.382812 457.746094 560.636719 457.714844 436.890625 457.886719 C 430.375 457.894531 426.015625 456.421875 421.882812 450.890625 C 405.9375 429.554688 389.359375 408.691406 372.390625 386.839844 C 376.128906 386.652344 378.800781 386.398438 381.472656 386.398438 C 525.21875 386.390625 668.96875 386.140625 812.710938 386.53125 C 875.414062 386.699219 925.347656 425.277344 937.0625 483.972656 C 947.835938 537.960938 935.59375 585.769531 891.125 621.949219 C 876.78125 633.617188 859.925781 640.457031 840.207031 644.792969 C 880.324219 685.542969 919.585938 725.429688 958.785156 765.25 C 957.378906 767.757812 955.414062 766.769531 953.886719 766.773438 C 924.136719 766.859375 894.386719 766.796875 864.640625 766.949219 C 860.867188 766.96875 858.105469 766.003906 855.425781 763.25 C 796.828125 703.085938 738.152344 643 679.492188 582.894531 C 678.675781 582.054688 677.894531 581.175781 675.773438 578.882812" />
                <path d="M 675.6875 766.613281 L 295.410156 766.613281 C 294.527344 764.195312 296.832031 763.199219 297.890625 761.832031 C 313.785156 741.300781 329.859375 720.902344 345.679688 700.3125 C 348.242188 696.972656 350.949219 695.839844 355.066406 695.847656 C 439.257812 695.964844 523.449219 695.941406 607.640625 695.96875 C 610.539062 695.972656 613.347656 695.5625 615.78125 698.363281 C 635.265625 720.746094 654.910156 742.988281 675.6875 766.613281" />
                <path d="M 372.246094 613.074219 C 390.425781 589.695312 407.929688 567.300781 425.253906 544.765625 C 427.765625 541.496094 430.886719 542.101562 434.023438 542.097656 C 496.730469 542.058594 559.4375 542.050781 622.144531 542.039062 C 639.292969 542.035156 656.441406 542.039062 675.050781 542.039062 C 666.066406 553.257812 657.886719 563.445312 649.734375 573.65625 C 640.230469 585.558594 630.667969 597.417969 621.316406 609.441406 C 619.164062 612.210938 617.070312 613.660156 613.339844 613.652344 C 534.144531 613.507812 454.945312 613.503906 375.75 613.464844 C 375.046875 613.464844 374.347656 613.3125 372.246094 613.074219" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2 leading-none">
                <svg 
                  viewBox="225.207 372.574 1326.039 141.574" 
                  className="h-3.5 text-zinc-900 fill-current shrink-0"
                >
                  <path d="M 1183.773438 480.5 C 1194.808594 461.085938 1205.320312 442.554688 1215.867188 424.042969 C 1223.78125 410.15625 1231.785156 396.316406 1239.640625 382.394531 C 1241.019531 379.945312 1242.597656 378.875 1245.527344 378.96875 C 1252.683594 379.199219 1259.851562 379.027344 1267.015625 379.050781 C 1272.332031 379.070312 1272.34375 379.101562 1269.726562 383.640625 C 1252.269531 413.929688 1234.800781 444.210938 1217.355469 474.507812 C 1211.621094 484.464844 1205.886719 494.425781 1200.3125 504.476562 C 1198.957031 506.917969 1197.511719 508.148438 1194.535156 508.058594 C 1187.210938 507.839844 1179.871094 507.863281 1172.546875 508.0625 C 1169.804688 508.136719 1168.425781 507.082031 1167.117188 504.785156 C 1144.347656 464.882812 1121.488281 425.035156 1098.660156 385.167969 C 1095.175781 379.082031 1095.214844 379.050781 1102.40625 379.039062 C 1108.90625 379.03125 1115.414062 379.265625 1121.894531 378.941406 C 1125.300781 378.773438 1126.890625 380.179688 1128.4375 382.933594 C 1146.0625 414.269531 1163.800781 445.539062 1181.511719 476.824219 C 1182.058594 477.792969 1182.679688 478.722656 1183.773438 480.5" fill="#18181B"/>
                  <path d="M 1371.390625 379.09375 C 1374.019531 379.09375 1375.140625 379.09375 1376.265625 379.09375 C 1416.921875 379.085938 1457.578125 378.960938 1498.230469 379.121094 C 1519.433594 379.203125 1535.761719 392.257812 1540.308594 412.128906 C 1545.246094 433.6875 1536.378906 454.210938 1517.980469 463.398438 C 1514.617188 465.078125 1510.921875 466.09375 1506.691406 467.675781 C 1512.667969 474.46875 1518.414062 481.089844 1524.261719 487.621094 C 1530.097656 494.132812 1536.03125 500.554688 1542.792969 507.972656 C 1531.535156 507.972656 1521.609375 507.960938 1511.683594 507.980469 C 1510.144531 507.984375 1509.304688 506.984375 1508.410156 505.992188 C 1490.65625 486.339844 1472.894531 466.6875 1455.152344 447.023438 C 1454.84375 446.683594 1454.691406 446.199219 1454.335938 445.546875 C 1456.09375 444.476562 1457.949219 444.941406 1459.660156 444.933594 C 1471.324219 444.855469 1482.988281 444.945312 1494.652344 444.832031 C 1507.394531 444.707031 1517.355469 435.222656 1517.152344 423.59375 C 1516.949219 411.890625 1507.425781 403.304688 1494.46875 403.277344 C 1461.308594 403.203125 1428.152344 403.113281 1394.996094 403.21875 C 1390.878906 403.230469 1388.167969 401.925781 1385.839844 398.578125 C 1381.484375 392.324219 1376.78125 386.316406 1371.390625 379.09375" fill="#18181B"/>
                  <path d="M 615.171875 508.050781 C 593.84375 508.050781 572.519531 508.003906 551.191406 508.105469 C 548.023438 508.121094 546.472656 507.679688 546.488281 503.863281 C 546.636719 464.210938 546.683594 424.558594 546.496094 384.910156 C 546.472656 379.988281 547.945312 378.574219 552.695312 378.960938 C 557.824219 379.378906 563.039062 379.320312 568.175781 378.941406 C 572.644531 378.613281 574.113281 379.894531 574.082031 384.617188 C 573.878906 415.4375 573.992188 446.257812 574.015625 477.078125 C 574.023438 485.085938 573.617188 483.855469 580.574219 483.867188 C 613.066406 483.910156 645.554688 484.011719 678.046875 483.761719 C 683.054688 483.722656 684.359375 485.242188 683.960938 489.90625 C 683.578125 494.375 683.628906 498.914062 683.949219 503.390625 C 684.222656 507.214844 682.8125 508.097656 679.152344 508.070312 C 657.828125 507.902344 636.5 507.988281 615.171875 507.988281 Z M 615.171875 508.050781" fill="#18181B"/>
                  <path d="M 231.207031 507.664062 C 237.34375 499.839844 242.972656 492.679688 248.578125 485.496094 C 249.898438 483.804688 251.714844 483.867188 253.5625 483.867188 C 296.214844 483.875 338.863281 483.878906 381.515625 483.882812 C 383.175781 483.882812 384.863281 483.710938 386.109375 485.214844 C 392.136719 492.472656 398.179688 499.714844 404.804688 507.664062 Z M 231.207031 507.664062" fill="#18181B"/>
                  <path d="M 965.441406 507.851562 L 791.636719 507.851562 C 797.96875 499.820312 803.746094 492.433594 809.605469 485.105469 C 810.769531 483.648438 812.613281 483.90625 814.273438 483.90625 C 856.589844 483.898438 898.902344 483.894531 941.21875 483.878906 C 943.242188 483.878906 945.113281 483.910156 946.625 485.714844 C 952.578125 492.832031 958.636719 499.867188 965.441406 507.851562" fill="#18181B"/>
                  <path d="M 255.328125 379.292969 L 423.011719 379.292969 C 416.535156 387.328125 410.660156 394.652344 404.742188 401.9375 C 403.417969 403.570312 401.445312 403.300781 399.636719 403.300781 C 359.191406 403.328125 318.746094 403.316406 278.300781 403.398438 C 274.992188 403.40625 272.738281 402.351562 270.765625 399.617188 C 266.007812 393.019531 260.941406 386.644531 255.328125 379.292969" fill="#18181B"/>
                  <path d="M 814.804688 379.246094 L 981.328125 379.246094 C 977.210938 384.453125 973.203125 388.628906 970.257812 393.449219 C 965.257812 401.632812 958.523438 403.691406 949.089844 403.535156 C 912.777344 402.941406 876.453125 840.132812 403.398438 C 835.152344 403.421875 831.769531 402.074219 828.914062 397.804688 C 824.804688 391.65625 819.988281 385.988281 814.804688 379.246094" fill="#18181B"/>
                  <path d="M 818.390625 455.570312 C 824.304688 447.996094 829.820312 440.960938 835.296875 433.898438 C 836.410156 432.460938 837.78125 431.855469 839.585938 431.859375 C 871.027344 431.898438 902.464844 431.914062 933.90625 431.953125 C 934.335938 431.953125 934.765625 432.207031 935.871094 432.554688 C 929.785156 440.222656 923.945312 447.582031 918.097656 454.933594 C 917.171875 456.097656 915.847656 456.230469 914.484375 456.230469 C 883.210938 456.1875 851.9375 456.148438 820.664062 456.09375 C 820.195312 456.09375 819.726562 455.886719 818.390625 455.570312" fill="#18181B"/>
                  <path d="M 257.917969 455.683594 C 263.925781 447.949219 269.523438 440.773438 275.082031 433.566406 C 276.386719 431.871094 278.15625 431.832031 280.023438 431.832031 C 310.351562 431.828125 340.679688 431.804688 371.007812 431.8125 C 372.117188 431.8125 373.621094 431.300781 374.257812 432.363281 C 375.15625 433.875 373.417969 434.679688 372.679688 435.628906 C 368.070312 441.539062 363.324219 447.34375 358.726562 453.261719 C 357.300781 455.09375 355.777344 456.179688 353.316406 456.175781 C 322.324219 456.089844 291.328125 456.082031 260.335938 456.042969 C 259.847656 456.039062 259.359375 455.902344 257.917969 455.683594" fill="#18181B"/>
                </svg>
                <span className="text-[8px] bg-zinc-900 text-white px-2 py-0.5 rounded-full font-extrabold tracking-wide select-none">RUNNING</span>
              </div>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold leading-none mt-1">
                RISE · COMMIT · CONQUER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchDiscipline && (
              <button
                onClick={onSwitchDiscipline}
                title="Cambiar plan"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer shadow-xs"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cambiar Plan</span>
              </button>
            )}
            {plan && (
              <button
                onClick={handleResetAll}
                title="Reiniciar Plan"
                className="flex p-2.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto relative ${plan ? "pb-28" : ""}`}>
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && plan && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard
                plan={plan}
                activeInjury={onboarding?.activeInjury || false}
                injuryAreas={onboarding?.injuryAreas || []}
                vamTest={vamTest}
                onSaveVAMTest={handleSaveVAMTest}
                completedWorkouts={completedWorkouts}
              />
            </motion.div>
          )}

          {activeTab === "today" && plan && (vamRequired ? (
            <motion.div key="today-locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <VAMRequiredLock onGoToDiagnostico={() => setActiveTab("dashboard")} />
            </motion.div>
          ) : (
            <motion.div
              key="today"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TodayWorkoutView
                plan={plan}
                currentWeekIndex={currentWeekIndex}
                readiness={todayReadiness}
                onSaveReadiness={handleSaveReadiness}
                onLogWorkoutCompletion={handleLogWorkoutCompletion}
                completedWorkouts={completedWorkouts}
                activeInjury={onboarding?.activeInjury || false}
                injuryAreas={onboarding?.injuryAreas || []}
              />
            </motion.div>
          ))}

          {activeTab === "plan" && plan && (
            <motion.div
              key="plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <WeeklyPlanView
                plan={plan}
                currentWeekIndex={currentWeekIndex}
                onSetCurrentWeek={handleSetCurrentWeekIndex}
                onLogWorkoutCompletion={handleLogWorkoutCompletion}
                completedWorkouts={completedWorkouts}
                readiness={todayReadiness}
                onSaveReadiness={handleSaveReadiness}
                activeInjury={onboarding?.activeInjury || false}
                injuryAreas={onboarding?.injuryAreas || []}
                vamRequired={vamRequired}
                onGoToDiagnostico={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}

          {activeTab === "calendar" && plan && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarView
                plan={plan}
                completedWorkouts={completedWorkouts}
              />
            </motion.div>
          )}

          {activeTab === "profile" && onboarding && plan && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileView
                onboarding={onboarding}
                plan={plan}
                onUpdateProfile={handleUpdateProfile}
                completedWorkouts={completedWorkouts}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {plan && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-zinc-200/80 px-2.5 py-2 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.08)] flex items-center justify-around gap-1 max-w-md w-full">
            <button onClick={() => !vamRequired && setActiveTab("today")} className={bottomNavButtonClass("today", vamRequired)}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "today" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                {vamRequired ? <Lock className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
              </div>
              <span className="text-[9px]">Hoy</span>
            </button>

            <button onClick={() => setActiveTab("dashboard")} className={bottomNavButtonClass("dashboard")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "dashboard" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Diagnóstico</span>
            </button>

            <button onClick={() => setActiveTab("plan")} className={bottomNavButtonClass("plan")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "plan" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6.5L13.5 2z" />
                  <path d="M13 2v5h5" />
                  <rect x="7" y="9" width="3" height="3" rx="0.5" />
                  <rect x="7" y="14" width="3" height="3" rx="0.5" />
                  <line x1="12" y1="10.5" x2="15" y2="10.5" />
                  <line x1="12" y1="15.5" x2="14" y2="15.5" />
                </svg>
              </div>
              <span className="text-[9px]">Mi Plan</span>
            </button>

            <button onClick={() => setActiveTab("calendar")} className={bottomNavButtonClass("calendar")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "calendar" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Calendario</span>
            </button>

            <button onClick={() => setActiveTab("profile")} className={bottomNavButtonClass("profile")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "profile" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <User className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Perfil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

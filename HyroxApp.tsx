import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HyroxOnboardingData, HyroxTrainingPlan } from "./hyroxTypes";
import { DailyReadinessInput } from "./types";
import { generateHyroxPlan } from "./hyroxEngine";

import HyroxLanding from "./components/hyrox/HyroxLanding";
import HyroxOnboarding from "./components/hyrox/HyroxOnboarding";
import HyroxDashboard from "./components/hyrox/HyroxDashboard";
import HyroxWeeklyPlanView from "./components/hyrox/HyroxWeeklyPlanView";
import HyroxTodayWorkoutView from "./components/hyrox/HyroxTodayWorkoutView";
import HyroxProfileView from "./components/hyrox/HyroxProfileView";
import HyroxCalendarView from "./components/hyrox/HyroxCalendarView";

import { LayoutDashboard, CalendarDays, Calendar, Flame, LogOut, User, ArrowLeftRight } from "lucide-react";

interface HyroxAppProps {
  onSwitchApp: () => void;
}

export default function HyroxApp({ onSwitchApp }: HyroxAppProps) {
  const [activeTab, setActiveTab] = useState<"landing" | "onboarding" | "dashboard" | "today" | "plan" | "profile" | "calendar">("landing");

  const [onboarding, setOnboarding] = useState<HyroxOnboardingData | null>(null);
  const [plan, setPlan] = useState<HyroxTrainingPlan | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [readinessHistory, setReadinessHistory] = useState<Record<string, DailyReadinessInput>>({});
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, { feedback: string; rpe: number; date: string }>>({});

  useEffect(() => {
    try {
      const savedOnboarding = localStorage.getItem("hyrox_plan_onboarding");
      const savedPlan = localStorage.getItem("hyrox_plan_data");
      const savedWeekIdx = localStorage.getItem("hyrox_plan_current_week");
      const savedReadiness = localStorage.getItem("hyrox_plan_readiness");
      const savedCompleted = localStorage.getItem("hyrox_plan_completed_workouts");

      if (savedOnboarding) setOnboarding(JSON.parse(savedOnboarding));

      if (savedPlan) {
        setPlan(JSON.parse(savedPlan));
        setActiveTab("today");
      }

      if (savedWeekIdx) setCurrentWeekIndex(Number(savedWeekIdx));
      if (savedReadiness) setReadinessHistory(JSON.parse(savedReadiness));
      if (savedCompleted) setCompletedWorkouts(JSON.parse(savedCompleted));
    } catch (e) {
      console.error("Error loading localStorage Hyrox plan state:", e);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  const handleSetCurrentWeekIndex = (idx: number) => {
    setCurrentWeekIndex(idx);
    localStorage.setItem("hyrox_plan_current_week", String(idx));
  };

  const handleCompleteOnboarding = (data: HyroxOnboardingData) => {
    const newPlan = generateHyroxPlan(data);

    setOnboarding(data);
    setPlan(newPlan);
    setCurrentWeekIndex(0);
    setActiveTab("dashboard");

    localStorage.setItem("hyrox_plan_onboarding", JSON.stringify(data));
    localStorage.setItem("hyrox_plan_data", JSON.stringify(newPlan));
    localStorage.setItem("hyrox_plan_current_week", "0");
  };

  const handleUpdateProfile = (data: HyroxOnboardingData) => {
    const newPlan = generateHyroxPlan(data);
    setOnboarding(data);
    setPlan(newPlan);
    localStorage.setItem("hyrox_plan_onboarding", JSON.stringify(data));
    localStorage.setItem("hyrox_plan_data", JSON.stringify(newPlan));
  };

  const handleSaveReadiness = (input: DailyReadinessInput) => {
    const todayKey = new Date().toISOString().split("T")[0];
    const newHistory = { ...readinessHistory, [todayKey]: input };
    setReadinessHistory(newHistory);
    localStorage.setItem("hyrox_plan_readiness", JSON.stringify(newHistory));
  };

  const handleLogWorkoutCompletion = (workoutId: string, feedback: string, rpe: number) => {
    const newCompleted = {
      ...completedWorkouts,
      [workoutId]: { feedback, rpe, date: new Date().toISOString() }
    };
    setCompletedWorkouts(newCompleted);
    localStorage.setItem("hyrox_plan_completed_workouts", JSON.stringify(newCompleted));
  };

  const handleResetAll = () => {
    setOnboarding(null);
    setPlan(null);
    setCurrentWeekIndex(0);
    setReadinessHistory({});
    setCompletedWorkouts({});
    setActiveTab("landing");

    localStorage.removeItem("hyrox_plan_onboarding");
    localStorage.removeItem("hyrox_plan_data");
    localStorage.removeItem("hyrox_plan_current_week");
    localStorage.removeItem("hyrox_plan_readiness");
    localStorage.removeItem("hyrox_plan_completed_workouts");
  };

  const todayKey = new Date().toISOString().split("T")[0];
  const todayReadiness = readinessHistory[todayKey];

  const bottomNavButtonClass = (tab: "today" | "dashboard" | "plan" | "profile" | "calendar") =>
    `py-1.5 px-2 text-[9px] font-bold uppercase tracking-wider transition flex flex-col items-center justify-center gap-1 cursor-pointer relative text-center min-w-0 ${
      activeTab === tab ? "text-black font-extrabold" : "text-zinc-400 hover:text-zinc-700"
    }`;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 flex flex-col font-sans select-none antialiased">
      {activeTab !== "landing" && (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div
              onClick={() => setActiveTab(plan ? "today" : "landing")}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
            >
              <div className="p-2 bg-black rounded-xl text-white shadow-sm shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg viewBox="288.527 380.141 676.258 393.617" className="w-5 h-3 fill-current text-white">
                  <path d="M 675.773438 578.882812 C 711.902344 578.882812 746.109375 579 780.316406 578.824219 C 793.289062 578.757812 806.367188 580.195312 819.222656 577.78125 C 850.214844 571.953125 871.574219 543.621094 868.824219 512.472656 C 866.070312 481.328125 839.976562 457.769531 808.132812 457.765625 C 684.382812 457.746094 560.636719 457.714844 436.890625 457.886719 C 430.375 457.894531 426.015625 456.421875 421.882812 450.890625 C 405.9375 429.554688 389.359375 408.691406 372.390625 386.839844 C 376.128906 386.652344 378.800781 386.398438 381.472656 386.398438 C 525.21875 386.390625 668.96875 386.140625 812.710938 386.53125 C 875.414062 386.699219 925.347656 425.277344 937.0625 483.972656 C 947.835938 537.960938 935.59375 585.769531 891.125 621.949219 C 876.78125 633.617188 859.925781 640.457031 840.207031 644.792969 C 880.324219 685.542969 919.585938 725.429688 958.785156 765.25 C 957.378906 767.757812 955.414062 766.769531 953.886719 766.773438 C 924.136719 766.859375 894.386719 766.796875 864.640625 766.949219 C 860.867188 766.96875 858.105469 766.003906 855.425781 763.25 C 796.828125 703.085938 738.152344 643 679.492188 582.894531 C 678.675781 582.054688 677.894531 581.175781 675.773438 578.882812" />
                  <path d="M 675.6875 766.613281 L 295.410156 766.613281 C 294.527344 764.195312 296.832031 763.199219 297.890625 761.832031 C 313.785156 741.300781 329.859375 720.902344 345.679688 700.3125 C 348.242188 696.972656 350.949219 695.839844 355.066406 695.847656 C 439.257812 695.964844 523.449219 695.941406 607.640625 695.96875 C 610.539062 695.972656 613.347656 695.5625 615.78125 698.363281 C 635.265625 720.746094 654.910156 742.988281 675.6875 766.613281" />
                  <path d="M 372.246094 613.074219 C 390.425781 589.695312 407.929688 567.300781 425.253906 544.765625 C 427.765625 541.496094 430.886719 542.101562 434.023438 542.097656 C 496.730469 542.058594 559.4375 542.050781 622.144531 542.039062 C 639.292969 542.035156 656.441406 542.039062 675.050781 542.039062 C 666.066406 553.257812 657.886719 563.445312 649.734375 573.65625 C 640.230469 585.558594 630.667969 597.417969 621.316406 609.441406 C 619.164062 612.210938 617.070312 613.660156 613.339844 613.652344 C 534.144531 613.507812 454.945312 613.503906 375.75 613.464844 C 375.046875 613.464844 374.347656 613.3125 372.246094 613.074219" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-sm font-black italic uppercase tracking-tight text-zinc-900">ELEVR</span>
                  <span className="text-[8px] bg-zinc-900 text-white px-2 py-0.5 rounded-full font-extrabold tracking-wide select-none">HYROX</span>
                </div>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold leading-none mt-1">RONDA · ESTACIÓN · CARRERA</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchApp}
                title="Cambiar de app"
                className="flex p-2.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer shadow-xs"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
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
      )}

      <main className={`flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto relative ${plan ? "pb-28" : ""}`}>
        <AnimatePresence mode="wait">
          {activeTab === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxLanding onStartOnboarding={() => setActiveTab("onboarding")} hasPlan={!!plan} onGoToDashboard={() => setActiveTab("today")} />
            </motion.div>
          )}

          {activeTab === "onboarding" && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxOnboarding onComplete={handleCompleteOnboarding} onCancel={() => setActiveTab(plan ? "today" : "landing")} />
            </motion.div>
          )}

          {activeTab === "dashboard" && plan && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxDashboard plan={plan} activeInjury={onboarding?.activeInjury || false} injuryAreas={onboarding?.injuryAreas || []} />
            </motion.div>
          )}

          {activeTab === "today" && plan && (
            <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxTodayWorkoutView
                plan={plan}
                currentWeekIndex={currentWeekIndex}
                readiness={todayReadiness}
                onSaveReadiness={handleSaveReadiness}
                onLogWorkoutCompletion={handleLogWorkoutCompletion}
                completedWorkouts={completedWorkouts}
              />
            </motion.div>
          )}

          {activeTab === "plan" && plan && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxWeeklyPlanView
                plan={plan}
                currentWeekIndex={currentWeekIndex}
                onSetCurrentWeek={handleSetCurrentWeekIndex}
                onLogWorkoutCompletion={handleLogWorkoutCompletion}
                completedWorkouts={completedWorkouts}
                readiness={todayReadiness}
                onSaveReadiness={handleSaveReadiness}
              />
            </motion.div>
          )}

          {activeTab === "calendar" && plan && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxCalendarView plan={plan} completedWorkouts={completedWorkouts} />
            </motion.div>
          )}

          {activeTab === "profile" && onboarding && plan && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxProfileView onboarding={onboarding} plan={plan} onUpdateProfile={handleUpdateProfile} completedWorkouts={completedWorkouts} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {plan && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-zinc-200/80 px-2.5 py-2 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.08)] flex items-center justify-around gap-1 max-w-md w-full">
            <button onClick={() => setActiveTab("today")} className={bottomNavButtonClass("today")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "today" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Entrenar</span>
            </button>

            <button onClick={() => setActiveTab("dashboard")} className={bottomNavButtonClass("dashboard")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "dashboard" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Diagnóstico</span>
            </button>

            <button onClick={() => setActiveTab("plan")} className={bottomNavButtonClass("plan")}>
              <div className={`p-2 rounded-full transition-all duration-200 ${activeTab === "plan" ? "bg-black text-white shadow-md scale-105" : "hover:bg-zinc-100"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
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

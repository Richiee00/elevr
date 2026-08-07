import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import App from "./App";
import HyroxApp from "./HyroxApp";
import Landing from "./Landing";
import ProfileStep, { BaseProfile } from "./ProfileStep";
import DisciplineSelect, { Discipline } from "./DisciplineSelect";
import Onboarding from "./Onboarding";
import HyroxOnboarding from "./HyroxOnboarding";
import { OnboardingData } from "./types";
import { generateTrainingPlan } from "./engines";
import { HyroxOnboardingData } from "./hyroxTypes";
import { generateHyroxPlan } from "./hyroxEngine";

type Stage =
  | "landing"
  | "profile"
  | "discipline"
  | "onboarding-running"
  | "onboarding-hyrox"
  | "app-running"
  | "app-hyrox";

function getStoredProfile(): BaseProfile | null {
  try {
    const run = localStorage.getItem("run_plan_onboarding");
    if (run) {
      const data = JSON.parse(run);
      return { age: data.age, sex: data.sex === "F" ? "F" : "M", height: data.height, weight: data.weight };
    }
    const hyrox = localStorage.getItem("hyrox_plan_onboarding");
    if (hyrox) {
      const data = JSON.parse(hyrox);
      return { age: data.age, sex: data.sex === "F" ? "F" : "M", height: data.height, weight: data.weight };
    }
  } catch (e) {
    console.error("Error reading stored profile:", e);
  }
  return null;
}

function resolveBootStage(): Stage {
  try {
    const activeApp = localStorage.getItem("elevr_active_app");
    if (activeApp === "running" && localStorage.getItem("run_plan_data")) return "app-running";
    if (activeApp === "hyrox" && localStorage.getItem("hyrox_plan_data")) return "app-hyrox";
    if (localStorage.getItem("hyrox_plan_data")) return "app-hyrox";
    if (localStorage.getItem("run_plan_data")) return "app-running";
  } catch (e) {
    console.error("Error resolving boot stage:", e);
  }
  return "landing";
}

export default function Root() {
  const [stage, setStage] = useState<Stage>(() => resolveBootStage());
  const [profile, setProfile] = useState<BaseProfile | null>(null);

  const handleCompleteRunning = (data: OnboardingData) => {
    const plan = generateTrainingPlan(data);
    localStorage.setItem("run_plan_onboarding", JSON.stringify(data));
    localStorage.setItem("run_plan_data", JSON.stringify(plan));
    localStorage.setItem("run_plan_current_week", "0");
    localStorage.setItem("elevr_active_app", "running");
    setStage("app-running");
  };

  const handleCompleteHyrox = (data: HyroxOnboardingData) => {
    const plan = generateHyroxPlan(data);
    localStorage.setItem("hyrox_plan_onboarding", JSON.stringify(data));
    localStorage.setItem("hyrox_plan_data", JSON.stringify(plan));
    localStorage.setItem("hyrox_plan_current_week", "0");
    localStorage.setItem("elevr_active_app", "hyrox");
    setStage("app-hyrox");
  };

  const handleSelectDiscipline = (discipline: Discipline) => {
    if (discipline === "running") {
      if (localStorage.getItem("run_plan_data")) {
        localStorage.setItem("elevr_active_app", "running");
        setStage("app-running");
      } else {
        setStage("onboarding-running");
      }
    } else if (discipline === "hyrox") {
      if (localStorage.getItem("hyrox_plan_data")) {
        localStorage.setItem("elevr_active_app", "hyrox");
        setStage("app-hyrox");
      } else {
        setStage("onboarding-hyrox");
      }
    }
    // gym / salud: intentionally no-op for now
  };

  const handleSwitchApp = () => {
    const stored = profile ?? getStoredProfile();
    if (stored) setProfile(stored);
    setStage("discipline");
  };

  if (stage === "app-running") return <App onSwitchApp={handleSwitchApp} />;
  if (stage === "app-hyrox") return <HyroxApp onSwitchApp={handleSwitchApp} />;

  const hasAnyPlan = !!localStorage.getItem("run_plan_data") || !!localStorage.getItem("hyrox_plan_data");

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 flex flex-col font-sans antialiased">
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-3xl w-full mx-auto relative">
        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Landing
                onStartOnboarding={() => setStage("profile")}
                hasPlan={hasAnyPlan}
                onGoToDashboard={() => {
                  const activeApp = localStorage.getItem("elevr_active_app");
                  if (activeApp === "hyrox" || (!activeApp && localStorage.getItem("hyrox_plan_data"))) {
                    setStage("app-hyrox");
                  } else {
                    setStage("app-running");
                  }
                }}
              />
            </motion.div>
          )}

          {stage === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ProfileStep
                onNext={(p) => {
                  setProfile(p);
                  setStage("discipline");
                }}
                onBack={() => setStage("landing")}
              />
            </motion.div>
          )}

          {stage === "discipline" && (
            <motion.div key="discipline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <DisciplineSelect onSelect={handleSelectDiscipline} onBack={() => setStage("profile")} />
            </motion.div>
          )}

          {stage === "onboarding-running" && (
            <motion.div key="onboarding-running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Onboarding
                baseProfile={profile ?? undefined}
                stepOffset={profile ? 1 : 0}
                onComplete={handleCompleteRunning}
                onCancel={() => setStage("discipline")}
              />
            </motion.div>
          )}

          {stage === "onboarding-hyrox" && (
            <motion.div key="onboarding-hyrox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxOnboarding
                baseProfile={profile ?? undefined}
                stepOffset={profile ? 1 : 0}
                onComplete={handleCompleteHyrox}
                onCancel={() => setStage("discipline")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

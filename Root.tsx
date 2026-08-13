import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import App from "./App";
import HyroxApp from "./HyroxApp";
import Landing from "./Landing";
import DisciplineSelect, { Discipline } from "./DisciplineSelect";
import Onboarding from "./Onboarding";
import HyroxOnboarding from "./HyroxOnboarding";
import { OnboardingData } from "./types";
import { generateTrainingPlan } from "./engines";
import { HyroxOnboardingData } from "./hyroxTypes";
import { generateHyroxPlan } from "./hyroxEngine";

type Stage =
  | "landing"
  | "discipline"
  | "onboarding-running"
  | "onboarding-hyrox"
  | "app-running"
  | "app-hyrox";

export default function Root() {
  // La app siempre arranca en la pantalla de bienvenida de ELEVR, con el selector de disciplina
  // como paso siguiente — nunca se salta directamente a Running o Hyrox aunque ya exista un plan
  // guardado. Quien vuelve con un plan ya creado tiene el botón "Ir directo a mi plan existente"
  // en esa pantalla de bienvenida como atajo deliberado, en vez de un salto automático y silencioso.
  const [stage, setStage] = useState<Stage>("landing");
  // Recuerda desde qué disciplina se abrió el selector cuando se usa como "cambiar de disciplina"
  // en vez de como el primer paso del onboarding, para poder volver directamente a ella con "Atrás".
  const [switchOrigin, setSwitchOrigin] = useState<Stage | null>(null);

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
    setSwitchOrigin(null);
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

  const handleSwitchDiscipline = () => {
    setSwitchOrigin(stage);
    setStage("discipline");
  };

  const handleResetToLanding = () => {
    setSwitchOrigin(null);
    setStage("landing");
  };

  if (stage === "app-running") return <App onSwitchDiscipline={handleSwitchDiscipline} onResetToLanding={handleResetToLanding} />;
  if (stage === "app-hyrox") return <HyroxApp onSwitchDiscipline={handleSwitchDiscipline} onResetToLanding={handleResetToLanding} />;

  const hasAnyPlan = !!localStorage.getItem("run_plan_data") || !!localStorage.getItem("hyrox_plan_data");

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 flex flex-col font-sans antialiased">
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-3xl w-full mx-auto relative">
        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Landing
                onStartOnboarding={() => setStage("discipline")}
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

          {stage === "discipline" && (
            <motion.div key="discipline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <DisciplineSelect
                mode={switchOrigin ? "switch" : "onboarding"}
                onSelect={handleSelectDiscipline}
                onBack={() => {
                  if (switchOrigin) {
                    setStage(switchOrigin);
                    setSwitchOrigin(null);
                  } else {
                    setStage("landing");
                  }
                }}
              />
            </motion.div>
          )}

          {stage === "onboarding-running" && (
            <motion.div key="onboarding-running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Onboarding
                stepOffset={1}
                onComplete={handleCompleteRunning}
                onCancel={() => setStage("discipline")}
              />
            </motion.div>
          )}

          {stage === "onboarding-hyrox" && (
            <motion.div key="onboarding-hyrox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <HyroxOnboarding
                stepOffset={1}
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

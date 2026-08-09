import React, { useState } from "react";
import { HyroxOnboardingData, HyroxPerformanceData } from "./hyroxTypes";
import { SegmentedTimeInput } from "./HyroxOnboarding";
import { parseTimeToSeconds, formatSecondsToTime } from "./engines";
import { Route } from "lucide-react";

interface HyroxRaceStrategyCardProps {
  onboarding: HyroxOnboardingData;
}

const STATION_FIELDS: Array<{ key: keyof HyroxPerformanceData; label: string }> = [
  { key: "skiErg", label: "Ski Erg" },
  { key: "sledPush", label: "Sled Push" },
  { key: "sledPull", label: "Sled Pull" },
  { key: "burpeeBroadJump", label: "Burpee Broad Jump" },
  { key: "row", label: "Row" },
  { key: "farmersCarry", label: "Farmers Carry" },
  { key: "sandbagLunges", label: "Sandbag Lunges" },
  { key: "wallBalls", label: "Wall Balls" }
];

export default function HyroxRaceStrategyCard({ onboarding }: HyroxRaceStrategyCardProps) {
  const perf = onboarding.performance;

  const [masterPace, setMasterPace] = useState("");
  const [runSplits, setRunSplits] = useState<string[]>(perf?.runSplits && perf.runSplits.some(Boolean) ? [...perf.runSplits] : Array(8).fill(""));
  const [stationSplits, setStationSplits] = useState<Record<string, string>>(() =>
    STATION_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: perf?.[f.key] ?? "" }), {} as Record<string, string>)
  );
  const [roxzone, setRoxzone] = useState<string>(perf?.roxzoneTotal ?? "");

  const runTotalSeconds = runSplits.reduce((sum, s) => sum + parseTimeToSeconds(s), 0);
  const stationTotalSeconds = STATION_FIELDS.reduce((sum, f) => sum + parseTimeToSeconds(stationSplits[f.key] ?? ""), 0);
  const roxzoneSeconds = parseTimeToSeconds(roxzone);
  const totalSeconds = runTotalSeconds + stationTotalSeconds + roxzoneSeconds;

  const filledRuns = runSplits.filter(s => parseTimeToSeconds(s) > 0);
  const avgPaceSeconds = filledRuns.length > 0 ? runTotalSeconds / filledRuns.length : 0;

  const applyPaceToAllRuns = (pace: string) => {
    setMasterPace(pace);
    setRunSplits(Array(8).fill(pace));
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Route className="w-4 h-4 text-blue-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Estrategia de Carrera</h4>
      </div>
      <p className="text-xs text-zinc-500 font-medium leading-relaxed">
        Juega con tu ritmo de carrera y el ritmo de cada estación para calcular tu tiempo total estimado.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Tiempo Total Estimado</p>
          <p className="text-2xl font-black text-blue-700 font-mono mt-1">{totalSeconds > 0 ? formatSecondsToTime(totalSeconds) : "--:--"}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ritmo Medio de Carrera</p>
          <p className="text-2xl font-black text-zinc-900 font-mono mt-1">{avgPaceSeconds > 0 ? formatSecondsToTime(avgPaceSeconds) : "--:--"} /km</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
        <SegmentedTimeInput label="Ajustar ritmo de carrera (aplica a los 8 km de golpe)" value={masterPace} onChange={applyPaceToAllRuns} />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Splits de carrera (8 x 1 km)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {runSplits.map((s, i) => (
            <div key={i}>
              <SegmentedTimeInput label={`Km ${i + 1}`} value={s} onChange={v => setRunSplits(prev => prev.map((val, idx) => (idx === i ? v : val)))} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Ritmo por estación</label>
        <div className="grid grid-cols-2 gap-3">
          {STATION_FIELDS.map(f => (
            <div key={f.key}>
              <SegmentedTimeInput
                label={f.label}
                value={stationSplits[f.key] ?? ""}
                onChange={v => setStationSplits(prev => ({ ...prev, [f.key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      <SegmentedTimeInput label="Roxzone / Transiciones" value={roxzone} onChange={setRoxzone} />
    </div>
  );
}

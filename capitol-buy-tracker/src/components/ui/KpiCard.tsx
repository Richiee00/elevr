import type { ReactNode } from "react";

export function KpiCard({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "up" | "near" | "muted" | "down" }) {
  const toneClass = { default: "text-ink", up: "text-up", near: "text-near", muted: "text-muted", down: "text-down" }[tone];
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className={`num mt-1 truncate text-xl font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-faint">{hint}</div>}
    </div>
  );
}

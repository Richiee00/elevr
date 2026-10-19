import type { OpportunityStatus, PriceFreshness } from "@/lib/types";

const STATUS: Record<OpportunityStatus, { label: string; cls: string; icon: string }> = {
  BELOW: { label: "BELOW BUY PRICE", cls: "bg-green-600 text-white border-green-500", icon: "▼" },
  NEAR: { label: "NEAR BUY PRICE", cls: "bg-yellow-400/90 text-black border-yellow-300", icon: "≈" },
  ABOVE: { label: "ABOVE BUY PRICE", cls: "bg-neutral-700 text-neutral-200 border-neutral-600", icon: "▲" },
  NO_PRICE: { label: "NO PRICE", cls: "bg-transparent text-faint border-line", icon: "–" },
  CURRENCY_MISMATCH: { label: "CURRENCY MISMATCH", cls: "bg-transparent text-orange-300 border-orange-900", icon: "≠" },
};

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${s.cls}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

const FRESH: Record<PriceFreshness, { label: string; cls: string; title: string }> = {
  MARKET_OPEN: { label: "Market open", cls: "text-up", title: "Intraday quote during the regular US session (may be delayed by the provider)" },
  PREVIOUS_CLOSE: { label: "Prev. close", cls: "text-muted", title: "Last closing price" },
  DELAYED: { label: "Delayed", cls: "text-near", title: "Delayed quote" },
  STALE: { label: "Stale", cls: "text-down", title: "Price is older than the configured freshness limit — the last update failed or has not run" },
  UNAVAILABLE: { label: "Unavailable", cls: "text-faint", title: "Price data unavailable" },
};

export function FreshnessTag({ freshness }: { freshness: PriceFreshness }) {
  const f = FRESH[freshness];
  return (
    <span className={`whitespace-nowrap text-[10px] uppercase tracking-wide ${f.cls}`} title={f.title}>
      {freshness === "STALE" ? "⚠ " : ""}
      {f.label}
    </span>
  );
}

export function TypeBadge({ type, original }: { type: string; original?: string }) {
  return (
    <span className="whitespace-nowrap font-semibold text-up" title={original && original !== type ? `Original label: ${original}` : undefined}>
      {type}
      {original && original !== type && original.toUpperCase() !== type ? <span className="ml-1 text-[10px] text-faint">({original})</span> : null}
    </span>
  );
}

export function PartyTag({ party }: { party: string }) {
  const cls = party === "Democrat" ? "text-blue-400" : party === "Republican" ? "text-red-400" : "text-muted";
  return <span className={`whitespace-nowrap ${cls}`}>{party}</span>;
}

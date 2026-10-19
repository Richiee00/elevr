"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useFilters } from "@/hooks/useFilters";
import { DEFAULT_FILTERS, isQuickActive, quickFilters, parseFilters, type FilterState } from "@/lib/query";

interface Options {
  politicians: { id: string; name: string }[];
  parties: string[];
  chambers: string[];
  states: string[];
  tickers: string[];
  sectors: string[];
  owners: string[];
  sizeLabels: string[];
}

const PRESETS_KEY = "cbt.savedFilters.v1";
const inputCls = "w-full rounded border border-line bg-panel2 px-2 py-1.5 text-xs text-ink placeholder:text-faint focus:border-link focus:outline-none";

function loadPresets(): { name: string; qs: string }[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function PremiumControl() {
  const { filters, set } = useFilters();
  const [v, setV] = useState(String(filters.premium));
  useEffect(() => setV(String(filters.premium)), [filters.premium]);
  const commit = (s: string) => {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n <= 100) set({ premium: n });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label htmlFor="premium" className="text-muted">
        Maximum premium above politician price:
      </label>
      <div className="flex items-center rounded border border-line bg-panel2">
        <input id="premium" type="number" step="0.01" min={0} max={100} value={v} onChange={(e) => setV(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit(v)} className="num w-16 bg-transparent px-2 py-1 text-right text-near focus:outline-none" />
        <span className="pr-2 text-muted">%</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2.99, 5, 10].map((p) => (
          <button key={p} onClick={() => set({ premium: p })} className={`rounded border px-1.5 py-0.5 ${filters.premium === p ? "border-near text-near" : "border-line text-muted hover:text-ink"}`}>
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterPanel({ hide = [] }: { hide?: (keyof FilterState)[] }) {
  const { filters, set, reset, queryString } = useFilters();
  const { data: opts } = useApi<Options>("/api/options");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(filters.q);
  const [presets, setPresets] = useState<{ name: string; qs: string }[]>([]);
  useEffect(() => setPresets(loadPresets()), []);
  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    const t = setTimeout(() => q !== filters.q && set({ q }), 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePreset = () => {
    const name = prompt("Name for this filter configuration:");
    if (!name) return;
    const next = [...presets.filter((p) => p.name !== name), { name, qs: queryString }];
    setPresets(next);
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
    } catch {}
  };
  const deletePreset = (name: string) => {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
    } catch {}
  };

  const show = (k: keyof FilterState) => !hide.includes(k);
  const sel = (k: keyof FilterState, label: string, values: { v: string; l: string }[]) =>
    show(k) && (
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">{label}</span>
        <select value={String(filters[k] ?? "")} onChange={(e) => set({ [k]: e.target.value } as Partial<FilterState>)} className={inputCls}>
          <option value="">All</option>
          {values.map((x) => (
            <option key={x.v} value={x.v}>
              {x.l}
            </option>
          ))}
        </select>
      </label>
    );
  const numIn = (k: "minEst" | "maxEst" | "maxFiledAfter", label: string, ph: string) =>
    show(k) && (
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">{label}</span>
        <input type="number" min={0} placeholder={ph} defaultValue={filters[k] ?? ""} key={String(filters[k])} onBlur={(e) => set({ [k]: e.target.value === "" ? null : Number(e.target.value) })} className={inputCls + " num"} />
      </label>
    );
  const vals = (xs?: string[]) => (xs ?? []).map((v) => ({ v, l: v }));
  const NOT_COUNTED = new Set(["sort", "dir", "page", "pageSize", "bucket", "premium", "q"]);
  const activeCount = [...new URLSearchParams(queryString).keys()].filter((k) => !NOT_COUNTED.has(k)).length;

  return (
    <div className="space-y-3 rounded-lg border border-line bg-panel p-3">
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" placeholder="Search ticker, company or politician…" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls + " max-w-xs flex-1"} aria-label="Search" />
        <PremiumControl />
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button onClick={() => setOpen((o) => !o)} className="rounded border border-line px-2.5 py-1 hover:bg-panel2">
            {open ? "Hide filters" : "All filters"}
            {activeCount > 0 && <span className="ml-1 rounded bg-link px-1 text-[10px] text-black">{activeCount}</span>}
          </button>
          <button onClick={reset} className="rounded border border-line px-2.5 py-1 text-muted hover:text-ink">
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => set({ status: filters.status === "OPPORTUNITY" ? "ALL" : "OPPORTUNITY" })} className={`rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${filters.status === "OPPORTUNITY" ? "border-green-500 bg-green-600 text-white" : "border-green-800 text-green-400 hover:bg-green-950"}`}>
          BELOW OR NEAR POLITICIAN BUY PRICE
        </button>
        {quickFilters(filters.premium).map((qf) => {
          const active = isQuickActive(filters, qf);
          const undo = Object.fromEntries(Object.keys(qf.patch).map((k) => [k, DEFAULT_FILTERS[k as keyof FilterState]]));
          return (
            <button key={qf.id} onClick={() => set(active ? undo : qf.patch)} className={`rounded-full border px-2.5 py-1 text-[11px] ${active ? "border-link bg-link/15 text-link" : "border-line text-muted hover:text-ink"}`}>
              {qf.label}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-3 lg:grid-cols-6">
          {show("dateFrom") && (
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Trade date from</span>
              <input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value, lastDays: null })} className={inputCls} />
            </label>
          )}
          {show("dateTo") && (
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Trade date to</span>
              <input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value, lastDays: null })} className={inputCls} />
            </label>
          )}
          {sel("politician", "Politician", (opts?.politicians ?? []).map((p) => ({ v: p.id, l: p.name })))}
          {sel("party", "Party", vals(opts?.parties))}
          {sel("chamber", "Chamber", vals(opts?.chambers))}
          {sel("state", "State", vals(opts?.states))}
          {show("company") && (
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Company</span>
              <input defaultValue={filters.company} key={filters.company} placeholder="Contains…" onBlur={(e) => set({ company: e.target.value })} onKeyDown={(e) => e.key === "Enter" && set({ company: (e.target as HTMLInputElement).value })} className={inputCls} />
            </label>
          )}
          {sel("ticker", "Ticker", vals(opts?.tickers))}
          {sel("sector", "Sector", vals(opts?.sectors))}
          {sel("owner", "Owner", vals(opts?.owners))}
          {sel("sizeLabel", "Original size", vals(opts?.sizeLabels))}
          {numIn("minEst", "Min estimated size ($)", "e.g. 50000")}
          {numIn("maxEst", "Max estimated size ($)", "e.g. 1000000")}
          {sel("status", "Current price status", [
            { v: "OPPORTUNITY", l: "Below or near buy price" },
            { v: "BELOW", l: "Below buy price" },
            { v: "NEAR", l: "Near buy price" },
            { v: "ABOVE", l: "Above buy price" },
            { v: "NO_PRICE", l: "No price" },
          ])}
          {numIn("maxFiledAfter", "Filed within (days)", "e.g. 30")}
          {sel("priceData", "Price data", [
            { v: "with", l: "With current price" },
            { v: "without", l: "Without current price" },
          ])}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-2 text-[11px]">
        <span className="text-faint">Saved:</span>
        {presets.length === 0 && <span className="text-faint">none</span>}
        {presets.map((p) => (
          <span key={p.name} className="inline-flex items-center rounded border border-line">
            <button onClick={() => set(parseFilters(new URLSearchParams(p.qs)))} className="px-2 py-0.5 text-muted hover:text-ink">
              {p.name}
            </button>
            <button onClick={() => deletePreset(p.name)} className="border-l border-line px-1.5 text-faint hover:text-down" aria-label={`Delete ${p.name}`}>
              ×
            </button>
          </span>
        ))}
        <button onClick={savePreset} className="rounded border border-dashed border-line px-2 py-0.5 text-muted hover:text-ink">
          + Save current filters
        </button>
      </div>
    </div>
  );
}

// Filtering, sorting and pagination of enriched trades.

import type { EnrichedTrade } from "../types";
import type { FilterState, StatusFilter } from "../query";
import type { OpportunityStatus } from "../types";
import { isOpportunity } from "./finance";

export function matchesStatus(status: OpportunityStatus, f: StatusFilter): boolean {
  switch (f) {
    case "ALL":
      return true;
    case "OPPORTUNITY":
      return isOpportunity(status);
    case "NO_PRICE":
      return status === "NO_PRICE" || status === "CURRENCY_MISMATCH";
    default:
      return status === f;
  }
}

function dateFloor(f: FilterState, now: Date): string {
  if (f.lastDays && f.lastDays > 0) return new Date(now.getTime() - f.lastDays * 86_400_000).toISOString().slice(0, 10);
  return f.dateFrom;
}

/**
 * Trade-level filters. `withStatus=false` skips status / price-availability filters so the stock
 * aggregation can apply them at stock level (vs. the weighted average price).
 */
export function filterTrades(rows: EnrichedTrade[], f: FilterState, opts: { withStatus: boolean; now?: Date } = { withStatus: true }): EnrichedTrade[] {
  const now = opts.now ?? new Date();
  const from = dateFloor(f, now);
  const q = f.q.toLowerCase();
  const company = f.company.toLowerCase();
  return rows.filter((t) => {
    if (from && t.tradeDate < from) return false;
    if (f.dateTo && t.tradeDate > f.dateTo) return false;
    if (f.politician && t.politicianId !== f.politician) return false;
    if (f.party && t.party !== f.party) return false;
    if (f.chamber && t.chamber !== f.chamber) return false;
    if (f.state && t.state !== f.state) return false;
    if (f.ticker && t.ticker !== f.ticker) return false;
    if (company && !t.issuerName.toLowerCase().includes(company)) return false;
    if (f.sector && (t.sector ?? "Unknown") !== f.sector) return false;
    if (f.owner && t.owner !== f.owner) return false;
    if (f.sizeLabel && t.sizeLabel !== f.sizeLabel) return false;
    if (f.minEst != null && t.sizeEstimated < f.minEst) return false;
    if (f.maxEst != null && t.sizeEstimated > f.maxEst) return false;
    if (f.maxFiledAfter != null && (t.filedAfterDays == null || t.filedAfterDays > f.maxFiledAfter)) return false;
    if (q && !(t.ticker.toLowerCase().includes(q) || t.issuerName.toLowerCase().includes(q) || t.politicianName.toLowerCase().includes(q))) return false;
    if (opts.withStatus) {
      if (!matchesStatus(t.status, f.status)) return false;
      if (f.priceData === "with" && t.currentPrice == null) return false;
      if (f.priceData === "without" && t.currentPrice != null) return false;
    }
    return true;
  });
}

type Accessor<T> = (row: T) => string | number | null;

/** Generic multi-key sort. Nulls always last. The requested key first, then tie-breakers. */
export function sortRows<T>(rows: T[], keys: { get: Accessor<T>; dir: "asc" | "desc" }[]): T[] {
  return [...rows].sort((a, b) => {
    for (const k of keys) {
      const va = k.get(a);
      const vb = k.get(b);
      if (va === vb) continue;
      if (va == null) return 1;
      if (vb == null) return -1;
      const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      if (c !== 0) return k.dir === "asc" ? c : -c;
    }
    return 0;
  });
}

const STATUS_ORDER: Record<string, number> = { BELOW: 0, NEAR: 1, ABOVE: 2, CURRENCY_MISMATCH: 3, NO_PRICE: 4 };

export const TRADE_SORT: Record<string, Accessor<EnrichedTrade>> = {
  ticker: (t) => t.ticker,
  issuerName: (t) => t.issuerName,
  politicianName: (t) => t.politicianName,
  party: (t) => t.party,
  chamber: (t) => t.chamber,
  owner: (t) => t.owner,
  tradeDate: (t) => t.tradeDate,
  publishedDate: (t) => t.publishedDate,
  filedAfterDays: (t) => t.filedAfterDays,
  txType: (t) => t.txType,
  sizeLabel: (t) => t.sizeEstimated, // never sort by the range text
  sizeEstimated: (t) => t.sizeEstimated,
  purchasePrice: (t) => t.purchasePrice,
  currentPrice: (t) => t.currentPrice,
  variationPct: (t) => t.variationPct,
  status: (t) => STATUS_ORDER[t.status],
  priceUpdatedAt: (t) => t.priceUpdatedAt,
};

/** Default: Estimated Size ↓, Trade Date ↓, Published Date ↓. */
export function sortTrades(rows: EnrichedTrade[], sort: string, dir: "asc" | "desc"): EnrichedTrade[] {
  const defaults = [
    { get: TRADE_SORT.sizeEstimated, dir: "desc" as const },
    { get: TRADE_SORT.tradeDate, dir: "desc" as const },
    { get: TRADE_SORT.publishedDate, dir: "desc" as const },
    { get: (t: EnrichedTrade) => t.id, dir: "asc" as const },
  ];
  const primary = TRADE_SORT[sort];
  return sortRows(rows, primary ? [{ get: primary, dir }, ...defaults] : defaults);
}

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((p - 1) * pageSize, p * pageSize), total, page: p, pages, pageSize };
}

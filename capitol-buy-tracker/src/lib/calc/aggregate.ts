// Aggregations: per stock, per politician, KPIs and chart series.

import type { EnrichedTrade, PoliticianAggregate, PriceFreshness, StockAggregate } from "../types";
import type { Bucket, FilterState } from "../query";
import { opportunityStatus, priceVariationPct, weightedAveragePrice } from "./finance";
import { matchesStatus, sortRows } from "./filters";

export function aggregateByStock(trades: EnrichedTrade[], premiumPct: number): StockAggregate[] {
  const groups = new Map<string, EnrichedTrade[]>();
  for (const t of trades) groups.set(t.ticker, [...(groups.get(t.ticker) ?? []), t]);
  const out: StockAggregate[] = [];
  for (const [ticker, rows] of groups) {
    const wavg = weightedAveragePrice(rows.map((r) => ({ price: r.purchasePrice, weight: r.sizeEstimated })))!;
    const largest = rows.reduce((a, b) => (b.sizeEstimated > a.sizeEstimated ? b : a));
    const latest = rows.reduce((a, b) => (b.tradeDate > a.tradeDate ? b : a));
    const ref = rows[0];
    const current = ref.currentPrice;
    out.push({
      ticker,
      issuerName: latest.issuerName,
      sector: rows.find((r) => r.sector)?.sector ?? null,
      tradeCount: rows.length,
      uniquePoliticians: new Set(rows.map((r) => r.politicianId)).size,
      totalMin: rows.reduce((s, r) => s + r.sizeMin, 0),
      totalEstimated: rows.reduce((s, r) => s + r.sizeEstimated, 0),
      totalMax: rows.reduce((s, r) => s + r.sizeMax, 0),
      weightedAvgPrice: wavg,
      currentPrice: current,
      priceFreshness: ref.priceFreshness as PriceFreshness,
      priceUpdatedAt: ref.priceUpdatedAt,
      variationPct: priceVariationPct(current, wavg),
      latestTradeDate: latest.tradeDate,
      largestBuy: largest.sizeEstimated,
      largestBuyTradeId: largest.id,
      status: ref.status === "CURRENCY_MISMATCH" ? "CURRENCY_MISMATCH" : opportunityStatus(current, wavg, premiumPct),
    });
  }
  return out;
}

export function filterStocks(stocks: StockAggregate[], f: FilterState): StockAggregate[] {
  return stocks.filter((s) => {
    if (!matchesStatus(s.status, f.status)) return false;
    if (f.priceData === "with" && s.currentPrice == null) return false;
    if (f.priceData === "without" && s.currentPrice != null) return false;
    return true;
  });
}

const STATUS_ORDER: Record<string, number> = { BELOW: 0, NEAR: 1, ABOVE: 2, CURRENCY_MISMATCH: 3, NO_PRICE: 4 };
export const STOCK_SORT: Record<string, (s: StockAggregate) => string | number | null> = {
  ticker: (s) => s.ticker,
  issuerName: (s) => s.issuerName,
  tradeCount: (s) => s.tradeCount,
  uniquePoliticians: (s) => s.uniquePoliticians,
  totalMin: (s) => s.totalMin,
  totalEstimated: (s) => s.totalEstimated,
  totalMax: (s) => s.totalMax,
  weightedAvgPrice: (s) => s.weightedAvgPrice,
  currentPrice: (s) => s.currentPrice,
  variationPct: (s) => s.variationPct,
  latestTradeDate: (s) => s.latestTradeDate,
  largestBuy: (s) => s.largestBuy,
  status: (s) => STATUS_ORDER[s.status],
};

/** Default: Total Estimated Volume ↓, Unique Politicians ↓, Number of Buy Transactions ↓. */
export function sortStocks(rows: StockAggregate[], sort: string, dir: "asc" | "desc"): StockAggregate[] {
  const defaults = [
    { get: STOCK_SORT.totalEstimated, dir: "desc" as const },
    { get: STOCK_SORT.uniquePoliticians, dir: "desc" as const },
    { get: STOCK_SORT.tradeCount, dir: "desc" as const },
    { get: STOCK_SORT.ticker, dir: "asc" as const },
  ];
  const primary = STOCK_SORT[sort];
  return sortRows(rows, primary ? [{ get: primary, dir }, ...defaults] : defaults);
}

export function aggregateByPolitician(trades: EnrichedTrade[]): PoliticianAggregate[] {
  const groups = new Map<string, EnrichedTrade[]>();
  for (const t of trades) groups.set(t.politicianId, [...(groups.get(t.politicianId) ?? []), t]);
  return [...groups.values()]
    .map((rows) => {
      const delays = rows.map((r) => r.filedAfterDays).filter((d): d is number => d != null);
      const p = rows[0];
      return {
        politicianId: p.politicianId,
        politicianName: p.politicianName,
        party: p.party,
        chamber: p.chamber,
        state: p.state,
        tradeCount: rows.length,
        totalEstimated: rows.reduce((s, r) => s + r.sizeEstimated, 0),
        largestBuy: Math.max(...rows.map((r) => r.sizeEstimated)),
        avgFilingDelay: delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null,
        uniqueStocks: new Set(rows.map((r) => r.ticker)).size,
      };
    })
    .sort((a, b) => b.totalEstimated - a.totalEstimated);
}

/** Start of the bucket containing `date` (weeks start on Monday). */
export function bucketKey(date: string, bucket: Bucket): string {
  if (bucket === "day") return date;
  if (bucket === "month") return date.slice(0, 7) + "-01";
  const d = new Date(date + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - dow * 86_400_000).toISOString().slice(0, 10);
}

export function volumeOverTime(trades: EnrichedTrade[], bucket: Bucket): { date: string; volume: number; trades: number }[] {
  const m = new Map<string, { volume: number; trades: number }>();
  for (const t of trades) {
    const k = bucketKey(t.tradeDate, bucket);
    const cur = m.get(k) ?? { volume: 0, trades: 0 };
    cur.volume += t.sizeEstimated;
    cur.trades += 1;
    m.set(k, cur);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}

export function statusDistribution(items: { status: string }[]) {
  const d = { BELOW: 0, NEAR: 0, ABOVE: 0, NO_PRICE: 0 };
  for (const i of items) {
    if (i.status === "BELOW" || i.status === "NEAR" || i.status === "ABOVE") d[i.status]++;
    else d.NO_PRICE++;
  }
  return d;
}

/** Histogram of purchase prices (weighted by estimated size) for the stock-detail page. */
export function priceDistribution(trades: EnrichedTrade[], bins = 10) {
  if (!trades.length) return [];
  const prices = trades.map((t) => t.purchasePrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return [{ from: min, to: max, label: `$${min.toFixed(2)}`, trades: trades.length, volume: trades.reduce((s, t) => s + t.sizeEstimated, 0) }];
  const w = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ from: min + i * w, to: min + (i + 1) * w, label: "", trades: 0, volume: 0 }));
  for (const t of trades) {
    const i = Math.min(bins - 1, Math.floor((t.purchasePrice - min) / w));
    out[i].trades++;
    out[i].volume += t.sizeEstimated;
  }
  for (const b of out) b.label = `$${b.from.toFixed(0)}–${b.to.toFixed(0)}`;
  return out;
}

export function topBy<T>(rows: T[], get: (r: T) => number, n: number): T[] {
  return sortRows(rows, [{ get, dir: "desc" }]).slice(0, n);
}

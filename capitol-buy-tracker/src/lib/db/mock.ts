// ⚠ DEVELOPMENT ONLY — in-memory repository seeded with clearly-labelled MOCK fixtures.
// Never touches the database, so mock rows can never be mixed with production data.

import type { MarketPrice, Rejection, Trade, UpdateLog } from "../types";
import type { Quote } from "../prices/provider";
import { normalizeBatch } from "../normalize/trade";
import { MOCK_RAW_TRADES, mockPrices } from "../../mock/fixtures";
import type { QualityCounts, Repository } from "./repository";

export class MockRepository implements Repository {
  readonly kind = "mock" as const;
  private trades: Trade[];
  private rejections: Rejection[];
  private prices: MarketPrice[];
  private logs: UpdateLog[] = [];
  private duplicates: number;

  constructor() {
    const batch = normalizeBatch(MOCK_RAW_TRADES);
    this.trades = batch.trades;
    this.rejections = batch.rejections;
    this.duplicates = batch.duplicates;
    this.prices = mockPrices(this.trades);
    const now = new Date().toISOString();
    this.logs = [
      { id: 2, job: "prices", status: "success", startedAt: now, finishedAt: now, stats: { requested: this.prices.length, updated: this.prices.filter((p) => p.price != null).length, failed: 0, provider: "mock" }, message: "MOCK price run" },
      { id: 1, job: "trades", status: "success", startedAt: now, finishedAt: now, stats: { ...batch.stats, inserted: batch.trades.length, pages: 1, via: "mock" }, message: "MOCK trades run" },
    ];
  }

  async insertTrades(trades: Trade[]) {
    const ids = new Set(this.trades.map((t) => t.id));
    const keys = new Set(this.trades.map((t) => t.dedupeKey));
    const fresh = trades.filter((t) => !ids.has(t.id) && !keys.has(t.dedupeKey));
    this.trades.push(...fresh);
    return fresh.length;
  }
  async saveRejections(r: Rejection[]) {
    this.rejections.push(...r);
  }
  async listTrades() {
    return this.trades;
  }
  async listPrices() {
    return this.prices;
  }
  async tickersNeedingPrice() {
    return [];
  }
  async savePrices(_q: Quote[]) {}
  async savePriceErrors() {}
  async startLog() {
    return 0;
  }
  async finishLog() {}
  async listLogs(limit: number) {
    return this.logs.slice(0, limit);
  }
  async qualityCounts(): Promise<QualityCounts> {
    const by: Record<string, number> = {};
    for (const r of this.rejections) by[r.reason] = (by[r.reason] ?? 0) + 1;
    by.DUPLICATE = this.duplicates;
    return { validRows: this.trades.length, rejectedByReason: by };
  }
  async dataVersion() {
    return "mock";
  }
}

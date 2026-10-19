// Storage contract. Two implementations: PostgreSQL (production) and in-memory MOCK (development only).

import type { MarketPrice, Rejection, Trade, UpdateLog } from "../types";
import type { Quote } from "../prices/provider";

export interface QualityCounts {
  validRows: number;
  rejectedByReason: Record<string, number>;
}

export interface Repository {
  readonly kind: "postgres" | "mock";
  /** Inserts new trades; existing ids / dedupe keys are ignored. Returns how many were inserted. */
  insertTrades(trades: Trade[]): Promise<number>;
  saveRejections(rejections: Rejection[]): Promise<void>;
  listTrades(): Promise<Trade[]>;
  listPrices(): Promise<MarketPrice[]>;
  /** US-listed tickers that need a price, oldest successful fetch first. */
  tickersNeedingPrice(olderThanHours: number, limit: number): Promise<string[]>;
  savePrices(quotes: Quote[], provider: string): Promise<void>;
  savePriceErrors(errors: { ticker: string; error: string }[]): Promise<void>;
  startLog(job: UpdateLog["job"]): Promise<number>;
  finishLog(id: number, status: UpdateLog["status"], stats: UpdateLog["stats"], message?: string): Promise<void>;
  listLogs(limit: number): Promise<UpdateLog[]>;
  qualityCounts(): Promise<QualityCounts>;
  /** Monotonic marker that changes whenever data changes (used for in-process caching). */
  dataVersion(): Promise<string>;
}

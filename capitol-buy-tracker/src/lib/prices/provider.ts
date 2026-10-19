// Common contract for market-data providers. Implementations live next to this file.

import type { PriceType } from "../types";

export interface Quote {
  ticker: string; // canonical ticker, e.g. "BRK.B"
  price: number;
  currency: string | null; // null = provider does not report it (US listing assumed USD)
  priceType: PriceType;
  priceTimestamp: string | null;
}

export interface QuoteBatchResult {
  quotes: Quote[];
  errors: { ticker: string; error: string }[];
}

export interface PriceProvider {
  id: string;
  label: string;
  fetchQuotes(tickers: string[]): Promise<QuoteBatchResult>;
}

export class RateLimitError extends Error {}

/** Simple sequential throttle: at most `perMinute` calls. */
export function throttle(perMinute: number) {
  const gap = perMinute > 0 ? 60_000 / perMinute : 0;
  let next = 0;
  return async () => {
    const now = Date.now();
    const wait = Math.max(0, next - now);
    next = Math.max(now, next) + gap;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  };
}

export async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (res.status === 429) throw new RateLimitError("HTTP 429 rate limited");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const toNum = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const fromUnix = (s: unknown): string | null => {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n > 1e12 ? n : n * 1000).toISOString();
};

/** Runs `one` for every ticker sequentially (throttled), collecting results and errors. Stops on rate limit. */
export async function perTicker(
  tickers: string[],
  perMinute: number,
  one: (ticker: string) => Promise<Quote | null>,
): Promise<QuoteBatchResult> {
  const wait = throttle(perMinute);
  const out: QuoteBatchResult = { quotes: [], errors: [] };
  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i];
    await wait();
    try {
      const q = await one(t);
      if (q) out.quotes.push(q);
      else out.errors.push({ ticker: t, error: "No quote returned" });
    } catch (e) {
      out.errors.push({ ticker: t, error: e instanceof Error ? e.message : String(e) });
      if (e instanceof RateLimitError) {
        for (const rest of tickers.slice(i + 1)) out.errors.push({ ticker: rest, error: "Skipped: provider rate limit reached" });
        break;
      }
    }
  }
  return out;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

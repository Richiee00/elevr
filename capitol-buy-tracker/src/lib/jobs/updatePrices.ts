// Job 2 — Update market prices (daily). Cached: only tickers older than PRICE_CACHE_TTL_HOURS are fetched.
// On API errors the last valid price is kept; the error is recorded and surfaced as STALE in the UI.

import { config } from "../config";
import type { Repository } from "../db/repository";
import { log } from "../log";
import { getPriceProvider } from "../prices";

export async function updatePrices(repo: Repository, opts: { force?: boolean } = {}) {
  if (repo.kind === "mock") return { status: "success" as const, stats: {}, message: "Mock mode: price updates disabled." };
  const provider = getPriceProvider();
  const logId = await repo.startLog("prices");
  if (!provider) {
    const message = "No market-data API configured (set PRICE_PROVIDER and PRICE_API_KEY).";
    await repo.finishLog(logId, "error", { requested: 0, updated: 0, failed: 0 }, message);
    return { status: "error" as const, stats: {}, message };
  }

  const ttl = opts.force ? 0 : config.price.cacheTtlHours;
  const tickers = await repo.tickersNeedingPrice(ttl, config.price.maxTickersPerRun);
  let status: "success" | "partial" | "error" = "success";
  let message: string | undefined;
  let updated = 0;
  let failed = 0;
  try {
    const res = await provider.fetchQuotes(tickers);
    // Only USD quotes are stored as comparable prices; others are recorded as errors (currency mismatch).
    const usd = res.quotes.filter((q) => q.currency == null || q.currency.toUpperCase() === "USD");
    const nonUsd = res.quotes.filter((q) => q.currency != null && q.currency.toUpperCase() !== "USD");
    await repo.savePrices(usd, provider.id);
    const errors = [...res.errors, ...nonUsd.map((q) => ({ ticker: q.ticker, error: `Currency mismatch: quote in ${q.currency}` }))];
    await repo.savePriceErrors(errors);
    updated = usd.length;
    failed = errors.length;
    if (failed > 0) status = updated > 0 ? "partial" : "error";
    if (failed) message = errors.slice(0, 5).map((e) => `${e.ticker}: ${e.error}`).join("; ");
  } catch (e) {
    status = "error";
    message = e instanceof Error ? e.message : String(e);
    await repo.savePriceErrors(tickers.map((t) => ({ ticker: t, error: message! })));
    failed = tickers.length;
  }
  const stats = { provider: provider.id, requested: tickers.length, updated, failed, cacheTtlHours: ttl };
  await repo.finishLog(logId, status, stats, message);
  log.info("prices.done", { status, ...stats });
  return { status, stats, message };
}

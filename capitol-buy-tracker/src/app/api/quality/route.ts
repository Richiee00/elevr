import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { getRepository } from "@/lib/db";
import { DEFAULT_PREMIUM_PCT } from "@/lib/calc/finance";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const repo = await getRepository();
    const [{ trades, meta, logs }, counts] = await Promise.all([getDataset(DEFAULT_PREMIUM_PCT), repo.qualityCounts()]);
    const tickers = new Map<string, boolean>();
    for (const t of trades) tickers.set(t.ticker, (tickers.get(t.ticker) ?? false) || t.currentPrice != null);
    const lastTrades = logs.find((l) => l.job === "trades");
    const r = counts.rejectedByReason;
    return json({
      meta,
      lastRun: lastTrades ?? null,
      totals: {
        validStored: counts.validRows,
        validDisplayed: trades.length,
        rejectedNotBuy: r.NOT_BUY ?? 0,
        rejectedNotStock: r.NOT_STOCK ?? 0,
        rejectedMissingTicker: r.MISSING_TICKER ?? 0,
        rejectedMissingPrice: r.MISSING_PRICE ?? 0,
        rejectedOther: (r.INVALID_SIZE ?? 0) + (r.INVALID_DATE ?? 0) + (r.MISSING_POLITICIAN ?? 0),
        duplicates: r.DUPLICATE ?? null,
        stocksWithoutPrice: [...tickers.values()].filter((v) => !v).length,
        stocksTotal: tickers.size,
      },
      logs,
    });
  });
}

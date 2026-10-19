// Server-side data access used by the API routes. Loads trades + prices once per data version.

import { config } from "./config";
import { getRepository } from "./db";
import { enrichTrades } from "./calc/enrich";
import type { EnrichedTrade, MarketPrice, Trade, UpdateLog } from "./types";
import { PROVIDER_LABELS } from "./prices";

let cache: { version: string; at: number; trades: Trade[]; prices: MarketPrice[] } | null = null;
const CACHE_MS = 60_000;

async function load() {
  const repo = await getRepository();
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const version = await repo.dataVersion();
  if (cache && cache.version === version) {
    cache.at = Date.now();
    return cache;
  }
  const [trades, prices] = await Promise.all([repo.listTrades(), repo.listPrices()]);
  cache = { version, at: Date.now(), trades, prices };
  return cache;
}

export interface DatasetMeta {
  mode: "live" | "mock";
  pricesEnabled: boolean;
  priceProvider: string | null;
  priceProviderLabel: string | null;
  lastTradesRefresh: string | null;
  lastPricesRefresh: string | null;
  lastPricesStatus: string | null;
  staleAfterHours: number;
}

export async function getDataset(premiumPct: number): Promise<{ trades: EnrichedTrade[]; meta: DatasetMeta; logs: UpdateLog[] }> {
  const repo = await getRepository();
  const [{ trades, prices }, logs] = await Promise.all([load(), repo.listLogs(50)]);
  const mode = config.dataMode;
  const provider = mode === "mock" ? "mock" : config.priceProvider;
  const pricesEnabled = provider !== null;
  const lastOk = (job: string) => logs.find((l) => l.job === job && (l.status === "success" || l.status === "partial"))?.finishedAt ?? null;
  return {
    trades: enrichTrades(trades, prices, { premiumPct, staleAfterHours: config.price.staleAfterHours, pricesEnabled }),
    logs,
    meta: {
      mode,
      pricesEnabled,
      priceProvider: provider,
      priceProviderLabel: provider ? PROVIDER_LABELS[provider] ?? provider : null,
      lastTradesRefresh: lastOk("trades"),
      lastPricesRefresh: lastOk("prices"),
      lastPricesStatus: logs.find((l) => l.job === "prices")?.status ?? null,
      staleAfterHours: config.price.staleAfterHours,
    },
  };
}

export function invalidateDataset() {
  cache = null;
}

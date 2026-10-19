// Joins trades with current prices and computes variation + opportunity status.

import type { EnrichedTrade, MarketPrice, Trade } from "../types";
import { opportunityStatus, priceVariationPct } from "./finance";
import { priceFreshness } from "../prices/market";
import { isDisplayable } from "../normalize/trade";

export interface EnrichOptions {
  premiumPct: number;
  staleAfterHours: number;
  pricesEnabled: boolean; // false when no market-data API is configured
  now?: Date;
}

export function enrichTrades(trades: Trade[], prices: MarketPrice[], opts: EnrichOptions): EnrichedTrade[] {
  const byTicker = new Map(prices.map((p) => [p.ticker, p]));
  const out: EnrichedTrade[] = [];
  for (const t of trades) {
    if (!isDisplayable(t)) continue; // never display anything that is not a valid BUY of a stock
    const p = opts.pricesEnabled ? byTicker.get(t.ticker) : undefined;
    const hasPrice = p != null && p.price != null && p.price > 0;
    const currency = hasPrice ? (p!.currency ?? "USD") : null;
    const sameCurrency = hasPrice && currency === t.priceCurrency;
    const current = sameCurrency ? p!.price : null;
    out.push({
      ...t,
      currentPrice: current,
      currentPriceCurrency: currency,
      priceProvider: hasPrice ? p!.provider : null,
      priceUpdatedAt: hasPrice ? p!.fetchedAt : null,
      priceFreshness: hasPrice ? priceFreshness(p!, opts.staleAfterHours, opts.now) : "UNAVAILABLE",
      variationPct: sameCurrency ? priceVariationPct(current, t.purchasePrice) : null,
      status: hasPrice && !sameCurrency ? "CURRENCY_MISMATCH" : opportunityStatus(current, t.purchasePrice, opts.premiumPct),
    });
  }
  return out;
}

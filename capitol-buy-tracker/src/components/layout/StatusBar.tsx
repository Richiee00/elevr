"use client";

import { formatDateTime } from "@/lib/format";

export interface Meta {
  mode: "live" | "mock";
  pricesEnabled: boolean;
  priceProviderLabel: string | null;
  lastTradesRefresh: string | null;
  lastPricesRefresh: string | null;
  lastPricesStatus: string | null;
}

/** Data-source banner: mock warning, missing price API, last refresh times. */
export function StatusBar({ meta }: { meta: Meta | null | undefined }) {
  if (!meta) return null;
  return (
    <div className="space-y-2">
      {meta.mode === "mock" && (
        <div className="rounded-md border-2 border-dashed border-orange-500 bg-orange-950/40 px-4 py-2 text-xs font-semibold text-orange-200" role="alert">
          ⚠ MOCK DATA — DEVELOPMENT ONLY. Politicians, trades and prices on this screen are fictional fixtures (DATA_MODE=mock). Nothing here comes from Capitol Trades or a market-data provider.
        </div>
      )}
      {!meta.pricesEnabled && (
        <div className="rounded-md border border-yellow-800 bg-yellow-950/30 px-4 py-2 text-xs text-yellow-200" role="status">
          <span className="font-semibold">Price data unavailable</span> — no market-data API is configured. Set <code className="text-yellow-100">PRICE_PROVIDER</code> and <code className="text-yellow-100">PRICE_API_KEY</code> (server-side environment variables). Variations are not calculated and no trade is included in the opportunity filter.
        </div>
      )}
      {meta.pricesEnabled && meta.lastPricesStatus === "error" && (
        <div className="rounded-md border border-red-900 bg-red-950/30 px-4 py-2 text-xs text-red-200" role="status">
          The last market-price update failed. The last valid prices are kept and marked <span className="font-semibold">STALE</span> when they exceed the freshness limit.
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-faint">
        <span>
          Trades refreshed: <span className="text-muted">{formatDateTime(meta.lastTradesRefresh)}</span>
        </span>
        <span>
          Prices refreshed: <span className="text-muted">{formatDateTime(meta.lastPricesRefresh)}</span>
        </span>
        <span>
          Price provider: <span className="text-muted">{meta.priceProviderLabel ?? "not configured"}</span>
        </span>
      </div>
    </div>
  );
}

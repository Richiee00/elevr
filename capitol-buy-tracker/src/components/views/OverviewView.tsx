"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useFilters } from "@/hooks/useFilters";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { StatusBar, type Meta } from "@/components/layout/StatusBar";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ErrorState, Loading, Empty } from "@/components/ui/States";
import { TradesTable } from "@/components/tables/TradesTable";
import { StocksTable } from "@/components/tables/StocksTable";
import { OpportunityDistributionChart, PriceComparisonChart, TopPoliticiansChart, TopStocksChart, VolumeOverTimeChart } from "@/components/charts/Charts";
import { formatDateTime, formatInt, formatUsdShort } from "@/lib/format";
import { serializeFilters } from "@/lib/query";
import type { EnrichedTrade, PoliticianAggregate, StockAggregate } from "@/lib/types";

interface Dashboard {
  meta: Meta;
  kpis: {
    validTrades: number;
    uniqueStocks: number;
    uniquePoliticians: number;
    totalEstimated: number;
    stocksBelow: number;
    stocksNear: number;
    stocksAbove: number;
    stocksNoPrice: number;
    largestBuy: { id: string; ticker: string; politicianName: string; sizeEstimated: number; sizeLabel: string } | null;
    mostBought: { ticker: string; issuerName: string; totalEstimated: number } | null;
    lastDataRefresh: string | null;
  };
  charts: {
    topStocks: { ticker: string; issuerName: string; volume: number; trades: number }[];
    priceComparison: { ticker: string; buyPrice: number; currentPrice: number | null; variationPct: number | null }[];
    volumeOverTime: { date: string; volume: number; trades: number }[];
    topPoliticians: PoliticianAggregate[];
    distribution: { BELOW: number; NEAR: number; ABOVE: number; NO_PRICE: number };
  };
  latestLarge: EnrichedTrade[];
  opportunities: StockAggregate[];
}

export function OverviewView() {
  const { filters, set, queryString } = useFilters();
  const { data, error, loading, retry } = useApi<Dashboard>(`/api/dashboard?${queryString}`);
  const pq = queryString ? `?${queryString}` : "";

  return (
    <div className="space-y-4">
      <StatusBar meta={data?.meta} />
      <FilterPanel />
      {error && <ErrorState error={error} onRetry={retry} />}
      {loading && !data && <Loading label="Loading dashboard…" />}
      {data && (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {data.kpis.validTrades === 0 ? (
            <Card>
              <Empty title="No valid BUY trades match these filters" hint="Run `npm run update:trades` to ingest data, or relax the filters." />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard label="Valid Buy Trades" value={formatInt(data.kpis.validTrades)} />
                <KpiCard label="Unique Stocks" value={formatInt(data.kpis.uniqueStocks)} />
                <KpiCard label="Unique Politicians" value={formatInt(data.kpis.uniquePoliticians)} />
                <KpiCard label="Total Estimated Buy Volume" value={formatUsdShort(data.kpis.totalEstimated)} hint="Sum of range midpoints" />
                <KpiCard label="Stocks Below Buy Price" value={formatInt(data.kpis.stocksBelow)} tone="up" hint="vs weighted avg buy price" />
                <KpiCard label="Stocks Near Buy Price" value={formatInt(data.kpis.stocksNear)} tone="near" hint={`within +${filters.premium}%`} />
                <KpiCard label="Stocks Above Buy Price" value={formatInt(data.kpis.stocksAbove)} tone="muted" hint={data.kpis.stocksNoPrice ? `${data.kpis.stocksNoPrice} without price` : undefined} />
                <KpiCard label="Largest Individual Buy" value={data.kpis.largestBuy ? formatUsdShort(data.kpis.largestBuy.sizeEstimated) : "—"} hint={data.kpis.largestBuy ? `${data.kpis.largestBuy.ticker} · ${data.kpis.largestBuy.politicianName} · ${data.kpis.largestBuy.sizeLabel}` : undefined} />
                <KpiCard
                  label="Most Bought Stock"
                  value={data.kpis.mostBought ? <Link href={`/stocks/${data.kpis.mostBought.ticker}${pq}`} className="font-mono text-link">{data.kpis.mostBought.ticker}</Link> : "—"}
                  hint={data.kpis.mostBought ? `${data.kpis.mostBought.issuerName} · ${formatUsdShort(data.kpis.mostBought.totalEstimated)}` : undefined}
                />
                <KpiCard label="Last Data Refresh" value={<span className="text-sm">{formatDateTime(data.kpis.lastDataRefresh)}</span>} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Top 10 Stocks by Estimated Buy Volume" className="lg:col-span-2" actions={<Link href={`/stocks${pq}`} className="text-xs text-link">All stocks →</Link>}>
                  <TopStocksChart data={data.charts.topStocks} />
                </Card>
                <Card title="Price Opportunity Distribution" subtitle="Stocks by current price vs volume-weighted average buy price">
                  <OpportunityDistributionChart dist={data.charts.distribution} premium={filters.premium} />
                </Card>
              </div>

              <Card title="Stocks Below or Near Politician Buy Price" subtitle={`Current price ≤ weighted avg buy price × ${(1 + filters.premium / 100).toFixed(4)}`} actions={<Link href={`/stocks?${serializeFilters({ ...filters, status: "OPPORTUNITY" })}`} className="text-xs text-link">View all →</Link>}>
                {data.opportunities.length ? (
                  <StocksTable rows={data.opportunities.map((s, i) => ({ ...s, rank: i + 1 }))} columns={["ticker", "company", "trades", "pols", "est", "wavg", "current", "var", "status"]} maxHeight="none" />
                ) : (
                  <Empty title={data.meta.pricesEnabled ? "No stocks currently below or near the politicians' buy price" : "Price data unavailable"} hint={data.meta.pricesEnabled ? "Try increasing the maximum premium." : "Configure a market-data API to enable this view."} />
                )}
              </Card>

              <Card title="Latest Large Purchases" subtitle="Most recent buys with an estimated size ≥ $50K" actions={<Link href={`/trades?minEst=50000&sort=tradeDate`} className="text-xs text-link">All trades →</Link>}>
                {data.latestLarge.length ? <TradesTable rows={data.latestLarge} columns={["ticker", "company", "politician", "party", "tradeDate", "filedAfter", "type", "size", "est", "buy", "current", "var", "status"]} maxHeight="none" /> : <Empty />}
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Purchase Price vs Current Price" subtitle="Top 10 stocks by volume with a current price">
                  <PriceComparisonChart data={data.charts.priceComparison} />
                </Card>
                <Card title="Buy Volume Over Time" subtitle="Estimated volume by trade date">
                  <VolumeOverTimeChart data={data.charts.volumeOverTime} bucket={filters.bucket} onBucket={(bucket) => set({ bucket }, { keepPage: true })} />
                </Card>
              </div>

              <Card title="Top Politicians by Buy Volume">
                <TopPoliticiansChart data={data.charts.topPoliticians} />
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

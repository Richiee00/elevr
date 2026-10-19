"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useFilters } from "@/hooks/useFilters";
import { PremiumControl } from "@/components/filters/FilterPanel";
import { StatusBar, type Meta } from "@/components/layout/StatusBar";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ErrorState, Loading } from "@/components/ui/States";
import { FreshnessTag, PartyTag, StatusBadge } from "@/components/ui/Badges";
import { DataTable } from "@/components/ui/DataTable";
import { TradesTable } from "@/components/tables/TradesTable";
import { PriceDistributionChart, VolumeOverTimeChart } from "@/components/charts/Charts";
import { formatDate, formatDateTime, formatPct, formatPrice, formatUsdShort } from "@/lib/format";
import type { EnrichedTrade, PoliticianAggregate, StockAggregate } from "@/lib/types";

interface StockDetail {
  meta: Meta;
  stock: StockAggregate;
  largest: EnrichedTrade;
  mostRecent: EnrichedTrade;
  history: EnrichedTrade[];
  politicians: PoliticianAggregate[];
  priceDistribution: { label: string; trades: number; volume: number }[];
  volumeOverTime: { date: string; volume: number; trades: number }[];
}

export function StockDetailView({ ticker }: { ticker: string }) {
  const { filters, set, queryString } = useFilters();
  const { data, error, loading, retry } = useApi<StockDetail>(`/api/stocks/${encodeURIComponent(ticker)}?premium=${filters.premium}&bucket=${filters.bucket}`);
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <Loading label={`Loading ${ticker}…`} />;
  const { stock: s } = data;
  const tone = s.variationPct == null ? "muted" : s.variationPct > 0 ? "up" : s.variationPct < 0 ? "down" : "muted";

  return (
    <div className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
      <StatusBar meta={data.meta} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/stocks${queryString ? `?${queryString}` : ""}`} className="text-xs text-muted hover:text-ink">
            ← Stock aggregation
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold">
            <span className="font-mono text-link">{s.ticker}</span>
            <span className="text-lg font-medium text-ink">{s.issuerName}</span>
            <StatusBadge status={s.status} />
          </h1>
          {s.sector && <div className="mt-1 text-xs text-muted">{s.sector}</div>}
        </div>
        <PremiumControl />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Current Price" value={s.currentPrice == null ? <span className="text-sm text-faint">Price data unavailable</span> : formatPrice(s.currentPrice)} hint={s.priceUpdatedAt ? <span>{formatDateTime(s.priceUpdatedAt)} · <FreshnessTag freshness={s.priceFreshness} /></span> : undefined} />
        <KpiCard label="Weighted Avg Politician Buy Price" value={formatPrice(s.weightedAvgPrice)} hint="Weighted by estimated size" />
        <KpiCard label="Variation %" value={formatPct(s.variationPct)} tone={tone} hint="Current vs weighted avg" />
        <KpiCard label="Total Estimated Buy Volume" value={formatUsdShort(s.totalEstimated)} hint={`${formatUsdShort(s.totalMin)} – ${formatUsdShort(s.totalMax)}`} />
        <KpiCard label="Buy Trades" value={s.tradeCount} />
        <KpiCard label="Unique Politicians" value={s.uniquePoliticians} />
        <KpiCard label="Largest Purchase" value={formatUsdShort(data.largest.sizeEstimated)} hint={`${data.largest.politicianName} · ${data.largest.sizeLabel} · ${formatDate(data.largest.tradeDate)}`} />
        <KpiCard label="Most Recent Purchase" value={<span className="text-base">{formatDate(data.mostRecent.tradeDate)}</span>} hint={`${data.mostRecent.politicianName} · ${data.mostRecent.sizeLabel} @ ${formatPrice(data.mostRecent.purchasePrice)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Purchase Price Distribution" subtitle="Number of buys per purchase-price range">
          <PriceDistributionChart data={data.priceDistribution} currentPrice={s.currentPrice} />
        </Card>
        <Card title="Buy Volume Over Time">
          <VolumeOverTimeChart data={data.volumeOverTime} bucket={filters.bucket} onBucket={(bucket) => set({ bucket }, { keepPage: true })} />
        </Card>
      </div>

      <Card title="Politicians Who Bought">
        <DataTable
          rows={data.politicians}
          rowKey={(p) => p.politicianId}
          maxHeight="none"
          columns={[
            { key: "name", header: "Politician", render: (p) => <Link href={`/politicians/${encodeURIComponent(p.politicianId)}`} className="text-link hover:underline">{p.politicianName}</Link> },
            { key: "party", header: "Party", render: (p) => <PartyTag party={p.party} /> },
            { key: "chamber", header: "Chamber", render: (p) => <span className="text-muted">{p.chamber}{p.state ? ` · ${p.state}` : ""}</span> },
            { key: "n", header: "Buys", align: "right", render: (p) => <span className="num">{p.tradeCount}</span> },
            { key: "vol", header: "Estimated Volume", align: "right", render: (p) => <span className="num font-semibold">{formatUsdShort(p.totalEstimated)}</span> },
            { key: "largest", header: "Largest Buy", align: "right", render: (p) => <span className="num">{formatUsdShort(p.largestBuy)}</span> },
          ]}
        />
      </Card>

      <Card title="Historical Purchase List" subtitle={`${data.history.length} valid BUY trades, most recent first`}>
        <TradesTable rows={data.history} columns={["ticker", "politician", "party", "chamber", "owner", "tradeDate", "publishedDate", "filedAfter", "type", "size", "est", "buy", "current", "var", "status", "source"]} />
      </Card>
    </div>
  );
}

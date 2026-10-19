"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useFilters } from "@/hooks/useFilters";
import { PremiumControl } from "@/components/filters/FilterPanel";
import { StatusBar, type Meta } from "@/components/layout/StatusBar";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ErrorState, Loading } from "@/components/ui/States";
import { PartyTag } from "@/components/ui/Badges";
import { TradesTable } from "@/components/tables/TradesTable";
import { StocksTable } from "@/components/tables/StocksTable";
import { formatDate, formatUsdShort } from "@/lib/format";
import type { EnrichedTrade, PoliticianAggregate, StockAggregate } from "@/lib/types";

interface PoliticianDetail {
  meta: Meta;
  politician: PoliticianAggregate;
  largest: EnrichedTrade;
  stocks: StockAggregate[];
  history: EnrichedTrade[];
}

export function PoliticianDetailView({ id }: { id: string }) {
  const { filters } = useFilters();
  const { data, error, loading, retry } = useApi<PoliticianDetail>(`/api/politicians/${encodeURIComponent(id)}?premium=${filters.premium}`);
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <Loading label="Loading politician…" />;
  const p = data.politician;

  return (
    <div className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
      <StatusBar meta={data.meta} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/trades?politician=${encodeURIComponent(p.politicianId)}`} className="text-xs text-muted hover:text-ink">
            View in trades table →
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{p.politicianName}</h1>
          <div className="mt-1 flex gap-3 text-sm">
            <PartyTag party={p.party} />
            <span className="text-muted">{p.chamber}</span>
            {p.state && <span className="text-muted">{p.state}</span>}
          </div>
        </div>
        <PremiumControl />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Estimated Buy Volume" value={formatUsdShort(p.totalEstimated)} />
        <KpiCard label="Stock Purchases" value={p.tradeCount} hint={`${p.uniqueStocks} different stocks`} />
        <KpiCard label="Largest Purchase" value={formatUsdShort(data.largest.sizeEstimated)} hint={`${data.largest.ticker} · ${data.largest.sizeLabel} · ${formatDate(data.largest.tradeDate)}`} />
        <KpiCard label="Most Purchased Stock" value={<Link href={`/stocks/${data.stocks[0].ticker}`} className="font-mono text-link">{data.stocks[0].ticker}</Link>} hint={`${formatUsdShort(data.stocks[0].totalEstimated)} in ${data.stocks[0].tradeCount} buys`} />
        <KpiCard label="Average Filing Delay" value={p.avgFilingDelay == null ? "—" : `${p.avgFilingDelay.toFixed(1)} days`} hint="Trade date → publication" />
      </div>

      <Card title="Most Purchased Stocks" subtitle="By estimated volume">
        <StocksTable rows={data.stocks.map((s, i) => ({ ...s, rank: i + 1 }))} columns={["ticker", "company", "trades", "est", "wavg", "current", "var", "latest", "largest", "status"]} maxHeight="420px" />
      </Card>

      <Card title="Complete Buy History" subtitle={`${data.history.length} valid BUY trades, most recent first`}>
        <TradesTable rows={data.history} columns={["ticker", "company", "owner", "tradeDate", "publishedDate", "filedAfter", "type", "size", "est", "buy", "current", "var", "status", "updated", "source"]} />
      </Card>
    </div>
  );
}

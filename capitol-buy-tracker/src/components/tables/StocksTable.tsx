"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FreshnessTag, StatusBadge } from "@/components/ui/Badges";
import { formatDate, formatPct, formatPrice, formatUsdShort, pctClass } from "@/lib/format";
import type { StockAggregate } from "@/lib/types";
import { rowTone } from "./TradesTable";

export type RankedStock = StockAggregate & { rank?: number };

const COLUMNS: Column<RankedStock>[] = [
  {
    key: "ticker",
    header: "Rank · Ticker",
    sortKey: "ticker",
    render: (s) => (
      <span className="inline-flex items-baseline gap-2">
        {s.rank != null && <span className="num w-7 text-right text-faint">{s.rank}</span>}
        <Link href={`/stocks/${encodeURIComponent(s.ticker)}`} className="font-mono font-semibold text-link hover:underline">{s.ticker}</Link>
      </span>
    ),
  },
  { key: "company", header: "Company", sortKey: "issuerName", render: (s) => <span className="block max-w-[200px] truncate" title={s.issuerName}>{s.issuerName}</span> },
  { key: "trades", header: "Buy Transactions", sortKey: "tradeCount", align: "right", render: (s) => <span className="num">{s.tradeCount}</span> },
  { key: "pols", header: "Unique Politicians", sortKey: "uniquePoliticians", align: "right", render: (s) => <span className="num">{s.uniquePoliticians}</span> },
  { key: "min", header: "Total Min Volume", sortKey: "totalMin", align: "right", render: (s) => <span className="num text-muted">{formatUsdShort(s.totalMin)}</span> },
  { key: "est", header: "Total Estimated Volume", sortKey: "totalEstimated", align: "right", render: (s) => <span className="num font-semibold">{formatUsdShort(s.totalEstimated)}</span> },
  { key: "max", header: "Total Max Volume", sortKey: "totalMax", align: "right", render: (s) => <span className="num text-muted">{formatUsdShort(s.totalMax)}</span> },
  { key: "wavg", header: "Vol-Weighted Avg Buy Price", sortKey: "weightedAvgPrice", align: "right", render: (s) => <span className="num">{formatPrice(s.weightedAvgPrice)}</span> },
  { key: "current", header: "Current Price", sortKey: "currentPrice", align: "right", render: (s) => (s.currentPrice == null ? <span className="text-[10px] text-faint">Price data unavailable</span> : <div className="leading-tight"><div className="num">{formatPrice(s.currentPrice)}</div><FreshnessTag freshness={s.priceFreshness} /></div>) },
  { key: "var", header: "Variation vs W. Avg", sortKey: "variationPct", align: "right", render: (s) => <span className={`num font-semibold ${pctClass(s.variationPct)}`}>{formatPct(s.variationPct)}</span> },
  { key: "latest", header: "Latest Trade", sortKey: "latestTradeDate", render: (s) => <span className="num text-muted">{formatDate(s.latestTradeDate)}</span> },
  { key: "largest", header: "Largest Buy", sortKey: "largestBuy", align: "right", render: (s) => <span className="num">{formatUsdShort(s.largestBuy)}</span> },
  { key: "status", header: "Opportunity Status", sortKey: "status", render: (s) => <StatusBadge status={s.status} /> },
];

export function StocksTable({ rows, sort, dir, onSort, columns, maxHeight }: { rows: RankedStock[]; sort?: string; dir?: "asc" | "desc"; onSort?: (k: string) => void; columns?: string[]; maxHeight?: string }) {
  const cols = columns ? COLUMNS.filter((c) => columns.includes(c.key)) : COLUMNS;
  return <DataTable columns={cols} rows={rows} rowKey={(s) => s.ticker} rowClassName={(s) => rowTone(s.status)} sort={sort} dir={dir} onSort={onSort} maxHeight={maxHeight} />;
}

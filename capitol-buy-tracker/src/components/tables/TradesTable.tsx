"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FreshnessTag, PartyTag, StatusBadge, TypeBadge } from "@/components/ui/Badges";
import { formatDate, formatDateTime, formatPct, formatPrice, formatUsdShort, pctClass } from "@/lib/format";
import type { EnrichedTrade } from "@/lib/types";

export type RankedTrade = EnrichedTrade & { rank?: number };

export function rowTone(status: string) {
  return status === "BELOW" ? "row-below" : status === "NEAR" ? "row-near" : "";
}

export const ALL_TRADE_COLUMNS: Column<RankedTrade>[] = [
  // Rank and ticker share the sticky first column so both stay visible when scrolling sideways.
  {
    key: "ticker",
    header: "Rank · Ticker",
    sortKey: "ticker",
    render: (t) => (
      <span className="inline-flex items-baseline gap-2">
        {t.rank != null && <span className="num w-7 text-right text-faint">{t.rank}</span>}
        <Link href={`/stocks/${encodeURIComponent(t.ticker)}`} className="font-mono font-semibold text-link hover:underline">{t.ticker}</Link>
      </span>
    ),
  },
  { key: "company", header: "Company", sortKey: "issuerName", render: (t) => <span className="block max-w-[200px] truncate" title={t.issuerName}>{t.issuerName}</span> },
  { key: "politician", header: "Politician", sortKey: "politicianName", render: (t) => <Link href={`/politicians/${encodeURIComponent(t.politicianId)}`} className="hover:text-link hover:underline">{t.politicianName}</Link> },
  { key: "party", header: "Party", sortKey: "party", render: (t) => <PartyTag party={t.party} /> },
  { key: "chamber", header: "Chamber", sortKey: "chamber", render: (t) => <span className="text-muted">{t.chamber}{t.state ? ` · ${t.state}` : ""}</span> },
  { key: "owner", header: "Owner", sortKey: "owner", render: (t) => <span className="text-muted">{t.owner}</span> },
  { key: "tradeDate", header: "Trade Date", sortKey: "tradeDate", render: (t) => <span className="num">{formatDate(t.tradeDate)}</span> },
  { key: "publishedDate", header: "Published", sortKey: "publishedDate", render: (t) => <span className="num text-muted">{formatDate(t.publishedDate)}</span> },
  { key: "filedAfter", header: "Filed After", sortKey: "filedAfterDays", align: "right", render: (t) => <span className="num text-muted">{t.filedAfterDays == null ? "—" : `${t.filedAfterDays}d`}</span> },
  { key: "type", header: "Type", sortKey: "txType", render: (t) => <TypeBadge type={t.txType} original={t.txTypeOriginal} /> },
  { key: "size", header: "Original Size", sortKey: "sizeLabel", render: (t) => <span className="num text-muted">{t.sizeLabel}</span> },
  { key: "est", header: "Estimated Size", sortKey: "sizeEstimated", align: "right", render: (t) => <span className="num font-semibold" title={`$${t.sizeMin.toLocaleString()} – $${t.sizeMax.toLocaleString()} (midpoint)`}>{formatUsdShort(t.sizeEstimated)}</span> },
  { key: "buy", header: "Politician Buy Price", sortKey: "purchasePrice", align: "right", render: (t) => <span className="num">{formatPrice(t.purchasePrice)}</span> },
  { key: "current", header: "Current Price", sortKey: "currentPrice", align: "right", render: (t) => (t.currentPrice == null ? <span className="text-[10px] text-faint">Price data unavailable</span> : <span className="num">{formatPrice(t.currentPrice)}</span>) },
  { key: "var", header: "Variation %", sortKey: "variationPct", align: "right", render: (t) => <span className={`num font-semibold ${pctClass(t.variationPct)}`}>{formatPct(t.variationPct)}</span> },
  { key: "status", header: "Price Status", sortKey: "status", render: (t) => <StatusBadge status={t.status} /> },
  { key: "updated", header: "Last Price Update", sortKey: "priceUpdatedAt", render: (t) => (t.priceUpdatedAt ? <div className="leading-tight"><div className="num text-muted">{formatDateTime(t.priceUpdatedAt)}</div><FreshnessTag freshness={t.priceFreshness} /></div> : <FreshnessTag freshness="UNAVAILABLE" />) },
  { key: "source", header: "Source", render: (t) => <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">Capitol Trades ↗</a> },
];

export function TradesTable({ rows, sort, dir, onSort, columns, maxHeight }: { rows: RankedTrade[]; sort?: string; dir?: "asc" | "desc"; onSort?: (k: string) => void; columns?: string[]; maxHeight?: string }) {
  const cols = columns ? ALL_TRADE_COLUMNS.filter((c) => columns.includes(c.key)) : ALL_TRADE_COLUMNS;
  return <DataTable columns={cols} rows={rows} rowKey={(t) => t.id} rowClassName={(t) => rowTone(t.status)} sort={sort} dir={dir} onSort={onSort} maxHeight={maxHeight} />;
}

import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { parseFilters } from "@/lib/query";
import { filterTrades, paginate, sortTrades } from "@/lib/calc/filters";
import { csvResponse, toCsv } from "@/lib/csv";
import type { EnrichedTrade } from "@/lib/types";

export const dynamic = "force-dynamic";

const CSV_COLUMNS: { header: string; value: (t: EnrichedTrade & { rank: number }) => unknown }[] = [
  { header: "Rank", value: (t) => t.rank },
  { header: "Trade ID", value: (t) => t.id },
  { header: "Ticker", value: (t) => t.ticker },
  { header: "Company", value: (t) => t.issuerName },
  { header: "Sector", value: (t) => t.sector },
  { header: "Politician", value: (t) => t.politicianName },
  { header: "Party", value: (t) => t.party },
  { header: "Chamber", value: (t) => t.chamber },
  { header: "State", value: (t) => t.state },
  { header: "Owner", value: (t) => t.owner },
  { header: "Trade Date", value: (t) => t.tradeDate },
  { header: "Published Date", value: (t) => t.publishedDate },
  { header: "Filed After (days)", value: (t) => t.filedAfterDays },
  { header: "Type", value: (t) => t.txType },
  { header: "Original Type Label", value: (t) => t.txTypeOriginal },
  { header: "Original Size", value: (t) => t.sizeLabel },
  { header: "Minimum Size (USD)", value: (t) => t.sizeMin },
  { header: "Maximum Size (USD)", value: (t) => t.sizeMax },
  { header: "Estimated Size (USD)", value: (t) => t.sizeEstimated },
  { header: "Politician Buy Price (USD)", value: (t) => t.purchasePrice.toFixed(2) },
  { header: "Current Price (USD)", value: (t) => t.currentPrice?.toFixed(2) ?? "Price data unavailable" },
  { header: "Variation %", value: (t) => (t.variationPct == null ? "" : t.variationPct.toFixed(2)) },
  { header: "Price Status", value: (t) => t.status },
  { header: "Price Freshness", value: (t) => t.priceFreshness },
  { header: "Last Price Update", value: (t) => t.priceUpdatedAt },
  { header: "Source URL", value: (t) => t.sourceUrl },
];

export async function GET(req: Request) {
  return handle(async () => {
    const sp = new URL(req.url).searchParams;
    const f = parseFilters(sp);
    const { trades, meta } = await getDataset(f.premium);
    const sorted = sortTrades(filterTrades(trades, f, { withStatus: true }), f.sort, f.dir).map((t, i) => ({ ...t, rank: i + 1 }));
    if (sp.get("format") === "csv") {
      return csvResponse(toCsv(sorted, CSV_COLUMNS), `capitol-buy-tracker-trades-${new Date().toISOString().slice(0, 10)}.csv`);
    }
    const page = paginate(sorted, f.page, f.pageSize);
    return json({ meta, ...page, totalEstimated: sorted.reduce((s, t) => s + t.sizeEstimated, 0) });
  });
}

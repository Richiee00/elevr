import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { parseFilters } from "@/lib/query";
import { filterTrades, paginate } from "@/lib/calc/filters";
import { aggregateByStock, filterStocks, sortStocks } from "@/lib/calc/aggregate";
import { csvResponse, toCsv } from "@/lib/csv";
import type { StockAggregate } from "@/lib/types";

export const dynamic = "force-dynamic";

const CSV_COLUMNS: { header: string; value: (s: StockAggregate & { rank: number }) => unknown }[] = [
  { header: "Rank", value: (s) => s.rank },
  { header: "Ticker", value: (s) => s.ticker },
  { header: "Company", value: (s) => s.issuerName },
  { header: "Number of Buy Transactions", value: (s) => s.tradeCount },
  { header: "Number of Unique Politicians", value: (s) => s.uniquePoliticians },
  { header: "Total Minimum Volume (USD)", value: (s) => s.totalMin },
  { header: "Total Estimated Volume (USD)", value: (s) => s.totalEstimated },
  { header: "Total Maximum Volume (USD)", value: (s) => s.totalMax },
  { header: "Volume-Weighted Average Buy Price (USD)", value: (s) => s.weightedAvgPrice.toFixed(2) },
  { header: "Current Price (USD)", value: (s) => s.currentPrice?.toFixed(2) ?? "Price data unavailable" },
  { header: "Variation vs Weighted Avg %", value: (s) => (s.variationPct == null ? "" : s.variationPct.toFixed(2)) },
  { header: "Latest Trade Date", value: (s) => s.latestTradeDate },
  { header: "Largest Individual Buy (USD est.)", value: (s) => s.largestBuy },
  { header: "Opportunity Status", value: (s) => s.status },
];

export async function GET(req: Request) {
  return handle(async () => {
    const sp = new URL(req.url).searchParams;
    const f = parseFilters(sp);
    const { trades, meta } = await getDataset(f.premium);
    const stocks = sortStocks(filterStocks(aggregateByStock(filterTrades(trades, f, { withStatus: false }), f.premium), f), f.sort, f.dir).map((s, i) => ({ ...s, rank: i + 1 }));
    if (sp.get("format") === "csv") {
      return csvResponse(toCsv(stocks, CSV_COLUMNS), `capitol-buy-tracker-stocks-${new Date().toISOString().slice(0, 10)}.csv`);
    }
    return json({ meta, ...paginate(stocks, f.page, f.pageSize) });
  });
}

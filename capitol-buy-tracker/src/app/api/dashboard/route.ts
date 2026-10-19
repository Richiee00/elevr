import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { parseFilters } from "@/lib/query";
import { filterTrades, sortTrades } from "@/lib/calc/filters";
import { aggregateByPolitician, aggregateByStock, filterStocks, sortStocks, statusDistribution, topBy, volumeOverTime } from "@/lib/calc/aggregate";
import { isOpportunity } from "@/lib/calc/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const f = parseFilters(new URL(req.url).searchParams);
    const { trades: all, meta } = await getDataset(f.premium);
    const trades = filterTrades(all, f, { withStatus: true });
    const stocks = sortStocks(filterStocks(aggregateByStock(filterTrades(all, f, { withStatus: false }), f.premium), f), "", "desc");
    const dist = statusDistribution(stocks);
    const largest = topBy(trades, (t) => t.sizeEstimated, 1)[0] ?? null;
    const most = stocks[0] ?? null;

    const withPrice = stocks.filter((s) => s.currentPrice != null);
    const latestLarge = sortTrades(trades, "tradeDate", "desc").filter((t) => t.sizeEstimated >= 50_000).slice(0, 10);

    return json({
      meta,
      kpis: {
        validTrades: trades.length,
        uniqueStocks: new Set(trades.map((t) => t.ticker)).size,
        uniquePoliticians: new Set(trades.map((t) => t.politicianId)).size,
        totalEstimated: trades.reduce((s, t) => s + t.sizeEstimated, 0),
        stocksBelow: dist.BELOW,
        stocksNear: dist.NEAR,
        stocksAbove: dist.ABOVE,
        stocksNoPrice: dist.NO_PRICE,
        largestBuy: largest && { id: largest.id, ticker: largest.ticker, politicianName: largest.politicianName, sizeEstimated: largest.sizeEstimated, sizeLabel: largest.sizeLabel },
        mostBought: most && { ticker: most.ticker, issuerName: most.issuerName, totalEstimated: most.totalEstimated },
        lastDataRefresh: meta.lastTradesRefresh,
      },
      charts: {
        topStocks: stocks.slice(0, 10).map((s) => ({ ticker: s.ticker, issuerName: s.issuerName, volume: s.totalEstimated, trades: s.tradeCount })),
        priceComparison: withPrice.slice(0, 10).map((s) => ({ ticker: s.ticker, buyPrice: s.weightedAvgPrice, currentPrice: s.currentPrice, variationPct: s.variationPct })),
        volumeOverTime: volumeOverTime(trades, f.bucket),
        topPoliticians: aggregateByPolitician(trades).slice(0, 10),
        distribution: dist,
      },
      latestLarge,
      opportunities: stocks.filter((s) => isOpportunity(s.status)).slice(0, 10),
    });
  });
}

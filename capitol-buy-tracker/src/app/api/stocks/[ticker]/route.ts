import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { parseFilters } from "@/lib/query";
import { sortTrades } from "@/lib/calc/filters";
import { aggregateByPolitician, aggregateByStock, priceDistribution, volumeOverTime } from "@/lib/calc/aggregate";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ ticker: string }> }) {
  return handle(async () => {
    const { ticker } = await ctx.params;
    const f = parseFilters(new URL(req.url).searchParams);
    const { trades, meta } = await getDataset(f.premium);
    const rows = trades.filter((t) => t.ticker === decodeURIComponent(ticker).toUpperCase());
    if (!rows.length) return json({ error: "No valid BUY trades for this ticker." }, { status: 404 });
    const [stock] = aggregateByStock(rows, f.premium);
    const history = sortTrades(rows, "tradeDate", "desc");
    const largest = sortTrades(rows, "sizeEstimated", "desc")[0];
    return json({
      meta,
      stock,
      largest,
      mostRecent: history[0],
      history,
      politicians: aggregateByPolitician(rows),
      priceDistribution: priceDistribution(rows),
      volumeOverTime: volumeOverTime(rows, f.bucket),
    });
  });
}

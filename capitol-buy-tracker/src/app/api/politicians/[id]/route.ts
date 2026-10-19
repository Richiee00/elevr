import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { parseFilters } from "@/lib/query";
import { sortTrades } from "@/lib/calc/filters";
import { aggregateByPolitician, aggregateByStock, sortStocks } from "@/lib/calc/aggregate";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const f = parseFilters(new URL(req.url).searchParams);
    const { trades, meta } = await getDataset(f.premium);
    const rows = trades.filter((t) => t.politicianId === decodeURIComponent(id));
    if (!rows.length) return json({ error: "No valid BUY trades for this politician." }, { status: 404 });
    const [politician] = aggregateByPolitician(rows);
    return json({
      meta,
      politician,
      largest: sortTrades(rows, "sizeEstimated", "desc")[0],
      stocks: sortStocks(aggregateByStock(rows, f.premium), "", "desc"),
      history: sortTrades(rows, "tradeDate", "desc"),
    });
  });
}

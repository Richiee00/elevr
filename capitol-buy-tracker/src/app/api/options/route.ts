import { handle, json } from "@/lib/api";
import { getDataset } from "@/lib/dataset";
import { DEFAULT_PREMIUM_PCT } from "@/lib/calc/finance";

export const dynamic = "force-dynamic";

const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b));

export async function GET() {
  return handle(async () => {
    const { trades } = await getDataset(DEFAULT_PREMIUM_PCT);
    const pols = new Map(trades.map((t) => [t.politicianId, t.politicianName]));
    const sizes = new Map(trades.map((t) => [t.sizeLabel, t.sizeEstimated]));
    return json({
      politicians: [...pols.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      parties: uniq(trades.map((t) => t.party)),
      chambers: uniq(trades.map((t) => t.chamber)),
      states: uniq(trades.map((t) => t.state)),
      tickers: uniq(trades.map((t) => t.ticker)),
      sectors: uniq(trades.map((t) => t.sector ?? "Unknown")),
      owners: uniq(trades.map((t) => t.owner)),
      sizeLabels: [...sizes.entries()].sort((a, b) => a[1] - b[1]).map(([l]) => l),
    });
  });
}

import { describe, expect, it } from "vitest";
import { normalizeBatch, type RawTradeRecord } from "@/lib/normalize/trade";
import { enrichTrades } from "@/lib/calc/enrich";
import { aggregateByStock, bucketKey, sortStocks, volumeOverTime } from "@/lib/calc/aggregate";
import { filterTrades, sortTrades } from "@/lib/calc/filters";
import { parseFilters } from "@/lib/query";
import type { MarketPrice } from "@/lib/types";

const now = new Date();
const mk = (id: string, p: Partial<RawTradeRecord>): RawTradeRecord => ({
  source: "t", sourceId: id, sourceUrl: "x", politicianId: "P1", politicianName: "P One", party: "d", chamber: "house",
  issuerName: "Acme Corp", ticker: "ACME:US", assetType: "stock", txType: "buy", sizeLabel: "1K–15K", price: 100, tradeDate: "2025-01-02", owner: "self", ...p,
});
const price = (ticker: string, p: number | null, currency = "USD"): MarketPrice => ({
  ticker, price: p, currency, provider: "test", priceType: "CLOSE", priceTimestamp: now.toISOString(), fetchedAt: now.toISOString(), lastAttemptAt: null, lastError: null,
});

const trades = normalizeBatch([
  mk("1", { sizeLabel: "1K–15K", price: 100 }),
  mk("2", { sizeLabel: "50K–100K", price: 110, politicianId: "P2", politicianName: "P Two", tradeDate: "2025-02-10" }),
  mk("3", { ticker: "ZED:US", issuerName: "Zed Inc", sizeLabel: "500K–1M", price: 50 }),
  mk("4", { ticker: "NOP:US", issuerName: "Nop Inc", sizeLabel: "15K–50K", price: 10 }),
]).trades;

describe("stock aggregation", () => {
  const enriched = enrichTrades(trades, [price("ACME", 105), price("ZED", 51), price("NOP", 12, "EUR")], { premiumPct: 2.99, staleAfterHours: 48, pricesEnabled: true });
  const stocks = sortStocks(aggregateByStock(enriched, 2.99), "", "desc");

  it("weighted average uses estimated size", () => {
    const acme = stocks.find((s) => s.ticker === "ACME")!;
    expect(acme.weightedAvgPrice).toBeCloseTo((100 * 8000 + 110 * 75000) / 83000, 6);
    expect(acme.totalEstimated).toBe(83_000);
    expect(acme.totalMin).toBe(51_000);
    expect(acme.totalMax).toBe(115_000);
    expect(acme.uniquePoliticians).toBe(2);
    expect(acme.status).toBe("BELOW"); // 105 < 109.04
    expect(acme.latestTradeDate).toBe("2025-02-10");
    expect(acme.largestBuy).toBe(75_000);
  });
  it("default order: total estimated volume desc", () => expect(stocks.map((s) => s.ticker)).toEqual(["ZED", "ACME", "NOP"]));
  it("NEAR within premium", () => expect(stocks.find((s) => s.ticker === "ZED")!.status).toBe("NEAR"));
  it("never compares prices in different currencies", () => {
    const nop = stocks.find((s) => s.ticker === "NOP")!;
    expect(nop.status).toBe("CURRENCY_MISMATCH");
    expect(nop.variationPct).toBeNull();
    expect(enriched.find((t) => t.ticker === "NOP")!.variationPct).toBeNull();
  });
  it("without a price API nothing is in the opportunity filter", () => {
    const noApi = enrichTrades(trades, [price("ACME", 1)], { premiumPct: 2.99, staleAfterHours: 48, pricesEnabled: false });
    expect(noApi.every((t) => t.currentPrice === null && t.variationPct === null && t.status === "NO_PRICE")).toBe(true);
    expect(filterTrades(noApi, parseFilters(new URLSearchParams("status=OPPORTUNITY")))).toHaveLength(0);
  });
});

describe("sorting & buckets", () => {
  const enriched = enrichTrades(trades, [], { premiumPct: 2.99, staleAfterHours: 48, pricesEnabled: false });
  it("default trade order is estimated size desc", () => {
    expect(sortTrades(enriched, "", "desc").map((t) => t.sizeEstimated)).toEqual([750_000, 75_000, 32_500, 8_000]);
  });
  it("sorting by the size column uses the numeric estimate, not the label text", () => {
    expect(sortTrades(enriched, "sizeLabel", "asc").map((t) => t.sizeLabel)).toEqual(["1K–15K", "15K–50K", "50K–100K", "500K–1M"]);
  });
  it("buckets", () => {
    expect(bucketKey("2025-01-15", "month")).toBe("2025-01-01");
    expect(bucketKey("2025-01-15", "week")).toBe("2025-01-13"); // Monday
    expect(volumeOverTime(enriched, "month")).toEqual([
      { date: "2025-01-01", volume: 790_500, trades: 3 },
      { date: "2025-02-01", volume: 75_000, trades: 1 },
    ]);
  });
});

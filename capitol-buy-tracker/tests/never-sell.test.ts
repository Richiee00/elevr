// Guarantees that SELL (or any non-BUY) operations can never reach what the user sees.
import { describe, expect, it } from "vitest";
import { normalizeBatch, isDisplayable, type RawTradeRecord } from "@/lib/normalize/trade";
import { enrichTrades } from "@/lib/calc/enrich";
import { filterTrades } from "@/lib/calc/filters";
import { aggregateByStock } from "@/lib/calc/aggregate";
import { parseFilters } from "@/lib/query";
import { parseBffPage } from "@/lib/sources/capitoltrades/bff";
import { parseTradesHtml } from "@/lib/sources/capitoltrades/html";
import { MOCK_RAW_TRADES } from "@/mock/fixtures";
import type { Trade } from "@/lib/types";
import { readFileSync } from "node:fs";
import path from "node:path";

const NON_BUY = ["sell", "SELL", "sale", "SALE", "sale_partial", "SALE_PARTIAL", "sell (partial)", "exchange", "EXCHANGE", "receive", "SELL*"];

function raw(i: number, txType: string): RawTradeRecord {
  return {
    source: "t", sourceId: String(i), sourceUrl: "x", politicianId: "P1", politicianName: "P One", party: "r", chamber: "senate",
    issuerName: "Microsoft Corp", ticker: "MSFT:US", assetType: "stock", txType, sizeLabel: "15K–50K", price: 400 + i, tradeDate: "2025-01-02", owner: "self",
  };
}

describe("SELL operations are never displayed", () => {
  it("normalizeBatch drops every non-BUY type", () => {
    const rows = [...NON_BUY.map((t, i) => raw(i, t)), raw(100, "buy"), raw(101, "BUY*")];
    const b = normalizeBatch(rows);
    expect(b.trades.map((t) => t.txType)).toEqual(["BUY", "BUY"]);
    expect(b.stats.rejectedNotBuy).toBe(NON_BUY.length);
  });

  it("enrichTrades filters out tampered stored rows (defence in depth)", () => {
    const good = normalizeBatch([raw(1, "buy")]).trades[0];
    const tampered = { ...good, id: "bad", txType: "SELL" } as unknown as Trade;
    const rows = enrichTrades([good, tampered], [], { premiumPct: 2.99, staleAfterHours: 48, pricesEnabled: false });
    expect(rows.map((r) => r.id)).toEqual([good.id]);
    expect(isDisplayable(tampered)).toBe(false);
  });

  it("the full mock pipeline (trades → filters → aggregation) contains BUY only", () => {
    const b = normalizeBatch(MOCK_RAW_TRADES);
    const enriched = enrichTrades(b.trades, [], { premiumPct: 2.99, staleAfterHours: 48, pricesEnabled: false });
    const shown = filterTrades(enriched, parseFilters(new URLSearchParams()), { withStatus: true });
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((t) => t.txType === "BUY" && t.assetType === "STOCK")).toBe(true);
    expect(b.rejections.some((r) => r.reason === "NOT_BUY")).toBe(true);
    expect(aggregateByStock(shown, 2.99).reduce((s, x) => s + x.tradeCount, 0)).toBe(shown.length);
  });

  it("JSON API rows with txType sell are rejected even if the URL asked for buys", () => {
    const json = JSON.parse(readFileSync(path.join(__dirname, "fixtures/bff-page.json"), "utf8"));
    const { rows } = parseBffPage(json, "https://www.capitoltrades.com/trades");
    const b = normalizeBatch(rows);
    expect(b.trades.every((t) => t.txType === "BUY")).toBe(true);
    expect(b.trades.map((t) => t.ticker)).toEqual(["NVDA", "BRK.B"]);
    expect(b.stats).toMatchObject({ retrieved: 6, rejectedNotBuy: 1, rejectedNotStock: 2, rejectedMissingPrice: 1 });
  });

  it("HTML rows with type SELL are rejected", () => {
    const html = readFileSync(path.join(__dirname, "fixtures/trades-page.html"), "utf8");
    const rows = parseTradesHtml(html, "https://www.capitoltrades.com/trades?txType=buy&assetType=stock", new Date("2025-06-01T12:00:00Z"));
    expect(rows).toHaveLength(4);
    const b = normalizeBatch(rows);
    expect(b.trades).toHaveLength(1);
    expect(b.trades[0]).toMatchObject({ ticker: "AAPL", txType: "BUY", txTypeOriginal: "BUY*", sizeEstimated: 32_500, purchasePrice: 210.5, chamber: "House", party: "Democrat", state: "CA", filedAfterDays: 21, tradeDate: "2025-05-02", owner: "Spouse" });
    expect(b.stats).toMatchObject({ rejectedNotBuy: 1, rejectedMissingTicker: 1, rejectedMissingPrice: 1 });
  });
});

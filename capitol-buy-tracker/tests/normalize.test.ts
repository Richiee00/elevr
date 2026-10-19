import { describe, expect, it } from "vitest";
import { isStockAsset, normalizeBatch, normalizeTrade, normalizeTxType, parseDate, parsePrice, type RawTradeRecord } from "@/lib/normalize/trade";
import { normalizeTicker } from "@/lib/normalize/ticker";

const base: RawTradeRecord = {
  source: "test",
  sourceId: "1",
  sourceUrl: "https://www.capitoltrades.com/trades/1",
  politicianId: "P000001",
  politicianName: "Test Politician",
  party: "democrat",
  chamber: "house",
  state: "ca",
  issuerName: "Apple Inc",
  ticker: "AAPL:US",
  assetType: "stock",
  txType: "buy",
  sizeLabel: "1K–15K",
  price: "$190.12",
  tradeDate: "2025-03-01",
  publishedDate: "2025-03-20",
  owner: "spouse",
};

describe("normalizeTrade — valid rows", () => {
  it("normalises a valid BUY", () => {
    const r = normalizeTrade(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.trade).toMatchObject({
      txType: "BUY",
      txTypeOriginal: "buy",
      assetType: "STOCK",
      ticker: "AAPL",
      sizeMin: 1000,
      sizeMax: 15000,
      sizeEstimated: 8000,
      purchasePrice: 190.12,
      party: "Democrat",
      chamber: "House",
      state: "CA",
      owner: "Spouse",
      filedAfterDays: 19,
      id: "ct-1",
    });
  });
  it("normalises BUY* to BUY and keeps the original label", () => {
    const r = normalizeTrade({ ...base, txType: "BUY*" });
    expect(r.ok && r.trade.txType).toBe("BUY");
    expect(r.ok && r.trade.txTypeOriginal).toBe("BUY*");
  });
});

describe("normalizeTrade — rejections", () => {
  it.each(["sell", "SELL", "sale", "SALE", "SALE_PARTIAL", "sell (partial)", "EXCHANGE", "exchange", "receive", "", null, "BUYBACK", "purchase"])(
    "rejects type %s as NOT_BUY",
    (txType) => {
      const r = normalizeTrade({ ...base, txType: txType as string });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.rejection.reason).toBe("NOT_BUY");
    },
  );
  it.each([
    ["corporate-bond", "Apple Inc"],
    ["government-bond", "US Treasury"],
    ["private-equity", "Some Fund"],
    ["cryptocurrency", "Bitcoin"],
    ["stock-option", "Apple Inc"],
    ["etf", "SPDR S&P 500"],
    ["commodity", "Gold"],
    ["stock", "United States Treasury Bills"],
    ["stock", "Vanguard Total Market Fund"],
    ["stock", "Apple Inc Call Option"],
    [null, "Apple Inc"],
  ])("rejects asset %s / %s as NOT_STOCK", (assetType, issuerName) => {
    const r = normalizeTrade({ ...base, assetType, issuerName });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejection.reason).toBe("NOT_STOCK");
  });
  it.each(["N/A", "n/a", "", null, "TOOLONGTICKER", "12345"])("rejects ticker %s", (ticker) => {
    const r = normalizeTrade({ ...base, ticker });
    expect(!r.ok && r.rejection.reason).toBe("MISSING_TICKER");
  });
  it.each(["N/A", "", "0", 0, "$0.00", "abc", null, -5])("rejects price %s", (price) => {
    const r = normalizeTrade({ ...base, price: price as string });
    expect(!r.ok && r.rejection.reason).toBe("MISSING_PRICE");
  });
  it("rejects invalid sizes and dates", () => {
    expect(normalizeTrade({ ...base, sizeLabel: "N/A" })).toMatchObject({ ok: false, rejection: { reason: "INVALID_SIZE" } });
    expect(normalizeTrade({ ...base, tradeDate: "not a date" })).toMatchObject({ ok: false, rejection: { reason: "INVALID_DATE" } });
    expect(normalizeTrade({ ...base, tradeDate: "2025-02-31" })).toMatchObject({ ok: false, rejection: { reason: "INVALID_DATE" } });
  });
});

describe("normalizeBatch — dedupe", () => {
  it("removes duplicates by politician+ticker+date+size+price+owner", () => {
    const b = normalizeBatch([base, { ...base, sourceId: "2" }, { ...base, sourceId: "3", owner: "self" }]);
    expect(b.trades).toHaveLength(2);
    expect(b.stats.duplicatesRemoved).toBe(1);
  });
  it("counts rejections by reason", () => {
    const b = normalizeBatch([base, { ...base, sourceId: "s", txType: "sell" }, { ...base, sourceId: "t", ticker: "N/A" }, { ...base, sourceId: "p", price: "N/A" }, { ...base, sourceId: "b", assetType: "corporate-bond" }]);
    expect(b.stats).toMatchObject({ retrieved: 5, valid: 1, rejectedNotBuy: 1, rejectedMissingTicker: 1, rejectedMissingPrice: 1, rejectedNotStock: 1 });
  });
});

describe("helpers", () => {
  it("normalizeTxType", () => {
    expect(normalizeTxType(" buy ")).toBe("BUY");
    expect(normalizeTxType("Buy *")).toBe("BUY");
    expect(normalizeTxType("sell")).toBeNull();
  });
  it("normalizeTicker", () => {
    expect(normalizeTicker("AAPL:US")).toEqual({ ticker: "AAPL", country: "US" });
    expect(normalizeTicker("BRK/B:US")).toEqual({ ticker: "BRK.B", country: "US" });
    expect(normalizeTicker("SAP:GR")).toEqual({ ticker: "SAP", country: "GR" });
    expect(normalizeTicker("N/A")).toBeNull();
  });
  it("parsePrice / parseDate / isStockAsset", () => {
    expect(parsePrice("$1,234.50")).toBe(1234.5);
    expect(parseDate("12 Mar 2025")).toBe("2025-03-12");
    expect(parseDate("2025-03-12T10:00:00Z")).toBe("2025-03-12");
    expect(isStockAsset("stock", "Option Care Health Inc")).toBe(true);
  });
});

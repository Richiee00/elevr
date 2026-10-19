// Market-data adapters, tested against recorded response shapes (fetch is stubbed — no network).
import { afterEach, describe, expect, it, vi } from "vitest";
import { alphaVantage, finnhub, fmp, marketstack, polygon, twelveData } from "@/lib/prices/providers";

function stub(handler: (url: string) => unknown, status = 200) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(handler(url)), { status, headers: { "content-type": "application/json" } })));
}
afterEach(() => vi.unstubAllGlobals());

describe("price providers", () => {
  it("Finnhub: c = current price, c = 0 means unknown symbol", async () => {
    stub((u) => (u.includes("AAPL") ? { c: 201.5, t: 1760000000 } : { c: 0, t: 0 }));
    const r = await finnhub("k", 6000).fetchQuotes(["AAPL", "ZZZZ"]);
    expect(r.quotes).toMatchObject([{ ticker: "AAPL", price: 201.5 }]);
    expect(r.errors[0].ticker).toBe("ZZZZ");
  });
  it("FMP: stable/quote with class-share symbols mapped to dashes", async () => {
    const f = vi.fn(async (_u: string) => new Response(JSON.stringify([{ symbol: "BRK-B", price: 470.1, timestamp: 1760000000 }])));
    vi.stubGlobal("fetch", f);
    const r = await fmp("k", 6000).fetchQuotes(["BRK.B"]);
    expect(String(f.mock.calls[0][0])).toContain("symbol=BRK-B");
    expect(r.quotes[0]).toMatchObject({ ticker: "BRK.B", price: 470.1 });
  });
  it("Alpha Vantage: rate-limit note stops the run and keeps remaining tickers as errors", async () => {
    stub(() => ({ Note: "Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day." }));
    const r = await alphaVantage("k", 6000).fetchQuotes(["AAPL", "MSFT"]);
    expect(r.quotes).toHaveLength(0);
    expect(r.errors).toHaveLength(2);
  });
  it("Alpha Vantage: GLOBAL_QUOTE", async () => {
    stub(() => ({ "Global Quote": { "05. price": "99.10", "07. latest trading day": "2025-06-02" } }));
    const r = await alphaVantage("k", 6000).fetchQuotes(["IBM"]);
    expect(r.quotes[0]).toMatchObject({ ticker: "IBM", price: 99.1, priceType: "DELAYED" });
  });
  it("Twelve Data: batch quote with currency", async () => {
    stub(() => ({ AAPL: { close: "200.00", currency: "USD", is_market_open: false, timestamp: 1760000000 }, SAP: { close: "230", currency: "EUR" } }));
    const r = await twelveData("k", 6000).fetchQuotes(["AAPL", "SAP"]);
    expect(r.quotes.map((q) => [q.ticker, q.currency])).toEqual([["AAPL", "USD"], ["SAP", "EUR"]]);
  });
  it("Polygon: grouped daily bars, one call for all tickers", async () => {
    stub(() => ({ status: "OK", results: [{ T: "AAPL", c: 199, t: 1760000000000 }, { T: "OTHER", c: 5, t: 1 }] }));
    const r = await polygon("k", 6000).fetchQuotes(["AAPL", "MSFT"]);
    expect(r.quotes).toMatchObject([{ ticker: "AAPL", price: 199, priceType: "CLOSE" }]);
    expect(r.errors.map((e) => e.ticker)).toEqual(["MSFT"]);
  });
  it("Marketstack: eod/latest", async () => {
    stub(() => ({ data: [{ symbol: "AAPL", close: 198.2, date: "2025-06-02T00:00:00+0000" }] }));
    const r = await marketstack("k", 6000, "https://api.marketstack.com/v2").fetchQuotes(["AAPL"]);
    expect(r.quotes[0]).toMatchObject({ ticker: "AAPL", price: 198.2 });
  });
  it("HTTP 429 is reported as an error, never as a price", async () => {
    stub(() => ({}), 429);
    const r = await finnhub("k", 6000).fetchQuotes(["AAPL"]);
    expect(r.quotes).toHaveLength(0);
    expect(r.errors[0].error).toMatch(/429/);
  });
});

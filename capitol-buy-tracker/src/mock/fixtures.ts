// ⚠⚠⚠ MOCK DATA — DEVELOPMENT ONLY ⚠⚠⚠
// Fictional politicians, deterministic pseudo-random trades and prices. Loaded exclusively by
// MockRepository when DATA_MODE=mock (refused in production). Never written to the database.

import type { RawTradeRecord } from "../lib/normalize/trade";
import type { MarketPrice, Trade } from "../lib/types";
import { weightedAveragePrice } from "../lib/calc/finance";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const POLITICIANS = [
  { id: "MOCK001", name: "Avery Lindqvist (MOCK)", party: "democrat", chamber: "house", state: "CA" },
  { id: "MOCK002", name: "Jordan Pike (MOCK)", party: "republican", chamber: "senate", state: "TX" },
  { id: "MOCK003", name: "Morgan Ashby (MOCK)", party: "republican", chamber: "house", state: "FL" },
  { id: "MOCK004", name: "Casey Duarte (MOCK)", party: "democrat", chamber: "senate", state: "NY" },
  { id: "MOCK005", name: "Riley Okafor (MOCK)", party: "independent", chamber: "senate", state: "VT" },
  { id: "MOCK006", name: "Quinn Harlow (MOCK)", party: "democrat", chamber: "house", state: "IL" },
  { id: "MOCK007", name: "Taylor Brandt (MOCK)", party: "republican", chamber: "house", state: "OH" },
  { id: "MOCK008", name: "Skyler Nakamura (MOCK)", party: "democrat", chamber: "house", state: "WA" },
];

// [ticker, issuer, sector, reference price]
const STOCKS: [string, string, string, number][] = [
  ["NVDA:US", "NVIDIA Corp", "Information Technology", 120],
  ["MSFT:US", "Microsoft Corp", "Information Technology", 420],
  ["AAPL:US", "Apple Inc", "Information Technology", 210],
  ["AMZN:US", "Amazon.com Inc", "Consumer Discretionary", 185],
  ["GOOGL:US", "Alphabet Inc", "Communication Services", 165],
  ["META:US", "Meta Platforms Inc", "Communication Services", 520],
  ["JPM:US", "JPMorgan Chase & Co", "Financials", 205],
  ["XOM:US", "Exxon Mobil Corp", "Energy", 115],
  ["UNH:US", "UnitedHealth Group Inc", "Health Care", 520],
  ["LMT:US", "Lockheed Martin Corp", "Industrials", 460],
  ["BRK/B:US", "Berkshire Hathaway Inc", "Financials", 410],
  ["PFE:US", "Pfizer Inc", "Health Care", 29],
  ["DIS:US", "Walt Disney Co", "Communication Services", 95],
  ["AVGO:US", "Broadcom Inc", "Information Technology", 160],
  ["CVX:US", "Chevron Corp", "Energy", 155],
  ["COST:US", "Costco Wholesale Corp", "Consumer Staples", 850],
];

const SIZES: [number, number, number][] = [
  [1001, 15000, 40],
  [15001, 50000, 25],
  [50001, 100000, 14],
  [100001, 250000, 10],
  [250001, 500000, 6],
  [500001, 1000000, 3],
  [1000001, 5000000, 2],
];
const OWNERS = ["self", "self", "spouse", "joint", "child", "undisclosed"];

function pickSize(r: () => number) {
  const total = SIZES.reduce((s, x) => s + x[2], 0);
  let x = r() * total;
  for (const s of SIZES) if ((x -= s[2]) <= 0) return s;
  return SIZES[0];
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function build(): RawTradeRecord[] {
  const r = rng(20240601);
  const out: RawTradeRecord[] = [];
  for (let i = 0; i < 160; i++) {
    const p = POLITICIANS[Math.floor(r() * POLITICIANS.length)];
    const s = STOCKS[Math.floor(r() * STOCKS.length)];
    const [lo, hi] = pickSize(r);
    const tradeAgo = 3 + Math.floor(r() * 360);
    const gap = 5 + Math.floor(r() * 40);
    out.push({
      source: "mock",
      sourceId: `MOCK-${1000 + i}`,
      sourceUrl: "https://www.capitoltrades.com/trades",
      politicianId: p.id,
      politicianName: p.name,
      party: p.party,
      chamber: p.chamber,
      state: p.state,
      issuerName: s[1],
      ticker: s[0],
      sector: s[2],
      assetType: "stock",
      txType: r() < 0.08 ? "BUY*" : "buy",
      sizeLow: lo,
      sizeHigh: hi,
      price: +(s[3] * (0.75 + r() * 0.5)).toFixed(2),
      tradeDate: isoDaysAgo(tradeAgo),
      publishedDate: isoDaysAgo(Math.max(0, tradeAgo - gap)),
      filedAfterDays: gap,
      owner: OWNERS[Math.floor(r() * OWNERS.length)],
    });
  }
  // Rows that MUST be rejected — exercise the validation pipeline and the Data Quality panel.
  const bad = (id: string, patch: Partial<RawTradeRecord>): RawTradeRecord => ({ ...out[0], sourceId: id, ...patch });
  out.push(
    bad("MOCK-SELL-1", { txType: "sell" }),
    bad("MOCK-SELL-2", { txType: "SALE_PARTIAL" }),
    bad("MOCK-EXCH-1", { txType: "exchange" }),
    bad("MOCK-BOND-1", { assetType: "corporate-bond", issuerName: "Apple Inc 3.25% Notes Due 2029" }),
    bad("MOCK-TBILL-1", { assetType: "stock", issuerName: "United States Treasury Bills" }),
    bad("MOCK-PE-1", { assetType: "private-equity", ticker: null }),
    bad("MOCK-CRYPTO-1", { assetType: "cryptocurrency", issuerName: "Bitcoin", ticker: "BTC" }),
    bad("MOCK-NA-1", { ticker: "N/A" }),
    bad("MOCK-NOPRICE-1", { price: "N/A" }),
    bad("MOCK-NOPRICE-2", { price: 0 }),
    { ...out[1], sourceId: "MOCK-DUP-1" }, // duplicate (same dedupe key as MOCK-1001)
  );
  return out;
}

export const MOCK_RAW_TRADES: RawTradeRecord[] = build();

/** Deterministic MOCK prices around each ticker's weighted average buy price. One ticker deliberately has none. */
export function mockPrices(trades: Trade[]): MarketPrice[] {
  const byTicker = new Map<string, Trade[]>();
  for (const t of trades) byTicker.set(t.ticker, [...(byTicker.get(t.ticker) ?? []), t]);
  const now = new Date().toISOString();
  // Cycle through below / near / above the weighted average so every status shows up.
  const factors = [0.9, 1.012, 1.18, 0.97, 1.025, 1.35];
  return [...byTicker.entries()].map(([ticker, rows], i) => {
    const avg = weightedAveragePrice(rows.map((t) => ({ price: t.purchasePrice, weight: t.sizeEstimated })))!;
    const missing = ticker === "COST";
    return {
      ticker,
      price: missing ? null : +(avg * factors[i % factors.length]).toFixed(2),
      currency: missing ? null : "USD",
      provider: missing ? null : "mock",
      priceType: missing ? null : i % 3 === 0 ? "INTRADAY" : "CLOSE",
      priceTimestamp: missing ? null : now,
      fetchedAt: missing ? null : now,
      lastAttemptAt: now,
      lastError: missing ? "MOCK: simulated provider failure" : null,
    };
  });
}

// Shared domain types. Pure data — no runtime dependencies.

export type Party = "Democrat" | "Republican" | "Independent" | "Other";
export type Chamber = "House" | "Senate";
export type Owner = "Self" | "Spouse" | "Joint" | "Child" | "Undisclosed";

/** A validated BUY trade of a listed stock, as stored in the database. */
export interface Trade {
  id: string;
  dedupeKey: string;
  source: string;
  sourceUrl: string;
  politicianId: string;
  politicianName: string;
  party: Party;
  chamber: Chamber;
  state: string | null;
  issuerName: string;
  ticker: string;
  rawTicker: string;
  listingCountry: string;
  sector: string | null;
  assetType: "STOCK";
  txType: "BUY";
  txTypeOriginal: string;
  sizeLabel: string;
  sizeMin: number;
  sizeMax: number;
  sizeEstimated: number;
  purchasePrice: number;
  priceCurrency: string;
  tradeDate: string; // YYYY-MM-DD
  publishedDate: string | null;
  filedAfterDays: number | null;
  owner: Owner;
}

export type PriceType = "INTRADAY" | "CLOSE" | "DELAYED";

export interface MarketPrice {
  ticker: string;
  price: number | null;
  currency: string | null;
  provider: string | null;
  priceType: PriceType | null;
  priceTimestamp: string | null; // ISO
  fetchedAt: string | null; // ISO
  lastAttemptAt: string | null;
  lastError: string | null;
}

export type OpportunityStatus = "BELOW" | "NEAR" | "ABOVE" | "NO_PRICE" | "CURRENCY_MISMATCH";

/** Freshness of the price shown to the user. */
export type PriceFreshness = "MARKET_OPEN" | "PREVIOUS_CLOSE" | "DELAYED" | "STALE" | "UNAVAILABLE";

/** A trade joined with its current price and computed metrics. */
export interface EnrichedTrade extends Trade {
  currentPrice: number | null;
  currentPriceCurrency: string | null;
  priceProvider: string | null;
  priceUpdatedAt: string | null;
  priceFreshness: PriceFreshness;
  variationPct: number | null;
  status: OpportunityStatus;
}

export interface StockAggregate {
  ticker: string;
  issuerName: string;
  sector: string | null;
  tradeCount: number;
  uniquePoliticians: number;
  totalMin: number;
  totalEstimated: number;
  totalMax: number;
  weightedAvgPrice: number;
  currentPrice: number | null;
  priceFreshness: PriceFreshness;
  priceUpdatedAt: string | null;
  variationPct: number | null;
  latestTradeDate: string;
  largestBuy: number;
  largestBuyTradeId: string;
  status: OpportunityStatus;
}

export interface PoliticianAggregate {
  politicianId: string;
  politicianName: string;
  party: Party;
  chamber: Chamber;
  state: string | null;
  tradeCount: number;
  totalEstimated: number;
  largestBuy: number;
  avgFilingDelay: number | null;
  uniqueStocks: number;
}

export type RejectionReason =
  | "NOT_BUY"
  | "NOT_STOCK"
  | "MISSING_TICKER"
  | "MISSING_PRICE"
  | "INVALID_SIZE"
  | "INVALID_DATE"
  | "MISSING_POLITICIAN";

export interface Rejection {
  sourceKey: string;
  reason: RejectionReason;
  detail: string;
  raw: unknown;
}

export interface UpdateLog {
  id: number;
  job: "trades" | "prices";
  status: "running" | "success" | "partial" | "error";
  startedAt: string;
  finishedAt: string | null;
  stats: Record<string, number | string | null>;
  message: string | null;
}

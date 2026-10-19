// Server-side configuration from environment variables. Never import from client components.

export type ProviderId = "fmp" | "finnhub" | "alphavantage" | "twelvedata" | "polygon" | "marketstack";
const PROVIDERS: ProviderId[] = ["fmp", "finnhub", "alphavantage", "twelvedata", "polygon", "marketstack"];

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? n : d;
};

function dataMode(): "live" | "mock" {
  const mode = (process.env.DATA_MODE ?? "live").toLowerCase() === "mock" ? "mock" : "live";
  if (mode === "mock" && process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_IN_PRODUCTION_BUILD !== "1") {
    throw new Error("DATA_MODE=mock is development-only and is refused when NODE_ENV=production.");
  }
  return mode;
}

export const config = {
  get dataMode() {
    return dataMode();
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get databaseSsl() {
    return (process.env.DATABASE_SSL ?? "").toLowerCase() === "require";
  },
  get priceProvider(): ProviderId | null {
    const p = (process.env.PRICE_PROVIDER ?? "").trim().toLowerCase() as ProviderId;
    return PROVIDERS.includes(p) && process.env.PRICE_API_KEY ? p : null;
  },
  get priceApiKey() {
    return process.env.PRICE_API_KEY ?? "";
  },
  price: {
    get requestsPerMinute() {
      return num(process.env.PRICE_REQUESTS_PER_MINUTE, 50);
    },
    get cacheTtlHours() {
      return num(process.env.PRICE_CACHE_TTL_HOURS, 20);
    },
    get staleAfterHours() {
      return num(process.env.PRICE_STALE_AFTER_HOURS, 48);
    },
    get maxTickersPerRun() {
      return num(process.env.PRICE_MAX_TICKERS_PER_RUN, 500);
    },
    get marketstackBaseUrl() {
      return process.env.MARKETSTACK_BASE_URL || "https://api.marketstack.com/v2";
    },
  },
  capitolTrades: {
    get bffUrl() {
      return process.env.CAPITOL_TRADES_BFF_URL || "https://bff.capitoltrades.com/trades";
    },
    get webUrl() {
      return process.env.CAPITOL_TRADES_WEB_URL || "https://www.capitoltrades.com/trades";
    },
    get maxPages() {
      return num(process.env.TRADES_MAX_PAGES, 30);
    },
    get stopAfterKnownPages() {
      return num(process.env.TRADES_STOP_AFTER_KNOWN_PAGES, 2);
    },
    get requestDelayMs() {
      return num(process.env.TRADES_REQUEST_DELAY_MS, 1200);
    },
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
};

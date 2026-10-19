// Provider factory. Returns null when no provider / API key is configured.

import { config } from "../config";
import type { PriceProvider } from "./provider";
import { alphaVantage, finnhub, fmp, marketstack, polygon, twelveData } from "./providers";

export function getPriceProvider(): PriceProvider | null {
  const id = config.priceProvider;
  const key = config.priceApiKey;
  const rpm = config.price.requestsPerMinute;
  switch (id) {
    case "fmp":
      return fmp(key, rpm);
    case "finnhub":
      return finnhub(key, rpm);
    case "alphavantage":
      return alphaVantage(key, rpm);
    case "twelvedata":
      return twelveData(key, rpm);
    case "polygon":
      return polygon(key, rpm);
    case "marketstack":
      return marketstack(key, rpm, config.price.marketstackBaseUrl);
    default:
      return null;
  }
}

export const PROVIDER_LABELS: Record<string, string> = {
  fmp: "Financial Modeling Prep",
  finnhub: "Finnhub",
  alphavantage: "Alpha Vantage",
  twelvedata: "Twelve Data",
  polygon: "Polygon.io",
  marketstack: "Marketstack",
  mock: "MOCK (development only)",
};

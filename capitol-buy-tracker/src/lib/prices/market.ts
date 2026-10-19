// US market-session helpers (America/New_York, regular session 09:30–16:00, Mon–Fri).
// Exchange holidays are not modelled; the provider timestamp is used to detect closes.

import type { PriceFreshness, PriceType } from "../types";

function nyParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { weekday: get("weekday"), minutes: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
}

export function isUsMarketOpen(at: Date = new Date()): boolean {
  const { weekday, minutes } = nyParts(at);
  if (weekday === "Sat" || weekday === "Sun") return false;
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

/** Classifies a quote: intraday during session (fresh), previous close, delayed or stale. */
export function priceFreshness(
  p: { price: number | null; priceType: PriceType | null; priceTimestamp: string | null; fetchedAt: string | null } | null,
  staleAfterHours: number,
  now: Date = new Date(),
): PriceFreshness {
  if (!p || p.price == null || !p.fetchedAt) return "UNAVAILABLE";
  const fetched = Date.parse(p.fetchedAt);
  if (Number.isNaN(fetched) || now.getTime() - fetched > staleAfterHours * 3_600_000) return "STALE";
  if (p.priceType === "CLOSE") return "PREVIOUS_CLOSE";
  const ts = p.priceTimestamp ? Date.parse(p.priceTimestamp) : fetched;
  if (p.priceType === "INTRADAY" && isUsMarketOpen(new Date(ts)) && now.getTime() - ts < 30 * 60_000) return "MARKET_OPEN";
  if (!isUsMarketOpen(new Date(ts))) return "PREVIOUS_CLOSE";
  return "DELAYED";
}

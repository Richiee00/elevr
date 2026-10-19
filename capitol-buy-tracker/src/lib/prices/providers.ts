// Concrete market-data providers. Each maps canonical tickers ("BRK.B") to its own symbology.

import { isUsMarketOpen } from "./market";
import { chunk, fromUnix, getJson, perTicker, RateLimitError, throttle, toNum, type PriceProvider, type Quote } from "./provider";

const dash = (t: string) => t.replace(".", "-");
const intradayOrClose = (ts: string | null): Quote["priceType"] =>
  ts && isUsMarketOpen(new Date(ts)) ? "INTRADAY" : "CLOSE";

/** Financial Modeling Prep — https://site.financialmodelingprep.com/developer/docs (stable/quote) */
export function fmp(apiKey: string, rpm: number): PriceProvider {
  return {
    id: "fmp",
    label: "Financial Modeling Prep",
    fetchQuotes: (tickers) =>
      perTicker(tickers, rpm, async (t) => {
        const j = (await getJson(
          `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(dash(t))}&apikey=${apiKey}`,
        )) as Array<Record<string, unknown>> | { "Error Message"?: string };
        if (!Array.isArray(j)) throw new Error(String((j as Record<string, unknown>)["Error Message"] ?? "Unexpected response"));
        const row = j[0];
        const price = toNum(row?.price);
        if (!price) return null;
        const ts = fromUnix(row.timestamp);
        return { ticker: t, price, currency: (row.currency as string) ?? null, priceType: intradayOrClose(ts), priceTimestamp: ts };
      }),
  };
}

/** Finnhub — https://finnhub.io/docs/api/quote */
export function finnhub(apiKey: string, rpm: number): PriceProvider {
  return {
    id: "finnhub",
    label: "Finnhub",
    fetchQuotes: (tickers) =>
      perTicker(tickers, rpm, async (t) => {
        const j = (await getJson(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(t)}&token=${apiKey}`)) as Record<string, unknown>;
        if (j.error) throw new Error(String(j.error));
        const price = toNum(j.c); // Finnhub returns c = 0 for unknown symbols
        if (!price) return null;
        const ts = fromUnix(j.t);
        return { ticker: t, price, currency: null, priceType: intradayOrClose(ts), priceTimestamp: ts };
      }),
  };
}

/** Alpha Vantage — https://www.alphavantage.co/documentation/#latestprice (GLOBAL_QUOTE) */
export function alphaVantage(apiKey: string, rpm: number): PriceProvider {
  return {
    id: "alphavantage",
    label: "Alpha Vantage",
    fetchQuotes: (tickers) =>
      perTicker(tickers, Math.min(rpm, 5), async (t) => {
        const j = (await getJson(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(dash(t))}&apikey=${apiKey}`,
        )) as Record<string, Record<string, string> | string>;
        if (typeof j.Note === "string" || typeof j.Information === "string") throw new RateLimitError(String(j.Note ?? j.Information));
        if (typeof j["Error Message"] === "string") throw new Error(j["Error Message"] as string);
        const q = j["Global Quote"] as Record<string, string> | undefined;
        const price = toNum(q?.["05. price"]);
        if (!q || !price) return null;
        const day = q["07. latest trading day"];
        return { ticker: t, price, currency: null, priceType: "DELAYED", priceTimestamp: day ? `${day}T20:00:00.000Z` : null };
      }),
  };
}

/** Twelve Data — https://twelvedata.com/docs#quote (batch: comma-separated symbols) */
export function twelveData(apiKey: string, rpm: number): PriceProvider {
  return {
    id: "twelvedata",
    label: "Twelve Data",
    async fetchQuotes(tickers) {
      const wait = throttle(rpm);
      const out: Awaited<ReturnType<PriceProvider["fetchQuotes"]>> = { quotes: [], errors: [] };
      for (const group of chunk(tickers, 8)) {
        await wait();
        try {
          const j = (await getJson(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(group.join(","))}&apikey=${apiKey}`)) as Record<string, unknown>;
          const bySymbol: Record<string, Record<string, unknown>> = group.length === 1 ? { [group[0]]: j } : (j as Record<string, Record<string, unknown>>);
          if (group.length > 1 && j.status === "error") throw new Error(String(j.message));
          for (const t of group) {
            const q = bySymbol[t];
            if (!q || q.status === "error") {
              out.errors.push({ ticker: t, error: String(q?.message ?? "No quote returned") });
              continue;
            }
            const price = toNum(q.close);
            if (!price) {
              out.errors.push({ ticker: t, error: "No price" });
              continue;
            }
            const ts = fromUnix(q.last_quote_at ?? q.timestamp);
            out.quotes.push({
              ticker: t,
              price,
              currency: (q.currency as string) ?? null,
              priceType: q.is_market_open ? "INTRADAY" : "CLOSE",
              priceTimestamp: ts,
            });
          }
        } catch (e) {
          for (const t of group) out.errors.push({ ticker: t, error: e instanceof Error ? e.message : String(e) });
          if (e instanceof RateLimitError) break;
        }
      }
      return out;
    },
  };
}

/** Polygon.io — grouped daily bars: one request returns the previous close of every US stock. */
export function polygon(apiKey: string, rpm: number): PriceProvider {
  return {
    id: "polygon",
    label: "Polygon.io",
    async fetchQuotes(tickers) {
      const wait = throttle(Math.min(rpm, 5));
      const wanted = new Set(tickers);
      for (let back = 0; back < 7; back++) {
        const d = new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10);
        await wait();
        const j = (await getJson(
          `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${d}?adjusted=true&apiKey=${apiKey}`,
        )) as { results?: Array<{ T: string; c: number; t: number }>; status?: string };
        if (!j.results?.length) continue;
        const quotes: Quote[] = [];
        for (const r of j.results) {
          if (wanted.has(r.T) && toNum(r.c)) {
            quotes.push({ ticker: r.T, price: r.c, currency: "USD", priceType: "CLOSE", priceTimestamp: fromUnix(r.t) });
          }
        }
        const got = new Set(quotes.map((q) => q.ticker));
        return { quotes, errors: tickers.filter((t) => !got.has(t)).map((t) => ({ ticker: t, error: "Not in grouped daily bars" })) };
      }
      return { quotes: [], errors: tickers.map((t) => ({ ticker: t, error: "No trading day found in the last 7 days" })) };
    },
  };
}

/** Marketstack — https://marketstack.com/documentation (eod/latest, up to 100 symbols per call) */
export function marketstack(apiKey: string, rpm: number, baseUrl: string): PriceProvider {
  return {
    id: "marketstack",
    label: "Marketstack",
    async fetchQuotes(tickers) {
      const wait = throttle(rpm);
      const out: Awaited<ReturnType<PriceProvider["fetchQuotes"]>> = { quotes: [], errors: [] };
      for (const group of chunk(tickers, 100)) {
        await wait();
        try {
          const j = (await getJson(
            `${baseUrl.replace(/\/$/, "")}/eod/latest?access_key=${apiKey}&symbols=${encodeURIComponent(group.join(","))}`,
          )) as { data?: Array<Record<string, unknown>>; error?: { message?: string } };
          if (j.error) throw new Error(j.error.message ?? "Marketstack error");
          const got = new Set<string>();
          for (const r of j.data ?? []) {
            const price = toNum(r.close);
            const t = String(r.symbol ?? "");
            if (!price || !group.includes(t)) continue;
            got.add(t);
            out.quotes.push({
              ticker: t,
              price,
              currency: (r.price_currency as string)?.toUpperCase() ?? null,
              priceType: "CLOSE",
              priceTimestamp: r.date ? new Date(String(r.date)).toISOString() : null,
            });
          }
          for (const t of group) if (!got.has(t)) out.errors.push({ ticker: t, error: "No EOD data" });
        } catch (e) {
          for (const t of group) out.errors.push({ ticker: t, error: e instanceof Error ? e.message : String(e) });
        }
      }
      return out;
    },
  };
}

// Fetches one page of BUY + STOCK trades. Tries the JSON API first, then the HTML page.
// URL parameters are only a pre-filter — every row is re-validated by normalizeTrade().

import { config } from "../../config";
import { log } from "../../log";
import type { RawTradeRecord } from "../../normalize/trade";
import { parseBffPage } from "./bff";
import { parseTradesHtml } from "./html";

const HEADERS = {
  "User-Agent": "CapitolBuyTracker/1.0 (+research dashboard)",
  Accept: "application/json, text/html;q=0.9",
};

export interface FetchedPage {
  rows: RawTradeRecord[];
  totalPages: number | null;
  via: "bff" | "html";
}

async function getText(url: string): Promise<{ status: number; body: string; type: string }> {
  const res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  return { status: res.status, body: await res.text(), type: res.headers.get("content-type") ?? "" };
}

export async function fetchTradesPage(page: number, pageSize = 100): Promise<FetchedPage> {
  const { bffUrl, webUrl } = config.capitolTrades;
  const bff = `${bffUrl}?txType=buy&assetType=stock&page=${page}&pageSize=${pageSize}&sortBy=-pubDate`;
  try {
    const r = await getText(bff);
    if (r.status === 200 && r.type.includes("json")) {
      const parsed = parseBffPage(JSON.parse(r.body), webUrl);
      return { ...parsed, via: "bff" };
    }
    log.warn("capitoltrades.bff_unavailable", { status: r.status, page });
  } catch (e) {
    log.warn("capitoltrades.bff_error", { page, error: String(e) });
  }

  const html = `${webUrl}?txType=buy&assetType=stock&page=${page}&pageSize=96`;
  const r = await getText(html);
  if (r.status !== 200) throw new Error(`Capitol Trades HTML responded ${r.status}`);
  return { rows: parseTradesHtml(r.body, html), totalPages: null, via: "html" };
}

// Fallback parser for the public HTML page https://www.capitoltrades.com/trades
// Columns: Politician | Traded Issuer | Published | Traded | Filed After | Owner | Type | Size | Price
// The parser locates columns by header text (falls back to known positions), so cosmetic
// class-name changes on the site do not silently shift fields.

import * as cheerio from "cheerio";
import type { RawTradeRecord } from "../../normalize/trade";

const HEADERS: Record<string, RegExp> = {
  politician: /politician/i,
  issuer: /issuer/i,
  published: /published/i,
  traded: /^traded$/i,
  filedAfter: /filed/i,
  owner: /owner/i,
  type: /type/i,
  size: /size/i,
  price: /price/i,
};
const DEFAULT_ORDER = ["politician", "issuer", "published", "traded", "filedAfter", "owner", "type", "size", "price"];

/** Capitol Trades renders dates as two lines, e.g. "12 Mar" + "2025", or "Yesterday"/"Today" + time. */
function readDate(text: string, now = new Date()): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (/^today/i.test(t)) return now.toISOString().slice(0, 10);
  if (/^yesterday/i.test(t)) return new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const m = t.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/) ?? t.match(/([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const d = Date.parse(`${m[0]} UTC`);
  return Number.isNaN(d) ? null : new Date(d).toISOString().slice(0, 10);
}

/** Text of a cell with a space between child nodes ("2 May" + "2025" → "2 May 2025"). */
function spacedText($: cheerio.CheerioAPI, el: cheerio.Cheerio<any> | undefined): string {
  if (!el) return "";
  const parts: string[] = [];
  el.find("*").addBack().contents().each((_, n) => {
    if (n.type === "text") parts.push($(n).text());
  });
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function parseTradesHtml(html: string, pageUrl: string, now = new Date()): RawTradeRecord[] {
  const $ = cheerio.load(html);
  const origin = new URL(pageUrl).origin;
  const table = $("table").first();
  if (!table.length) throw new Error("Capitol Trades HTML: no table found (layout changed?)");

  const headerCells = table.find("thead th").toArray().map((th) => $(th).text().replace(/\s+/g, " ").trim());
  const col: Record<string, number> = {};
  for (const [key, re] of Object.entries(HEADERS)) {
    const idx = headerCells.findIndex((h) => re.test(h) && !(key === "type" && /asset/i.test(h)));
    col[key] = idx >= 0 ? idx : DEFAULT_ORDER.indexOf(key);
  }
  // "Traded Issuer" also matches /traded/ — make sure "traded" points to the date column
  const tradedIdx = headerCells.findIndex((h) => /^traded$/i.test(h));
  if (tradedIdx >= 0) col.traded = tradedIdx;

  const rows: RawTradeRecord[] = [];
  table.find("tbody tr").each((_, tr) => {
    const cells = $(tr).find("td").toArray().map((td) => $(td));
    if (cells.length < 8) return;
    const cell = (k: string) => cells[col[k]];

    const polCell = cell("politician");
    const polLink = polCell.find("a[href*='/politicians/']").first();
    const politicianId = polLink.attr("href")?.split("/politicians/")[1]?.split(/[?#/]/)[0] ?? null;
    const politicianName = (polCell.find("h2, h3, .politician-name, a").first().text() || polCell.text()).replace(/\s+/g, " ").trim();
    const polText = polCell.text().replace(/\s+/g, " ");
    const party = polCell.find("[class*='party']").first().text().trim() || (polText.match(/\b(Democrat|Republican|Independent|Other)\b/i)?.[1] ?? null);
    const chamber = polCell.find("[class*='chamber']").first().text().trim() || (polText.match(/\b(House|Senate)\b/i)?.[1] ?? null);
    const state = polCell.find("[class*='us-state'], [class*='state']").first().text().trim() || (polText.match(/\b([A-Z]{2})\b\s*$/)?.[1] ?? null);

    const issCell = cell("issuer");
    const issuerName = (issCell.find("h3, .issuer-name, a").first().text() || issCell.text()).replace(/\s+/g, " ").trim();
    const ticker = issCell.find("[class*='ticker']").first().text().trim() || (issCell.text().match(/\b([A-Z][A-Z./]{0,6}:[A-Z]{2}|N\/A)\b/)?.[1] ?? null);

    const tradeLink = $(tr).find("a[href*='/trades/']").first().attr("href");
    const sourceId = tradeLink?.match(/\/trades\/(\d+)/)?.[1] ?? null;

    const filedText = spacedText($, cell("filedAfter"));
    rows.push({
      source: "capitoltrades-html",
      sourceId,
      sourceUrl: tradeLink ? new URL(tradeLink, origin).toString() : pageUrl,
      politicianId,
      politicianName,
      party,
      chamber,
      state,
      issuerName,
      ticker,
      sector: null,
      // The HTML table has no asset-type column. The page is requested with assetType=stock,
      // and the issuer-name heuristics + ticker check in normalizeTrade still apply.
      assetType: "stock",
      txType: cell("type")?.text().replace(/\s+/g, "").trim() ?? null,
      sizeLabel: cell("size")?.text().replace(/\s+/g, "").trim() ?? null,
      price: cell("price")?.text().trim() ?? null,
      tradeDate: readDate(spacedText($, cell("traded")), now),
      publishedDate: readDate(spacedText($, cell("published")), now),
      filedAfterDays: filedText.match(/\d+/)?.[0] ?? null,
      owner: cell("owner")?.text().replace(/\s+/g, " ").trim() ?? null,
    });
  });
  return rows;
}

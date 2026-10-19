// Validation + normalisation of raw records coming from any trades source.
// A record becomes a Trade only if it passes EVERY rule; otherwise a Rejection is returned.

import type { Chamber, Owner, Party, Rejection, Trade } from "../types";
import { makeRange, parseSizeRange, type SizeRange } from "../calc/size";
import { daysBetween } from "../calc/finance";
import { normalizeTicker } from "./ticker";

/** Source-agnostic raw record. Every field is untrusted. */
export interface RawTradeRecord {
  source: string;
  sourceId?: string | number | null;
  sourceUrl: string;
  politicianId?: string | null;
  politicianName?: string | null;
  party?: string | null;
  chamber?: string | null;
  state?: string | null;
  issuerName?: string | null;
  ticker?: string | null;
  sector?: string | null;
  assetType?: string | null;
  txType?: string | null;
  sizeLabel?: string | null;
  sizeLow?: number | null;
  sizeHigh?: number | null;
  price?: string | number | null;
  tradeDate?: string | null;
  publishedDate?: string | null;
  filedAfterDays?: number | string | null;
  owner?: string | null;
}

export type NormalizeResult = { ok: true; trade: Trade } | { ok: false; rejection: Rejection };

/** "buy", "BUY", "Buy*", "BUY *" → "BUY". Anything else (sell, sale_partial, exchange…) → null. */
export function normalizeTxType(raw: string | null | undefined): "BUY" | null {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase().replace(/\s*\*+\s*$/, "");
  return s === "BUY" ? "BUY" : null;
}

/** Issuer names that betray a non-stock asset even when tagged "stock". */
const NON_STOCK_NAME =
  /\b(treasury|t-?bills?|bills?\s+due|notes?\s+due|bonds?|debentures?|municipal|munis?|fund|funds|private\s+equity|l\.?p\.?\s*(units?|interests?)|debt|commodit(y|ies)|bullion|(call|put)\s+options?|options?\s+contract|warrants?|bitcoin|ethereum|crypto(currency)?|etf|etn|certificate\s+of\s+deposit|cd\s+due)\b/i;

const STOCK_ASSET_TYPES = new Set(["STOCK", "STOCKS", "COMMON STOCK", "ST"]);

export function isStockAsset(assetType: string | null | undefined, issuerName: string | null | undefined): boolean {
  const t = String(assetType ?? "").trim().toUpperCase();
  if (!STOCK_ASSET_TYPES.has(t)) return false;
  return !NON_STOCK_NAME.test(String(issuerName ?? ""));
}

/** Parses "$123.45", "123.45", 123.45. Returns null for N/A, empty, zero, negative or non-numeric. */
export function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
  const s = raw.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = parseFloat(s);
  return n > 0 ? n : null;
}

/** Accepts ISO strings, "YYYY-MM-DD", "12 Mar 2025", "2025 Mar 12"… → "YYYY-MM-DD" or null. */
export function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let t: number;
  if (iso) t = Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);
  else {
    const parsed = Date.parse(s.replace(/(\d{4})\s+([A-Za-z]{3,})\s+(\d{1,2})/, "$3 $2 $1") + " UTC");
    if (Number.isNaN(parsed)) return null;
    t = parsed;
  }
  const d = new Date(t);
  const y = d.getUTCFullYear();
  if (Number.isNaN(y) || y < 1990 || y > 2100) return null;
  // Reject impossible calendar values like 2025-02-31 (Date.UTC would roll them over)
  if (iso && (d.getUTCMonth() + 1 !== +iso[2] || d.getUTCDate() !== +iso[3])) return null;
  return d.toISOString().slice(0, 10);
}

export function normalizeParty(raw: string | null | undefined): Party {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s.startsWith("d")) return "Democrat";
  if (s.startsWith("r")) return "Republican";
  if (s.startsWith("i")) return "Independent";
  return "Other";
}

export function normalizeChamber(raw: string | null | undefined): Chamber | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s.startsWith("h") || s === "representative") return "House";
  if (s.startsWith("s")) return "Senate";
  return null;
}

export function normalizeOwner(raw: string | null | undefined): Owner {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "self" || s === "politician") return "Self";
  if (s === "spouse") return "Spouse";
  if (s === "joint") return "Joint";
  if (s === "child" || s === "dependent") return "Child";
  return "Undisclosed";
}

export function buildDedupeKey(t: {
  politicianId: string;
  ticker: string;
  tradeDate: string;
  sizeMin: number;
  sizeMax: number;
  purchasePrice: number;
  owner: string;
}): string {
  return [
    t.politicianId.toLowerCase(),
    t.ticker,
    t.tradeDate,
    `${t.sizeMin}-${t.sizeMax}`,
    t.purchasePrice.toFixed(4),
    t.owner.toLowerCase(),
  ].join("|");
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function reject(raw: RawTradeRecord, reason: Rejection["reason"], detail: string): NormalizeResult {
  const sourceKey = raw.sourceId != null ? `${raw.source}:${raw.sourceId}` : `${raw.source}:${slug(JSON.stringify(raw)).slice(0, 180)}`;
  return { ok: false, rejection: { sourceKey, reason, detail, raw } };
}

export function normalizeTrade(raw: RawTradeRecord): NormalizeResult {
  // 1. Transaction type must be exactly BUY (BUY* accepted and normalised).
  const txType = normalizeTxType(raw.txType);
  if (!txType) return reject(raw, "NOT_BUY", `type=${raw.txType ?? "∅"}`);

  // 2. Asset must be a listed stock.
  if (!isStockAsset(raw.assetType, raw.issuerName)) {
    return reject(raw, "NOT_STOCK", `assetType=${raw.assetType ?? "∅"} issuer=${raw.issuerName ?? "∅"}`);
  }

  // 3. Valid ticker.
  const tk = normalizeTicker(raw.ticker);
  if (!tk) return reject(raw, "MISSING_TICKER", `ticker=${raw.ticker ?? "∅"}`);

  // 4. Valid purchase price (> 0, numeric).
  const price = parsePrice(raw.price);
  if (price === null) return reject(raw, "MISSING_PRICE", `price=${raw.price ?? "∅"}`);

  // 5. Valid size range with estimated size > 0.
  let size: SizeRange | null = null;
  if (raw.sizeLow != null && raw.sizeHigh != null) size = makeRange(Number(raw.sizeLow), Number(raw.sizeHigh));
  if (!size) size = parseSizeRange(raw.sizeLabel);
  if (!size || !(size.estimated > 0)) return reject(raw, "INVALID_SIZE", `size=${raw.sizeLabel ?? `${raw.sizeLow}-${raw.sizeHigh}`}`);

  // 6. Valid trade date.
  const tradeDate = parseDate(raw.tradeDate);
  if (!tradeDate) return reject(raw, "INVALID_DATE", `tradeDate=${raw.tradeDate ?? "∅"}`);

  const politicianName = String(raw.politicianName ?? "").replace(/\s+/g, " ").trim();
  const chamber = normalizeChamber(raw.chamber);
  if (!politicianName || !chamber) return reject(raw, "MISSING_POLITICIAN", `politician=${politicianName || "∅"} chamber=${raw.chamber ?? "∅"}`);

  const politicianId = String(raw.politicianId ?? "").trim() || slug(politicianName);
  const publishedDate = parseDate(raw.publishedDate);
  const filedRaw = raw.filedAfterDays != null ? parseInt(String(raw.filedAfterDays).replace(/\D/g, ""), 10) : NaN;
  const filedAfterDays = Number.isFinite(filedRaw) ? filedRaw : publishedDate ? daysBetween(tradeDate, publishedDate) : null;
  const owner = normalizeOwner(raw.owner);

  const base = {
    politicianId,
    ticker: tk.ticker,
    tradeDate,
    sizeMin: size.min,
    sizeMax: size.max,
    purchasePrice: price,
    owner,
  };
  const dedupeKey = buildDedupeKey(base);

  const trade: Trade = {
    ...base,
    id: raw.sourceId != null && String(raw.sourceId).trim() ? `ct-${String(raw.sourceId).trim()}` : `k-${slug(dedupeKey)}`,
    dedupeKey,
    source: raw.source,
    sourceUrl: raw.sourceUrl,
    politicianName,
    party: normalizeParty(raw.party),
    chamber,
    state: raw.state ? String(raw.state).trim().toUpperCase().slice(0, 2) : null,
    issuerName: String(raw.issuerName ?? "").trim() || tk.ticker,
    rawTicker: String(raw.ticker).trim(),
    listingCountry: tk.country,
    sector: raw.sector ? String(raw.sector).trim() : null,
    assetType: "STOCK",
    txType,
    txTypeOriginal: String(raw.txType).trim(),
    sizeLabel: size.label,
    sizeEstimated: size.estimated,
    priceCurrency: "USD", // US financial disclosures are reported in USD
    publishedDate,
    filedAfterDays,
  };
  return { ok: true, trade };
}

export interface BatchResult {
  trades: Trade[];
  rejections: Rejection[];
  duplicates: number;
  stats: {
    retrieved: number;
    valid: number;
    rejectedNotBuy: number;
    rejectedNotStock: number;
    rejectedMissingTicker: number;
    rejectedMissingPrice: number;
    rejectedOther: number;
    duplicatesRemoved: number;
  };
}

/** Normalises a batch and removes duplicates (same dedupe key or same source id). */
export function normalizeBatch(raws: RawTradeRecord[]): BatchResult {
  const trades: Trade[] = [];
  const rejections: Rejection[] = [];
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  let duplicates = 0;
  for (const raw of raws) {
    const r = normalizeTrade(raw);
    if (!r.ok) {
      rejections.push(r.rejection);
      continue;
    }
    if (seenKeys.has(r.trade.dedupeKey) || seenIds.has(r.trade.id)) {
      duplicates++;
      continue;
    }
    seenKeys.add(r.trade.dedupeKey);
    seenIds.add(r.trade.id);
    trades.push(r.trade);
  }
  const count = (reason: string) => rejections.filter((x) => x.reason === reason).length;
  return {
    trades,
    rejections,
    duplicates,
    stats: {
      retrieved: raws.length,
      valid: trades.length,
      rejectedNotBuy: count("NOT_BUY"),
      rejectedNotStock: count("NOT_STOCK"),
      rejectedMissingTicker: count("MISSING_TICKER"),
      rejectedMissingPrice: count("MISSING_PRICE"),
      rejectedOther: count("INVALID_SIZE") + count("INVALID_DATE") + count("MISSING_POLITICIAN"),
      duplicatesRemoved: duplicates,
    },
  };
}

/** Defence in depth: re-checks a stored trade right before display. */
export function isDisplayable(t: Trade): boolean {
  return (
    normalizeTxType(t.txType) === "BUY" &&
    t.assetType === "STOCK" &&
    normalizeTicker(t.ticker) !== null &&
    t.purchasePrice > 0 &&
    t.sizeEstimated > 0 &&
    parseDate(t.tradeDate) !== null &&
    t.priceCurrency === "USD"
  );
}

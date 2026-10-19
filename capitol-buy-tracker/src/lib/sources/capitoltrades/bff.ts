// Capitol Trades JSON backend ("BFF") — the same API the website uses to render its tables.
// Shape (abridged):
// { meta: { paging: { page, size, totalPages, totalItems } },
//   data: [{ _txId, _politicianId, pubDate, txDate, txType, owner, chamber, price,
//            sizeRangeLow, sizeRangeHigh, reportingGap, filingURL,
//            asset: { assetType, assetTicker }, issuer: { issuerName, issuerTicker, sector },
//            politician: { firstName, lastName, nickname, party, _stateId, chamber } }] }

import type { RawTradeRecord } from "../../normalize/trade";

export interface BffTrade {
  _txId?: number | string;
  _politicianId?: string;
  pubDate?: string;
  txDate?: string;
  txType?: string;
  owner?: string;
  chamber?: string;
  price?: number | string | null;
  size?: number | null;
  sizeRangeLow?: number | null;
  sizeRangeHigh?: number | null;
  reportingGap?: number | null;
  filingURL?: string;
  asset?: { assetType?: string; assetTicker?: string | null };
  issuer?: { issuerName?: string; issuerTicker?: string | null; sector?: string | null };
  politician?: {
    firstName?: string;
    lastName?: string;
    nickname?: string | null;
    party?: string;
    _stateId?: string;
    chamber?: string;
  };
}

export interface BffPage {
  meta?: { paging?: { page?: number; size?: number; totalPages?: number; totalItems?: number } };
  data?: BffTrade[];
}

export function bffTradeToRaw(t: BffTrade, webBase: string): RawTradeRecord {
  const p = t.politician ?? {};
  const first = (p.nickname || p.firstName || "").trim();
  const name = [first, (p.lastName || "").trim()].filter(Boolean).join(" ");
  return {
    source: "capitoltrades-bff",
    sourceId: t._txId ?? null,
    sourceUrl: t._txId != null ? `${webBase.replace(/\/$/, "")}/${t._txId}` : webBase,
    politicianId: t._politicianId ?? null,
    politicianName: name,
    party: p.party ?? null,
    chamber: t.chamber ?? p.chamber ?? null,
    state: p._stateId ?? null,
    issuerName: t.issuer?.issuerName ?? null,
    ticker: t.asset?.assetTicker ?? t.issuer?.issuerTicker ?? null,
    sector: t.issuer?.sector ?? null,
    assetType: t.asset?.assetType ?? null,
    txType: t.txType ?? null,
    sizeLow: t.sizeRangeLow ?? null,
    sizeHigh: t.sizeRangeHigh ?? null,
    price: t.price ?? null,
    tradeDate: t.txDate ?? null,
    publishedDate: t.pubDate ?? null,
    filedAfterDays: t.reportingGap ?? null,
    owner: t.owner ?? null,
  };
}

export function parseBffPage(json: unknown, webBase: string): { rows: RawTradeRecord[]; totalPages: number | null } {
  const page = json as BffPage;
  if (!page || !Array.isArray(page.data)) throw new Error("Unexpected Capitol Trades API response (no data array)");
  return {
    rows: page.data.map((t) => bffTradeToRaw(t, webBase)),
    totalPages: page.meta?.paging?.totalPages ?? null,
  };
}

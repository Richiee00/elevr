// Filter / sort / pagination state shared by the client (URL) and the API (query string).
// Pure module: safe to import from client and server.

import { DEFAULT_PREMIUM_PCT } from "./calc/finance";

export type StatusFilter = "ALL" | "OPPORTUNITY" | "BELOW" | "NEAR" | "ABOVE" | "NO_PRICE";
export type PriceDataFilter = "all" | "with" | "without";
export type Bucket = "day" | "week" | "month";

export interface FilterState {
  q: string;
  dateFrom: string;
  dateTo: string;
  lastDays: number | null;
  politician: string;
  party: string;
  chamber: string;
  state: string;
  company: string;
  ticker: string;
  sector: string;
  owner: string;
  sizeLabel: string;
  minEst: number | null;
  maxEst: number | null;
  status: StatusFilter;
  premium: number;
  maxFiledAfter: number | null;
  priceData: PriceDataFilter;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
  bucket: Bucket;
}

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  dateFrom: "",
  dateTo: "",
  lastDays: null,
  politician: "",
  party: "",
  chamber: "",
  state: "",
  company: "",
  ticker: "",
  sector: "",
  owner: "",
  sizeLabel: "",
  minEst: null,
  maxEst: null,
  status: "ALL",
  premium: DEFAULT_PREMIUM_PCT,
  maxFiledAfter: null,
  priceData: "all",
  sort: "",
  dir: "desc",
  page: 1,
  pageSize: 50,
  bucket: "month",
};

const STATUSES: StatusFilter[] = ["ALL", "OPPORTUNITY", "BELOW", "NEAR", "ABOVE", "NO_PRICE"];

function numOrNull(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseFilters(sp: URLSearchParams): FilterState {
  const s = (k: keyof FilterState) => (sp.get(k) ?? "").trim();
  const status = s("status").toUpperCase() as StatusFilter;
  const premium = numOrNull(sp.get("premium"));
  const pageSize = numOrNull(sp.get("pageSize"));
  const bucket = s("bucket") as Bucket;
  const priceData = s("priceData") as PriceDataFilter;
  return {
    q: s("q").slice(0, 100),
    dateFrom: /^\d{4}-\d{2}-\d{2}$/.test(s("dateFrom")) ? s("dateFrom") : "",
    dateTo: /^\d{4}-\d{2}-\d{2}$/.test(s("dateTo")) ? s("dateTo") : "",
    lastDays: numOrNull(sp.get("lastDays")),
    politician: s("politician"),
    party: s("party"),
    chamber: s("chamber"),
    state: s("state").toUpperCase(),
    company: s("company"),
    ticker: s("ticker").toUpperCase(),
    sector: s("sector"),
    owner: s("owner"),
    sizeLabel: s("sizeLabel"),
    minEst: numOrNull(sp.get("minEst")),
    maxEst: numOrNull(sp.get("maxEst")),
    status: STATUSES.includes(status) ? status : "ALL",
    premium: premium != null && premium >= 0 && premium <= 100 ? premium : DEFAULT_PREMIUM_PCT,
    maxFiledAfter: numOrNull(sp.get("maxFiledAfter")),
    priceData: ["all", "with", "without"].includes(priceData) ? priceData : "all",
    sort: s("sort"),
    dir: s("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Math.floor(numOrNull(sp.get("page")) ?? 1)),
    pageSize: [10, 25, 50, 100, 250].includes(pageSize ?? 0) ? (pageSize as number) : DEFAULT_FILTERS.pageSize,
    bucket: ["day", "week", "month"].includes(bucket) ? bucket : "month",
  };
}

/** Serialises only non-default values (short, shareable URLs). */
export function serializeFilters(f: Partial<FilterState>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    const def = DEFAULT_FILTERS[k as keyof FilterState];
    if (v === null || v === undefined || v === "" || v === def) continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

export interface QuickFilter {
  id: string;
  label: string;
  patch: Partial<FilterState>;
}

export function quickFilters(premium: number): QuickFilter[] {
  return [
    { id: "largest", label: "Largest Trades", patch: { minEst: 250_000, sort: "sizeEstimated", dir: "desc" } },
    { id: "below", label: "Below Politician Price", patch: { status: "BELOW" } },
    { id: "within", label: `Within ${premium}%`, patch: { status: "NEAR" } },
    { id: "last7", label: "Last 7 Days", patch: { lastDays: 7, dateFrom: "", dateTo: "" } },
    { id: "last30", label: "Last 30 Days", patch: { lastDays: 30, dateFrom: "", dateTo: "" } },
    { id: "last90", label: "Last 90 Days", patch: { lastDays: 90, dateFrom: "", dateTo: "" } },
    { id: "house", label: "House Only", patch: { chamber: "House" } },
    { id: "senate", label: "Senate Only", patch: { chamber: "Senate" } },
    { id: "self", label: "Politician Owned", patch: { owner: "Self" } },
    { id: "spouse", label: "Spouse Owned", patch: { owner: "Spouse" } },
  ];
}

export function isQuickActive(f: FilterState, q: QuickFilter): boolean {
  return Object.entries(q.patch).every(([k, v]) => k === "sort" || k === "dir" || k === "dateFrom" || k === "dateTo" || f[k as keyof FilterState] === v);
}

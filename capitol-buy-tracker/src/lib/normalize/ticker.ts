// Ticker normalisation: "AAPL:US" → { ticker: "AAPL", country: "US" }, "BRK/B:US" → "BRK.B".

export interface NormalizedTicker {
  ticker: string;
  country: string; // exchange country code from the ":XX" suffix, "US" by default
}

const VALID = /^[A-Z]{1,5}(?:\.[A-Z]{1,2})?$/;

export function normalizeTicker(raw: string | null | undefined): NormalizedTicker | null {
  if (raw == null) return null;
  let s = String(raw).trim().toUpperCase();
  if (!s || /^(N\/?A|NONE|NULL|-+|—)$/.test(s)) return null;
  let country = "US";
  const suffix = s.match(/^(.+?):([A-Z]{2})$/);
  if (suffix) {
    s = suffix[1];
    country = suffix[2];
  }
  s = s.replace(/^\$/, "").replace(/[/\-\s]/g, ".");
  if (!VALID.test(s)) return null;
  return { ticker: s, country };
}

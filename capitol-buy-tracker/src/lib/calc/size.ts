// Parsing of disclosed transaction-size ranges ("1K–15K", "$1,001 - $15,000", "50M+").

export interface SizeRange {
  label: string; // normalized label, e.g. "1K–15K"
  min: number;
  max: number;
  estimated: number; // midpoint of the range
}

const SUFFIX: Record<string, number> = { "": 1, K: 1_000, M: 1_000_000, B: 1_000_000_000 };

/** Parses "15K", "$1,001", "2.5M" → number. Returns null if not numeric. */
export function parseAmount(raw: string): number | null {
  const m = raw
    .trim()
    .replace(/[$,\s]/g, "")
    .toUpperCase()
    .match(/^(\d+(?:\.\d+)?)([KMB]?)$/);
  if (!m) return null;
  const n = parseFloat(m[1]) * SUFFIX[m[2]];
  return Number.isFinite(n) ? n : null;
}

/**
 * Disclosure brackets are "$1,001 – $15,000", "$15,001 – $50,000"… The trailing 1 is an
 * artefact of non-overlapping brackets: normalise 1,001 → 1,000 so that the range
 * matches the "1K–15K" label convention.
 */
export function normalizeBracketLow(n: number): number {
  return n >= 1000 && n % 1000 === 1 ? n - 1 : n;
}

/** Formats an amount like the Capitol Trades labels: 1000 → "1K", 1500000 → "1.5M". */
export function shortAmount(n: number): string {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, ""));
  if (n >= 1_000_000_000) return fmt(n / 1_000_000_000) + "B";
  if (n >= 1_000_000) return fmt(n / 1_000_000) + "M";
  if (n >= 1_000) return fmt(n / 1_000) + "K";
  return fmt(n);
}

export function makeRange(min: number, max: number): SizeRange | null {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max <= 0 || max < min) return null;
  const lo = normalizeBracketLow(min);
  return {
    label: lo === max ? `${shortAmount(lo)}+` : `${shortAmount(lo)}–${shortAmount(max)}`,
    min: lo,
    max,
    estimated: (lo + max) / 2,
  };
}

/**
 * Parses a size label into min / max / estimated (midpoint).
 *   "1K–15K"   → 1,000 / 15,000 / 8,000
 *   "< 1K"     → 0 / 1,000 / 500
 *   "> 50M", "50M+" → open-ended: min = max = estimated = 50,000,000 (conservative)
 */
export function parseSizeRange(raw: string | null | undefined): SizeRange | null {
  if (!raw) return null;
  const s = raw.trim().replace(/[‒–—−]/g, "-").replace(/\bto\b/gi, "-");
  if (!s || /^n\/?a$/i.test(s)) return null;

  const under = s.match(/^(?:<|under|less than|below)\s*(.+)$/i);
  if (under) {
    const max = parseAmount(under[1]);
    return max ? { label: `<${shortAmount(max)}`, min: 0, max, estimated: max / 2 } : null;
  }
  const over = s.match(/^(?:>|over|more than|above)\s*(.+)$/i) ?? s.match(/^(.+?)\s*\+$/);
  if (over) {
    const min = parseAmount(over[1]);
    return min ? makeRange(min, normalizeBracketLow(min)) : null;
  }
  const parts = s.split("-").map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  const min = parseAmount(parts[0]);
  const max = parseAmount(parts[1]);
  if (min === null || max === null) return null;
  return makeRange(min, max);
}

// Financial formulas. Every function is pure and covered by tests/finance.test.ts.

import type { OpportunityStatus } from "../types";

export const DEFAULT_PREMIUM_PCT = 2.99;

/** ((current − purchase) / purchase) × 100. Null when either price is missing or invalid. */
export function priceVariationPct(current: number | null | undefined, purchase: number | null | undefined): number | null {
  if (current == null || purchase == null) return null;
  if (!Number.isFinite(current) || !Number.isFinite(purchase) || purchase <= 0 || current <= 0) return null;
  return ((current - purchase) / purchase) * 100;
}

/** Rounds to 2 decimals avoiding binary artefacts (e.g. -2.9899999 → -2.99). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * BELOW: current < purchase
 * NEAR:  purchase ≤ current ≤ purchase × (1 + premium/100)
 * ABOVE: current > purchase × (1 + premium/100)
 * A tiny epsilon makes the boundary inclusive despite floating point (100 × 1.0299).
 */
export function opportunityStatus(
  current: number | null | undefined,
  purchase: number | null | undefined,
  premiumPct: number = DEFAULT_PREMIUM_PCT,
): OpportunityStatus {
  if (current == null || purchase == null || !(current > 0) || !(purchase > 0)) return "NO_PRICE";
  const premium = Math.max(0, Number.isFinite(premiumPct) ? premiumPct : DEFAULT_PREMIUM_PCT);
  const limit = purchase * (1 + premium / 100);
  const eps = 1e-9 * purchase;
  if (current < purchase - eps) return "BELOW";
  if (current <= limit + eps) return "NEAR";
  return "ABOVE";
}

/** True for the main “BELOW OR NEAR POLITICIAN BUY PRICE” filter. */
export function isOpportunity(status: OpportunityStatus): boolean {
  return status === "BELOW" || status === "NEAR";
}

/** Σ(price × weight) / Σ(weight), weighted by estimated size. Null when no positive weight. */
export function weightedAveragePrice(items: { price: number; weight: number }[]): number | null {
  let num = 0;
  let den = 0;
  for (const { price, weight } of items) {
    if (!(price > 0) || !(weight > 0)) continue;
    num += price * weight;
    den += weight;
  }
  return den > 0 ? num / den : null;
}

/** Whole days between two YYYY-MM-DD dates (b − a). */
export function daysBetween(a: string, b: string): number | null {
  const ta = Date.parse(a + "T00:00:00Z");
  const tb = Date.parse(b + "T00:00:00Z");
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return Math.round((tb - ta) / 86_400_000);
}

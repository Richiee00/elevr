import { describe, expect, it } from "vitest";
import { daysBetween, isOpportunity, opportunityStatus, priceVariationPct, round2, weightedAveragePrice } from "@/lib/calc/finance";
import { formatPct, formatUsdShort } from "@/lib/format";

describe("priceVariationPct", () => {
  it.each([
    [100, 200, 100],
    [200, 100, -50],
    [100, 97.01, -2.99],
    [100, 102.99, 2.99],
    [100, 100, 0],
  ])("purchase %d, current %d → %d%%", (purchase, current, expected) => {
    expect(round2(priceVariationPct(current, purchase)!)).toBe(expected);
  });

  it("returns null when any price is missing or invalid", () => {
    expect(priceVariationPct(null, 100)).toBeNull();
    expect(priceVariationPct(100, null)).toBeNull();
    expect(priceVariationPct(100, 0)).toBeNull();
    expect(priceVariationPct(0, 100)).toBeNull();
    expect(priceVariationPct(NaN, 100)).toBeNull();
  });
});

describe("opportunityStatus (default premium 2.99%)", () => {
  it("BELOW when current < purchase", () => expect(opportunityStatus(97.01, 100)).toBe("BELOW"));
  it("NEAR when current == purchase", () => expect(opportunityStatus(100, 100)).toBe("NEAR"));
  it("NEAR exactly at the 2.99% limit (inclusive)", () => expect(opportunityStatus(102.99, 100)).toBe("NEAR"));
  it("ABOVE just over the limit", () => expect(opportunityStatus(103, 100)).toBe("ABOVE"));
  it("ABOVE far above", () => expect(opportunityStatus(200, 100)).toBe("ABOVE"));
  it("NO_PRICE without current price", () => expect(opportunityStatus(null, 100)).toBe("NO_PRICE"));
  it("current <= purchase × 1.0299 ⇔ opportunity", () => {
    for (const c of [50, 99.99, 100, 101, 102.98, 102.99]) expect(isOpportunity(opportunityStatus(c, 100))).toBe(c <= 100 * 1.0299 + 1e-9);
    for (const c of [103, 150]) expect(isOpportunity(opportunityStatus(c, 100))).toBe(false);
  });
  it("respects an editable premium", () => {
    expect(opportunityStatus(100.5, 100, 0)).toBe("ABOVE");
    expect(opportunityStatus(100, 100, 0)).toBe("NEAR");
    expect(opportunityStatus(101, 100, 1)).toBe("NEAR");
    expect(opportunityStatus(104.99, 100, 5)).toBe("NEAR");
    expect(opportunityStatus(110, 100, 10)).toBe("NEAR");
    expect(opportunityStatus(110.01, 100, 10)).toBe("ABOVE");
  });
});

describe("weightedAveragePrice", () => {
  it("weights by estimated size, not a simple mean", () => {
    const w = weightedAveragePrice([
      { price: 100, weight: 8_000 },
      { price: 110, weight: 75_000 },
    ])!;
    expect(round2(w)).toBe(109.04); // (100×8000 + 110×75000) / 83000
    expect(w).not.toBe(105);
    expect(Math.abs(w - 110)).toBeLessThan(Math.abs(w - 100));
  });
  it("ignores zero weights and returns null when empty", () => {
    expect(weightedAveragePrice([{ price: 50, weight: 0 }])).toBeNull();
    expect(weightedAveragePrice([])).toBeNull();
  });
});

describe("formatting", () => {
  it("abbreviated USD", () => {
    expect(formatUsdShort(750_000)).toBe("$750K");
    expect(formatUsdShort(2_500_000)).toBe("$2.5M");
    expect(formatUsdShort(8_000)).toBe("$8K");
    expect(formatUsdShort(32_500)).toBe("$32.5K");
  });
  it("percent always signed with 2 decimals", () => {
    expect(formatPct(100)).toBe("+100.00%");
    expect(formatPct(-50)).toBe("-50.00%");
    expect(formatPct(-2.99)).toBe("-2.99%");
    expect(formatPct(0)).toBe("0.00%");
    expect(formatPct(null)).toBe("—");
  });
  it("daysBetween", () => expect(daysBetween("2025-01-01", "2025-01-31")).toBe(30));
});

import { describe, expect, it } from "vitest";
import { makeRange, parseAmount, parseSizeRange, shortAmount } from "@/lib/calc/size";

describe("parseSizeRange", () => {
  it.each([
    ["1K–15K", 1_000, 15_000, 8_000],
    ["15K–50K", 15_000, 50_000, 32_500],
    ["50K–100K", 50_000, 100_000, 75_000],
    ["100K–250K", 100_000, 250_000, 175_000],
    ["250K–500K", 250_000, 500_000, 375_000],
    ["500K–1M", 500_000, 1_000_000, 750_000],
    ["1M–5M", 1_000_000, 5_000_000, 3_000_000],
    ["5M–25M", 5_000_000, 25_000_000, 15_000_000],
    ["25M–50M", 25_000_000, 50_000_000, 37_500_000],
  ])("%s → min %d, max %d, estimated %d", (label, min, max, est) => {
    const r = parseSizeRange(label)!;
    expect(r).not.toBeNull();
    expect(r.min).toBe(min);
    expect(r.max).toBe(max);
    expect(r.estimated).toBe(est);
    expect(r.estimated).toBe((r.min + r.max) / 2);
    expect(r.label).toBe(label);
  });

  it("accepts hyphens, spaces, dollar signs and disclosure brackets", () => {
    expect(parseSizeRange("1K-15K")!.estimated).toBe(8_000);
    expect(parseSizeRange("1K - 15K")!.estimated).toBe(8_000);
    expect(parseSizeRange("$1,001 - $15,000")).toMatchObject({ min: 1_000, max: 15_000, estimated: 8_000, label: "1K–15K" });
    expect(parseSizeRange("$500,001 – $1,000,000")).toMatchObject({ min: 500_000, max: 1_000_000, estimated: 750_000 });
    expect(parseSizeRange("15K to 50K")!.estimated).toBe(32_500);
  });

  it("handles open-ended and under ranges", () => {
    expect(parseSizeRange("< 1K")).toMatchObject({ min: 0, max: 1_000, estimated: 500 });
    expect(parseSizeRange("> 50M")).toMatchObject({ min: 50_000_000, max: 50_000_000, estimated: 50_000_000 });
    expect(parseSizeRange("50M+")!.estimated).toBe(50_000_000);
  });

  it("rejects invalid labels", () => {
    for (const bad of ["", "N/A", "abc", "15K–1K", "1K–", null, undefined]) expect(parseSizeRange(bad as string)).toBeNull();
  });

  it("makeRange normalises numeric brackets from the JSON API", () => {
    expect(makeRange(1001, 15000)).toMatchObject({ min: 1000, max: 15000, estimated: 8000, label: "1K–15K" });
    expect(makeRange(1000001, 5000000)).toMatchObject({ label: "1M–5M", estimated: 3_000_000 });
    expect(makeRange(0, 0)).toBeNull();
    expect(makeRange(50, 10)).toBeNull();
  });

  it("parseAmount / shortAmount", () => {
    expect(parseAmount("2.5M")).toBe(2_500_000);
    expect(parseAmount("$15,000")).toBe(15_000);
    expect(parseAmount("x")).toBeNull();
    expect(shortAmount(2_500_000)).toBe("2.5M");
    expect(shortAmount(750_000)).toBe("750K");
  });
});

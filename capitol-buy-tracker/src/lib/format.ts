// Display formatting. Pure; used by client components and tests.

const trim = (s: string) => s.replace(/\.0+$|(\.\d*?)0+$/, "$1");

/** $750K, $2.5M, $1.25B. */
export function formatUsdShort(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}$${trim((a / 1e9).toFixed(2))}B`;
  if (a >= 1e6) return `${sign}$${trim((a / 1e6).toFixed(2))}M`;
  if (a >= 1e3) return `${sign}$${trim((a / 1e3).toFixed(1))}K`;
  return `${sign}$${trim(a.toFixed(0))}`;
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "+2.99%", "-50.00%", "0.00%". */
export function formatPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const r = Math.round(n * 100) / 100;
  if (r === 0) return "0.00%";
  return `${r > 0 ? "+" : "-"}${Math.abs(r).toFixed(2)}%`;
}

export function pctClass(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "text-faint";
  const r = Math.round(n * 100) / 100;
  return r > 0 ? "text-up" : r < 0 ? "text-down" : "text-muted";
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const t = Date.parse(d.length === 10 ? d + "T00:00:00Z" : d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" });
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
}

export function formatInt(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString("en-US");
}

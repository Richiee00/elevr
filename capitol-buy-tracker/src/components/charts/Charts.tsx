"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import { formatDate, formatPct, formatPrice, formatUsdShort } from "@/lib/format";
import type { Bucket } from "@/lib/query";
import { Empty } from "@/components/ui/States";
import { axisProps, C, tooltipStyle } from "./theme";

const usdTick = (v: number) => formatUsdShort(v);
const priceTick = (v: number) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "K" : v.toFixed(0)}`;

/** 1 — Top 10 stocks by estimated buy volume (horizontal bars, descending). */
export function TopStocksChart({ data }: { data: { ticker: string; issuerName: string; volume: number; trades: number }[] }) {
  if (!data.length) return <Empty title="No data" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 30 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }} barCategoryGap={4}>
        <CartesianGrid horizontal={false} stroke={C.grid} />
        <XAxis type="number" tickFormatter={usdTick} {...axisProps} />
        <YAxis type="category" dataKey="ticker" width={56} {...axisProps} tick={{ fill: C.text, fontSize: 11, fontFamily: "ui-monospace" }} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [formatUsdShort(v), "Estimated volume"]} labelFormatter={(l, p) => `${l} — ${p?.[0]?.payload?.issuerName ?? ""} (${p?.[0]?.payload?.trades ?? 0} buys)`} />
        <Bar isAnimationActive={false} dataKey="volume" fill={C.series1} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="volume" position="right" formatter={usdTick} style={{ fill: C.text, fontSize: 11 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 2 — Weighted avg politician buy price vs current market price, per ticker. */
export function PriceComparisonChart({ data }: { data: { ticker: string; buyPrice: number; currentPrice: number | null; variationPct: number | null }[] }) {
  if (!data.length) return <Empty title="Price data unavailable" hint="Configure a market-data API to compare prices." />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }} barGap={2} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="ticker" {...axisProps} tick={{ fill: C.text, fontSize: 11, fontFamily: "ui-monospace" }} />
        <YAxis tickFormatter={priceTick} width={52} {...axisProps} />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number, name: string) => [formatPrice(v), name]}
          labelFormatter={(l, p) => `${l} · variation ${formatPct(p?.[0]?.payload?.variationPct)}`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: C.text }} iconType="square" />
        <Bar isAnimationActive={false} dataKey="buyPrice" name="Weighted avg politician buy price" fill={C.series1} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar isAnimationActive={false} dataKey="currentPrice" name="Current market price" fill={C.series2} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 3 — Buy volume over time with day / week / month grouping. */
export function VolumeOverTimeChart({ data, bucket, onBucket }: { data: { date: string; volume: number; trades: number }[]; bucket: Bucket; onBucket?: (b: Bucket) => void }) {
  return (
    <div>
      {onBucket && (
        <div className="mb-2 flex gap-1 text-[11px]" role="group" aria-label="Group by">
          {(["day", "week", "month"] as Bucket[]).map((b) => (
            <button key={b} onClick={() => onBucket(b)} className={`rounded border px-2 py-0.5 capitalize ${bucket === b ? "border-link text-link" : "border-line text-muted hover:text-ink"}`}>
              {b === "day" ? "Daily" : b === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      )}
      {!data.length ? (
        <Empty title="No data" />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }} barCategoryGap={1}>
            <CartesianGrid vertical={false} stroke={C.grid} />
            <XAxis dataKey="date" tickFormatter={(d) => (bucket === "month" ? d.slice(0, 7) : d.slice(5))} minTickGap={24} {...axisProps} />
            <YAxis tickFormatter={usdTick} width={56} {...axisProps} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [formatUsdShort(v), "Estimated buy volume"]} labelFormatter={(l, p) => `${bucket === "month" ? String(l).slice(0, 7) : formatDate(String(l))} · ${p?.[0]?.payload?.trades ?? 0} buys`} />
            <Bar isAnimationActive={false} dataKey="volume" fill={C.series1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** 4 — Top politicians by aggregated estimated buy volume. */
export function TopPoliticiansChart({ data }: { data: { politicianId: string; politicianName: string; totalEstimated: number; tradeCount: number; party: string }[] }) {
  if (!data.length) return <Empty title="No data" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 30 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }} barCategoryGap={4}>
        <CartesianGrid horizontal={false} stroke={C.grid} />
        <XAxis type="number" tickFormatter={usdTick} {...axisProps} />
        <YAxis type="category" dataKey="politicianName" width={150} {...axisProps} tick={{ fill: C.text, fontSize: 11 }} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [formatUsdShort(v), "Estimated volume"]} labelFormatter={(l, p) => `${l} (${p?.[0]?.payload?.party ?? ""}) · ${p?.[0]?.payload?.tradeCount ?? 0} buys`} />
        <Bar isAnimationActive={false} dataKey="totalEstimated" fill={C.series1} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="totalEstimated" position="right" formatter={usdTick} style={{ fill: C.text, fontSize: 11 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 5 — Price opportunity distribution (stocks). Status colors carry an icon + label, never color alone. */
export function OpportunityDistributionChart({ dist, premium }: { dist: { BELOW: number; NEAR: number; ABOVE: number; NO_PRICE: number }; premium: number }) {
  const rows = [
    { key: "BELOW", label: "▼ Below buy price", value: dist.BELOW, color: C.good, href: "/stocks?status=BELOW" },
    { key: "NEAR", label: `≈ Near (≤ +${premium}%)`, value: dist.NEAR, color: C.warning, href: "/stocks?status=NEAR" },
    { key: "ABOVE", label: "▲ Above buy price", value: dist.ABOVE, color: C.neutral, href: "/stocks?status=ABOVE" },
    { key: "NO_PRICE", label: "– No current price", value: dist.NO_PRICE, color: C.none, href: "/stocks?status=NO_PRICE" },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return <Empty title="No data" />;
  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded" role="img" aria-label="Distribution of stocks by price status">
        {rows.filter((r) => r.value > 0).map((r) => (
          <div key={r.key} style={{ width: `${(r.value / total) * 100}%`, background: r.color }} title={`${r.label}: ${r.value}`} />
        ))}
      </div>
      <ul className="space-y-1.5 text-xs">
        {rows.map((r) => (
          <li key={r.key}>
            <Link href={r.href + `&premium=${premium}`} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-panel2">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                <span className="text-ink">{r.label}</span>
              </span>
              <span className="num text-muted">
                {r.value} <span className="text-faint">({((r.value / total) * 100).toFixed(0)}%)</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Stock detail — purchase price distribution (count of buys per price bin). */
export function PriceDistributionChart({ data, currentPrice }: { data: { label: string; trades: number; volume: number }[]; currentPrice: number | null }) {
  if (!data.length) return <Empty title="No data" />;
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="label" interval={0} angle={-30} textAnchor="end" height={50} {...axisProps} tick={{ fill: C.axis, fontSize: 10 }} />
          <YAxis allowDecimals={false} width={32} {...axisProps} />
          <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [n === "trades" ? v : formatUsdShort(v), n === "trades" ? "Buys" : "Volume"]} />
          <Bar isAnimationActive={false} dataKey="trades" fill={C.series1} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {currentPrice != null && <p className="mt-1 text-xs text-muted">Current price: <span className="num text-ink">{formatPrice(currentPrice)}</span></p>}
    </div>
  );
}

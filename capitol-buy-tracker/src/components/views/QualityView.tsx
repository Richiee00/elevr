"use client";

import { useApi } from "@/hooks/useApi";
import { StatusBar, type Meta } from "@/components/layout/StatusBar";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState, Loading, Empty } from "@/components/ui/States";
import { formatDateTime, formatInt } from "@/lib/format";
import type { UpdateLog } from "@/lib/types";

interface Quality {
  meta: Meta;
  lastRun: UpdateLog | null;
  totals: {
    validStored: number;
    validDisplayed: number;
    rejectedNotBuy: number;
    rejectedNotStock: number;
    rejectedMissingTicker: number;
    rejectedMissingPrice: number;
    rejectedOther: number;
    duplicates: number | null;
    stocksWithoutPrice: number;
    stocksTotal: number;
  };
  logs: UpdateLog[];
}

const STATUS_CLS: Record<string, string> = { success: "text-up", partial: "text-near", error: "text-down", running: "text-link" };

export function QualityView() {
  const { data, error, loading, retry } = useApi<Quality>("/api/quality");
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (loading || !data) return <Loading label="Loading data-quality report…" />;
  const run = (data.lastRun?.stats ?? {}) as Record<string, number | string | undefined>;
  const t = data.totals;
  const v = (n: unknown) => (typeof n === "number" ? formatInt(n) : "—");

  return (
    <div className="space-y-4">
      <StatusBar meta={data.meta} />
      <Card title="Data Quality — Last Trades Refresh" subtitle={data.lastRun ? `${formatDateTime(data.lastRun.startedAt)} · status: ${data.lastRun.status}${run.via ? ` · via ${run.via}` : ""}` : "No ingestion run recorded yet"}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Rows Retrieved" value={v(run.retrieved)} />
          <KpiCard label="Valid Buy Rows" value={v(run.valid)} tone="up" hint={typeof run.inserted === "number" ? `${run.inserted} new` : undefined} />
          <KpiCard label="Rejected: Type Not BUY" value={v(run.rejectedNotBuy)} tone="down" />
          <KpiCard label="Rejected: Asset Not STOCK" value={v(run.rejectedNotStock)} tone="down" />
          <KpiCard label="Rejected: Ticker Missing" value={v(run.rejectedMissingTicker)} tone="down" />
          <KpiCard label="Rejected: Purchase Price Missing" value={v(run.rejectedMissingPrice)} tone="down" />
          <KpiCard label="Rejected: Other (size/date)" value={v(run.rejectedOther)} tone="down" />
          <KpiCard label="Duplicate Rows Removed" value={v(run.duplicatesRemoved ?? t.duplicates)} hint={typeof run.alreadyStored === "number" ? `${run.alreadyStored} already stored` : undefined} />
          <KpiCard label="Stocks Without Current Price" value={`${t.stocksWithoutPrice} / ${t.stocksTotal}`} tone={t.stocksWithoutPrice ? "near" : "default"} />
          <KpiCard label="Last Successful Refresh" value={<span className="text-sm">{formatDateTime(data.meta.lastTradesRefresh)}</span>} hint={`Prices: ${formatDateTime(data.meta.lastPricesRefresh)}`} />
        </div>
      </Card>

      <Card title="Stored History (all runs)" subtitle="Valid trades are never deleted. Rejected rows are kept for audit, one entry per source row.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Valid Trades Stored" value={formatInt(t.validStored)} hint={`${formatInt(t.validDisplayed)} pass display checks`} />
          <KpiCard label="Not BUY" value={formatInt(t.rejectedNotBuy)} />
          <KpiCard label="Not STOCK" value={formatInt(t.rejectedNotStock)} />
          <KpiCard label="Missing Ticker" value={formatInt(t.rejectedMissingTicker)} />
          <KpiCard label="Missing Price" value={formatInt(t.rejectedMissingPrice)} />
          <KpiCard label="Other" value={formatInt(t.rejectedOther)} />
        </div>
      </Card>

      <Card title="Update Logs">
        {data.logs.length === 0 ? (
          <Empty title="No update runs yet" hint="Run `npm run update:trades` and `npm run update:prices`." />
        ) : (
          <DataTable
            rows={data.logs}
            rowKey={(l) => String(l.id)}
            maxHeight="480px"
            columns={[
              { key: "job", header: "Job", render: (l) => <span className="font-mono">{l.job}</span> },
              { key: "status", header: "Status", render: (l) => <span className={`font-semibold uppercase ${STATUS_CLS[l.status] ?? ""}`}>{l.status}</span> },
              { key: "start", header: "Started", render: (l) => <span className="num text-muted">{formatDateTime(l.startedAt)}</span> },
              { key: "end", header: "Finished", render: (l) => <span className="num text-muted">{formatDateTime(l.finishedAt)}</span> },
              { key: "stats", header: "Stats", render: (l) => <code className="block max-w-[520px] truncate text-[10px] text-muted" title={JSON.stringify(l.stats)}>{Object.entries(l.stats).map(([k, x]) => `${k}=${x}`).join(" ")}</code> },
              { key: "msg", header: "Message", render: (l) => <span className="block max-w-[360px] truncate text-muted" title={l.message ?? ""}>{l.message ?? ""}</span> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

"use client";

import { useApi } from "@/hooks/useApi";
import { useFilters } from "@/hooks/useFilters";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { StatusBar, type Meta } from "@/components/layout/StatusBar";
import { Card } from "@/components/ui/Card";
import { Empty, ErrorState, Loading } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { TradesTable, type RankedTrade } from "@/components/tables/TradesTable";
import { formatUsdShort } from "@/lib/format";

interface TradesResponse {
  meta: Meta;
  rows: RankedTrade[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  totalEstimated: number;
}

export function TradesView() {
  const { filters, set, toggleSort, queryString } = useFilters();
  const { data, error, loading, retry } = useApi<TradesResponse>(`/api/trades?${queryString}`);
  const sort = filters.sort || "sizeEstimated";

  return (
    <div className="space-y-4">
      <StatusBar meta={data?.meta} />
      <FilterPanel />
      <Card
        title="Top Politician Stock Buys"
        subtitle={data ? `${data.total.toLocaleString()} valid BUY trades · ${formatUsdShort(data.totalEstimated)} estimated volume · default order: estimated size ↓, trade date ↓, published date ↓` : undefined}
        actions={
          <a href={`/api/trades?${queryString}${queryString ? "&" : ""}format=csv`} className="rounded border border-line px-2.5 py-1 text-xs hover:bg-panel2" download>
            ⬇ Export CSV
          </a>
        }
      >
        {error && <ErrorState error={error} onRetry={retry} />}
        {loading && !data && <Loading />}
        {data && data.total === 0 && <Empty title="No trades match these filters" />}
        {data && data.total > 0 && (
          <div className={loading ? "opacity-60" : ""}>
            <TradesTable rows={data.rows} sort={sort} dir={filters.sort ? filters.dir : "desc"} onSort={(k) => toggleSort(k, "sizeEstimated")} />
            <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onPage={(page) => set({ page })} onPageSize={(pageSize) => set({ pageSize })} />
          </div>
        )}
      </Card>
    </div>
  );
}

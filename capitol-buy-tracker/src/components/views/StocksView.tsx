"use client";

import { useApi } from "@/hooks/useApi";
import { useFilters } from "@/hooks/useFilters";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { StatusBar, type Meta } from "@/components/layout/StatusBar";
import { Card } from "@/components/ui/Card";
import { Empty, ErrorState, Loading } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { StocksTable, type RankedStock } from "@/components/tables/StocksTable";

interface StocksResponse {
  meta: Meta;
  rows: RankedStock[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
}

export function StocksView() {
  const { filters, set, toggleSort, queryString } = useFilters();
  const { data, error, loading, retry } = useApi<StocksResponse>(`/api/stocks?${queryString}`);

  return (
    <div className="space-y-4">
      <StatusBar meta={data?.meta} />
      <FilterPanel />
      <Card
        title="Most Bought Stocks by Politicians"
        subtitle="Weighted average buy price = Σ(price × estimated size) / Σ(estimated size). Default order: total estimated volume ↓, unique politicians ↓, buy transactions ↓."
        actions={
          <a href={`/api/stocks?${queryString}${queryString ? "&" : ""}format=csv`} className="rounded border border-line px-2.5 py-1 text-xs hover:bg-panel2" download>
            ⬇ Export CSV
          </a>
        }
      >
        {error && <ErrorState error={error} onRetry={retry} />}
        {loading && !data && <Loading />}
        {data && data.total === 0 && <Empty title="No stocks match these filters" />}
        {data && data.total > 0 && (
          <div className={loading ? "opacity-60" : ""}>
            <StocksTable rows={data.rows} sort={filters.sort || "totalEstimated"} dir={filters.sort ? filters.dir : "desc"} onSort={(k) => toggleSort(k, "totalEstimated")} />
            <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onPage={(page) => set({ page })} onPageSize={(pageSize) => set({ pageSize })} />
          </div>
        )}
      </Card>
    </div>
  );
}

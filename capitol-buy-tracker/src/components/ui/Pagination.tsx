"use client";

export function Pagination({ page, pages, total, pageSize, onPage, onPageSize }: { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void; onPageSize: (n: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "rounded border border-line px-2.5 py-1 text-xs disabled:opacity-30 hover:bg-panel2";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-muted">
      <div className="num">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1">
          Rows
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded border border-line bg-panel2 px-1 py-0.5">
            {[25, 50, 100, 250].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button className={btn} disabled={page <= 1} onClick={() => onPage(1)} aria-label="First page">«</button>
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <span className="num">
          {page} / {pages}
        </span>
        <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
        <button className={btn} disabled={page >= pages} onClick={() => onPage(pages)} aria-label="Last page">»</button>
      </div>
    </div>
  );
}

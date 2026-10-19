"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortKey?: string; // omitted = not sortable
  align?: "left" | "right" | "center";
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  sort,
  dir,
  onSort,
  maxHeight = "70vh",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (r: T) => string;
  rowClassName?: (r: T) => string;
  sort?: string;
  dir?: "asc" | "desc";
  onSort?: (key: string) => void;
  maxHeight?: string;
}) {
  const align = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");
  return (
    <div className="overflow-auto rounded-md border border-line" style={{ maxHeight }}>
      <table className="sticky-table w-full border-collapse text-xs">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort === c.sortKey && !!c.sortKey;
              return (
                <th key={c.key} scope="col" className={`whitespace-nowrap border-b border-line px-2.5 py-2 font-semibold uppercase tracking-wide text-muted ${align(c.align)}`}>
                  {c.sortKey && onSort ? (
                    <button onClick={() => onSort(c.sortKey!)} className={`inline-flex items-center gap-1 uppercase hover:text-ink ${active ? "text-ink" : ""}`} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                      {c.header}
                      <span className="text-[9px]">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className={rowClassName?.(r) ?? ""}>
              {columns.map((c) => (
                <td key={c.key} className={`whitespace-nowrap border-b border-line/60 px-2.5 py-1.5 ${align(c.align)} ${c.className ?? ""}`}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

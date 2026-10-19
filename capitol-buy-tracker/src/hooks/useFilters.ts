"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_FILTERS, parseFilters, serializeFilters, type FilterState } from "@/lib/query";

/** Filter state lives in the URL so views are shareable and survive reloads. */
export function useFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);

  const set = useCallback(
    (patch: Partial<FilterState>, opts: { keepPage?: boolean } = {}) => {
      const next = { ...filters, ...patch };
      if (!opts.keepPage && !("page" in patch)) next.page = 1;
      const qs = serializeFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const reset = useCallback(() => {
    const keep = filters.premium !== DEFAULT_FILTERS.premium ? `?premium=${filters.premium}` : "";
    router.replace(pathname + keep, { scroll: false });
  }, [filters.premium, pathname, router]);

  /** `defaultSort` is the column the table is ordered by when no sort is in the URL. */
  const toggleSort = useCallback(
    (key: string, defaultSort = "") => {
      const current = filters.sort || defaultSort;
      const dir = filters.sort ? filters.dir : "desc";
      if (current === key) set({ sort: key, dir: dir === "desc" ? "asc" : "desc" });
      else set({ sort: key, dir: "desc" });
    },
    [filters.sort, filters.dir, set],
  );

  const queryString = serializeFilters(filters);
  return { filters, set, reset, toggleSort, queryString };
}

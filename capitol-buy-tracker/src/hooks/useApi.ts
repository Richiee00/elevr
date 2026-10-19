"use client";

import { useCallback, useEffect, useState } from "react";

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(url, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
        setData(body as T);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [url, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, retry };
}

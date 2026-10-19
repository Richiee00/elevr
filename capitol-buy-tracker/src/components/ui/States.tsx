export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-link" />
      {label}
    </div>
  );
}

export function Empty({ title = "No results", hint }: { title?: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="rounded-md border border-red-900 bg-red-950/40 p-4 text-sm text-red-200" role="alert">
      <div className="font-semibold">Could not load data</div>
      <div className="mt-1 break-words text-xs text-red-300">{error}</div>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded border border-red-800 px-3 py-1 text-xs hover:bg-red-900/40">
          Retry
        </button>
      )}
    </div>
  );
}

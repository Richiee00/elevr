// Structured JSON logs (visible in `vercel logs` / terminal). Persistent run logs live in update_logs.

type Level = "info" | "warn" | "error";

function write(level: Level, event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...data });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => write("error", event, data),
};

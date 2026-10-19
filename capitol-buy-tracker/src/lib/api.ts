import { NextResponse } from "next/server";
import { log } from "./log";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log.error("api.error", { message });
    return json({ error: message }, { status: 500 });
  }
}

export function round(n: number | null, d = 2) {
  return n == null ? null : Math.round(n * 10 ** d) / 10 ** d;
}

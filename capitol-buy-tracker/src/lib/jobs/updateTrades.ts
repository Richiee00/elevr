// Job 1 — Update political trades. Fetch → normalise → validate → dedupe → insert (never deletes history).

import { config } from "../config";
import type { Repository } from "../db/repository";
import { log } from "../log";
import { normalizeBatch } from "../normalize/trade";
import { fetchTradesPage } from "../sources/capitoltrades";

export interface TradesJobResult {
  status: "success" | "partial" | "error";
  stats: Record<string, number | string>;
  message?: string;
}

export async function updateTrades(repo: Repository, opts: { maxPages?: number } = {}): Promise<TradesJobResult> {
  if (repo.kind === "mock") return { status: "success", stats: {}, message: "Mock mode: ingestion disabled." };
  const logId = await repo.startLog("trades");
  const maxPages = opts.maxPages ?? config.capitolTrades.maxPages;
  const totals = {
    pages: 0,
    retrieved: 0,
    valid: 0,
    inserted: 0,
    alreadyStored: 0,
    rejectedNotBuy: 0,
    rejectedNotStock: 0,
    rejectedMissingTicker: 0,
    rejectedMissingPrice: 0,
    rejectedOther: 0,
    duplicatesRemoved: 0,
  };
  let via = "";
  let knownStreak = 0;
  let error: string | undefined;

  try {
    for (let page = 1; page <= maxPages; page++) {
      const fetched = await fetchTradesPage(page);
      via = fetched.via;
      totals.pages++;
      if (!fetched.rows.length) break;
      const batch = normalizeBatch(fetched.rows);
      const inserted = await repo.insertTrades(batch.trades);
      await repo.saveRejections(batch.rejections);

      totals.retrieved += batch.stats.retrieved;
      totals.valid += batch.stats.valid;
      totals.inserted += inserted;
      totals.alreadyStored += batch.trades.length - inserted;
      totals.rejectedNotBuy += batch.stats.rejectedNotBuy;
      totals.rejectedNotStock += batch.stats.rejectedNotStock;
      totals.rejectedMissingTicker += batch.stats.rejectedMissingTicker;
      totals.rejectedMissingPrice += batch.stats.rejectedMissingPrice;
      totals.rejectedOther += batch.stats.rejectedOther;
      // Rows already in the DB under another id but the same dedupe key are duplicates too
      totals.duplicatesRemoved += batch.stats.duplicatesRemoved;
      log.info("trades.page", { page, via, retrieved: batch.stats.retrieved, valid: batch.stats.valid, inserted });

      // Incremental mode: stop once N consecutive pages bring nothing new.
      knownStreak = inserted === 0 ? knownStreak + 1 : 0;
      if (knownStreak >= config.capitolTrades.stopAfterKnownPages) break;
      if (fetched.totalPages && page >= fetched.totalPages) break;
      await new Promise((r) => setTimeout(r, config.capitolTrades.requestDelayMs));
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    log.error("trades.failed", { error, pages: totals.pages });
  }

  const status = error ? (totals.pages > 0 && totals.retrieved > 0 ? "partial" : "error") : "success";
  const stats = { ...totals, via };
  await repo.finishLog(logId, status, stats, error);
  log.info("trades.done", { status, ...stats });
  return { status, stats, message: error };
}

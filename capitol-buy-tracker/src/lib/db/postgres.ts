import { Pool, types } from "pg";
import { config } from "../config";
import type { MarketPrice, Rejection, Trade, UpdateLog } from "../types";
import type { Quote } from "../prices/provider";
import type { QualityCounts, Repository } from "./repository";

// Return DATE columns as plain "YYYY-MM-DD" strings (no timezone shifting).
types.setTypeParser(1082, (v) => v);

let pool: Pool | null = null;
export function getPool(): Pool {
  if (!config.databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return pool;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));
const n = (v: unknown) => (v == null ? null : Number(v));

const TRADE_COLS = [
  "id", "dedupe_key", "source", "source_url", "politician_id", "politician_name", "party", "chamber", "state",
  "issuer_name", "ticker", "raw_ticker", "listing_country", "sector", "asset_type", "tx_type", "tx_type_original",
  "size_label", "size_min", "size_max", "size_estimated", "purchase_price", "price_currency", "trade_date",
  "published_date", "filed_after_days", "owner",
] as const;

function tradeValues(t: Trade): unknown[] {
  return [
    t.id, t.dedupeKey, t.source, t.sourceUrl, t.politicianId, t.politicianName, t.party, t.chamber, t.state,
    t.issuerName, t.ticker, t.rawTicker, t.listingCountry, t.sector, t.assetType, t.txType, t.txTypeOriginal,
    t.sizeLabel, t.sizeMin, t.sizeMax, t.sizeEstimated, t.purchasePrice, t.priceCurrency, t.tradeDate,
    t.publishedDate, t.filedAfterDays, t.owner,
  ];
}

function rowToTrade(r: Record<string, unknown>): Trade {
  return {
    id: String(r.id),
    dedupeKey: String(r.dedupe_key),
    source: String(r.source),
    sourceUrl: String(r.source_url),
    politicianId: String(r.politician_id),
    politicianName: String(r.politician_name),
    party: r.party as Trade["party"],
    chamber: r.chamber as Trade["chamber"],
    state: (r.state as string) ?? null,
    issuerName: String(r.issuer_name),
    ticker: String(r.ticker),
    rawTicker: String(r.raw_ticker),
    listingCountry: String(r.listing_country),
    sector: (r.sector as string) ?? null,
    assetType: r.asset_type as "STOCK",
    txType: r.tx_type as "BUY",
    txTypeOriginal: String(r.tx_type_original),
    sizeLabel: String(r.size_label),
    sizeMin: Number(r.size_min),
    sizeMax: Number(r.size_max),
    sizeEstimated: Number(r.size_estimated),
    purchasePrice: Number(r.purchase_price),
    priceCurrency: String(r.price_currency),
    tradeDate: String(r.trade_date),
    publishedDate: (r.published_date as string) ?? null,
    filedAfterDays: n(r.filed_after_days),
    owner: r.owner as Trade["owner"],
  };
}

export class PostgresRepository implements Repository {
  readonly kind = "postgres" as const;

  async insertTrades(trades: Trade[]): Promise<number> {
    if (!trades.length) return 0;
    let inserted = 0;
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < trades.length; i += 200) {
        const batch = trades.slice(i, i + 200);
        const params: unknown[] = [];
        const tuples = batch.map((t) => {
          const vals = tradeValues(t);
          const ph = vals.map((v) => {
            params.push(v);
            return `$${params.length}`;
          });
          return `(${ph.join(",")})`;
        });
        const res = await client.query(
          `INSERT INTO trades (${TRADE_COLS.join(",")}) VALUES ${tuples.join(",")} ON CONFLICT DO NOTHING`,
          params,
        );
        inserted += res.rowCount ?? 0;
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return inserted;
  }

  async saveRejections(rejections: Rejection[]): Promise<void> {
    for (const r of rejections) {
      await getPool().query(
        `INSERT INTO rejected_trades (source_key, reason, detail, raw) VALUES ($1,$2,$3,$4)
         ON CONFLICT (source_key) DO UPDATE SET reason = EXCLUDED.reason, detail = EXCLUDED.detail`,
        [r.sourceKey, r.reason, r.detail, JSON.stringify(r.raw)],
      );
    }
  }

  async listTrades(): Promise<Trade[]> {
    const { rows } = await getPool().query(
      `SELECT * FROM trades WHERE tx_type = 'BUY' AND asset_type = 'STOCK' AND purchase_price > 0 AND size_estimated > 0`,
    );
    return rows.map(rowToTrade);
  }

  async listPrices(): Promise<MarketPrice[]> {
    const { rows } = await getPool().query(`SELECT * FROM market_prices`);
    return rows.map((r) => ({
      ticker: r.ticker,
      price: n(r.price),
      currency: r.currency,
      provider: r.provider,
      priceType: r.price_type,
      priceTimestamp: iso(r.price_timestamp),
      fetchedAt: iso(r.fetched_at),
      lastAttemptAt: iso(r.last_attempt_at),
      lastError: r.last_error,
    }));
  }

  async tickersNeedingPrice(olderThanHours: number, limit: number): Promise<string[]> {
    const { rows } = await getPool().query(
      `SELECT t.ticker
         FROM (SELECT DISTINCT ticker FROM trades WHERE listing_country = 'US') t
         LEFT JOIN market_prices p ON p.ticker = t.ticker
        WHERE p.fetched_at IS NULL OR p.fetched_at < now() - ($1 || ' hours')::interval
        ORDER BY p.fetched_at NULLS FIRST, t.ticker
        LIMIT $2`,
      [String(olderThanHours), limit],
    );
    return rows.map((r) => r.ticker);
  }

  async savePrices(quotes: Quote[], provider: string): Promise<void> {
    for (const q of quotes) {
      const currency = q.currency ?? "USD";
      await getPool().query(
        `INSERT INTO market_prices (ticker, price, currency, provider, price_type, price_timestamp, fetched_at, last_attempt_at, last_error)
         VALUES ($1,$2,$3,$4,$5,$6, now(), now(), NULL)
         ON CONFLICT (ticker) DO UPDATE SET price = EXCLUDED.price, currency = EXCLUDED.currency, provider = EXCLUDED.provider,
           price_type = EXCLUDED.price_type, price_timestamp = EXCLUDED.price_timestamp, fetched_at = now(),
           last_attempt_at = now(), last_error = NULL`,
        [q.ticker, q.price, currency, provider, q.priceType, q.priceTimestamp],
      );
      await getPool().query(
        `INSERT INTO price_snapshots (ticker, snap_date, price, currency, provider, price_type)
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
         ON CONFLICT (ticker, snap_date) DO UPDATE SET price = EXCLUDED.price, price_type = EXCLUDED.price_type`,
        [q.ticker, q.price, currency, provider, q.priceType],
      );
    }
  }

  async savePriceErrors(errors: { ticker: string; error: string }[]): Promise<void> {
    // Keeps the last valid price; only records the attempt and error.
    for (const e of errors) {
      await getPool().query(
        `INSERT INTO market_prices (ticker, last_attempt_at, last_error) VALUES ($1, now(), $2)
         ON CONFLICT (ticker) DO UPDATE SET last_attempt_at = now(), last_error = EXCLUDED.last_error`,
        [e.ticker, e.error.slice(0, 500)],
      );
    }
  }

  async startLog(job: UpdateLog["job"]): Promise<number> {
    const { rows } = await getPool().query(`INSERT INTO update_logs (job, status) VALUES ($1, 'running') RETURNING id`, [job]);
    return Number(rows[0].id);
  }

  async finishLog(id: number, status: UpdateLog["status"], stats: UpdateLog["stats"], message?: string): Promise<void> {
    await getPool().query(`UPDATE update_logs SET status=$2, stats=$3, message=$4, finished_at=now() WHERE id=$1`, [
      id,
      status,
      JSON.stringify(stats),
      message ?? null,
    ]);
  }

  async listLogs(limit: number): Promise<UpdateLog[]> {
    const { rows } = await getPool().query(`SELECT * FROM update_logs ORDER BY started_at DESC LIMIT $1`, [limit]);
    return rows.map((r) => ({
      id: Number(r.id),
      job: r.job,
      status: r.status,
      startedAt: iso(r.started_at)!,
      finishedAt: iso(r.finished_at),
      stats: r.stats ?? {},
      message: r.message,
    }));
  }

  async qualityCounts(): Promise<QualityCounts> {
    const [v, r] = await Promise.all([
      getPool().query(`SELECT count(*)::int AS c FROM trades`),
      getPool().query(`SELECT reason, count(*)::int AS c FROM rejected_trades GROUP BY reason`),
    ]);
    return {
      validRows: v.rows[0].c,
      rejectedByReason: Object.fromEntries(r.rows.map((x) => [x.reason, x.c])),
    };
  }

  async dataVersion(): Promise<string> {
    const { rows } = await getPool().query(
      `SELECT (SELECT count(*) FROM trades) AS t,
              (SELECT max(updated_at) FROM trades) AS tu,
              (SELECT max(coalesce(fetched_at, last_attempt_at)) FROM market_prices) AS p`,
    );
    return `${rows[0].t}|${iso(rows[0].tu)}|${iso(rows[0].p)}`;
  }
}

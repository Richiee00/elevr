-- Capitol Buy Tracker — PostgreSQL schema (idempotent; run with `npm run db:migrate`)

-- Validated BUY + STOCK trades. History is never deleted by the update jobs.
CREATE TABLE IF NOT EXISTS trades (
  id                 TEXT PRIMARY KEY,              -- unique trade identifier (e.g. "ct-20003781234")
  dedupe_key         TEXT NOT NULL UNIQUE,          -- politician|ticker|trade date|size|price|owner
  source             TEXT NOT NULL,                 -- "capitoltrades-bff" | "capitoltrades-html"
  source_url         TEXT NOT NULL,
  politician_id      TEXT NOT NULL,
  politician_name    TEXT NOT NULL,
  party              TEXT NOT NULL,
  chamber            TEXT NOT NULL,                 -- House | Senate
  state              TEXT,
  issuer_name        TEXT NOT NULL,
  ticker             TEXT NOT NULL,                 -- canonical, e.g. "BRK.B"
  raw_ticker         TEXT NOT NULL,                 -- as published, e.g. "BRK/B:US"
  listing_country    TEXT NOT NULL DEFAULT 'US',
  sector             TEXT,
  asset_type         TEXT NOT NULL CHECK (asset_type = 'STOCK'),
  tx_type            TEXT NOT NULL CHECK (tx_type = 'BUY'),
  tx_type_original   TEXT NOT NULL,                 -- e.g. "buy", "BUY*"
  size_label         TEXT NOT NULL,                 -- e.g. "1K–15K"
  size_min           NUMERIC(16,2) NOT NULL CHECK (size_min >= 0),
  size_max           NUMERIC(16,2) NOT NULL,
  size_estimated     NUMERIC(16,2) NOT NULL CHECK (size_estimated > 0),
  purchase_price     NUMERIC(16,4) NOT NULL CHECK (purchase_price > 0),
  price_currency     TEXT NOT NULL DEFAULT 'USD',
  trade_date         DATE NOT NULL,
  published_date     DATE,
  filed_after_days   INTEGER,
  owner              TEXT NOT NULL,                 -- Self | Spouse | Joint | Child | Undisclosed
  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trades_ticker_idx     ON trades (ticker);
CREATE INDEX IF NOT EXISTS trades_politician_idx ON trades (politician_id);
CREATE INDEX IF NOT EXISTS trades_trade_date_idx ON trades (trade_date DESC);

-- Rows that failed validation (audit trail for the Data Quality panel).
CREATE TABLE IF NOT EXISTS rejected_trades (
  source_key     TEXT PRIMARY KEY,
  reason         TEXT NOT NULL,   -- NOT_BUY | NOT_STOCK | MISSING_TICKER | MISSING_PRICE | INVALID_SIZE | INVALID_DATE
  detail         TEXT,
  raw            JSONB,
  first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rejected_reason_idx ON rejected_trades (reason);

-- Latest valid market price per ticker (cache). Only overwritten by a successful fetch.
CREATE TABLE IF NOT EXISTS market_prices (
  ticker           TEXT PRIMARY KEY,
  price            NUMERIC(16,4),
  currency         TEXT,
  provider         TEXT,
  price_type       TEXT,          -- INTRADAY | CLOSE | DELAYED
  price_timestamp  TIMESTAMPTZ,   -- time of the quote according to the provider
  fetched_at       TIMESTAMPTZ,   -- last successful fetch
  last_attempt_at  TIMESTAMPTZ,
  last_error       TEXT
);

-- Daily snapshots (one per ticker per day), useful for audits/history.
CREATE TABLE IF NOT EXISTS price_snapshots (
  ticker      TEXT NOT NULL,
  snap_date   DATE NOT NULL,
  price       NUMERIC(16,4) NOT NULL,
  currency    TEXT NOT NULL,
  provider    TEXT NOT NULL,
  price_type  TEXT NOT NULL,
  PRIMARY KEY (ticker, snap_date)
);

-- Logs of every update run.
CREATE TABLE IF NOT EXISTS update_logs (
  id           BIGSERIAL PRIMARY KEY,
  job          TEXT NOT NULL,    -- trades | prices
  status       TEXT NOT NULL,    -- running | success | partial | error
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  stats        JSONB NOT NULL DEFAULT '{}'::jsonb,
  message      TEXT
);
CREATE INDEX IF NOT EXISTS update_logs_job_idx ON update_logs (job, started_at DESC);

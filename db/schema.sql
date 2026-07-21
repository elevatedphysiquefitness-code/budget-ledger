CREATE TABLE IF NOT EXISTS bills (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  amount         REAL NOT NULL,
  due_day        INTEGER CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31),
  paid           INTEGER NOT NULL DEFAULT 0,
  paid_cycle_key TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cards (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  balance      REAL NOT NULL,
  credit_limit REAL NOT NULL,
  apr          REAL NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS allocation_targets (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  savings           REAL NOT NULL DEFAULT 0,
  food              REAL NOT NULL DEFAULT 0,
  hobbies           REAL NOT NULL DEFAULT 0,
  other             REAL NOT NULL DEFAULT 0,
  extra_toward_debt REAL NOT NULL DEFAULT 0,
  savings_apy       REAL NOT NULL DEFAULT 0,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pay_schedule (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  hourly_rate         REAL,
  pay_frequency       TEXT NOT NULL,
  net_per_paycheck    REAL NOT NULL,
  monthly_average_net REAL,
  federal_withholding TEXT NOT NULL DEFAULT 'standard',
  next_pay_date       TEXT NOT NULL,
  pay_interval_days   INTEGER NOT NULL,
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  date                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  amount               REAL NOT NULL,
  source               TEXT NOT NULL CHECK (source IN ('plaid','manual')),
  plaid_transaction_id TEXT UNIQUE,
  plaid_account_id     TEXT,
  category             TEXT,
  pending              INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

CREATE TABLE IF NOT EXISTS plaid_item (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id                TEXT NOT NULL UNIQUE,
  access_token_encrypted TEXT NOT NULL,
  iv                     TEXT NOT NULL,
  auth_tag               TEXT NOT NULL,
  institution_name       TEXT,
  cursor                 TEXT,
  last_synced_at         TEXT,
  created_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  plaid_item_id     INTEGER NOT NULL REFERENCES plaid_item(id) ON DELETE CASCADE,
  plaid_account_id  TEXT NOT NULL UNIQUE,
  name              TEXT,
  official_name     TEXT,
  type              TEXT,
  subtype           TEXT,
  current_balance   REAL,
  available_balance REAL,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

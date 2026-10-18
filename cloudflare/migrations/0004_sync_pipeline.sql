-- V50: cấu hình một lần, chống trùng, ghi nhận lần nhập/sync.
CREATE TABLE IF NOT EXISTS sync_runs (
  run_id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK(source IN ('seller','orders')),
  status TEXT NOT NULL CHECK(status IN ('success','failed')),
  item_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON sync_runs(source, completed_at DESC);
CREATE TABLE IF NOT EXISTS sync_watermarks (
  source TEXT PRIMARY KEY,
  last_success_at TEXT,
  last_error_at TEXT,
  last_error TEXT,
  total_items_processed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ingest_batch_keys (
  batch_key TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sync_batch_created ON ingest_batch_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_order_channel ON order_reconciliations(channel_username, order_id);

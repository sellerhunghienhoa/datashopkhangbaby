-- V47: nguồn thật cần upsert từ TikTok theo order_item_id, cập nhật idempotent.
-- Không dùng tỷ lệ hiện tại để tính lại đơn cũ; lưu rate_snapshot_bps tại thời điểm bán.
CREATE TABLE IF NOT EXISTS affiliate_sku_rate_versions (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  sku_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'standard', -- standard / shop_ads / target, theo quyền API
  rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 0 AND 10000),
  effective_from TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aff_rates_lookup ON affiliate_sku_rate_versions(shop_id,sku_id,scope,effective_from DESC);
CREATE TABLE IF NOT EXISTS affiliate_order_items (
  order_item_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  creator_id TEXT,
  session_id TEXT,
  product_id TEXT NOT NULL,
  sku_id TEXT NOT NULL,
  attributed_source TEXT,
  placed_at TEXT NOT NULL,
  paid_eligible_vnd INTEGER NOT NULL DEFAULT 0 CHECK(paid_eligible_vnd>=0),
  cumulative_refund_vnd INTEGER NOT NULL DEFAULT 0 CHECK(cumulative_refund_vnd>=0 AND cumulative_refund_vnd<=paid_eligible_vnd),
  order_status TEXT NOT NULL,
  rate_version_id TEXT REFERENCES affiliate_sku_rate_versions(id),
  rate_snapshot_bps INTEGER NOT NULL CHECK(rate_snapshot_bps BETWEEN 0 AND 10000),
  estimated_commission_vnd INTEGER NOT NULL DEFAULT 0,
  adjusted_commission_vnd INTEGER NOT NULL DEFAULT 0,
  tiktok_confirmed_commission_vnd INTEGER,
  source_updated_at TEXT,
  reconciled_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aff_items_session ON affiliate_order_items(session_id);
CREATE INDEX IF NOT EXISTS idx_aff_items_order ON affiliate_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_aff_items_creator ON affiliate_order_items(creator_id);
CREATE TABLE IF NOT EXISTS affiliate_refund_events (
  event_id TEXT PRIMARY KEY, -- ID hoàn tiền phía TikTok; xử lý trùng lặp
  order_item_id TEXT NOT NULL REFERENCES affiliate_order_items(order_item_id),
  delta_refund_vnd INTEGER NOT NULL CHECK(delta_refund_vnd>=0),
  event_at TEXT NOT NULL,
  source_updated_at TEXT,
  raw_event_r2_key TEXT
);
CREATE TABLE IF NOT EXISTS affiliate_settlement_events (
  settlement_id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES affiliate_order_items(order_item_id),
  confirmed_vnd INTEGER NOT NULL CHECK(confirmed_vnd>=0),
  settled_at TEXT NOT NULL,
  source_updated_at TEXT,
  raw_event_r2_key TEXT
);
CREATE TABLE IF NOT EXISTS affiliate_reconciliation_audit (
  audit_id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL,
  actor_uid TEXT,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  origin TEXT NOT NULL, -- tiktok_sync / reconciliation_admin
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Tài chính chuẩn: số TikTok quyết toán là nguồn xác nhận, tính tạm chỉ là dự báo.

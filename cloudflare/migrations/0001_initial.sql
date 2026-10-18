-- Dữ liệu thật được ghi qua tác vụ đồng bộ đã xác thực ở backend, không qua trình duyệt.
-- Các định danh kênh hiển thị chỉ là nhãn; ID chính thức TikTok phải map sau OAuth.
CREATE TABLE IF NOT EXISTS app_users (
  firebase_uid TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin','Ops','Host','Viewer')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS official_channels (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  tiktok_creator_id TEXT UNIQUE,
  active INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO official_channels (username, display_name) VALUES
  ('mekhangsua','Mẹ Khang Sữa'), ('shopkhangbaby','ShopKhangBaby');

CREATE TABLE IF NOT EXISTS live_sessions (
  session_id TEXT PRIMARY KEY,
  channel_username TEXT NOT NULL REFERENCES official_channels(username),
  title TEXT NOT NULL,
  host_name TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  gross_gmv_vnd INTEGER NOT NULL DEFAULT 0,
  canceled_refunded_vnd INTEGER NOT NULL DEFAULT 0,
  net_gmv_vnd INTEGER NOT NULL DEFAULT 0,
  sold_units INTEGER NOT NULL DEFAULT 0,
  net_units INTEGER NOT NULL DEFAULT 0,
  source_updated_at TEXT,
  reconciled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lives_started ON live_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_lives_channel ON live_sessions(channel_username, started_at DESC);

-- Lưu biến động theo đơn để đối soát hoàn/hủy; tránh sửa trực tiếp số tổng phiên.
CREATE TABLE IF NOT EXISTS order_reconciliations (
  order_id TEXT PRIMARY KEY,
  live_session_id TEXT,
  channel_username TEXT,
  order_status TEXT NOT NULL,
  gross_amount_vnd INTEGER NOT NULL DEFAULT 0,
  refunded_amount_vnd INTEGER NOT NULL DEFAULT 0,
  final_amount_vnd INTEGER NOT NULL DEFAULT 0,
  last_source_update TEXT,
  reconciled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_live ON order_reconciliations(live_session_id);

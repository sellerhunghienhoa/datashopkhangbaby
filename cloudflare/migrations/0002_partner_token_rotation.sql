-- Dynamic TikTok PARTNER tokens encrypted with AES-GCM; secret key stays in Wrangler secrets.
-- Access token and refresh token change during renewal; do not put in plaintext .env or frontend.
CREATE TABLE IF NOT EXISTS partner_oauth_tokens (
  id TEXT PRIMARY KEY CHECK (id = 'partner'),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  access_expires_at INTEGER,
  refresh_expires_at INTEGER,
  open_id TEXT,
  user_type INTEGER,
  granted_scopes TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_initial_authorization',
  last_success_at INTEGER,
  last_attempt_at INTEGER,
  last_error_code TEXT,
  retry_after INTEGER,
  failure_count INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0
);

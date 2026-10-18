-- Two independent seller authorizations; never reuse Partner token as Seller access token.
CREATE TABLE IF NOT EXISTS seller_oauth_tokens (
  username TEXT PRIMARY KEY CHECK(username IN ('shopkhangbaby','mekhangsua')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  access_expires_at INTEGER,
  refresh_expires_at INTEGER,
  open_id TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_initial_authorization',
  last_refresh_at INTEGER,
  last_error_code TEXT,
  retry_after INTEGER,
  failures INTEGER DEFAULT 0,
  lease_until INTEGER DEFAULT 0
);

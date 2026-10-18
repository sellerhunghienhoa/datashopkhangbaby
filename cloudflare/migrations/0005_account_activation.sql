
-- V69: Firebase accounts begin as Viewer; Admin approves request tokens server-side.
-- Store SHA-256 hashes only. Never store plaintext activation tokens.
ALTER TABLE app_users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0,1));

CREATE TABLE IF NOT EXISTS account_activation_requests (
  firebase_uid TEXT PRIMARY KEY REFERENCES app_users(firebase_uid) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  approved_at TEXT,
  approved_by TEXT,
  approved_role TEXT CHECK(approved_role IN ('Viewer','Host','Ops'))
);
CREATE INDEX IF NOT EXISTS idx_activation_pending ON account_activation_requests(status, created_at DESC);

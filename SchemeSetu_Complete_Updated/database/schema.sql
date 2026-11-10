-- SchemeSetu persistent data model
-- Passwords are NEVER stored in plaintext. Store scrypt hashes + random salts.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  whatsapp_opt_in INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  age INTEGER,
  gender TEXT,
  category TEXT,
  state TEXT,
  district TEXT,
  income_bracket TEXT,
  education_level TEXT,
  business_type TEXT,
  disability_status TEXT,
  preferred_language TEXT DEFAULT 'en',
  consent_given INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheme_id TEXT NOT NULL,
  scheme_name TEXT,
  ministry TEXT,
  status TEXT NOT NULL DEFAULT 'matched',
  match_score INTEGER,
  match_reasons TEXT,
  application_reference TEXT,
  applied_date TEXT,
  last_updated TEXT DEFAULT (datetime('now')),
  notes TEXT,
  official_status TEXT,
  official_message TEXT,
  last_sync_at TEXT,
  sync_error TEXT,
  tracking_mode TEXT NOT NULL DEFAULT 'manual',
  tracking_consent_at TEXT,
  UNIQUE(user_id, scheme_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE TABLE IF NOT EXISTS application_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'user',
  provider_event_id TEXT,
  raw_status TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_application_events_application ON application_events(application_id);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Keep this table for backward compatibility with the original hackathon schema.
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

CREATE TABLE IF NOT EXISTS host_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_host_sessions_token ON host_sessions(token_hash);

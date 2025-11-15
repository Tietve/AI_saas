-- ════════════════════════════════════════════════════════════════
-- D1 Database Schema for Cloudflare Workers Gateway
-- ════════════════════════════════════════════════════════════════

-- Usage Tracking Table
-- Tracks API usage per user for billing and analytics
CREATE TABLE IF NOT EXISTS usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  service TEXT NOT NULL,           -- 'embeddings', 'chat', 'rag', etc.
  provider TEXT,                   -- 'cloudflare', 'openai', 'backend'
  model TEXT,                      -- Model name
  tokens INTEGER DEFAULT 0,        -- Tokens consumed
  cost REAL DEFAULT 0,             -- Cost in USD
  timestamp TEXT NOT NULL,         -- ISO 8601 timestamp
  metadata TEXT                    -- JSON for additional data
);

CREATE INDEX idx_usage_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_timestamp ON usage_tracking(timestamp);
CREATE INDEX idx_usage_service ON usage_tracking(service);

-- Rate Limiting Table (backup for KV)
-- Fallback rate limiting if KV is unavailable
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,        -- Format: 'rl:{endpoint}:{identifier}'
  count INTEGER DEFAULT 1,         -- Request count
  reset_at TEXT NOT NULL           -- ISO 8601 timestamp when counter resets
);

CREATE INDEX idx_ratelimit_key ON rate_limits(key);
CREATE INDEX idx_ratelimit_reset ON rate_limits(reset_at);

-- Analytics Events Table
-- Track important events for analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,        -- 'login', 'signup', 'error', etc.
  user_id TEXT,                    -- NULL for anonymous events
  data TEXT,                       -- JSON event data
  ip TEXT,                         -- Client IP
  country TEXT,                    -- Client country (from CF)
  timestamp TEXT NOT NULL          -- ISO 8601 timestamp
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);

-- User Registrations Table
-- Track signups for funnel analysis
CREATE TABLE IF NOT EXISTS user_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  referrer TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_registrations_timestamp ON user_registrations(timestamp);

-- Login Attempts Table
-- Track login attempts for security
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  success INTEGER NOT NULL,        -- 1 = success, 0 = failure
  ip TEXT,
  country TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_login_email ON login_attempts(email);
CREATE INDEX idx_login_timestamp ON login_attempts(timestamp);

-- Cost Tracking Summary Table
-- Daily cost aggregation for monitoring
CREATE TABLE IF NOT EXISTS cost_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,       -- YYYY-MM-DD
  total_cost REAL DEFAULT 0,
  cloudflare_cost REAL DEFAULT 0,  -- Should be 0!
  openai_cost REAL DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  cloudflare_requests INTEGER DEFAULT 0,
  openai_requests INTEGER DEFAULT 0
);

CREATE INDEX idx_cost_date ON cost_summary(date);

-- Cache Statistics Table
-- Track cache hit/miss rates
CREATE TABLE IF NOT EXISTS cache_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service TEXT NOT NULL,
  hits INTEGER DEFAULT 0,
  misses INTEGER DEFAULT 0,
  date TEXT NOT NULL              -- YYYY-MM-DD
);

CREATE INDEX idx_cache_service ON cache_stats(service);
CREATE INDEX idx_cache_date ON cache_stats(date);

-- ════════════════════════════════════════════════════════════════
-- Initial Data (Optional)
-- ════════════════════════════════════════════════════════════════

-- Insert initial cost summary for today
INSERT OR IGNORE INTO cost_summary (date, total_cost, total_requests)
VALUES (date('now'), 0, 0);

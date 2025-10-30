-- =====================================================
-- Analytics Events Table
-- =====================================================
-- Raw events from all services (Auth, Chat, Billing)
-- Partitioned by month for efficient data management
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_db.events (
    -- Event Identification
    event_id UUID DEFAULT generateUUIDv4(),
    event_type String,
    event_category String,  -- 'user', 'chat', 'billing', 'provider'

    -- Timestamp
    timestamp DateTime DEFAULT now(),
    date Date DEFAULT toDate(timestamp),

    -- User Information
    user_id String,
    user_email String,
    plan_tier String,  -- 'FREE', 'PRO', 'ENTERPRISE'

    -- Event Metadata
    service_name String,  -- 'auth-service', 'chat-service', 'billing-service'

    -- Chat-specific fields
    conversation_id String DEFAULT '',
    message_id String DEFAULT '',
    ai_provider String DEFAULT '',  -- 'openai', 'anthropic', 'google'
    ai_model String DEFAULT '',     -- 'gpt-4', 'claude-3-sonnet', etc.
    tokens_used Int32 DEFAULT 0,
    response_time_ms Int32 DEFAULT 0,

    -- Billing-specific fields
    payment_id String DEFAULT '',
    amount Decimal(10, 2) DEFAULT 0,
    currency String DEFAULT 'VND',
    subscription_id String DEFAULT '',

    -- Request Information
    ip_address String DEFAULT '',
    user_agent String DEFAULT '',
    country String DEFAULT '',

    -- Additional metadata (JSON)
    metadata String DEFAULT '{}',

    -- Error tracking
    is_error Bool DEFAULT false,
    error_message String DEFAULT '',

    -- Indexes for common queries
    INDEX idx_user_id user_id TYPE bloom_filter GRANULARITY 4,
    INDEX idx_event_type event_type TYPE bloom_filter GRANULARITY 4,
    INDEX idx_ai_provider ai_provider TYPE bloom_filter GRANULARITY 4

) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, timestamp, event_category, event_type)
TTL date + INTERVAL 12 MONTH  -- Keep data for 12 months
SETTINGS index_granularity = 8192;

-- =====================================================
-- Comments
-- =====================================================
-- This table stores all raw events from microservices
-- Data is partitioned by month for efficient queries
-- Old data (>12 months) is automatically deleted
-- Bloom filter indexes speed up user/event/provider lookups
-- =====================================================

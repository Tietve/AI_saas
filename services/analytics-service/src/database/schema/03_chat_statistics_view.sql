-- =====================================================
-- Chat Statistics Materialized View
-- =====================================================
-- Pre-aggregated chat and AI provider metrics
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.chat_statistics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, ai_provider, ai_model)
AS
SELECT
    date,
    ai_provider,
    ai_model,

    -- Message counts
    countIf(event_type = 'chat.message_sent') as messages_sent,
    countIf(event_type = 'chat.conversation_created') as conversations_created,

    -- Token usage
    sum(tokens_used) as total_tokens,
    avg(tokens_used) as avg_tokens_per_message,
    max(tokens_used) as max_tokens_in_message,

    -- Performance metrics
    avg(response_time_ms) as avg_response_time_ms,
    quantile(0.95)(response_time_ms) as p95_response_time_ms,
    quantile(0.99)(response_time_ms) as p99_response_time_ms,

    -- User engagement
    uniq(user_id) as unique_users,
    uniq(conversation_id) as unique_conversations,

    -- Error tracking
    countIf(is_error = true) as error_count,
    countIf(is_error = true) / count() as error_rate,

    -- Plan tier breakdown
    countIf(plan_tier = 'FREE') as free_tier_messages,
    countIf(plan_tier = 'PRO') as pro_tier_messages,
    countIf(plan_tier = 'ENTERPRISE') as enterprise_tier_messages

FROM analytics_db.events
WHERE event_category = 'chat'
GROUP BY date, ai_provider, ai_model;

-- =====================================================
-- Hourly Chat Metrics (for real-time dashboards)
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.chat_metrics_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, hour, ai_provider)
AS
SELECT
    date,
    toHour(timestamp) as hour,
    ai_provider,

    count() as total_requests,
    sum(tokens_used) as total_tokens,
    avg(response_time_ms) as avg_response_time_ms,
    countIf(is_error = true) as errors,
    uniq(user_id) as unique_users

FROM analytics_db.events
WHERE event_category = 'chat'
GROUP BY date, hour, ai_provider;

-- =====================================================
-- Provider Usage Summary
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.provider_usage
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, ai_provider)
AS
SELECT
    date,
    ai_provider,

    -- Usage counts
    count() as total_requests,
    sum(tokens_used) as total_tokens,

    -- Performance
    avg(response_time_ms) as avg_response_time,
    quantile(0.95)(response_time_ms) as p95_response_time,

    -- Reliability
    countIf(is_error = false) as successful_requests,
    countIf(is_error = true) as failed_requests,
    countIf(is_error = true) / count() as error_rate,

    -- Cost estimation (tokens * estimated cost per 1K tokens)
    -- OpenAI: ~$0.03/1K, Anthropic: ~$0.015/1K, Google: ~$0.001/1K
    CASE ai_provider
        WHEN 'openai' THEN sum(tokens_used) * 0.00003
        WHEN 'anthropic' THEN sum(tokens_used) * 0.000015
        WHEN 'google' THEN sum(tokens_used) * 0.000001
        ELSE 0
    END as estimated_cost_usd,

    -- User engagement
    uniq(user_id) as unique_users,
    uniq(conversation_id) as unique_conversations

FROM analytics_db.events
WHERE event_category = 'chat' AND ai_provider != ''
GROUP BY date, ai_provider;

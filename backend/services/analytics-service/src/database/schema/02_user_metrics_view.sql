-- =====================================================
-- User Metrics Materialized View
-- =====================================================
-- Pre-aggregated user activity metrics
-- Updated automatically when new events arrive
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.user_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id, plan_tier)
AS
SELECT
    date,
    user_id,
    user_email,
    plan_tier,

    -- Activity counts
    count() as total_events,
    countIf(event_category = 'user' AND event_type = 'user.signin') as signin_count,
    countIf(event_category = 'chat') as chat_events,
    countIf(event_category = 'billing') as billing_events,

    -- Chat metrics
    countIf(event_category = 'chat' AND event_type = 'chat.message_sent') as messages_sent,
    countIf(event_category = 'chat' AND event_type = 'chat.conversation_created') as conversations_created,
    sum(tokens_used) as total_tokens_used,

    -- Billing metrics
    sum(amount) as total_spent,
    countIf(event_category = 'billing' AND event_type = 'billing.payment_success') as successful_payments,

    -- Error tracking
    countIf(is_error = true) as error_count,

    -- Last activity
    max(timestamp) as last_active_at

FROM analytics_db.events
GROUP BY date, user_id, user_email, plan_tier;

-- =====================================================
-- User Daily Active Users (DAU) View
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.daily_active_users
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY date
AS
SELECT
    date,
    uniqState(user_id) as unique_users,
    uniqStateIf(user_id, plan_tier = 'FREE') as free_users,
    uniqStateIf(user_id, plan_tier = 'PRO') as pro_users,
    uniqStateIf(user_id, plan_tier = 'ENTERPRISE') as enterprise_users
FROM analytics_db.events
GROUP BY date;

-- =====================================================
-- User Retention View
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.user_retention
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(activity_month)
ORDER BY (activity_month, user_id)
AS
SELECT
    toStartOfMonth(timestamp) as activity_month,
    user_id,
    count() as events_in_period
FROM analytics_db.events
WHERE event_category = 'user'
GROUP BY activity_month, user_id;

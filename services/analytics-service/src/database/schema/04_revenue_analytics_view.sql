-- =====================================================
-- Revenue Analytics Materialized View
-- =====================================================
-- Pre-aggregated billing and revenue metrics
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.revenue_analytics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, plan_tier)
AS
SELECT
    date,
    plan_tier,

    -- Payment metrics
    countIf(event_type = 'billing.payment_success') as successful_payments,
    countIf(event_type = 'billing.payment_failed') as failed_payments,

    -- Revenue
    sumIf(amount, event_type = 'billing.payment_success') as total_revenue,
    avgIf(amount, event_type = 'billing.payment_success') as avg_transaction_value,
    maxIf(amount, event_type = 'billing.payment_success') as max_transaction_value,

    -- Subscriptions
    countIf(event_type = 'billing.subscription_created') as new_subscriptions,
    countIf(event_type = 'billing.subscription_cancelled') as cancelled_subscriptions,
    countIf(event_type = 'billing.subscription_renewed') as renewed_subscriptions,

    -- Upgrades & Downgrades
    countIf(event_type = 'billing.plan_upgraded') as plan_upgrades,
    countIf(event_type = 'billing.plan_downgraded') as plan_downgrades,

    -- Unique users
    uniq(user_id) as unique_paying_users,
    uniqIf(user_id, event_type = 'billing.subscription_created') as new_paying_users

FROM analytics_db.events
WHERE event_category = 'billing'
GROUP BY date, plan_tier;

-- =====================================================
-- Monthly Recurring Revenue (MRR) View
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.mrr_metrics
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, plan_tier, user_id)
AS
SELECT
    date,
    plan_tier,
    user_id,

    -- MRR contribution per user
    CASE plan_tier
        WHEN 'PRO' THEN 99000  -- 99k VND per month
        WHEN 'ENTERPRISE' THEN 499000  -- 499k VND per month
        ELSE 0
    END as mrr_value,

    -- Subscription status
    argMaxIf(subscription_id, timestamp, event_type IN ('billing.subscription_created', 'billing.subscription_renewed')) as active_subscription_id,
    maxIf(timestamp, event_type = 'billing.subscription_created') as subscription_start_date,
    maxIf(timestamp, event_type = 'billing.subscription_cancelled') as subscription_end_date

FROM analytics_db.events
WHERE event_category = 'billing'
  AND event_type IN ('billing.subscription_created', 'billing.subscription_renewed', 'billing.subscription_cancelled')
GROUP BY date, plan_tier, user_id;

-- =====================================================
-- Revenue Summary by Country
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.revenue_by_country
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, country)
AS
SELECT
    date,
    country,

    count() as total_transactions,
    sum(amount) as total_revenue,
    avg(amount) as avg_transaction_value,
    uniq(user_id) as unique_customers

FROM analytics_db.events
WHERE event_category = 'billing'
  AND event_type = 'billing.payment_success'
  AND country != ''
GROUP BY date, country;

-- =====================================================
-- Churn Analysis View
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_db.churn_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (month, plan_tier)
AS
SELECT
    toStartOfMonth(date) as month,
    plan_tier,

    -- Churn events
    countIf(event_type = 'billing.subscription_cancelled') as churned_users,
    countIf(event_type = 'billing.subscription_renewed') as retained_users,

    -- Unique users
    uniq(user_id) as total_users

FROM analytics_db.events
WHERE event_category = 'billing'
  AND event_type IN ('billing.subscription_cancelled', 'billing.subscription_renewed')
GROUP BY month, plan_tier;

/**
 * Revenue Analytics Service
 * Provides analytics queries for revenue and billing metrics
 */

import { executeQuery } from '../database/clickhouse.client';

/**
 * Get total revenue
 */
export async function getTotalRevenue(): Promise<{
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  currency: string;
}> {
  const query = `
    SELECT
      sum(amount) as total,
      sumIf(amount, date = today()) as today,
      sumIf(amount, date >= today() - INTERVAL 7 DAY) as this_week,
      sumIf(amount, date >= today() - INTERVAL 30 DAY) as this_month,
      any(currency) as currency
    FROM analytics_db.events
    WHERE event_type IN ('billing.payment_success', 'billing.subscription_renewed')
      AND event_category = 'billing'
  `;

  const result = await executeQuery(query);
  return result[0] || { total: 0, today: 0, this_week: 0, this_month: 0, currency: 'VND' };
}

/**
 * Get Monthly Recurring Revenue (MRR)
 */
export async function getMRR(): Promise<{
  current_mrr: number;
  previous_mrr: number;
  growth_rate: number;
  currency: string;
}> {
  const query = `
    WITH
      current_month AS (
        SELECT sum(amount) as mrr
        FROM analytics_db.events
        WHERE toYYYYMM(date) = toYYYYMM(today())
          AND event_type = 'billing.subscription_renewed'
          AND event_category = 'billing'
      ),
      previous_month AS (
        SELECT sum(amount) as mrr
        FROM analytics_db.events
        WHERE toYYYYMM(date) = toYYYYMM(today() - INTERVAL 1 MONTH)
          AND event_type = 'billing.subscription_renewed'
          AND event_category = 'billing'
      )
    SELECT
      (SELECT mrr FROM current_month) as current_mrr,
      (SELECT mrr FROM previous_month) as previous_mrr,
      round(((SELECT mrr FROM current_month) - (SELECT mrr FROM previous_month)) * 100.0 / (SELECT mrr FROM previous_month), 2) as growth_rate,
      'VND' as currency
  `;

  const result = await executeQuery(query);
  return result[0] || { current_mrr: 0, previous_mrr: 0, growth_rate: 0, currency: 'VND' };
}

/**
 * Get revenue over time
 */
export async function getRevenueOverTime(startDate: string, endDate: string): Promise<Array<{
  date: string;
  revenue: number;
  payments: number;
}>> {
  const query = `
    SELECT
      date,
      sum(amount) as revenue,
      count() as payments
    FROM analytics_db.events
    WHERE date BETWEEN '${startDate}' AND '${endDate}'
      AND event_type IN ('billing.payment_success', 'billing.subscription_renewed')
      AND event_category = 'billing'
    GROUP BY date
    ORDER BY date
  `;

  return executeQuery(query);
}

/**
 * Get revenue by plan tier
 */
export async function getRevenueByPlan(): Promise<Array<{
  plan_tier: string;
  total_revenue: number;
  subscriber_count: number;
  avg_revenue_per_user: number;
}>> {
  const query = `
    SELECT
      plan_tier,
      sum(amount) as total_revenue,
      uniq(user_id) as subscriber_count,
      sum(amount) / uniq(user_id) as avg_revenue_per_user
    FROM analytics_db.events
    WHERE plan_tier != ''
      AND event_type IN ('billing.payment_success', 'billing.subscription_renewed')
      AND event_category = 'billing'
    GROUP BY plan_tier
    ORDER BY total_revenue DESC
  `;

  return executeQuery(query);
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total_subscriptions: number;
  active_subscriptions: number;
  cancelled_subscriptions: number;
  churn_rate: number;
}> {
  const query = `
    WITH
      total AS (
        SELECT uniq(user_id) as count
        FROM analytics_db.events
        WHERE event_type = 'billing.subscription_created'
      ),
      cancelled AS (
        SELECT uniq(user_id) as count
        FROM analytics_db.events
        WHERE event_type = 'billing.subscription_cancelled'
          AND toYYYYMM(timestamp) = toYYYYMM(today())
      )
    SELECT
      (SELECT count FROM total) as total_subscriptions,
      (SELECT count FROM total) - (SELECT count FROM cancelled) as active_subscriptions,
      (SELECT count FROM cancelled) as cancelled_subscriptions,
      round((SELECT count FROM cancelled) * 100.0 / (SELECT count FROM total), 2) as churn_rate
  `;

  const result = await executeQuery(query);
  return result[0] || {
    total_subscriptions: 0,
    active_subscriptions: 0,
    cancelled_subscriptions: 0,
    churn_rate: 0
  };
}

/**
 * Get failed payments
 */
export async function getFailedPayments(startDate: string, endDate: string): Promise<Array<{
  date: string;
  failed_count: number;
  failed_amount: number;
}>> {
  const query = `
    SELECT
      date,
      count() as failed_count,
      sum(amount) as failed_amount
    FROM analytics_db.events
    WHERE event_type = 'billing.payment_failed'
      AND date BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY date
    ORDER BY date
  `;

  return executeQuery(query);
}

/**
 * Get customer lifetime value (LTV) by cohort
 */
export async function getLTVByCohort(): Promise<Array<{
  cohort_month: string;
  user_count: number;
  total_revenue: number;
  avg_ltv: number;
}>> {
  const query = `
    SELECT
      toYYYYMM(first_payment) as cohort_month,
      count(DISTINCT user_id) as user_count,
      sum(total_spent) as total_revenue,
      sum(total_spent) / count(DISTINCT user_id) as avg_ltv
    FROM (
      SELECT
        user_id,
        min(date) as first_payment,
        sum(amount) as total_spent
      FROM analytics_db.events
      WHERE event_type IN ('billing.payment_success', 'billing.subscription_renewed')
        AND event_category = 'billing'
      GROUP BY user_id
    )
    GROUP BY cohort_month
    ORDER BY cohort_month DESC
    LIMIT 12
  `;

  return executeQuery(query);
}

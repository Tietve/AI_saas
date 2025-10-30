/**
 * User Analytics Service
 * Provides analytics queries for user metrics
 */

import { executeQuery } from '../database/clickhouse.client';

/**
 * Get total user count by plan tier
 */
export async function getUserCount(): Promise<{
  total: number;
  free: number;
  pro: number;
  plus: number;
}> {
  const query = `
    SELECT
      uniq(user_id) as total,
      uniqIf(user_id, plan_tier = 'FREE') as free,
      uniqIf(user_id, plan_tier = 'PLUS') as plus,
      uniqIf(user_id, plan_tier = 'PRO') as pro
    FROM analytics_db.user_metrics
  `;

  const result = await executeQuery(query);
  return result[0] || { total: 0, free: 0, plus: 0, pro: 0 };
}

/**
 * Get user growth over time
 */
export async function getUserGrowth(startDate: string, endDate: string): Promise<Array<{
  date: string;
  users: number;
}>> {
  const query = `
    SELECT
      date,
      count(DISTINCT user_id) as users
    FROM analytics_db.user_metrics
    WHERE date BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY date
    ORDER BY date
  `;

  return executeQuery(query);
}

/**
 * Get active users (DAU/WAU/MAU)
 */
export async function getActiveUsers(period: 'day' | 'week' | 'month' = 'day'): Promise<{
  count: number;
  period: string;
}> {
  let dateFilter = '';

  if (period === 'day') {
    dateFilter = "date = today()";
  } else if (period === 'week') {
    dateFilter = "date >= today() - INTERVAL 7 DAY";
  } else {
    dateFilter = "date >= today() - INTERVAL 30 DAY";
  }

  const query = `
    SELECT
      uniq(user_id) as count,
      '${period}' as period
    FROM analytics_db.daily_active_users
    WHERE ${dateFilter}
  `;

  const result = await executeQuery(query);
  return result[0] || { count: 0, period };
}

/**
 * Get user signups over time
 */
export async function getUserSignups(startDate: string, endDate: string): Promise<Array<{
  date: string;
  signups: number;
}>> {
  const query = `
    SELECT
      toDate(timestamp) as date,
      count() as signups
    FROM analytics_db.events
    WHERE event_type = 'user.signup'
      AND date BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY date
    ORDER BY date
  `;

  return executeQuery(query);
}

/**
 * Get user retention rate
 */
export async function getUserRetention(cohortDate: string): Promise<Array<{
  days_since_signup: number;
  retained_users: number;
  retention_rate: number;
}>> {
  const query = `
    WITH cohort AS (
      SELECT DISTINCT user_id
      FROM analytics_db.events
      WHERE event_type = 'user.signup'
        AND toDate(timestamp) = '${cohortDate}'
    )
    SELECT
      dateDiff('day', '${cohortDate}', date) as days_since_signup,
      uniq(dau.user_id) as retained_users,
      round(uniq(dau.user_id) * 100.0 / (SELECT count(*) FROM cohort), 2) as retention_rate
    FROM analytics_db.daily_active_users dau
    INNER JOIN cohort c ON dau.user_id = c.user_id
    WHERE date >= '${cohortDate}'
    GROUP BY days_since_signup
    ORDER BY days_since_signup
    LIMIT 30
  `;

  return executeQuery(query);
}

/**
 * Get top users by activity
 */
export async function getTopUsers(limit: number = 10): Promise<Array<{
  user_id: string;
  user_email: string;
  plan_tier: string;
  total_events: number;
  chat_events: number;
  last_active: string;
}>> {
  const query = `
    SELECT
      user_id,
      any(user_email) as user_email,
      any(plan_tier) as plan_tier,
      sum(total_events) as total_events,
      sum(chat_events) as chat_events,
      max(last_active_at) as last_active
    FROM analytics_db.user_metrics
    GROUP BY user_id
    ORDER BY total_events DESC
    LIMIT ${limit}
  `;

  return executeQuery(query);
}

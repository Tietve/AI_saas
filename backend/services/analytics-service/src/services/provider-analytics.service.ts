/**
 * Provider Analytics Service
 * Provides analytics queries for AI provider metrics
 */

import { executeQuery } from '../database/clickhouse.client';

/**
 * Get overall provider usage statistics
 */
export async function getProviderUsage(): Promise<Array<{
  ai_provider: string;
  total_requests: number;
  total_tokens: number;
  avg_response_time: number;
  unique_users: number;
}>> {
  const query = `
    SELECT
      ai_provider,
      count() as total_requests,
      sum(tokens_used) as total_tokens,
      avg(response_time_ms) as avg_response_time,
      uniq(user_id) as unique_users
    FROM analytics_db.events
    WHERE event_category = 'chat'
      AND ai_provider != ''
    GROUP BY ai_provider
    ORDER BY total_requests DESC
  `;

  return executeQuery(query);
}

/**
 * Get provider usage by model
 */
export async function getProviderUsageByModel(provider: string): Promise<Array<{
  ai_model: string;
  total_requests: number;
  total_tokens: number;
  avg_tokens_per_request: number;
  avg_response_time: number;
}>> {
  const query = `
    SELECT
      ai_model,
      count() as total_requests,
      sum(tokens_used) as total_tokens,
      avg(tokens_used) as avg_tokens_per_request,
      avg(response_time_ms) as avg_response_time
    FROM analytics_db.events
    WHERE event_category = 'chat'
      AND ai_provider = '${provider}'
      AND ai_model != ''
    GROUP BY ai_model
    ORDER BY total_requests DESC
  `;

  return executeQuery(query);
}

/**
 * Get provider usage over time
 */
export async function getProviderUsageOverTime(
  startDate: string,
  endDate: string,
  provider?: string
): Promise<Array<{
  date: string;
  ai_provider: string;
  requests: number;
  tokens: number;
}>> {
  const providerFilter = provider ? `AND ai_provider = '${provider}'` : '';

  const query = `
    SELECT
      date,
      ai_provider,
      count() as requests,
      sum(tokens_used) as tokens
    FROM analytics_db.events
    WHERE event_category = 'chat'
      AND date BETWEEN '${startDate}' AND '${endDate}'
      ${providerFilter}
      AND ai_provider != ''
    GROUP BY date, ai_provider
    ORDER BY date, ai_provider
  `;

  return executeQuery(query);
}

/**
 * Get provider performance comparison
 */
export async function getProviderPerformance(): Promise<Array<{
  ai_provider: string;
  p50_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  error_rate: number;
}>> {
  const query = `
    WITH
      response_times AS (
        SELECT
          ai_provider,
          quantile(0.50)(response_time_ms) as p50_response_time,
          quantile(0.95)(response_time_ms) as p95_response_time,
          quantile(0.99)(response_time_ms) as p99_response_time
        FROM analytics_db.events
        WHERE event_category = 'chat'
          AND ai_provider != ''
          AND response_time_ms > 0
        GROUP BY ai_provider
      ),
      errors AS (
        SELECT
          ai_provider,
          countIf(is_error = 1) * 100.0 / count() as error_rate
        FROM analytics_db.events
        WHERE event_category = 'chat' AND ai_provider != ''
        GROUP BY ai_provider
      )
    SELECT
      rt.ai_provider,
      rt.p50_response_time,
      rt.p95_response_time,
      rt.p99_response_time,
      coalesce(e.error_rate, 0) as error_rate
    FROM response_times rt
    LEFT JOIN errors e ON rt.ai_provider = e.ai_provider
    ORDER BY rt.p50_response_time
  `;

  return executeQuery(query);
}

/**
 * Get provider cost estimation
 */
export async function getProviderCostEstimation(): Promise<Array<{
  ai_provider: string;
  total_tokens: number;
  estimated_cost_usd: number;
}>> {
  // Rough cost estimation (these are example rates, should be configurable)
  const query = `
    SELECT
      ai_provider,
      sum(tokens_used) as total_tokens,
      CASE ai_provider
        WHEN 'openai' THEN sum(tokens_used) * 0.00002
        WHEN 'anthropic' THEN sum(tokens_used) * 0.00003
        WHEN 'google' THEN sum(tokens_used) * 0.000025
        ELSE sum(tokens_used) * 0.00001
      END as estimated_cost_usd
    FROM analytics_db.events
    WHERE event_category = 'chat'
      AND ai_provider != ''
    GROUP BY ai_provider
    ORDER BY estimated_cost_usd DESC
  `;

  return executeQuery(query);
}

/**
 * Get provider usage by plan tier
 */
export async function getProviderUsageByPlan(): Promise<Array<{
  ai_provider: string;
  plan_tier: string;
  total_requests: number;
  total_tokens: number;
}>> {
  const query = `
    SELECT
      ai_provider,
      plan_tier,
      count() as total_requests,
      sum(tokens_used) as total_tokens
    FROM analytics_db.events
    WHERE event_category = 'chat'
      AND ai_provider != ''
      AND plan_tier != ''
    GROUP BY ai_provider, plan_tier
    ORDER BY ai_provider, total_requests DESC
  `;

  return executeQuery(query);
}

/**
 * Get most popular models
 */
export async function getPopularModels(limit: number = 10): Promise<Array<{
  ai_provider: string;
  ai_model: string;
  total_requests: number;
  unique_users: number;
  avg_tokens: number;
}>> {
  const query = `
    SELECT
      ai_provider,
      ai_model,
      count() as total_requests,
      uniq(user_id) as unique_users,
      avg(tokens_used) as avg_tokens
    FROM analytics_db.events
    WHERE event_category = 'chat'
      AND ai_provider != ''
      AND ai_model != ''
    GROUP BY ai_provider, ai_model
    ORDER BY total_requests DESC
    LIMIT ${limit}
  `;

  return executeQuery(query);
}

/**
 * Chat Analytics Service
 * Provides analytics queries for chat metrics
 */

import { executeQuery } from '../database/clickhouse.client';

/**
 * Get total message count
 */
export async function getTotalMessages(): Promise<{
  total: number;
  today: number;
  this_week: number;
  this_month: number;
}> {
  const query = `
    SELECT
      count() as total,
      countIf(date = today()) as today,
      countIf(date >= today() - INTERVAL 7 DAY) as this_week,
      countIf(date >= today() - INTERVAL 30 DAY) as this_month
    FROM analytics_db.events
    WHERE event_type = 'chat.message_sent'
  `;

  const result = await executeQuery(query);
  return result[0] || { total: 0, today: 0, this_week: 0, this_month: 0 };
}

/**
 * Get messages by AI provider
 */
export async function getMessagesByProvider(): Promise<Array<{
  ai_provider: string;
  message_count: number;
  avg_response_time: number;
  total_tokens: number;
}>> {
  const query = `
    SELECT
      ai_provider,
      count() as message_count,
      avg(response_time_ms) as avg_response_time,
      sum(tokens_used) as total_tokens
    FROM analytics_db.chat_metrics
    WHERE ai_provider != ''
    GROUP BY ai_provider
    ORDER BY message_count DESC
  `;

  return executeQuery(query);
}

/**
 * Get messages by AI model
 */
export async function getMessagesByModel(): Promise<Array<{
  ai_provider: string;
  ai_model: string;
  message_count: number;
  avg_tokens: number;
}>> {
  const query = `
    SELECT
      ai_provider,
      ai_model,
      count() as message_count,
      avg(tokens_used) as avg_tokens
    FROM analytics_db.chat_metrics
    WHERE ai_provider != '' AND ai_model != ''
    GROUP BY ai_provider, ai_model
    ORDER BY message_count DESC
    LIMIT 20
  `;

  return executeQuery(query);
}

/**
 * Get chat activity over time
 */
export async function getChatActivity(startDate: string, endDate: string): Promise<Array<{
  date: string;
  messages: number;
  unique_users: number;
}>> {
  const query = `
    SELECT
      date,
      count() as messages,
      uniq(user_id) as unique_users
    FROM analytics_db.events
    WHERE event_type = 'chat.message_sent'
      AND date BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY date
    ORDER BY date
  `;

  return executeQuery(query);
}

/**
 * Get average response time by provider
 */
export async function getResponseTimeByProvider(): Promise<Array<{
  ai_provider: string;
  avg_response_time: number;
  p50_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
}>> {
  const query = `
    SELECT
      ai_provider,
      avg(response_time_ms) as avg_response_time,
      quantile(0.50)(response_time_ms) as p50_response_time,
      quantile(0.95)(response_time_ms) as p95_response_time,
      quantile(0.99)(response_time_ms) as p99_response_time
    FROM analytics_db.chat_metrics
    WHERE ai_provider != '' AND response_time_ms > 0
    GROUP BY ai_provider
    ORDER BY avg_response_time
  `;

  return executeQuery(query);
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(): Promise<{
  total_conversations: number;
  avg_messages_per_conversation: number;
  active_conversations_today: number;
}> {
  const query = `
    SELECT
      uniq(conversation_id) as total_conversations,
      count() / uniq(conversation_id) as avg_messages_per_conversation,
      uniqIf(conversation_id, date = today()) as active_conversations_today
    FROM analytics_db.chat_metrics
    WHERE conversation_id != ''
  `;

  const result = await executeQuery(query);
  return result[0] || {
    total_conversations: 0,
    avg_messages_per_conversation: 0,
    active_conversations_today: 0
  };
}

/**
 * Get token usage by plan tier
 */
export async function getTokenUsageByPlan(): Promise<Array<{
  plan_tier: string;
  total_tokens: number;
  avg_tokens_per_user: number;
}>> {
  const query = `
    SELECT
      plan_tier,
      sum(total_tokens_used) as total_tokens,
      sum(total_tokens_used) / uniq(user_id) as avg_tokens_per_user
    FROM analytics_db.user_metrics
    WHERE plan_tier != ''
    GROUP BY plan_tier
    ORDER BY total_tokens DESC
  `;

  return executeQuery(query);
}

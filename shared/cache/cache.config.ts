/**
 * Cache TTL configuration for different data types
 * All values in seconds
 */
export const CACHE_TTL = {
  // User & Auth
  USER_QUOTA: 60, // 1 minute - frequently updated
  USER_PLAN: 300, // 5 minutes
  USER_SESSION: 3600, // 1 hour

  // Chat & Conversations
  CONVERSATION_MESSAGES: 300, // 5 minutes
  CONVERSATION_LIST: 180, // 3 minutes

  // OpenAI & AI Responses
  OPENAI_RESPONSE: 3600, // 1 hour - for identical prompts
  SIMILAR_QUERY: 1800, // 30 minutes - for similar queries

  // Analytics
  ANALYTICS_USER_COUNT: 600, // 10 minutes
  ANALYTICS_METRICS: 900, // 15 minutes
  ANALYTICS_PROVIDER_STATS: 1800, // 30 minutes

  // Billing
  BILLING_PLAN_INFO: 86400, // 24 hours - rarely changes
  BILLING_USAGE: 300, // 5 minutes
  SUBSCRIPTION_INFO: 600, // 10 minutes

  // Rate Limiting
  RATE_LIMIT_WINDOW: 60, // 1 minute
  RATE_LIMIT_HOUR: 3600, // 1 hour

  // Development mode
  DEV_MOCK_RESPONSE: 300, // 5 minutes
} as const;

/**
 * Cache key prefixes for different services
 */
export const CACHE_PREFIX = {
  AUTH: 'auth',
  CHAT: 'chat',
  BILLING: 'billing',
  ANALYTICS: 'analytics',
  OPENAI: 'openai',
  RATE_LIMIT: 'rl',
} as const;

/**
 * Development mode configuration
 */
export const DEV_CONFIG = {
  SKIP_OPENAI_CALLS: process.env.DEV_SKIP_OPENAI === 'true',
  SKIP_STRIPE_CALLS: process.env.DEV_SKIP_STRIPE === 'true',
  SKIP_EMAIL_SENDING: process.env.DEV_SKIP_EMAIL === 'true',
  USE_MOCK_RESPONSES: process.env.NODE_ENV === 'development',
} as const;

/**
 * Cost tracking thresholds
 */
export const COST_THRESHOLDS = {
  OPENAI_DAILY_LIMIT_USD: parseFloat(process.env.OPENAI_DAILY_LIMIT || '100'),
  OPENAI_HOURLY_LIMIT_USD: parseFloat(process.env.OPENAI_HOURLY_LIMIT || '20'),
  ALERT_THRESHOLD_PERCENT: 80, // Alert when 80% of limit reached
} as const;

/**
 * Performance thresholds (in milliseconds)
 */
export const PERF_THRESHOLDS = {
  SLOW_API_RESPONSE: 1000, // 1 second
  SLOW_DB_QUERY: 500, // 500ms
  SLOW_OPENAI_CALL: 5000, // 5 seconds
} as const;

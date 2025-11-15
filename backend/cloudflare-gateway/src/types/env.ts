/**
 * Cloudflare Workers Environment Bindings
 *
 * This file defines all environment variables, KV namespaces, D1 databases,
 * and other Cloudflare-specific bindings available to the worker.
 */

export interface Env {
  // ════════════════════════════════════════════════════════════════
  // Cloudflare Bindings
  // ════════════════════════════════════════════════════════════════

  // KV Namespace for caching and rate limiting
  KV: KVNamespace;

  // D1 Database for usage tracking and analytics
  DB: D1Database;

  // Workers AI binding for FREE AI inference
  AI: Ai;

  // Vectorize binding for FREE vector search
  VECTORIZE: VectorizeIndex;

  // ════════════════════════════════════════════════════════════════
  // Environment Variables
  // ════════════════════════════════════════════════════════════════

  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

  // Backend Service URLs
  AUTH_SERVICE_URL: string;
  CHAT_SERVICE_URL: string;
  BILLING_SERVICE_URL: string;
  ANALYTICS_SERVICE_URL: string;
  ORCHESTRATOR_SERVICE_URL: string;

  // ════════════════════════════════════════════════════════════════
  // Secrets (set with wrangler secret put)
  // ════════════════════════════════════════════════════════════════

  // JWT secret for token verification
  JWT_SECRET: string;

  // OpenAI API key for complex queries fallback
  OPENAI_API_KEY: string;

  // Stripe webhook secret
  STRIPE_WEBHOOK_SECRET: string;

  // ════════════════════════════════════════════════════════════════
  // Optional Configuration
  // ════════════════════════════════════════════════════════════════

  ENABLE_ANALYTICS?: string;
  CACHE_TTL?: string;
  MAX_REQUEST_SIZE?: string;
}

/**
 * Cloudflare AI Models
 */
export const AI_MODELS = {
  // Embeddings (768 dimensions, FREE)
  EMBEDDINGS: '@cf/baai/bge-base-en-v1.5',

  // LLMs (FREE)
  LLAMA_2_7B: '@cf/meta/llama-2-7b-chat-int8',
  MISTRAL_7B: '@cf/mistral/mistral-7b-instruct-v0.1',
  LLAMA_3_8B: '@cf/meta/llama-3-8b-instruct',

  // Image classification
  RESNET_50: '@cf/microsoft/resnet-50',
} as const;

/**
 * Rate limit tiers
 */
export const RATE_LIMIT_TIERS = {
  free: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
  pro: {
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  enterprise: {
    requestsPerHour: 10000,
    requestsPerDay: 100000,
  },
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  // Short-lived (5 minutes)
  SHORT: 300,

  // Medium (1 hour)
  MEDIUM: 3600,

  // Long (24 hours)
  LONG: 86400,

  // Very long (7 days)
  VERY_LONG: 604800,
} as const;

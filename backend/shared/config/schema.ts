/**
 * Shared Configuration Schema
 *
 * This file defines the complete configuration schema for all microservices
 * using Zod for runtime validation. All environment variables are standardized
 * with consistent naming conventions.
 *
 * Naming Conventions:
 * - CLOUDFLARE_* for Cloudflare services
 * - OPENAI_* for OpenAI API
 * - ANTHROPIC_* for Anthropic Claude API
 * - GOOGLE_* for Google AI/OAuth
 * - GROQ_* for Groq API
 * - DATABASE_* for all database configs
 * - REDIS_* for Redis configs
 * - AWS_* for AWS services
 * - STRIPE_* for Stripe payment configs
 * - RABBITMQ_* for message queue
 * - MONGODB_* for MongoDB
 * - CLICKHOUSE_* for ClickHouse
 * - PINECONE_* for Pinecone vector DB
 * - SENTRY_* for error tracking
 * - JAEGER_* for distributed tracing
 *
 * @module shared/config/schema
 */

import { z } from 'zod';

// =============================================================================
// HELPER SCHEMAS
// =============================================================================

/**
 * URL validation schema
 */
const urlSchema = z.string().url();

/**
 * Port number schema (1-65535)
 */
const portSchema = z.coerce.number().int().min(1).max(65535);

/**
 * Positive integer schema
 */
const positiveIntSchema = z.coerce.number().int().positive();

/**
 * Non-negative integer schema
 */
const nonNegativeIntSchema = z.coerce.number().int().min(0);

/**
 * Probability schema (0.0 to 1.0)
 */
const probabilitySchema = z.coerce.number().min(0).max(1);

/**
 * API key schema (non-empty string)
 */
const apiKeySchema = z.string().min(1, 'API key cannot be empty');

/**
 * Secret schema (minimum 32 characters for production security)
 */
const secretSchema = z.string().min(1);

// =============================================================================
// ENVIRONMENT & GENERAL CONFIGURATION
// =============================================================================

/**
 * Node environment schema
 */
export const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']);

/**
 * Log level schema
 */
export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

/**
 * Base configuration common to all services
 */
export const baseConfigSchema = z.object({
  // Environment
  NODE_ENV: nodeEnvSchema.default('development'),
  DEPLOYMENT_ENV: z.string().optional(),
  LOG_LEVEL: logLevelSchema.default('info'),

  // Service port (each service defines its own default)
  PORT: portSchema,
});

// =============================================================================
// DATABASE CONFIGURATIONS
// =============================================================================

/**
 * PostgreSQL configuration schema
 */
export const postgresConfigSchema = z.object({
  DATABASE_URL: z.string().min(1, 'PostgreSQL connection URL is required'),
  DATABASE_POOL_MIN: nonNegativeIntSchema.optional().default(2),
  DATABASE_POOL_MAX: positiveIntSchema.optional().default(10),
  DATABASE_TIMEOUT: positiveIntSchema.optional().default(30000), // milliseconds
});

/**
 * MongoDB configuration schema
 */
export const mongoConfigSchema = z.object({
  MONGODB_URL: z.string().min(1, 'MongoDB connection URL is required'),
  MONGODB_DATABASE: z.string().optional(),
  MONGODB_POOL_SIZE: positiveIntSchema.optional().default(10),
});

/**
 * Redis configuration schema
 */
export const redisConfigSchema = z.object({
  REDIS_URL: z.string().min(1, 'Redis connection URL is required'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: nonNegativeIntSchema.optional().default(0),
  REDIS_KEY_PREFIX: z.string().optional().default('saas:'),
  REDIS_CONNECT_TIMEOUT: positiveIntSchema.optional().default(10000), // milliseconds
  REDIS_COMMAND_TIMEOUT: positiveIntSchema.optional().default(5000), // milliseconds
});

/**
 * ClickHouse configuration schema
 */
export const clickhouseConfigSchema = z.object({
  CLICKHOUSE_HOST: z.string().optional().default('localhost'),
  CLICKHOUSE_PORT: portSchema.optional().default(8123),
  CLICKHOUSE_USER: z.string().optional().default('default'),
  CLICKHOUSE_PASSWORD: z.string().optional(),
  CLICKHOUSE_DATABASE: z.string().optional().default('default'),
});

// =============================================================================
// AI PROVIDER CONFIGURATIONS
// =============================================================================

/**
 * OpenAI configuration schema
 */
export const openaiConfigSchema = z.object({
  OPENAI_API_KEY: apiKeySchema,
  OPENAI_ORG_ID: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default('gpt-4'),
  OPENAI_EMBEDDING_MODEL: z.string().optional().default('text-embedding-3-small'),
  OPENAI_MAX_TOKENS: positiveIntSchema.optional().default(4096),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).optional().default(0.7),
  OPENAI_TIMEOUT: positiveIntSchema.optional().default(60000), // milliseconds
});

/**
 * Anthropic (Claude) configuration schema
 */
export const anthropicConfigSchema = z.object({
  ANTHROPIC_API_KEY: apiKeySchema,
  ANTHROPIC_MODEL: z.string().optional().default('claude-3-5-sonnet-20241022'),
  ANTHROPIC_MAX_TOKENS: positiveIntSchema.optional().default(4096),
  ANTHROPIC_TIMEOUT: positiveIntSchema.optional().default(60000), // milliseconds
});

/**
 * Google AI configuration schema
 */
export const googleAIConfigSchema = z.object({
  GOOGLE_AI_API_KEY: apiKeySchema,
  GOOGLE_AI_MODEL: z.string().optional().default('gemini-pro'),
});

/**
 * Groq configuration schema
 */
export const groqConfigSchema = z.object({
  GROQ_API_KEY: apiKeySchema,
  GROQ_MODEL: z.string().optional().default('llama2-70b-4096'),
});

/**
 * Cloudflare Workers AI configuration schema
 */
export const cloudflareAIConfigSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, 'Cloudflare Account ID is required'),
  CLOUDFLARE_API_TOKEN: apiKeySchema,
  CLOUDFLARE_AI_GATEWAY_ID: z.string().optional(),
  CLOUDFLARE_AI_MODEL: z.string().optional().default('@cf/meta/llama-2-7b-chat-int8'),
});

// =============================================================================
// VECTOR DATABASE CONFIGURATIONS
// =============================================================================

/**
 * Pinecone configuration schema
 */
export const pineconeConfigSchema = z.object({
  PINECONE_API_KEY: apiKeySchema,
  PINECONE_ENVIRONMENT: z.string().min(1, 'Pinecone environment is required'),
  PINECONE_INDEX_NAME: z.string().min(1, 'Pinecone index name is required'),
  PINECONE_NAMESPACE: z.string().optional(),
});

// =============================================================================
// PAYMENT & BILLING CONFIGURATIONS
// =============================================================================

/**
 * Stripe configuration schema
 */
export const stripeConfigSchema = z.object({
  STRIPE_SECRET_KEY: apiKeySchema,
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required'),
  STRIPE_PRICE_ID_FREE: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().optional(),
});

// =============================================================================
// MESSAGE QUEUE CONFIGURATIONS
// =============================================================================

/**
 * RabbitMQ configuration schema
 */
export const rabbitmqConfigSchema = z.object({
  RABBITMQ_URL: z.string().min(1, 'RabbitMQ connection URL is required'),
  RABBITMQ_EXCHANGE: z.string().optional().default('analytics.events'),
  RABBITMQ_QUEUE: z.string().optional(),
  RABBITMQ_PREFETCH: positiveIntSchema.optional().default(10),
  RABBITMQ_HEARTBEAT: positiveIntSchema.optional().default(60), // seconds
});

// =============================================================================
// EMAIL CONFIGURATIONS
// =============================================================================

/**
 * SMTP email configuration schema
 */
export const smtpConfigSchema = z.object({
  SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  SMTP_PORT: portSchema,
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().min(1, 'SMTP username is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP password is required'),
  SMTP_FROM: z.string().email('Invalid sender email address'),
  SMTP_FROM_NAME: z.string().optional().default('My SaaS Chat'),
});

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

/**
 * JWT/Auth configuration schema
 */
export const authConfigSchema = z.object({
  AUTH_SECRET: secretSchema,
  JWT_SECRET: secretSchema,
  REFRESH_TOKEN_SECRET: secretSchema,
  JWT_EXPIRY: z.string().optional().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().optional().default('7d'),
  PASSWORD_RESET_EXPIRY: z.string().optional().default('1h'),
  REQUIRE_EMAIL_VERIFICATION: z.coerce.boolean().optional().default(false),
  MAX_LOGIN_ATTEMPTS: positiveIntSchema.optional().default(5),
  ACCOUNT_LOCKOUT_DURATION: z.string().optional().default('30m'),
});

/**
 * Google OAuth configuration schema
 */
export const googleOAuthConfigSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google OAuth client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google OAuth client secret is required'),
  GOOGLE_REDIRECT_URI: urlSchema.optional(),
});

/**
 * GitHub OAuth configuration schema
 */
export const githubOAuthConfigSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1, 'GitHub OAuth client ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GitHub OAuth client secret is required'),
  GITHUB_REDIRECT_URI: urlSchema.optional(),
});

// =============================================================================
// MONITORING & OBSERVABILITY
// =============================================================================

/**
 * Sentry configuration schema
 */
export const sentryConfigSchema = z.object({
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: probabilitySchema.optional().default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: probabilitySchema.optional().default(0.1),
  SENTRY_DEBUG: z.coerce.boolean().optional().default(false),
});

/**
 * Jaeger tracing configuration schema
 */
export const jaegerConfigSchema = z.object({
  JAEGER_AGENT_HOST: z.string().optional().default('localhost'),
  JAEGER_AGENT_PORT: portSchema.optional().default(6831),
  JAEGER_SAMPLER_TYPE: z.enum(['const', 'probabilistic', 'ratelimiting', 'remote']).optional().default('probabilistic'),
  JAEGER_SAMPLER_PARAM: z.coerce.number().optional().default(0.1),
  JAEGER_SERVICE_NAME: z.string().optional(),
});

/**
 * Prometheus configuration schema
 */
export const prometheusConfigSchema = z.object({
  PROMETHEUS_ENABLED: z.coerce.boolean().optional().default(false),
  PROMETHEUS_PORT: portSchema.optional().default(9090),
  PROMETHEUS_PATH: z.string().optional().default('/metrics'),
});

// =============================================================================
// AWS SERVICES
// =============================================================================

/**
 * AWS configuration schema
 */
export const awsConfigSchema = z.object({
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS access key ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS secret access key is required'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_ENDPOINT: urlSchema.optional(),
});

/**
 * Cloudflare R2 configuration schema
 */
export const cloudflareR2ConfigSchema = z.object({
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().min(1, 'Cloudflare R2 account ID is required'),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1, 'Cloudflare R2 access key ID is required'),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1, 'Cloudflare R2 secret access key is required'),
  CLOUDFLARE_R2_BUCKET: z.string().min(1, 'Cloudflare R2 bucket name is required'),
  CLOUDFLARE_R2_ENDPOINT: urlSchema.optional(),
});

// =============================================================================
// RATE LIMITING & QUOTAS
// =============================================================================

/**
 * Rate limiting configuration schema
 */
export const rateLimitConfigSchema = z.object({
  RATE_LIMIT_WINDOW_MS: positiveIntSchema.optional().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: positiveIntSchema.optional().default(100),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.coerce.boolean().optional().default(false),
});

/**
 * Token quota configuration schema
 */
export const tokenQuotaConfigSchema = z.object({
  FREE_MONTHLY_TOKEN_QUOTA: positiveIntSchema.optional().default(100000),
  PRO_MONTHLY_TOKEN_QUOTA: positiveIntSchema.optional().default(1000000),
  ENTERPRISE_MONTHLY_TOKEN_QUOTA: positiveIntSchema.optional().default(10000000),
});

/**
 * API usage quota configuration schema
 */
export const apiQuotaConfigSchema = z.object({
  FREE_MONTHLY_UPGRADE_QUOTA: positiveIntSchema.optional().default(1000),
  PRO_MONTHLY_UPGRADE_QUOTA: positiveIntSchema.optional().default(10000),
  ENTERPRISE_MONTHLY_UPGRADE_QUOTA: positiveIntSchema.optional().default(100000),

  FREE_MONTHLY_EMBEDDING_QUOTA: positiveIntSchema.optional().default(10000),
  PRO_MONTHLY_EMBEDDING_QUOTA: positiveIntSchema.optional().default(100000),
  ENTERPRISE_MONTHLY_EMBEDDING_QUOTA: positiveIntSchema.optional().default(1000000),
});

// =============================================================================
// CACHING & PERFORMANCE
// =============================================================================

/**
 * Cache TTL configuration schema
 */
export const cacheTTLConfigSchema = z.object({
  CACHE_TTL_DEFAULT: positiveIntSchema.optional().default(3600), // 1 hour
  SUMMARY_CACHE_TTL: positiveIntSchema.optional().default(604800), // 7 days
  EMBEDDING_CACHE_TTL: positiveIntSchema.optional().default(2592000), // 30 days
  RAG_CACHE_TTL: positiveIntSchema.optional().default(3600), // 1 hour
});

/**
 * Performance limits configuration schema
 */
export const performanceConfigSchema = z.object({
  MAX_CONTEXT_MESSAGES: positiveIntSchema.optional().default(10),
  MAX_RAG_RESULTS: positiveIntSchema.optional().default(5),
  MAX_SUMMARY_LENGTH: positiveIntSchema.optional().default(500),
});

// =============================================================================
// FILE UPLOAD & STORAGE
// =============================================================================

/**
 * File upload configuration schema
 */
export const fileUploadConfigSchema = z.object({
  MAX_FILE_SIZE: positiveIntSchema.optional().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z.string().optional().default('image/jpeg,image/png,image/gif,application/pdf,text/plain'),
  UPLOAD_DIR: z.string().optional().default('/app/uploads'),
});

// =============================================================================
// FRONTEND & CORS
// =============================================================================

/**
 * Frontend configuration schema
 */
export const frontendConfigSchema = z.object({
  FRONTEND_URL: urlSchema,
  FRONTEND_PORT: portSchema.optional().default(3000),
  CORS_ORIGIN: z.string().min(1, 'CORS origin is required'),
  CORS_CREDENTIALS: z.coerce.boolean().optional().default(true),
});

// =============================================================================
// SECURITY
// =============================================================================

/**
 * Security configuration schema
 */
export const securityConfigSchema = z.object({
  HELMET_ENABLED: z.coerce.boolean().optional().default(true),
  CSP_ENABLED: z.coerce.boolean().optional().default(true),
  HSTS_MAX_AGE: positiveIntSchema.optional().default(31536000), // 1 year
});

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Feature flags configuration schema
 */
export const featureFlagsConfigSchema = z.object({
  FEATURE_CHAT_ENABLED: z.coerce.boolean().optional().default(true),
  FEATURE_SUMMARIZER_ENABLED: z.coerce.boolean().optional().default(true),
  FEATURE_RAG_ENABLED: z.coerce.boolean().optional().default(true),
  FEATURE_PROMPT_UPGRADER_ENABLED: z.coerce.boolean().optional().default(true),
  FEATURE_PII_DETECTION_ENABLED: z.coerce.boolean().optional().default(true),
  FEATURE_ANALYTICS_ENABLED: z.coerce.boolean().optional().default(true),
  FEATURE_BILLING_ENABLED: z.coerce.boolean().optional().default(true),
});

// =============================================================================
// MAINTENANCE MODE
// =============================================================================

/**
 * Maintenance mode configuration schema
 */
export const maintenanceConfigSchema = z.object({
  MAINTENANCE_MODE: z.coerce.boolean().optional().default(false),
  MAINTENANCE_MESSAGE: z.string().optional().default('We are currently performing maintenance. Please try again later.'),
  MAINTENANCE_ALLOWED_IPS: z.string().optional().default('127.0.0.1,::1'),
});

// =============================================================================
// COMPLETE CONFIGURATION SCHEMA
// =============================================================================

/**
 * Complete configuration schema combining all sub-schemas
 * Services can use this or compose only the schemas they need
 */
export const completeConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema.partial())
  .merge(mongoConfigSchema.partial())
  .merge(redisConfigSchema.partial())
  .merge(clickhouseConfigSchema.partial())
  .merge(openaiConfigSchema.partial())
  .merge(anthropicConfigSchema.partial())
  .merge(googleAIConfigSchema.partial())
  .merge(groqConfigSchema.partial())
  .merge(cloudflareAIConfigSchema.partial())
  .merge(pineconeConfigSchema.partial())
  .merge(stripeConfigSchema.partial())
  .merge(rabbitmqConfigSchema.partial())
  .merge(smtpConfigSchema.partial())
  .merge(authConfigSchema.partial())
  .merge(googleOAuthConfigSchema.partial())
  .merge(githubOAuthConfigSchema.partial())
  .merge(sentryConfigSchema.partial())
  .merge(jaegerConfigSchema.partial())
  .merge(prometheusConfigSchema.partial())
  .merge(awsConfigSchema.partial())
  .merge(cloudflareR2ConfigSchema.partial())
  .merge(rateLimitConfigSchema.partial())
  .merge(tokenQuotaConfigSchema.partial())
  .merge(apiQuotaConfigSchema.partial())
  .merge(cacheTTLConfigSchema.partial())
  .merge(performanceConfigSchema.partial())
  .merge(fileUploadConfigSchema.partial())
  .merge(frontendConfigSchema.partial())
  .merge(securityConfigSchema.partial())
  .merge(featureFlagsConfigSchema.partial())
  .merge(maintenanceConfigSchema.partial());

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BaseConfig = z.infer<typeof baseConfigSchema>;
export type PostgresConfig = z.infer<typeof postgresConfigSchema>;
export type MongoConfig = z.infer<typeof mongoConfigSchema>;
export type RedisConfig = z.infer<typeof redisConfigSchema>;
export type ClickHouseConfig = z.infer<typeof clickhouseConfigSchema>;
export type OpenAIConfig = z.infer<typeof openaiConfigSchema>;
export type AnthropicConfig = z.infer<typeof anthropicConfigSchema>;
export type GoogleAIConfig = z.infer<typeof googleAIConfigSchema>;
export type GroqConfig = z.infer<typeof groqConfigSchema>;
export type CloudflareAIConfig = z.infer<typeof cloudflareAIConfigSchema>;
export type PineconeConfig = z.infer<typeof pineconeConfigSchema>;
export type StripeConfig = z.infer<typeof stripeConfigSchema>;
export type RabbitMQConfig = z.infer<typeof rabbitmqConfigSchema>;
export type SMTPConfig = z.infer<typeof smtpConfigSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type GoogleOAuthConfig = z.infer<typeof googleOAuthConfigSchema>;
export type GitHubOAuthConfig = z.infer<typeof githubOAuthConfigSchema>;
export type SentryConfig = z.infer<typeof sentryConfigSchema>;
export type JaegerConfig = z.infer<typeof jaegerConfigSchema>;
export type PrometheusConfig = z.infer<typeof prometheusConfigSchema>;
export type AWSConfig = z.infer<typeof awsConfigSchema>;
export type CloudflareR2Config = z.infer<typeof cloudflareR2ConfigSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
export type TokenQuotaConfig = z.infer<typeof tokenQuotaConfigSchema>;
export type APIQuotaConfig = z.infer<typeof apiQuotaConfigSchema>;
export type CacheTTLConfig = z.infer<typeof cacheTTLConfigSchema>;
export type PerformanceConfig = z.infer<typeof performanceConfigSchema>;
export type FileUploadConfig = z.infer<typeof fileUploadConfigSchema>;
export type FrontendConfig = z.infer<typeof frontendConfigSchema>;
export type SecurityConfig = z.infer<typeof securityConfigSchema>;
export type FeatureFlagsConfig = z.infer<typeof featureFlagsConfigSchema>;
export type MaintenanceConfig = z.infer<typeof maintenanceConfigSchema>;
export type CompleteConfig = z.infer<typeof completeConfigSchema>;

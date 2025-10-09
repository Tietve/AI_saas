/**
 * Server-side Environment Variables Configuration
 *
 * All secrets and server-only environment variables.
 * Validated with Zod schema - throws error if missing required vars.
 *
 * NEVER import this file in client-side code!
 */

import { z } from 'zod'

// ============================================
// ZOD SCHEMAS
// ============================================

const serverEnvSchema = z.object({
  // ============================================
  // CORE
  // ============================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ============================================
  // APP URLs
  // ============================================
  APP_URL: z.string().url('APP_URL must be a valid URL'),
  NEXTAUTH_URL: z.string().url().optional(),

  // ============================================
  // DATABASE (Neon PostgreSQL)
  // ============================================
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ============================================
  // AUTHENTICATION
  // ============================================
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_COOKIE_NAME: z.string().default('session'),

  // ============================================
  // REDIS (Upstash)
  // ============================================
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),

  // ============================================
  // EMAIL (SMTP)
  // ============================================
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  REQUIRE_EMAIL_VERIFICATION: z.enum(['true', 'false']).default('false'),

  // Alternative: Resend
  RESEND_API_KEY: z.string().optional(),

  // ============================================
  // AI PROVIDERS
  // ============================================
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),

  AI_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'groq', 'xai']).default('openai'),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  AI_TIMEOUT_MS: z.string().optional(),
  INTENT_MODEL: z.string().optional(),

  // ============================================
  // PAYMENT (PayOS)
  // ============================================
  PAYOS_CLIENT_ID: z.string().optional(),
  PAYOS_API_KEY: z.string().optional(),
  PAYOS_CHECKSUM_KEY: z.string().optional(),
  PAYOS_WEBHOOK_SECRET: z.string().optional(),

  // ============================================
  // STORAGE
  // ============================================
  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Azure Blob Storage (fallback)
  AZURE_STORAGE_ACCOUNT_NAME: z.string().optional(),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().optional(),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_BLOB_CONTAINER_NAME: z.string().optional(),

  // ============================================
  // MONITORING & ERROR TRACKING
  // ============================================
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // ============================================
  // SECURITY
  // ============================================
  CORS_ALLOWED_ORIGINS: z.string().optional(), // Comma-separated

  // ============================================
  // FEATURE FLAGS
  // ============================================
  MOCK_AI: z.enum(['0', '1']).default('0'),
  DEV_BYPASS_PAY: z.enum(['0', '1']).default('0'),
  DEV_BYPASS_LIMIT: z.enum(['0', '1']).default('0'),
  DEBUG_OPENAI: z.enum(['0', '1']).default('0'),

  // ============================================
  // RATE LIMITING
  // ============================================
  RATE_PM: z.string().optional(),
  MAX_HISTORY: z.string().optional(),

  // ============================================
  // CLOUDFLARE
  // ============================================
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_TURNSTILE_SECRET: z.string().optional(),

  // ============================================
  // AZURE SPECIFIC
  // ============================================
  AZURE_APP_INSIGHTS_KEY: z.string().optional(),
  AZURE_KEY_VAULT_URL: z.string().url().optional(),

  // ============================================
  // LOGGING
  // ============================================
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

// ============================================
// PARSE & VALIDATE
// ============================================

let serverEnv: z.infer<typeof serverEnvSchema>

try {
  serverEnv = serverEnvSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n')

    console.error('❌ Invalid server environment variables:')
    console.error(missingVars)
    console.error('\n💡 Check your .env file and ensure all required variables are set.')

    throw new Error(`Server environment validation failed:\n${missingVars}`)
  }
  throw error
}

// ============================================
// EXPORTS
// ============================================

export const env = serverEnv

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if storage is configured
 */
export function hasStorageConfigured(): 'r2' | 'azure' | null {
  if (env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME) {
    return 'r2'
  }
  if (env.AZURE_STORAGE_CONNECTION_STRING ||
      (env.AZURE_STORAGE_ACCOUNT_NAME && env.AZURE_STORAGE_ACCOUNT_KEY)) {
    return 'azure'
  }
  return null
}

/**
 * Check if email is configured
 */
export function hasEmailConfigured(): 'smtp' | 'resend' | null {
  if (env.RESEND_API_KEY) {
    return 'resend'
  }
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return 'smtp'
  }
  return null
}

/**
 * Check if payment is configured
 */
export function hasPaymentConfigured(): boolean {
  return !!(env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY)
}

/**
 * Get CORS allowed origins
 */
export function getCorsOrigins(): string[] {
  if (!env.CORS_ALLOWED_ORIGINS) {
    return [env.APP_URL]
  }
  return env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Get storage config
 */
export function getStorageConfig() {
  const type = hasStorageConfigured()

  if (type === 'r2') {
    return {
      type: 'r2' as const,
      accountId: env.R2_ACCOUNT_ID!,
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      bucketName: env.R2_BUCKET_NAME!,
      publicUrl: env.R2_PUBLIC_URL,
    }
  }

  if (type === 'azure') {
    return {
      type: 'azure' as const,
      connectionString: env.AZURE_STORAGE_CONNECTION_STRING,
      accountName: env.AZURE_STORAGE_ACCOUNT_NAME,
      accountKey: env.AZURE_STORAGE_ACCOUNT_KEY,
      containerName: env.AZURE_BLOB_CONTAINER_NAME || 'uploads',
    }
  }

  return null
}

/**
 * Environment info for logging
 */
export function getEnvInfo() {
  return {
    nodeEnv: env.NODE_ENV,
    appUrl: env.APP_URL,
    storage: hasStorageConfigured(),
    email: hasEmailConfigured(),
    payment: hasPaymentConfigured(),
    ai: {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
    },
    features: {
      mockAi: env.MOCK_AI === '1',
      bypassPayment: env.DEV_BYPASS_PAY === '1',
      bypassLimit: env.DEV_BYPASS_LIMIT === '1',
      debugOpenAi: env.DEBUG_OPENAI === '1',
    },
  }
}

// Log environment info on startup
if (env.NODE_ENV !== 'test') {
  const info = getEnvInfo()
  console.log('🔧 Server Environment:')
  console.log(`   - Node: ${info.nodeEnv}`)
  console.log(`   - App URL: ${info.appUrl}`)
  console.log(`   - Storage: ${info.storage || 'none'}`)
  console.log(`   - Email: ${info.email || 'none'}`)
  console.log(`   - Payment: ${info.payment ? 'configured' : 'not configured'}`)
  console.log(`   - AI: ${info.ai.provider} (${info.ai.model})`)
}

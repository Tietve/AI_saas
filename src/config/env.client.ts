/**
 * Client-side Environment Variables Configuration
 *
 * Only NEXT_PUBLIC_* variables are available here.
 * This file can be imported in client-side code safely.
 *
 * Validated with Zod schema - throws error if missing required vars.
 */

import { z } from 'zod'

// ============================================
// ZOD SCHEMAS
// ============================================

const clientEnvSchema = z.object({
  // ============================================
  // APP URLs (Public)
  // ============================================
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

  // ============================================
  // MONITORING (Public)
  // ============================================
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // ============================================
  // ANALYTICS (if needed)
  // ============================================
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // ============================================
  // CLOUDFLARE TURNSTILE (CAPTCHA)
  // ============================================
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().optional(),

  // ============================================
  // FEATURE FLAGS (Public)
  // ============================================
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_ENABLE_CHAT_EXPORT: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_MAX_FILE_SIZE_MB: z.string().optional(),

  // ============================================
  // API ENDPOINTS (if using separate API server)
  // ============================================
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // ============================================
  // CDN / ASSETS
  // ============================================
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),
  NEXT_PUBLIC_R2_PUBLIC_URL: z.string().url().optional(),
})

// ============================================
// PARSE & VALIDATE
// ============================================

let clientEnv: z.infer<typeof clientEnvSchema>

try {
  // Only parse NEXT_PUBLIC_* variables
  const publicEnv = Object.entries(process.env)
    .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

  clientEnv = clientEnvSchema.parse(publicEnv)
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n')

    console.error('❌ Invalid client environment variables:')
    console.error(missingVars)
    console.error('\n💡 Check your .env file and ensure all required NEXT_PUBLIC_* variables are set.')

    throw new Error(`Client environment validation failed:\n${missingVars}`)
  }
  throw error
}

// ============================================
// EXPORTS
// ============================================

export const env = clientEnv

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get app URL (for client-side)
 */
export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

/**
 * Get API URL (for client-side API calls)
 */
export function getApiUrl(): string {
  return env.NEXT_PUBLIC_API_URL || getAppUrl()
}

/**
 * Get CDN URL for assets
 */
export function getCdnUrl(): string | null {
  return env.NEXT_PUBLIC_CDN_URL || env.NEXT_PUBLIC_R2_PUBLIC_URL || null
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
}

/**
 * Get max file upload size in bytes
 */
export function getMaxFileSize(): number {
  const mb = parseInt(env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '10', 10)
  return mb * 1024 * 1024 // Convert to bytes
}

/**
 * Check if Turnstile (Cloudflare CAPTCHA) is configured
 */
export function hasTurnstileConfigured(): boolean {
  return !!env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
}

// Log client environment info (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🌐 Client Environment:')
  console.log(`   - App URL: ${getAppUrl()}`)
  console.log(`   - API URL: ${getApiUrl()}`)
  console.log(`   - CDN URL: ${getCdnUrl() || 'none'}`)
  console.log(`   - Analytics: ${isAnalyticsEnabled() ? 'enabled' : 'disabled'}`)
  console.log(`   - Turnstile: ${hasTurnstileConfigured() ? 'enabled' : 'disabled'}`)
}

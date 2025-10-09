/**
 * Sentry Server Configuration
 *
 * This configuration is used for server-side (API routes, SSR, middleware)
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Integrations
  integrations: [
    Sentry.prismaIntegration(),
    Sentry.httpIntegration(),
  ],

  // Filter events
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Add user context if available
    const userId = event.user?.id
    if (userId) {
      event.user = {
        id: userId,
        // Don't send PII
      }
    }

    return event
  },

  // Ignore specific errors
  ignoreErrors: [
    // Prisma connection errors (handled separately)
    'PrismaClientKnownRequestError',
    // Auth errors (expected)
    'Unauthorized',
    'Forbidden',
    // Client-side errors
    'CSRF_TOKEN_INVALID',
    'VALIDATION_ERROR',
  ],
})

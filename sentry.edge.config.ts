/**
 * Sentry Edge Configuration
 *
 * This configuration is used for Edge Runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance Monitoring (lower sample rate for edge)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Filter events
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    return event
  },

  // Ignore specific errors
  ignoreErrors: [
    'CSRF_TOKEN_INVALID',
    'Token verification failed',
  ],
})

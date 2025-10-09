/**
 * Sentry Client Configuration
 *
 * This configuration is used for the browser/client-side
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking (useful for source maps)
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (useful for debugging)
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Privacy: mask all text content
      blockAllMedia: true, // Privacy: block all media
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out non-error events in production
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Filter out known browser extensions errors
    const error = hint.originalException
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message)
      if (
        message.includes('chrome-extension://') ||
        message.includes('moz-extension://') ||
        message.includes('ResizeObserver')
      ) {
        return null
      }
    }

    return event
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension',
    'moz-extension',
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Non-errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
})

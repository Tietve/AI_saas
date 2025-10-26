/**
 * Sentry Error Tracking Configuration
 *
 * Provides centralized error tracking and monitoring.
 * Works in development (logs only) and production (sends to Sentry).
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  serviceName: string;
  enabled?: boolean;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

/**
 * Initialize Sentry
 */
export function initSentry(config: SentryConfig): void {
  const {
    dsn = process.env.SENTRY_DSN,
    environment = process.env.NODE_ENV || 'development',
    serviceName,
    enabled = !!dsn, // Auto-enable if DSN is provided
    tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
  } = config;

  if (!enabled || !dsn) {
    console.log(`ℹ️  Sentry disabled for ${serviceName} (no DSN configured)`);
    console.log(`   Errors will be logged locally only`);
    return;
  }

  Sentry.init({
    dsn,
    environment,
    serverName: serviceName,

    // Performance Monitoring
    tracesSampleRate,
    profilesSampleRate,

    // Integrations
    integrations: [
      nodeProfilingIntegration(),
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],

    // Release tracking (optional)
    release: process.env.SENTRY_RELEASE || `${serviceName}@${process.env.npm_package_version || 'dev'}`,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in test environment
      if (environment === 'test') {
        return null;
      }

      // Log errors to console in development
      if (environment === 'development') {
        console.error('[Sentry]', hint.originalException || hint.syntheticException);
      }

      return event;
    },

    // Custom tags
    initialScope: {
      tags: {
        service: serviceName,
      },
    },
  });

  console.log(`✅ Sentry initialized for ${serviceName}`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Traces sample rate: ${tracesSampleRate * 100}%`);
}

/**
 * Express middleware for request tracing
 * Note: With Sentry v10+, these are handled automatically by expressIntegration()
 */
export function sentryRequestHandler() {
  // No-op middleware - Sentry v10 handles this automatically via expressIntegration
  return (req: Request, res: Response, next: NextFunction) => next();
}

/**
 * Express middleware for tracing
 * Note: With Sentry v10+, these are handled automatically by expressIntegration()
 */
export function sentryTracingHandler() {
  // No-op middleware - Sentry v10 handles this automatically via expressIntegration
  return (req: Request, res: Response, next: NextFunction) => next();
}

/**
 * Express error handler
 * Must be added after all controllers and before other error handlers
 */
export function sentryErrorHandler() {
  // Return error handler that captures exceptions
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    // Capture exception with Sentry
    Sentry.captureException(err, {
      contexts: {
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
        },
      },
    });
    // Pass error to next handler
    next(err);
  };
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Close Sentry connection (for graceful shutdown)
 */
export async function closeSentry(timeout = 2000): Promise<void> {
  await Sentry.close(timeout);
  console.log('✅ Sentry connection closed');
}

export { Sentry };

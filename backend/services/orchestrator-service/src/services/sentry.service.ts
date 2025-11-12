import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from '../config/env.config';
import logger from '../config/logger.config';

/**
 * Sentry Service
 * Enhanced error tracking and performance monitoring
 */
export class SentryService {
  private initialized: boolean = false;

  /**
   * Initialize Sentry
   */
  public init(): void {
    if (this.initialized) {
      logger.warn('[Sentry] Already initialized');
      return;
    }

    if (!env.sentry.dsn) {
      logger.warn('[Sentry] SENTRY_DSN not configured, skipping initialization');
      return;
    }

    try {
      Sentry.init({
        dsn: env.sentry.dsn,
        environment: env.sentry.environment,
        tracesSampleRate: env.sentry.tracesSampleRate,
        profilesSampleRate: 0.1,
        integrations: [
          nodeProfilingIntegration(),
        ],
        beforeSend(event) {
          // Filter out noisy errors
          if (event.exception) {
            const error = event.exception.values?.[0];
            if (error?.type === 'PrismaClientKnownRequestError') {
              // Don't send validation errors to Sentry
              return null;
            }
          }
          return event;
        },
      });

      this.initialized = true;
      logger.info('[Sentry] Initialized successfully');
    } catch (error) {
      logger.error('[Sentry] Initialization failed:', error);
    }
  }

  /**
   * Capture exception with context
   */
  public captureException(
    error: Error,
    context?: {
      component?: string;
      userId?: string;
      operation?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    if (!this.initialized) {
      return;
    }

    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        operation: context?.operation || 'unknown',
      },
      user: context?.userId ? { id: context.userId } : undefined,
      extra: context?.metadata,
    });

    logger.error(`[Sentry] Exception captured: ${error.message}`, {
      component: context?.component,
      operation: context?.operation,
    });
  }

  /**
   * Capture message
   */
  public captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: {
      component?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    if (!this.initialized) {
      return;
    }

    Sentry.captureMessage(message, {
      level,
      tags: {
        component: context?.component || 'unknown',
      },
      user: context?.userId ? { id: context.userId } : undefined,
      extra: context?.metadata,
    });
  }

  /**
   * Add breadcrumb for context
   */
  public addBreadcrumb(
    message: string,
    category: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    data?: Record<string, any>
  ): void {
    if (!this.initialized) {
      return;
    }

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Set user context
   */
  public setUser(userId: string, email?: string): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser({
      id: userId,
      email,
    });
  }

  /**
   * Clear user context
   */
  public clearUser(): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(null);
  }

  /**
   * Set custom context
   */
  public setContext(name: string, context: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setContext(name, context);
  }

  /**
   * Start transaction for performance monitoring
   * Note: Sentry v8+ uses startSpan instead of startTransaction
   */
  public startTransaction(
    name: string,
    op: string,
    description?: string
  ): any {
    if (!this.initialized) {
      return undefined;
    }

    // Sentry v8+ doesn't expose Transaction type, use startSpan or startInactiveSpan
    return Sentry.startInactiveSpan({
      name,
      op,
    });
  }

  /**
   * Wrap async function with error tracking
   */
  public async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: {
      component?: string;
      operation?: string;
      userId?: string;
    }
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        this.captureException(error, context);
      }
      throw error;
    }
  }

  /**
   * Check if Sentry is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton
export const sentryService = new SentryService();

/**
 * Logger configuration for auth-service
 * Exports a singleton logger instance to be used across the service
 */

import { createLogger } from '@saas/shared/dist/utils/logger';
import { config } from './env';

export const logger = createLogger({
  service: 'auth-service',
  level: (config.LOG_LEVEL as any) || 'info',
  prettyPrint: config.NODE_ENV !== 'production',
  sentryDsn: process.env.SENTRY_DSN,
  environment: config.NODE_ENV
});

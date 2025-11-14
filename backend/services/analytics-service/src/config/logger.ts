/**
 * Logger configuration for analytics-service
 * Exports a singleton logger instance to be used across the service
 */

import { createLogger } from '@saas/shared/dist/utils/logger';

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = createLogger({
  service: 'analytics-service',
  level: LOG_LEVEL as any,
  prettyPrint: NODE_ENV !== 'production',
  sentryDsn: process.env.SENTRY_DSN,
  environment: NODE_ENV
});

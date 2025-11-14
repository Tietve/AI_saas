/**
 * Metrics configuration for auth-service
 * Exports a singleton metrics instance to be used across the service
 */

import { createMetricsCollector } from '@saas/shared/dist/utils/metrics';

export const metrics = createMetricsCollector({
  service: 'auth-service',
  defaultMetrics: false  // Temporarily disabled to avoid metric name conflict
});

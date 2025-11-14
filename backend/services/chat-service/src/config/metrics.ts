/**
 * Metrics configuration for chat-service
 * Exports a singleton metrics instance to be used across the service
 */

import { createMetricsCollector } from '@saas/shared/dist/utils/metrics';

export const metrics = createMetricsCollector({
  service: 'chat-service',
  defaultMetrics: true
});

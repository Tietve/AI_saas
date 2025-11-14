import cron from 'node-cron';
import { canaryRolloutService } from '../services/canary-rollout.service';
import logger from '../config/logger.config';

/**
 * Canary increment job
 * Runs every 24 hours to check error rates and increment rollout stages
 */
export function startCanaryIncrementJob() {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('[CanaryJob] Starting canary increment check...');

      const activeRollouts = await canaryRolloutService.getActiveRollouts();

      logger.info(`[CanaryJob] Found ${activeRollouts.length} active rollouts`);

      for (const rollout of activeRollouts) {
        try {
          // Check error rate over last 24 hours
          const errorRate = await canaryRolloutService.checkErrorRate(rollout.id, 24);
          const metrics = await canaryRolloutService.getMetrics(rollout.id, 24);

          logger.info(
            `[CanaryJob] Template ${rollout.name} v${rollout.version} (${rollout.rolloutStage}): ` +
            `Error rate: ${(errorRate * 100).toFixed(2)}%, Runs: ${metrics.totalRuns}`
          );

          // Require minimum number of runs before incrementing
          if (metrics.totalRuns < 10) {
            logger.warn(
              `[CanaryJob] Template ${rollout.id} has insufficient runs (${metrics.totalRuns}), skipping increment`
            );
            continue;
          }

          // Check error rate threshold
          if (errorRate < 0.05) {
            // Error rate acceptable, increment rollout
            await canaryRolloutService.incrementRollout(rollout.id);
            logger.info(`[CanaryJob] Incremented rollout for template ${rollout.id}`);
          } else {
            // Error rate too high, rollback
            logger.warn(
              `[CanaryJob] Template ${rollout.id} has high error rate (${(errorRate * 100).toFixed(2)}%), rolling back`
            );
            await canaryRolloutService.rollback(rollout.id);
          }
        } catch (error) {
          logger.error(`[CanaryJob] Failed to process rollout ${rollout.id}:`, error);
          // Continue with other rollouts
        }
      }

      logger.info('[CanaryJob] Canary increment check completed');
    } catch (error) {
      logger.error('[CanaryJob] Canary increment job failed:', error);
    }
  });

  logger.info('[CanaryJob] Canary increment job scheduled (daily at 2 AM)');
}

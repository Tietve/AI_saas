import cron from 'node-cron';
import { prisma } from '../config/database.config';
import { evalRunnerService } from '../services/eval-runner.service';
import logger from '../config/logger.config';

/**
 * Nightly Evaluation Job
 * Runs automated evaluations on all active datasets every night at 2 AM
 */
export function startNightlyEvalsJob() {
  // Run every night at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('[NightlyEvals] Starting nightly evaluation run...');

      // Get all active datasets
      const datasets = await prisma.evalDataset.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      });

      logger.info(`[NightlyEvals] Found ${datasets.length} active datasets`);

      const results: { datasetId: string; evalRunId: string; status: string }[] = [];

      for (const dataset of datasets) {
        try {
          // Skip datasets with no questions
          if (dataset._count.questions === 0) {
            logger.warn(
              `[NightlyEvals] Skipping dataset ${dataset.name} - no questions`
            );
            continue;
          }

          logger.info(
            `[NightlyEvals] Running eval for dataset: ${dataset.name} (${dataset._count.questions} questions)`
          );

          // Start evaluation
          const evalRunId = await evalRunnerService.runEval(dataset.id, 'NIGHTLY');

          results.push({
            datasetId: dataset.id,
            evalRunId,
            status: 'STARTED',
          });

          logger.info(`[NightlyEvals] Started eval run ${evalRunId} for dataset ${dataset.name}`);
        } catch (error) {
          logger.error(`[NightlyEvals] Failed to run eval for dataset ${dataset.id}:`, error);
          results.push({
            datasetId: dataset.id,
            evalRunId: 'N/A',
            status: 'FAILED',
          });
        }
      }

      logger.info(
        `[NightlyEvals] Nightly evaluation job completed. Started ${results.filter(r => r.status === 'STARTED').length}/${datasets.length} evaluations`
      );

      // Log summary
      logger.info('[NightlyEvals] Summary:', {
        totalDatasets: datasets.length,
        started: results.filter((r) => r.status === 'STARTED').length,
        failed: results.filter((r) => r.status === 'FAILED').length,
        results,
      });
    } catch (error) {
      logger.error('[NightlyEvals] Nightly evaluation job failed:', error);
    }
  });

  logger.info('[NightlyEvals] Nightly evaluation job scheduled (daily at 2 AM)');
}

/**
 * Run nightly evals manually (for testing)
 */
export async function runNightlyEvalsNow(): Promise<void> {
  try {
    logger.info('[NightlyEvals] Running nightly evals manually...');

    const datasets = await prisma.evalDataset.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    for (const dataset of datasets) {
      if (dataset._count.questions === 0) {
        logger.warn(`[NightlyEvals] Skipping dataset ${dataset.name} - no questions`);
        continue;
      }

      try {
        const evalRunId = await evalRunnerService.runEval(dataset.id, 'NIGHTLY');
        logger.info(`[NightlyEvals] Started eval run ${evalRunId} for dataset ${dataset.name}`);
      } catch (error) {
        logger.error(`[NightlyEvals] Failed to run eval for dataset ${dataset.id}:`, error);
      }
    }

    logger.info('[NightlyEvals] Manual nightly eval run completed');
  } catch (error) {
    logger.error('[NightlyEvals] Manual nightly eval run failed:', error);
    throw error;
  }
}

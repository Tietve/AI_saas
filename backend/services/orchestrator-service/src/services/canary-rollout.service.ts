import { prisma } from '../config/database.config';
import logger from '../config/logger.config';
import { RolloutStage } from '@prisma/client';

export interface RolloutMetrics {
  totalRuns: number;
  successRuns: number;
  failureRuns: number;
  errorRate: number;
  avgLatency: number;
}

export class CanaryRolloutService {
  /**
   * Get current rollout stage for a template
   */
  public async getRolloutStage(promptTemplateId: string): Promise<RolloutStage | null> {
    try {
      const template = await prisma.promptTemplate.findUnique({
        where: { id: promptTemplateId },
        select: { rolloutStage: true },
      });

      return template?.rolloutStage || null;
    } catch (error) {
      logger.error('[CanaryRollout] Failed to get rollout stage:', error);
      throw error;
    }
  }

  /**
   * Determine if a user should use the new version based on rollout percentage
   */
  public async shouldUseNewVersion(promptTemplateId: string, userId?: string): Promise<boolean> {
    try {
      const template = await prisma.promptTemplate.findUnique({
        where: { id: promptTemplateId },
        select: { rolloutStage: true, isActive: true, version: true },
      });

      if (!template || !template.isActive) {
        return false;
      }

      // If version 1 (stable), don't use new version
      if (template.version === 1) {
        return false;
      }

      // Map rollout stage to percentage
      const rolloutPercentages: Record<RolloutStage, number> = {
        DEVELOPMENT: 0,
        CANARY_5: 5,
        CANARY_25: 25,
        CANARY_50: 50,
        PRODUCTION: 100,
        FULL_100: 100,
      };

      const percentage = rolloutPercentages[template.rolloutStage];

      // Deterministic rollout based on userId hash (if provided)
      if (userId) {
        const hash = this.hashString(userId);
        const userPercentage = (hash % 100) + 1; // 1-100
        return userPercentage <= percentage;
      }

      // Random rollout if no userId
      return Math.random() * 100 <= percentage;
    } catch (error) {
      logger.error('[CanaryRollout] Failed to check new version:', error);
      return false; // Fallback to old version on error
    }
  }

  /**
   * Increment rollout to next stage
   */
  public async incrementRollout(promptTemplateId: string): Promise<void> {
    try {
      const template = await prisma.promptTemplate.findUnique({
        where: { id: promptTemplateId },
      });

      if (!template) {
        throw new Error(`Template ${promptTemplateId} not found`);
      }

      // Determine next stage
      const nextStage: Record<RolloutStage, RolloutStage | null> = {
        DEVELOPMENT: 'CANARY_5',
        CANARY_5: 'CANARY_25',
        CANARY_25: 'CANARY_50',
        CANARY_50: 'PRODUCTION',
        PRODUCTION: null, // Already at final stage
        FULL_100: null,   // Alias for PRODUCTION
      };

      const next = nextStage[template.rolloutStage];

      if (!next) {
        logger.info(`[CanaryRollout] Template ${promptTemplateId} already at PRODUCTION`);
        return;
      }

      await prisma.promptTemplate.update({
        where: { id: promptTemplateId },
        data: {
          rolloutStage: next,
          updatedAt: new Date(),
        },
      });

      logger.info(
        `[CanaryRollout] Incremented template ${promptTemplateId} from ${template.rolloutStage} to ${next}`
      );
    } catch (error) {
      logger.error('[CanaryRollout] Failed to increment rollout:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous version
   */
  public async rollback(promptTemplateId: string): Promise<void> {
    try {
      const template = await prisma.promptTemplate.findUnique({
        where: { id: promptTemplateId },
        select: { version: true },
      });

      if (!template) {
        throw new Error(`Template ${promptTemplateId} not found`);
      }

      // Find previous version
      const previousVersion = template.version - 1;

      if (previousVersion < 1) {
        throw new Error('No previous version to rollback to');
      }

      // Deactivate current version
      await prisma.promptTemplate.update({
        where: { id: promptTemplateId },
        data: {
          isActive: false,
          rolloutStage: 'DEVELOPMENT',
        },
      });

      // Activate previous version
      await prisma.promptTemplate.updateMany({
        where: {
          name: (await prisma.promptTemplate.findUnique({ where: { id: promptTemplateId } }))?.name,
          version: previousVersion,
        },
        data: {
          isActive: true,
          rolloutStage: 'PRODUCTION',
        },
      });

      logger.info(
        `[CanaryRollout] Rolled back template ${promptTemplateId} to version ${previousVersion}`
      );
    } catch (error) {
      logger.error('[CanaryRollout] Failed to rollback:', error);
      throw error;
    }
  }

  /**
   * Calculate error rate for a template
   */
  public async checkErrorRate(promptTemplateId: string, hoursBack: number = 24): Promise<number> {
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      const runs = await prisma.promptRun.findMany({
        where: {
          promptTemplateId,
          createdAt: {
            gte: since,
          },
        },
        select: {
          success: true,
        },
      });

      if (runs.length === 0) {
        return 0;
      }

      const failures = runs.filter(r => !r.success).length;
      const errorRate = failures / runs.length;

      logger.debug(
        `[CanaryRollout] Template ${promptTemplateId} error rate: ${(errorRate * 100).toFixed(2)}% (${failures}/${runs.length})`
      );

      return errorRate;
    } catch (error) {
      logger.error('[CanaryRollout] Failed to check error rate:', error);
      return 1; // Assume 100% error rate on failure (safe default)
    }
  }

  /**
   * Get rollout metrics
   */
  public async getMetrics(promptTemplateId: string, hoursBack: number = 24): Promise<RolloutMetrics> {
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      const runs = await prisma.promptRun.findMany({
        where: {
          promptTemplateId,
          createdAt: {
            gte: since,
          },
        },
        select: {
          success: true,
          latencyMs: true,
        },
      });

      const totalRuns = runs.length;
      const successRuns = runs.filter(r => r.success).length;
      const failureRuns = totalRuns - successRuns;
      const errorRate = totalRuns > 0 ? failureRuns / totalRuns : 0;
      const avgLatency =
        runs.length > 0
          ? runs.reduce((sum, r) => sum + (r.latencyMs || 0), 0) / runs.length
          : 0;

      return {
        totalRuns,
        successRuns,
        failureRuns,
        errorRate,
        avgLatency,
      };
    } catch (error) {
      logger.error('[CanaryRollout] Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Get all active rollouts
   */
  public async getActiveRollouts() {
    try {
      return await prisma.promptTemplate.findMany({
        where: {
          isActive: true,
          rolloutStage: {
            not: 'PRODUCTION',
          },
        },
        select: {
          id: true,
          name: true,
          version: true,
          rolloutStage: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error('[CanaryRollout] Failed to get active rollouts:', error);
      throw error;
    }
  }

  /**
   * Simple string hash for deterministic rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const canaryRolloutService = new CanaryRolloutService();

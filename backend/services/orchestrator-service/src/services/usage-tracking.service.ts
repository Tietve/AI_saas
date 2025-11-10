import { prisma } from '../config/database.config';
import logger from '../config/logger.config';

export interface UsageMetrics {
  component: string;
  operation: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs?: number;
  cacheHit: boolean;
  metadata?: Record<string, any>;
}

export class UsageTrackingService {
  /**
   * Track usage for a component
   */
  public async track(userId: string, metrics: UsageMetrics): Promise<void> {
    try {
      // Get tenant plan
      const tenantPlan = await prisma.tenantPlan.findUnique({
        where: { userId },
      });

      if (!tenantPlan) {
        logger.warn(`[UsageTracking] No tenant plan for user ${userId}`);
        return;
      }

      // Create usage meter record
      await prisma.usageMeter.create({
        data: {
          tenantPlanId: tenantPlan.id,
          component: metrics.component,
          operation: metrics.operation,
          tokensIn: metrics.tokensIn,
          tokensOut: metrics.tokensOut,
          costUsd: metrics.costUsd,
          latencyMs: metrics.latencyMs,
          cacheHit: metrics.cacheHit,
          metadata: metrics.metadata,
        },
      });

      // Update tenant plan usage
      const totalTokens = metrics.tokensIn + metrics.tokensOut;

      await prisma.tenantPlan.update({
        where: { userId },
        data: {
          tokensUsed: {
            increment: totalTokens,
          },
          upgradesUsed: metrics.component === 'upgrader' ? { increment: 1 } : undefined,
          embeddingsUsed: metrics.component === 'embedding' ? { increment: 1 } : undefined,
        },
      });

      logger.debug(`[UsageTracking] Tracked ${totalTokens} tokens for ${userId}`);
    } catch (error) {
      logger.error('[UsageTracking] Failed to track usage:', error);
      // Don't throw - usage tracking shouldn't break the request
    }
  }

  /**
   * Track batch usage
   */
  public async trackBatch(userId: string, metricsArray: UsageMetrics[]): Promise<void> {
    for (const metrics of metricsArray) {
      await this.track(userId, metrics);
    }
  }

  /**
   * Get usage stats for a user
   */
  public async getStats(userId: string, startDate?: Date, endDate?: Date) {
    try {
      const tenantPlan = await prisma.tenantPlan.findUnique({
        where: { userId },
        include: {
          usageMeters: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!tenantPlan) {
        return null;
      }

      // Calculate stats
      const stats = {
        currentPeriod: {
          tokensUsed: tenantPlan.tokensUsed,
          tokensQuota: tenantPlan.monthlyTokenQuota,
          upgradesUsed: tenantPlan.upgradesUsed,
          upgradesQuota: tenantPlan.monthlyUpgradeQuota,
          embeddingsUsed: tenantPlan.embeddingsUsed,
          embeddingsQuota: tenantPlan.monthlyEmbeddingQuota,
          periodStart: tenantPlan.currentPeriodStart,
          periodEnd: tenantPlan.currentPeriodEnd,
        },
        byComponent: {} as Record<string, any>,
        totalCost: 0,
        totalLatency: 0,
        cacheHitRate: 0,
      };

      // Aggregate by component
      for (const meter of tenantPlan.usageMeters) {
        if (!stats.byComponent[meter.component]) {
          stats.byComponent[meter.component] = {
            calls: 0,
            tokensIn: 0,
            tokensOut: 0,
            costUsd: 0,
            cacheHits: 0,
            cacheMisses: 0,
          };
        }

        const comp = stats.byComponent[meter.component];
        comp.calls++;
        comp.tokensIn += meter.tokensIn;
        comp.tokensOut += meter.tokensOut;
        comp.costUsd += meter.costUsd;

        if (meter.cacheHit) {
          comp.cacheHits++;
        } else {
          comp.cacheMisses++;
        }

        stats.totalCost += meter.costUsd;
        stats.totalLatency += meter.latencyMs || 0;
      }

      // Calculate cache hit rate
      const totalCalls = tenantPlan.usageMeters.length;
      const cacheHits = tenantPlan.usageMeters.filter(m => m.cacheHit).length;
      stats.cacheHitRate = totalCalls > 0 ? cacheHits / totalCalls : 0;

      return stats;
    } catch (error) {
      logger.error('[UsageTracking] Failed to get stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();

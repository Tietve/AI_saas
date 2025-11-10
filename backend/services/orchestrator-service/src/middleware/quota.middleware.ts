import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import logger from '../config/logger.config';

/**
 * Check if user has quota remaining
 */
export async function checkQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.body.userId || req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'userId is required in request body or x-user-id header',
        },
      });
    }

    // Get or create tenant plan
    let tenantPlan = await prisma.tenantPlan.findUnique({
      where: { userId },
    });

    if (!tenantPlan) {
      // Create default FREE plan
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      tenantPlan = await prisma.tenantPlan.create({
        data: {
          userId,
          planTier: 'FREE',
          monthlyTokenQuota: 100000,
          monthlyUpgradeQuota: 1000,
          monthlyEmbeddingQuota: 10000,
          tokensUsed: 0,
          upgradesUsed: 0,
          embeddingsUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });

      logger.info(`[Quota] Created FREE plan for user ${userId}`);
    }

    // Check if period expired
    if (new Date() > tenantPlan.currentPeriodEnd) {
      // Reset quotas
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      tenantPlan = await prisma.tenantPlan.update({
        where: { userId },
        data: {
          tokensUsed: 0,
          upgradesUsed: 0,
          embeddingsUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });

      logger.info(`[Quota] Reset quotas for user ${userId}`);
    }

    // Check upgrade quota
    if (tenantPlan.upgradesUsed >= tenantPlan.monthlyUpgradeQuota) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: `Monthly upgrade quota exceeded (${tenantPlan.monthlyUpgradeQuota} upgrades)`,
          quotaInfo: {
            used: tenantPlan.upgradesUsed,
            limit: tenantPlan.monthlyUpgradeQuota,
            resetAt: tenantPlan.currentPeriodEnd,
          },
        },
      });
    }

    // Check token quota (soft limit, warn but allow)
    if (tenantPlan.tokensUsed >= tenantPlan.monthlyTokenQuota) {
      logger.warn(`[Quota] User ${userId} exceeded token quota but allowing request`);
    }

    // Attach tenant plan to request
    (req as any).tenantPlan = tenantPlan;

    next();
  } catch (error) {
    logger.error('[Quota] Middleware error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'QUOTA_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

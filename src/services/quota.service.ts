/**
 * Quota Service
 *
 * Business logic for quota management and usage tracking.
 * No direct database access - uses repositories.
 */

import { injectable, inject } from 'tsyringe'
import { UserRepository } from '@/repositories/user.repository'
import { TokenUsageRepository } from '@/repositories/token-usage.repository'
import { PLAN_LIMITS } from '@/lib/billing/limits'
import { calcCostUsd } from '@/lib/billing/costs'
import { ModelId, PlanTier } from '@prisma/client'
import { logger, logBillingEvent } from '@/lib/logger'

export interface QuotaCheck {
  ok: boolean
  reason?: 'NO_USER' | 'OVER_LIMIT' | 'PER_REQUEST_TOO_LARGE'
  remaining: number
  limit: number
  wouldExceedBy?: number
}

export interface UsageSummary {
  used: number
  limit: number
  remaining: number
  percent: number
  plan: PlanTier
}

@injectable()
export class QuotaService {
  constructor(
    @inject(UserRepository) private userRepo: UserRepository,
    @inject(TokenUsageRepository) private tokenUsageRepo: TokenUsageRepository
  ) {}

  /**
   * Check if user can spend estimated tokens
   */
  async canSpend(userId: string, estimateTokens: number): Promise<QuotaCheck> {
    const user = await this.userRepo.findById(userId)

    if (!user) {
      return {
        ok: false,
        reason: 'NO_USER',
        remaining: 0,
        limit: 0,
      }
    }

    const { monthlyTokenLimit, perRequestMaxTokens } = PLAN_LIMITS[user.planTier]

    // Check per-request limit
    if (estimateTokens > perRequestMaxTokens) {
      logger.warn(
        {
          userId,
          estimateTokens,
          perRequestMaxTokens,
        },
        'Request exceeds per-request token limit'
      )

      return {
        ok: false,
        reason: 'PER_REQUEST_TOO_LARGE',
        remaining: Math.max(0, monthlyTokenLimit - user.monthlyTokenUsed),
        limit: monthlyTokenLimit,
        wouldExceedBy: estimateTokens - perRequestMaxTokens,
      }
    }

    // Check monthly limit
    const projected = user.monthlyTokenUsed + estimateTokens
    if (projected > monthlyTokenLimit) {
      logger.warn(
        {
          userId,
          used: user.monthlyTokenUsed,
          limit: monthlyTokenLimit,
          projected,
        },
        'User would exceed monthly quota'
      )

      return {
        ok: false,
        reason: 'OVER_LIMIT',
        remaining: Math.max(0, monthlyTokenLimit - user.monthlyTokenUsed),
        limit: monthlyTokenLimit,
        wouldExceedBy: projected - monthlyTokenLimit,
      }
    }

    return {
      ok: true,
      remaining: monthlyTokenLimit - projected,
      limit: monthlyTokenLimit,
    }
  }

  /**
   * Record usage and increment user's token count
   */
  async recordUsage(params: {
    userId: string
    model: ModelId
    tokensIn: number
    tokensOut: number
    costUsd?: number
    meta?: any
  }): Promise<{
    saved: boolean
    newMonthlyUsed: number
    plan: PlanTier
    costUsd: number
  }> {
    const { userId, model, tokensIn, tokensOut } = params
    const costUsd = params.costUsd ?? calcCostUsd(model, tokensIn, tokensOut)

    // Check for duplicate request
    const requestId = params.meta?.requestId
    if (requestId) {
      const duplicate = await this.tokenUsageRepo.findByRequestId(userId, requestId)
      if (duplicate) {
        logger.debug({ userId, requestId }, 'Duplicate request detected, skipping usage recording')
        return {
          saved: false,
          newMonthlyUsed: 0,
          plan: 'FREE',
          costUsd: 0,
        }
      }
    }

    // Create usage record
    await this.tokenUsageRepo.create({
      userId,
      model,
      tokensIn,
      tokensOut,
      costUsd,
      meta: params.meta,
    })

    // Increment user's monthly usage
    const totalTokens = tokensIn + tokensOut
    const updatedUser = await this.userRepo.incrementTokenUsage(userId, totalTokens)

    logger.info(
      {
        userId,
        model,
        tokensIn,
        tokensOut,
        costUsd,
        newMonthlyUsed: updatedUser.monthlyTokenUsed,
      },
      'Usage recorded'
    )

    return {
      saved: true,
      newMonthlyUsed: updatedUser.monthlyTokenUsed,
      plan: updatedUser.planTier,
      costUsd,
    }
  }

  /**
   * Get usage summary for user
   */
  async getUsageSummary(userId: string): Promise<UsageSummary | null> {
    const user = await this.userRepo.findById(userId)

    if (!user) {
      return null
    }

    const limit = PLAN_LIMITS[user.planTier].monthlyTokenLimit
    const used = user.monthlyTokenUsed
    const remaining = Math.max(0, limit - used)
    const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

    return {
      used,
      limit,
      remaining,
      percent,
      plan: user.planTier,
    }
  }

  /**
   * Get detailed usage statistics
   */
  async getUsageStats(userId: string, startDate?: Date, endDate?: Date) {
    return await this.tokenUsageRepo.getStats(userId, startDate, endDate)
  }

  /**
   * Reset monthly quota for all users (cron job)
   */
  async resetMonthlyQuotas(): Promise<number> {
    const count = await this.userRepo.resetMonthlyTokenUsage()

    logBillingEvent({
      event: 'quota_exceeded', // Reusing this event type
      userId: 'system',
      amount: count,
      metadata: { operation: 'monthly_quota_reset' },
    })

    logger.info({ count }, 'Monthly quotas reset for all users')

    return count
  }

  /**
   * Get plan limits for a user
   */
  async getUserLimits(userId: string) {
    const user = await this.userRepo.findById(userId)

    if (!user) {
      return null
    }

    return PLAN_LIMITS[user.planTier]
  }
}

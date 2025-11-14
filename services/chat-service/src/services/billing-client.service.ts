import axios from 'axios';
import { redisCache } from '../../../../shared/cache/redis.client';
import { CACHE_TTL, CACHE_PREFIX } from '../../../../shared/cache/cache.config';

export interface UsageInfo {
  userId: string;
  planTier: string;
  monthlyQuota: number;
  monthlyUsed: number;
  percentageUsed: number;
  remaining: number;
}

export class BillingClientService {
  private billingServiceUrl: string;

  constructor() {
    this.billingServiceUrl = process.env.BILLING_SERVICE_URL || 'http://localhost:3003';
  }

  /**
   * Check if user can use tokens (with caching)
   */
  async checkQuota(userId: string, sessionCookie: string): Promise<UsageInfo> {
    try {
      // Try to get from cache first
      const cacheKey = `${userId}:quota`;
      const cached = await redisCache.get<UsageInfo>(cacheKey, {
        prefix: CACHE_PREFIX.BILLING,
      });

      if (cached) {
        console.log(`[BillingClient] Quota cache HIT for user ${userId}`);
        return cached;
      }

      console.log(`[BillingClient] Quota cache MISS for user ${userId}`);

      // Fetch from billing service
      const response = await axios.get(`${this.billingServiceUrl}/api/usage`, {
        headers: {
          Cookie: `session=${sessionCookie}`
        }
      });

      if (response.data.ok && response.data.usage) {
        const usageInfo = response.data.usage;

        // Cache for 1 minute
        await redisCache.set(cacheKey, usageInfo, {
          prefix: CACHE_PREFIX.BILLING,
          ttl: CACHE_TTL.USER_QUOTA,
        });

        return usageInfo;
      }

      throw new Error('Failed to get usage info');
    } catch (error: any) {
      console.error('[BillingClient] checkQuota error:', error.message);
      // Fallback: assume unlimited quota on error
      return {
        userId,
        planTier: 'FREE',
        monthlyQuota: 100000,
        monthlyUsed: 0,
        percentageUsed: 0,
        remaining: 100000
      };
    }
  }

  /**
   * Invalidate quota cache for a user (call after token usage update)
   */
  async invalidateQuotaCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${userId}:quota`;
      await redisCache.del(cacheKey, { prefix: CACHE_PREFIX.BILLING });
      console.log(`[BillingClient] Invalidated quota cache for user ${userId}`);
    } catch (error) {
      console.error('[BillingClient] Error invalidating quota cache:', error);
    }
  }

  /**
   * Check if enough quota for tokens
   */
  async canUseTokens(userId: string, tokensNeeded: number, sessionCookie: string): Promise<{
    allowed: boolean;
    usage?: UsageInfo;
    error?: string;
  }> {
    try {
      const usage = await this.checkQuota(userId, sessionCookie);

      if (usage.remaining < tokensNeeded) {
        return {
          allowed: false,
          usage,
          error: `Không đủ quota. Cần ${tokensNeeded} tokens, còn ${usage.remaining} tokens.`
        };
      }

      return {
        allowed: true,
        usage
      };
    } catch (error: any) {
      console.error('[BillingClient] canUseTokens error:', error.message);
      // Fallback: allow on error to not break chat
      return {
        allowed: true
      };
    }
  }
}

export const billingClientService = new BillingClientService();

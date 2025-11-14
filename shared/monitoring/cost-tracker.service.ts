import { redisCache } from '../cache/redis.client';
import { COST_THRESHOLDS } from '../cache/cache.config';

export interface CostRecord {
  service: 'openai' | 'stripe' | 'cloudflare' | 'other';
  amount: number; // in USD
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CostSummary {
  hourly: number;
  daily: number;
  monthly: number;
  records: CostRecord[];
}

/**
 * Cost Tracking Service
 * Tracks costs for external API calls (OpenAI, Stripe, etc.)
 */
export class CostTrackerService {
  private readonly COST_KEY_PREFIX = 'cost:tracker';

  /**
   * Record a cost event
   */
  async recordCost(record: CostRecord): Promise<void> {
    try {
      const now = Date.now();
      const hourKey = this.getHourlyKey(now);
      const dailyKey = this.getDailyKey(now);
      const monthlyKey = this.getMonthlyKey(now);

      // Increment hourly, daily, and monthly counters
      await Promise.all([
        redisCache.getClient().incrbyfloat(hourKey, record.amount),
        redisCache.getClient().incrbyfloat(dailyKey, record.amount),
        redisCache.getClient().incrbyfloat(monthlyKey, record.amount),
      ]);

      // Set TTL for automatic cleanup
      await Promise.all([
        redisCache.expire(hourKey, 3600, { prefix: '' }), // 1 hour
        redisCache.expire(dailyKey, 86400 * 7, { prefix: '' }), // 7 days
        redisCache.expire(monthlyKey, 86400 * 60, { prefix: '' }), // 60 days
      ]);

      // Store individual record for detailed tracking
      const recordKey = `${this.COST_KEY_PREFIX}:records:${record.service}:${now}`;
      await redisCache.set(recordKey, record, { ttl: 86400 * 30 }); // 30 days

      // Check if we're approaching limits
      await this.checkThresholds(record.service);

      console.log(`[CostTracker] Recorded $${record.amount.toFixed(4)} for ${record.service}`);
    } catch (error) {
      console.error('[CostTracker] Error recording cost:', error);
    }
  }

  /**
   * Get current hourly cost
   */
  async getHourlyCost(service?: string): Promise<number> {
    try {
      const now = Date.now();
      const hourKey = service
        ? `${this.COST_KEY_PREFIX}:${service}:hourly:${this.getHourBucket(now)}`
        : this.getHourlyKey(now);

      const cost = await redisCache.getClient().get(hourKey);
      return cost ? parseFloat(cost) : 0;
    } catch (error) {
      console.error('[CostTracker] Error getting hourly cost:', error);
      return 0;
    }
  }

  /**
   * Get current daily cost
   */
  async getDailyCost(service?: string): Promise<number> {
    try {
      const now = Date.now();
      const dailyKey = service
        ? `${this.COST_KEY_PREFIX}:${service}:daily:${this.getDayBucket(now)}`
        : this.getDailyKey(now);

      const cost = await redisCache.getClient().get(dailyKey);
      return cost ? parseFloat(cost) : 0;
    } catch (error) {
      console.error('[CostTracker] Error getting daily cost:', error);
      return 0;
    }
  }

  /**
   * Get current monthly cost
   */
  async getMonthlyCost(service?: string): Promise<number> {
    try {
      const now = Date.now();
      const monthlyKey = service
        ? `${this.COST_KEY_PREFIX}:${service}:monthly:${this.getMonthBucket(now)}`
        : this.getMonthlyKey(now);

      const cost = await redisCache.getClient().get(monthlyKey);
      return cost ? parseFloat(cost) : 0;
    } catch (error) {
      console.error('[CostTracker] Error getting monthly cost:', error);
      return 0;
    }
  }

  /**
   * Get cost summary
   */
  async getCostSummary(service?: string): Promise<CostSummary> {
    const [hourly, daily, monthly] = await Promise.all([
      this.getHourlyCost(service),
      this.getDailyCost(service),
      this.getMonthlyCost(service),
    ]);

    return {
      hourly,
      daily,
      monthly,
      records: [], // Could populate from stored records if needed
    };
  }

  /**
   * Check if costs are approaching thresholds
   */
  private async checkThresholds(service: string): Promise<void> {
    if (service !== 'openai') return; // Only check OpenAI for now

    const [hourly, daily] = await Promise.all([
      this.getHourlyCost('openai'),
      this.getDailyCost('openai'),
    ]);

    const hourlyThreshold = COST_THRESHOLDS.OPENAI_HOURLY_LIMIT_USD * (COST_THRESHOLDS.ALERT_THRESHOLD_PERCENT / 100);
    const dailyThreshold = COST_THRESHOLDS.OPENAI_DAILY_LIMIT_USD * (COST_THRESHOLDS.ALERT_THRESHOLD_PERCENT / 100);

    if (hourly >= hourlyThreshold) {
      console.warn(`[CostTracker] ⚠️ ALERT: OpenAI hourly cost ($${hourly.toFixed(2)}) approaching limit ($${COST_THRESHOLDS.OPENAI_HOURLY_LIMIT_USD})`);
    }

    if (daily >= dailyThreshold) {
      console.warn(`[CostTracker] ⚠️ ALERT: OpenAI daily cost ($${daily.toFixed(2)}) approaching limit ($${COST_THRESHOLDS.OPENAI_DAILY_LIMIT_USD})`);
    }

    // Hard limits
    if (hourly >= COST_THRESHOLDS.OPENAI_HOURLY_LIMIT_USD) {
      console.error(`[CostTracker] 🚨 CRITICAL: OpenAI hourly limit EXCEEDED! ($${hourly.toFixed(2)})`);
    }

    if (daily >= COST_THRESHOLDS.OPENAI_DAILY_LIMIT_USD) {
      console.error(`[CostTracker] 🚨 CRITICAL: OpenAI daily limit EXCEEDED! ($${daily.toFixed(2)})`);
    }
  }

  /**
   * Helper: Get hourly key
   */
  private getHourlyKey(timestamp: number): string {
    return `${this.COST_KEY_PREFIX}:all:hourly:${this.getHourBucket(timestamp)}`;
  }

  /**
   * Helper: Get daily key
   */
  private getDailyKey(timestamp: number): string {
    return `${this.COST_KEY_PREFIX}:all:daily:${this.getDayBucket(timestamp)}`;
  }

  /**
   * Helper: Get monthly key
   */
  private getMonthlyKey(timestamp: number): string {
    return `${this.COST_KEY_PREFIX}:all:monthly:${this.getMonthBucket(timestamp)}`;
  }

  /**
   * Helper: Get hour bucket (YYYY-MM-DD-HH)
   */
  private getHourBucket(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
  }

  /**
   * Helper: Get day bucket (YYYY-MM-DD)
   */
  private getDayBucket(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Helper: Get month bucket (YYYY-MM)
   */
  private getMonthBucket(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Reset all cost tracking (use with caution!)
   */
  async resetTracking(): Promise<void> {
    try {
      const pattern = `${this.COST_KEY_PREFIX}:*`;
      const deleted = await redisCache.delPattern(pattern);
      console.log(`[CostTracker] Reset tracking - deleted ${deleted} keys`);
    } catch (error) {
      console.error('[CostTracker] Error resetting tracking:', error);
    }
  }
}

export const costTracker = new CostTrackerService();

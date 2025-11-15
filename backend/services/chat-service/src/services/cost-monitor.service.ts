/**
 * Cost Monitor Service
 *
 * Tracks AI costs per provider, user, and time period.
 * Provides cost analytics and budget alerts.
 *
 * FEATURES:
 * - Per-provider cost tracking
 * - Per-user cost tracking
 * - Daily/monthly aggregation
 * - Budget alert thresholds
 * - Cost comparison analytics
 */

import { LLMProvider } from '../../../shared/services/types';
import { LLMService } from '../../../shared/services/llm.service';
import { tokenUsageRepository } from '../repositories/token-usage.repository';

export interface CostRecord {
  userId: string;
  provider: LLMProvider;
  tokens: number;
  cost: number;
  timestamp: Date;
}

export interface CostStats {
  totalCost: number;
  totalTokens: number;
  byProvider: Record<string, { tokens: number; cost: number; percentage: number }>;
  averageCostPerMessage: number;
  messageCount: number;
}

export interface BudgetAlert {
  level: 'warning' | 'critical';
  currentCost: number;
  budgetLimit: number;
  percentage: number;
  message: string;
}

export class CostMonitorService {
  private llm: LLMService;
  private costRecords: CostRecord[] = [];

  // Budget thresholds (in USD per month)
  private readonly MONTHLY_BUDGET_WARNING = 100; // Warn at $100/month
  private readonly MONTHLY_BUDGET_CRITICAL = 200; // Critical at $200/month
  private readonly MONTHLY_BUDGET_MAX = 500; // Hard limit at $500/month

  constructor() {
    this.llm = new LLMService();
  }

  /**
   * Track a single API call cost
   */
  async trackCost(
    userId: string,
    provider: LLMProvider,
    tokens: number,
    messageId?: string
  ): Promise<void> {
    const cost = this.llm.estimateCost(tokens, provider);

    const record: CostRecord = {
      userId,
      provider,
      tokens,
      cost,
      timestamp: new Date(),
    };

    // Store in memory (TODO: persist to database)
    this.costRecords.push(record);

    // Log for monitoring
    console.log(
      `[CostMonitor] User: ${userId} | Provider: ${provider} | Tokens: ${tokens} | Cost: $${cost.toFixed(6)}`
    );

    // Check budget alerts
    const alerts = await this.checkBudgetAlerts(userId);
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        console.warn(`[CostMonitor] ALERT: ${alert.message}`);
      });
    }
  }

  /**
   * Get cost statistics for a user
   */
  async getUserCostStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CostStats> {
    // Filter records by user and date range
    const userRecords = this.costRecords.filter(record => {
      if (record.userId !== userId) return false;
      if (startDate && record.timestamp < startDate) return false;
      if (endDate && record.timestamp > endDate) return false;
      return true;
    });

    // Calculate totals
    const totalCost = userRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = userRecords.reduce((sum, r) => sum + r.tokens, 0);
    const messageCount = userRecords.length;

    // Group by provider
    const byProvider: Record<string, { tokens: number; cost: number; percentage: number }> = {};

    for (const provider of Object.values(LLMProvider)) {
      const providerRecords = userRecords.filter(r => r.provider === provider);
      const providerCost = providerRecords.reduce((sum, r) => sum + r.cost, 0);
      const providerTokens = providerRecords.reduce((sum, r) => sum + r.tokens, 0);

      if (providerTokens > 0) {
        byProvider[provider] = {
          tokens: providerTokens,
          cost: providerCost,
          percentage: totalCost > 0 ? (providerCost / totalCost) * 100 : 0,
        };
      }
    }

    return {
      totalCost,
      totalTokens,
      byProvider,
      averageCostPerMessage: messageCount > 0 ? totalCost / messageCount : 0,
      messageCount,
    };
  }

  /**
   * Get total cost for current month
   */
  async getMonthlyTotal(userId?: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let records = this.costRecords.filter(
      r => r.timestamp >= startOfMonth && r.timestamp <= endOfMonth
    );

    if (userId) {
      records = records.filter(r => r.userId === userId);
    }

    return records.reduce((sum, r) => sum + r.cost, 0);
  }

  /**
   * Check if budget alerts should be triggered
   */
  async checkBudgetAlerts(userId?: string): Promise<BudgetAlert[]> {
    const monthlyTotal = await this.getMonthlyTotal(userId);
    const alerts: BudgetAlert[] = [];

    // Warning threshold (50% of budget)
    if (monthlyTotal >= this.MONTHLY_BUDGET_WARNING) {
      const percentage = (monthlyTotal / this.MONTHLY_BUDGET_MAX) * 100;
      alerts.push({
        level: 'warning',
        currentCost: monthlyTotal,
        budgetLimit: this.MONTHLY_BUDGET_WARNING,
        percentage,
        message: `Monthly cost of $${monthlyTotal.toFixed(2)} has reached warning threshold ($${this.MONTHLY_BUDGET_WARNING})`,
      });
    }

    // Critical threshold (75% of budget)
    if (monthlyTotal >= this.MONTHLY_BUDGET_CRITICAL) {
      const percentage = (monthlyTotal / this.MONTHLY_BUDGET_MAX) * 100;
      alerts.push({
        level: 'critical',
        currentCost: monthlyTotal,
        budgetLimit: this.MONTHLY_BUDGET_CRITICAL,
        percentage,
        message: `CRITICAL: Monthly cost of $${monthlyTotal.toFixed(2)} has reached critical threshold ($${this.MONTHLY_BUDGET_CRITICAL})`,
      });
    }

    // Hard limit exceeded
    if (monthlyTotal >= this.MONTHLY_BUDGET_MAX) {
      const percentage = (monthlyTotal / this.MONTHLY_BUDGET_MAX) * 100;
      alerts.push({
        level: 'critical',
        currentCost: monthlyTotal,
        budgetLimit: this.MONTHLY_BUDGET_MAX,
        percentage,
        message: `HARD LIMIT EXCEEDED: Monthly cost of $${monthlyTotal.toFixed(2)} has exceeded maximum budget ($${this.MONTHLY_BUDGET_MAX})`,
      });
    }

    return alerts;
  }

  /**
   * Compare costs before and after migration
   */
  async generateCostComparison(days: number = 30): Promise<{
    before: CostStats;
    after: CostStats;
    savings: number;
    savingsPercentage: number;
  }> {
    // Simulate "before" scenario: 100% OpenAI GPT-4
    const stats = await this.getUserCostStats('all');
    const totalTokens = stats.totalTokens;

    // Before: All tokens on GPT-4o
    const costBefore = this.llm.estimateCost(totalTokens, LLMProvider.GPT4O);

    // After: Mixed providers (current distribution)
    const costAfter = stats.totalCost;

    const savings = costBefore - costAfter;
    const savingsPercentage = costBefore > 0 ? (savings / costBefore) * 100 : 0;

    return {
      before: {
        totalCost: costBefore,
        totalTokens,
        byProvider: {
          [LLMProvider.GPT4O]: { tokens: totalTokens, cost: costBefore, percentage: 100 },
        },
        averageCostPerMessage: costBefore / stats.messageCount,
        messageCount: stats.messageCount,
      },
      after: stats,
      savings,
      savingsPercentage,
    };
  }

  /**
   * Get provider usage distribution
   */
  getProviderDistribution(): Record<LLMProvider, number> {
    const distribution: Record<LLMProvider, number> = {
      [LLMProvider.GPT4O]: 0,
      [LLMProvider.GPT35_TURBO]: 0,
      [LLMProvider.LLAMA2]: 0,
      [LLMProvider.CLAUDE]: 0,
    };

    this.costRecords.forEach(record => {
      distribution[record.provider] = (distribution[record.provider] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Clear old records (keep last 30 days)
   */
  async clearOldRecords(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.costRecords = this.costRecords.filter(r => r.timestamp >= thirtyDaysAgo);
  }
}

export const costMonitorService = new CostMonitorService();

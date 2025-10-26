import { PrismaClient, TokenUsage } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTokenUsageData {
  userId: string;
  messageId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export class TokenUsageRepository {
  /**
   * Record token usage
   */
  async create(data: CreateTokenUsageData): Promise<TokenUsage> {
    return prisma.tokenUsage.create({
      data: {
        userId: data.userId,
        messageId: data.messageId,
        model: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        cost: data.cost || this.calculateCost(data.model, data.promptTokens, data.completionTokens)
      }
    });
  }

  /**
   * Get usage for user in current month
   */
  async getMonthlyUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        totalTokens: true
      }
    });

    return result._sum.totalTokens || 0;
  }

  /**
   * Calculate cost based on OpenAI pricing
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // GPT-4 pricing (as of 2024)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4': { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
      'gpt-4-turbo': { prompt: 0.01 / 1000, completion: 0.03 / 1000 },
      'gpt-3.5-turbo': { prompt: 0.0005 / 1000, completion: 0.0015 / 1000 }
    };

    const modelPricing = pricing[model] || pricing['gpt-4'];
    return (promptTokens * modelPricing.prompt) + (completionTokens * modelPricing.completion);
  }
}

export const tokenUsageRepository = new TokenUsageRepository();

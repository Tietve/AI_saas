import axios from 'axios';

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
   * Check if user can use tokens
   */
  async checkQuota(userId: string, sessionCookie: string): Promise<UsageInfo> {
    try {
      const response = await axios.get(`${this.billingServiceUrl}/api/usage`, {
        headers: {
          Cookie: `session=${sessionCookie}`
        }
      });

      if (response.data.ok && response.data.usage) {
        return response.data.usage;
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

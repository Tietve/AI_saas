import { billingClient } from '@/shared/api/client';
import type {
  Plan,
  Subscription,
  Payment,
  UsageStats,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CancelSubscriptionResponse,
} from './types';

export const billingApi = {
  // Get all available plans
  getPlans: async (): Promise<Plan[]> => {
    const response = await billingClient.get('/billing/plans');
    return response.data;
  },

  // Get current subscription
  getSubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await billingClient.get('/billing/subscription');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No subscription found
      }
      throw error;
    }
  },

  // Create new subscription
  createSubscription: async (
    data: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> => {
    const response = await billingClient.post('/billing/subscribe', data);
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<CancelSubscriptionResponse> => {
    const response = await billingClient.post('/billing/cancel');
    return response.data;
  },

  // Get usage statistics
  getUsage: async (): Promise<UsageStats> => {
    const response = await billingClient.get('/billing/usage');
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await billingClient.get('/billing/payments');
    return response.data;
  },
};

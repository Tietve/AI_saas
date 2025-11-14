import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billingApi';
import type { CreateSubscriptionRequest } from '../api/types';

export const BILLING_KEYS = {
  plans: ['billing', 'plans'] as const,
  subscription: ['billing', 'subscription'] as const,
  usage: ['billing', 'usage'] as const,
  payments: ['billing', 'payments'] as const,
};

// Get all plans
export function usePlans() {
  return useQuery({
    queryKey: BILLING_KEYS.plans,
    queryFn: billingApi.getPlans,
    staleTime: 1000 * 60 * 5, // 5 minutes - plans don't change often
  });
}

// Get current subscription
export function useSubscription() {
  return useQuery({
    queryKey: BILLING_KEYS.subscription,
    queryFn: billingApi.getSubscription,
    retry: false, // Don't retry if no subscription
  });
}

// Get usage stats
export function useUsage() {
  return useQuery({
    queryKey: BILLING_KEYS.usage,
    queryFn: billingApi.getUsage,
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

// Get payment history
export function usePaymentHistory() {
  return useQuery({
    queryKey: BILLING_KEYS.payments,
    queryFn: billingApi.getPaymentHistory,
  });
}

// Create subscription mutation
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) =>
      billingApi.createSubscription(data),
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.subscription });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.usage });
    },
  });
}

// Cancel subscription mutation
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingApi.cancelSubscription,
    onSuccess: () => {
      // Invalidate and refetch subscription
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.subscription });
    },
  });
}

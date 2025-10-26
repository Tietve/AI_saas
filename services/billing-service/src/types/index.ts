export interface CreateSubscriptionData {
  userId: string;
  planTier: 'PLUS' | 'PRO';
  paymentMethodId: string;
}

export interface SubscriptionInfo {
  id: string;
  planTier: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export interface UsageInfo {
  userId: string;
  planTier: string;
  monthlyQuota: number;
  monthlyUsed: number;
  percentageUsed: number;
  remaining: number;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  planTier: string;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'plus' | 'pro';
  price: number;
  currency: string;
  interval: 'month' | 'year';
  tokenLimit: number;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  tier: 'free' | 'plus' | 'pro';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  paymentMethod?: string;
  createdAt: string;
}

export interface UsageStats {
  tokensUsed: number;
  tokenLimit: number;
  percentUsed: number;
  resetDate: string;
}

export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId?: string;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  clientSecret?: string; // For payment confirmation
}

export interface CancelSubscriptionResponse {
  subscription: Subscription;
  message: string;
}

/**
 * Mock Billing Plans & Subscription Data Fixtures
 */

export interface MockPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    tokens: number;
    conversations: number;
    models: string[];
  };
  stripePriceId: string;
}

export interface MockSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}

export const mockPlans: MockPlan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      'Basic chat access',
      'GPT-3.5 Turbo',
      '10 conversations per month',
      'Community support',
    ],
    limits: {
      tokens: 10000,
      conversations: 10,
      models: ['gpt-3.5-turbo'],
    },
    stripePriceId: 'price_free',
  },
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 9.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Free',
      'GPT-4 access',
      '100 conversations per month',
      'Email support',
      'Export conversations',
    ],
    limits: {
      tokens: 100000,
      conversations: 100,
      models: ['gpt-3.5-turbo', 'gpt-4'],
    },
    stripePriceId: 'price_starter_monthly',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: 29.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Starter',
      'GPT-4 Turbo access',
      'Unlimited conversations',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
    ],
    limits: {
      tokens: 1000000,
      conversations: -1, // -1 means unlimited
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    },
    stripePriceId: 'price_pro_monthly',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    price: 99.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Pro',
      'All models including GPT-4 Turbo',
      'Unlimited everything',
      'Dedicated support',
      'Custom model fine-tuning',
      'SSO integration',
      'SLA guarantee',
    ],
    limits: {
      tokens: -1, // unlimited
      conversations: -1, // unlimited
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4-32k'],
    },
    stripePriceId: 'price_enterprise_monthly',
  },
];

export const mockSubscriptions: Record<string, MockSubscription> = {
  '1': {
    id: 'sub-1',
    userId: '1',
    planId: 'plan-free',
    status: 'active',
    currentPeriodStart: '2025-01-01T00:00:00.000Z',
    currentPeriodEnd: '2025-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'sub_stripe_1',
    stripeCustomerId: 'cus_stripe_1',
  },
  '2': {
    id: 'sub-2',
    userId: '2',
    planId: 'plan-pro',
    status: 'active',
    currentPeriodStart: '2025-01-01T00:00:00.000Z',
    currentPeriodEnd: '2025-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'sub_stripe_2',
    stripeCustomerId: 'cus_stripe_2',
  },
  '3': {
    id: 'sub-3',
    userId: '3',
    planId: 'plan-enterprise',
    status: 'active',
    currentPeriodStart: '2025-01-01T00:00:00.000Z',
    currentPeriodEnd: '2025-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'sub_stripe_3',
    stripeCustomerId: 'cus_stripe_3',
  },
};

export const mockUsageData = {
  '1': {
    planId: 'plan-free',
    currentPeriod: {
      tokens: 5000,
      conversations: 5,
    },
    limits: {
      tokens: 10000,
      conversations: 10,
    },
    percentage: {
      tokens: 50,
      conversations: 50,
    },
  },
  '2': {
    planId: 'plan-pro',
    currentPeriod: {
      tokens: 250000,
      conversations: 50,
    },
    limits: {
      tokens: 1000000,
      conversations: -1,
    },
    percentage: {
      tokens: 25,
      conversations: 0, // unlimited
    },
  },
  '3': {
    planId: 'plan-enterprise',
    currentPeriod: {
      tokens: 5000000,
      conversations: 500,
    },
    limits: {
      tokens: -1,
      conversations: -1,
    },
    percentage: {
      tokens: 0, // unlimited
      conversations: 0, // unlimited
    },
  },
};

// Helper functions
export const getPlanById = (planId: string): MockPlan | undefined => {
  return mockPlans.find(plan => plan.id === planId);
};

export const getSubscriptionByUserId = (userId: string): MockSubscription | undefined => {
  return mockSubscriptions[userId];
};

export const getUsageByUserId = (userId: string) => {
  return mockUsageData[userId as keyof typeof mockUsageData] || mockUsageData['1'];
};

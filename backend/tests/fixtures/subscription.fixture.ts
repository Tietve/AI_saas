import { faker } from '@faker-js/faker';

export interface SubscriptionFixtureOptions {
  userId?: string;
  planTier?: 'FREE' | 'PLUS' | 'PRO';
  status?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Creates a subscription fixture with realistic data
 * @param userId - The user who owns the subscription
 * @param overrides - Optional overrides for subscription properties
 * @returns Subscription data ready for database insertion
 */
export function createSubscriptionFixture(
  userId: string,
  overrides: SubscriptionFixtureOptions = {}
) {
  const planTier = overrides.planTier || 'PLUS';
  const periodStart = faker.date.past({ years: 0.5 });
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    id: faker.string.uuid(),
    userId,
    stripeSubscriptionId: overrides.stripeSubscriptionId || `sub_${faker.string.alphanumeric(24)}`,
    stripeCustomerId: overrides.stripeCustomerId || `cus_${faker.string.alphanumeric(24)}`,
    planTier,
    status: overrides.status || 'ACTIVE',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: overrides.cancelAtPeriodEnd ?? false,
    canceledAt: null,
    createdAt: periodStart,
    updatedAt: new Date()
  };
}

/**
 * Creates an active subscription fixture (convenience function)
 */
export function createActiveSubscriptionFixture(
  userId: string,
  overrides: SubscriptionFixtureOptions = {}
) {
  return createSubscriptionFixture(userId, { ...overrides, status: 'ACTIVE' });
}

/**
 * Creates a canceled subscription fixture (convenience function)
 */
export function createCanceledSubscriptionFixture(
  userId: string,
  overrides: SubscriptionFixtureOptions = {}
) {
  return createSubscriptionFixture(userId, {
    ...overrides,
    status: 'CANCELED',
    canceledAt: faker.date.recent({ days: 30 })
  });
}

/**
 * Creates a trialing subscription fixture (convenience function)
 */
export function createTrialingSubscriptionFixture(
  userId: string,
  overrides: SubscriptionFixtureOptions = {}
) {
  return createSubscriptionFixture(userId, { ...overrides, status: 'TRIALING' });
}

/**
 * Creates a PRO subscription fixture (convenience function)
 */
export function createProSubscriptionFixture(
  userId: string,
  overrides: SubscriptionFixtureOptions = {}
) {
  return createSubscriptionFixture(userId, { ...overrides, planTier: 'PRO' });
}

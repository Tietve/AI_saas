import { faker } from '@faker-js/faker';

export interface PaymentFixtureOptions {
  userId?: string;
  planTier?: 'FREE' | 'PLUS' | 'PRO';
  amount?: number;
  currency?: string;
  status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  stripePaymentId?: string;
  stripeInvoiceId?: string;
  description?: string;
}

/**
 * Creates a payment fixture with realistic data
 * @param userId - The user who made the payment
 * @param overrides - Optional overrides for payment properties
 * @returns Payment data ready for database insertion
 */
export function createPaymentFixture(
  userId: string,
  overrides: PaymentFixtureOptions = {}
) {
  const planTier = overrides.planTier || 'PLUS';
  const defaultAmount = planTier === 'PRO' ? 1999 : 999; // in cents

  return {
    id: faker.string.uuid(),
    userId,
    stripePaymentId: overrides.stripePaymentId || `pi_${faker.string.alphanumeric(24)}`,
    stripeInvoiceId: overrides.stripeInvoiceId || `in_${faker.string.alphanumeric(24)}`,
    amount: overrides.amount ?? defaultAmount,
    currency: overrides.currency || 'usd',
    status: overrides.status || 'SUCCEEDED',
    planTier,
    description: overrides.description || `${planTier} Plan - Monthly Subscription`,
    failureMessage: overrides.status === 'FAILED' ? 'Card declined' : null,
    paidAt: overrides.status === 'SUCCEEDED' ? faker.date.past({ years: 0.5 }) : null,
    createdAt: faker.date.past({ years: 0.5 })
  };
}

/**
 * Creates a successful payment fixture (convenience function)
 */
export function createSuccessfulPaymentFixture(
  userId: string,
  overrides: PaymentFixtureOptions = {}
) {
  return createPaymentFixture(userId, { ...overrides, status: 'SUCCEEDED' });
}

/**
 * Creates a failed payment fixture (convenience function)
 */
export function createFailedPaymentFixture(
  userId: string,
  overrides: PaymentFixtureOptions = {}
) {
  return createPaymentFixture(userId, {
    ...overrides,
    status: 'FAILED',
    failureMessage: 'Card declined'
  });
}

/**
 * Creates a pending payment fixture (convenience function)
 */
export function createPendingPaymentFixture(
  userId: string,
  overrides: PaymentFixtureOptions = {}
) {
  return createPaymentFixture(userId, { ...overrides, status: 'PENDING' });
}

/**
 * Creates a PRO plan payment fixture (convenience function)
 */
export function createProPaymentFixture(
  userId: string,
  overrides: PaymentFixtureOptions = {}
) {
  return createPaymentFixture(userId, { ...overrides, planTier: 'PRO', amount: 1999 });
}

/**
 * Creates multiple payment fixtures (payment history)
 * @param userId - The user who made the payments
 * @param count - Number of payments to create
 * @param overrides - Optional overrides applied to all payments
 * @returns Array of payment data
 */
export function createPaymentHistoryFixture(
  userId: string,
  count: number,
  overrides: PaymentFixtureOptions = {}
) {
  const payments = [];
  for (let i = 0; i < count; i++) {
    payments.push(createPaymentFixture(userId, overrides));
  }
  return payments;
}

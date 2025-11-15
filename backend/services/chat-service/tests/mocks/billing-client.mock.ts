/**
 * Billing Client Service Mock
 */

export const mockBillingClient = {
  checkQuota: jest.fn(),
  canUseTokens: jest.fn(),
};

// Default successful quota check
mockBillingClient.checkQuota.mockResolvedValue({
  userId: 'test-user-id',
  planTier: 'PRO',
  monthlyQuota: 100000,
  monthlyUsed: 5000,
  percentageUsed: 5,
  remaining: 95000,
});

// Default allow tokens
mockBillingClient.canUseTokens.mockResolvedValue({
  allowed: true,
  usage: {
    userId: 'test-user-id',
    planTier: 'PRO',
    monthlyQuota: 100000,
    monthlyUsed: 5000,
    percentageUsed: 5,
    remaining: 95000,
  },
});

export const resetBillingClientMocks = () => {
  mockBillingClient.checkQuota.mockReset();
  mockBillingClient.canUseTokens.mockReset();

  // Reset to defaults
  mockBillingClient.checkQuota.mockResolvedValue({
    userId: 'test-user-id',
    planTier: 'PRO',
    monthlyQuota: 100000,
    monthlyUsed: 5000,
    percentageUsed: 5,
    remaining: 95000,
  });

  mockBillingClient.canUseTokens.mockResolvedValue({
    allowed: true,
    usage: {
      userId: 'test-user-id',
      planTier: 'PRO',
      monthlyQuota: 100000,
      monthlyUsed: 5000,
      percentageUsed: 5,
      remaining: 95000,
    },
  });
};

jest.mock('../../src/services/billing-client.service', () => ({
  billingClientService: mockBillingClient,
  BillingClientService: jest.fn().mockImplementation(() => mockBillingClient),
}));

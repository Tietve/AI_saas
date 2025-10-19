/**
 * Integration tests for the Payment API routes.
 */

import 'reflect-metadata';
import { POST as paymentCreateHandler } from '@/app/api/payment/create/route';
import { prisma } from '@/lib/prisma';
import { initializeDependencyInjection } from '@/lib/di/container';
import { requireUserId } from '@/lib/auth/session';
import { PayOS } from '@payos/node';

// Mock the session utility
jest.mock('@/lib/auth/session', () => ({
  requireUserId: jest.fn(),
}));

// Mock the PayOS client
jest.mock('@payos/node');

const MOCK_USER_ID = 'test_user_123';
const MOCK_CHECKOUT_URL = 'https://pay.os/mock-checkout-url';
const MOCK_PAYMENT_LINK_ID = 'mock-payment-link-id';

// Initialize DI container before tests
beforeAll(() => {
  initializeDependencyInjection();
});

// Clean up database after each test
afterEach(async () => {
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
});

// Reset mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});

describe.skip('Payment Integration Tests', () => {
  
  beforeEach(async () => {
    // Create a mock user for each test
    await prisma.user.create({
      data: {
        id: MOCK_USER_ID,
        email: 'test@example.com',
        emailLower: 'test@example.com',
        passwordHash: 'hashed_password',
      },
    });

    // Mock the authenticated user ID
    (requireUserId as jest.Mock).mockResolvedValue(MOCK_USER_ID);

    // Mock the PayOS API response
    const mockPayOSCreate = jest.fn().mockResolvedValue({
        checkoutUrl: MOCK_CHECKOUT_URL,
        paymentLinkId: MOCK_PAYMENT_LINK_ID,
        qrCode: 'mock_qr_code',
        orderCode: expect.any(Number),
    });
    (PayOS as any).mockImplementation(() => ({
        paymentRequests: {
            create: mockPayOSCreate,
        },
    }));
  });

  describe('POST /api/payment/create', () => {
    it('should create a new payment link for a user without an active subscription', async () => {
      const mockRequest = {
        json: async () => ({}), // No body needed for this request
      } as any;

      const response = await paymentCreateHandler(mockRequest);
      const data = await response.json();

      // 1. Assert the response is successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.checkoutUrl).toBe(MOCK_CHECKOUT_URL);

      // 2. Verify a payment record was created in the database
      const payment = await prisma.payment.findFirst({
        where: {
          userId: MOCK_USER_ID,
        },
      });
      expect(payment).not.toBeNull();
      expect(payment?.status).toBe('PENDING');
      expect(payment?.amount).toBe(279000);
      expect(payment?.payosCheckoutUrl).toBe(MOCK_CHECKOUT_URL);
      expect(payment?.payosPaymentId).toBe(MOCK_PAYMENT_LINK_ID);
    });

    it('should return 400 if the user already has an active PLUS subscription', async () => {
        // Setup: Give the user an active subscription
        await prisma.subscription.create({
            data: {
                userId: MOCK_USER_ID,
                planTier: 'PLUS',
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            }
        });
        
        const mockRequest = {
            json: async () => ({}),
        } as any;

        const response = await paymentCreateHandler(mockRequest);
        const data = await response.json();

        // Assert the response is a 400 Bad Request
        expect(response.status).toBe(400);
        expect(data.error).toBe('Bạn đã có gói Plus đang hoạt động');

        // Verify no new payment was created
        const paymentCount = await prisma.payment.count({
            where: { userId: MOCK_USER_ID }
        });
        expect(paymentCount).toBe(0);
    });
  });
});

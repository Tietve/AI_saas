import { PrismaClient, PlanTier, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export class PaymentRepository {
  /**
   * Create payment record
   */
  async create(data: {
    userId: string;
    stripePaymentId?: string;
    stripeInvoiceId?: string;
    amount: number;
    currency?: string;
    planTier: PlanTier;
    description?: string;
    status?: PaymentStatus;
  }) {
    return await prisma.payments.create({
      data: {
        ...data,
        id: randomUUID(),
        currency: data.currency || 'usd',
        status: data.status || 'PENDING'
      }
    });
  }

  /**
   * Get payment by Stripe payment ID
   */
  async getByStripePaymentId(stripePaymentId: string) {
    return await prisma.payments.findUnique({
      where: { stripePaymentId }
    });
  }

  /**
   * Update payment status
   */
  async updateStatus(id: string, status: PaymentStatus, paidAt?: Date, failureMessage?: string) {
    return await prisma.payments.update({
      where: { id },
      data: {
        status,
        paidAt,
        failureMessage
      }
    });
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId: string, limit: number = 10) {
    return await prisma.payments.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get successful payments count
   */
  async getSuccessfulPaymentsCount(userId: string) {
    return await prisma.payments.count({
      where: {
        userId,
        status: 'SUCCEEDED'
      }
    });
  }
}

export const paymentRepository = new PaymentRepository();

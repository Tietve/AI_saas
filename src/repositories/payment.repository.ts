import { prisma } from '@/lib/prisma';
import { Payment, Subscription, User } from '@prisma/client';
import { injectable } from 'tsyringe';

@injectable()
export class PaymentRepository {

    async findUserWithActiveSubscription(userId: string, planTier: 'PLUS'): Promise<(User & { subscriptions: Subscription[] }) | null> {
        return prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: {
                        planTier: planTier,
                        status: 'ACTIVE',
                        currentPeriodEnd: { gte: new Date() },
                    },
                },
            },
        });
    }

    async createPayment(data: {
        userId: string;
        amount: number;
        currency: string;
        status: 'PENDING';
        payosOrderCode: number;
        payosPaymentId: string;
        payosCheckoutUrl: string;
        description: string;
        metadata: any;
    }): Promise<Payment> {
        return prisma.payment.create({ data });
    }

    async findPayment(where: any): Promise<Payment | null> {
        return prisma.payment.findFirst({ where });
    }

    async updatePaymentStatus(paymentId: string, status: 'SUCCESS' | 'FAILED', paidAt: Date): Promise<Payment> {
        return prisma.payment.update({
            where: { id: paymentId },
            data: { status, paidAt },
        });
    }

    async findActiveSubscription(userId: string): Promise<Subscription | null> {
        return prisma.subscription.findFirst({
            where: {
                userId: userId,
                status: 'ACTIVE',
            },
        });
    }

    async updateSubscription(subscriptionId: string, data: { planTier: 'PLUS', currentPeriodEnd: Date }): Promise<Subscription> {
        return prisma.subscription.update({
            where: { id: subscriptionId },
            data: { ...data, updatedAt: new Date() },
        });
    }

    async createSubscription(data: {
        userId: string;
        planTier: 'PLUS';
        status: 'ACTIVE';
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
    }): Promise<Subscription> {
        return prisma.subscription.create({ data });
    }

    async updateUserPlan(userId: string, planTier: 'PLUS'): Promise<User> {
        return prisma.user.update({
            where: { id: userId },
            data: { planTier },
        });
    }
}

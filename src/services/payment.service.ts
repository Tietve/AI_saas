import { injectable, inject } from 'tsyringe';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PayOS } from '@payos/node';
import { AppError } from '@/lib/errors/AppError';

@injectable()
export class PaymentService {
    private payos: PayOS;

    constructor(
        @inject(PaymentRepository) private paymentRepository: PaymentRepository
    ) {
        const clientId = process.env.PAYOS_CLIENT_ID;
        const apiKey = process.env.PAYOS_API_KEY;
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

        if (!clientId || !apiKey || !checksumKey) {
            throw new Error('PayOS credentials not configured.');
        }

        this.payos = new PayOS({ clientId, apiKey, checksumKey });
    }

    public async createPlusSubscriptionLink(userId: string) {
        const user = await this.paymentRepository.findUserWithActiveSubscription(userId, 'PLUS');

        if (!user) {
            throw new AppError('Không tìm thấy người dùng', 404);
        }

        if (user.subscriptions.length > 0) {
            throw new AppError('Bạn đã có gói Plus đang hoạt động', 400);
        }

        const orderCode = Number(String(Date.now()).slice(-9));
        const amount = 279000;
        const description = 'Nâng cấp gói Plus - AI Chat';
        const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`;
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`;

        const paymentData = {
            orderCode,
            amount,
            description,
            items: [{
                name: 'Gói Plus - AI Chat (1 tháng)',
                quantity: 1,
                price: amount,
            }],
            cancelUrl,
            returnUrl,
        };

        try {
            const paymentLinkResponse = await this.payos.paymentRequests.create(paymentData);

            const payment = await this.paymentRepository.createPayment({
                userId: userId,
                amount: amount,
                currency: 'VND',
                status: 'PENDING',
                payosOrderCode: orderCode,
                payosPaymentId: paymentLinkResponse.paymentLinkId,
                payosCheckoutUrl: paymentLinkResponse.checkoutUrl,
                description: description,
                metadata: {
                    qrCode: paymentLinkResponse.qrCode,
                    items: paymentData.items,
                },
            });

            return {
                paymentId: payment.id,
                checkoutUrl: paymentLinkResponse.checkoutUrl,
                qrCode: paymentLinkResponse.qrCode,
                orderCode: orderCode,
                amount: amount,
            };
        } catch (error: any) {
            console.error('[PaymentService] Error creating payment:', error);
            if (error.response?.data) {
                throw new AppError('Lỗi từ PayOS', 400, error.response.data);
            }
            throw new AppError('Không thể tạo link thanh toán', 500);
        }
    }
    
    public async checkPaymentStatus(userId: string, paymentId?: string, orderCode?: string) {
        const payment = await this.paymentRepository.findPayment({
            userId: userId,
            OR: [
                { id: paymentId || undefined },
                { payosOrderCode: orderCode ? Number(orderCode) : undefined },
            ],
        });

        if (!payment) {
            throw new AppError('Không tìm thấy thông tin thanh toán', 404);
        }

        if (payment.status === 'SUCCESS') {
            return { status: payment.status, paidAt: payment.paidAt, amount: payment.amount };
        }

        if (payment.payosOrderCode) {
            try {
                const payosInfo = await this.payos.paymentRequests.get(payment.payosOrderCode);

                if (payosInfo.status === 'PAID' && payment.status === 'PENDING') {
                    const updatedPayment = await this.paymentRepository.updatePaymentStatus(payment.id, 'SUCCESS', new Date());
                    await this.createOrUpdateSubscription(userId);
                    return { status: updatedPayment.status, paidAt: updatedPayment.paidAt, amount: updatedPayment.amount };
                }
                return { status: payosInfo.status, paymentStatus: payment.status, amount: payment.amount };

            } catch (error) {
                console.error('[PaymentService] Error checking PayOS status:', error);
                // Do not throw, just return the current DB status if PayOS check fails
            }
        }

        return { status: payment.status, amount: payment.amount };
    }

    private async createOrUpdateSubscription(userId: string) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

        const existingSubscription = await this.paymentRepository.findActiveSubscription(userId);

        if (existingSubscription) {
            await this.paymentRepository.updateSubscription(existingSubscription.id, {
                planTier: 'PLUS',
                currentPeriodEnd: endDate,
            });
        } else {
            await this.paymentRepository.createSubscription({
                userId: userId,
                planTier: 'PLUS',
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: endDate,
            });
        }

        await this.paymentRepository.updateUserPlan(userId, 'PLUS');
    }
}

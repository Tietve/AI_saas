import { NextRequest, NextResponse } from 'next/server';
import { injectable, inject } from 'tsyringe';
import { PaymentService } from '@/services/payment.service';
import { requireUserId } from '@/lib/auth/session';
import { AppError } from '@/lib/errors/AppError';

function handleApiError(error: any): NextResponse {
    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message, details: error.details },
            { status: error.statusCode }
        );
    }
    console.error('[Controller] Unknown error:', error);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
    );
}

@injectable()
export class PaymentController {
    constructor(
        @inject(PaymentService) private paymentService: PaymentService
    ) {}

    public async createPaymentLink(req: NextRequest): Promise<NextResponse> {
        try {
            const userId = await requireUserId();
            const result = await this.paymentService.createPlusSubscriptionLink(userId);
            return NextResponse.json({ success: true, data: result });
        } catch (error) {
            return handleApiError(error);
        }
    }

    public async checkPaymentStatus(req: NextRequest): Promise<NextResponse> {
        try {
            const userId = await requireUserId();
            const { searchParams } = new URL(req.url);
            const paymentId = searchParams.get('paymentId') || undefined;
            const orderCode = searchParams.get('orderCode') || undefined;

            if (!paymentId && !orderCode) {
                throw new AppError('Thiếu paymentId hoặc orderCode', 400);
            }

            const result = await this.paymentService.checkPaymentStatus(userId, paymentId, orderCode);
            return NextResponse.json({ success: true, data: result });
        } catch (error) {
            return handleApiError(error);
        }
    }
}

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create payment link for Plus subscription
 *     description: Creates a PayOS payment link to upgrade to Plus plan (279k VND/month)
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     checkoutUrl:
 *                       type: string
 *                     qrCode:
 *                       type: string
 *                     orderCode:
 *                       type: number
 *                     amount:
 *                       type: number
 *                       example: 279000
 *       400:
 *         description: User already has active Plus subscription or PayOS error
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to create payment link
 *   get:
 *     tags:
 *       - Payment
 *     summary: Check payment status
 *     description: Checks the status of a payment and updates subscription if paid
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - name: paymentId
 *         in: query
 *         description: Payment ID
 *         schema:
 *           type: string
 *       - name: orderCode
 *         in: query
 *         description: PayOS order code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [PENDING, SUCCESS, FAILED, PAID]
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                     amount:
 *                       type: number
 *       400:
 *         description: Missing paymentId or orderCode
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Error checking payment status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'
import { PayOS } from '@payos/node'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'

// Lazy-load PayOS client (only initialize when needed at runtime)
let payosInstance: PayOS | null = null

function getPayOSClient(): PayOS {
    if (!payosInstance) {
        const clientId = process.env.PAYOS_CLIENT_ID
        const apiKey = process.env.PAYOS_API_KEY
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY

        if (!clientId || !apiKey || !checksumKey) {
            throw new Error(
                'PayOS credentials not configured. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY environment variables.'
            )
        }

        payosInstance = new PayOS({
            clientId,
            apiKey,
            checksumKey
        })
    }
    return payosInstance
}

export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        currentPeriodEnd: { gte: new Date() }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            )
        }

        // Check if user already has an active PLUS subscription
        if (user.subscriptions.length > 0 && user.subscriptions[0].planTier === 'PLUS') {
            return NextResponse.json(
                { error: 'Bạn đã có gói Plus đang hoạt động' },
                { status: 400 }
            )
        }

        // Generate unique order code
        const orderCode = Number(String(Date.now()).slice(-9))

        // Payment details
        const amount = 279000 // 279k VND
        const description = 'Nâng cấp gói Plus - AI Chat'
        const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`

        // Create payment link
        const paymentData = {
            orderCode: orderCode,
            amount: amount,
            description: description,
            items: [
                {
                    name: 'Gói Plus - AI Chat (1 tháng)',
                    quantity: 1,
                    price: amount
                }
            ],
            cancelUrl: cancelUrl,
            returnUrl: returnUrl
        }

        console.log('[Payment] Creating PayOS payment link:', paymentData)

        // Call PayOS API (lazy-loaded)
        const payos = getPayOSClient()
        const paymentLinkResponse = await payos.paymentRequests.create(paymentData)

        console.log('[Payment] PayOS response:', paymentLinkResponse)

        // Save payment to database
        const payment = await prisma.payment.create({
            data: {
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
                    items: paymentData.items
                }
            }
        })

        console.log('[Payment] Saved to DB:', payment.id)

        // Return checkout URL
        return NextResponse.json({
            success: true,
            data: {
                paymentId: payment.id,
                checkoutUrl: paymentLinkResponse.checkoutUrl,
                qrCode: paymentLinkResponse.qrCode,
                orderCode: orderCode,
                amount: amount
            }
        })

    } catch (error: any) {
        console.error('[Payment] Error creating payment:', error)

        // Handle PayOS API errors
        if (error.response?.data) {
            return NextResponse.json(
                {
                    error: 'Lỗi từ PayOS',
                    details: error.response.data
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Không thể tạo link thanh toán' },
            { status: 500 }
        )
    }
}

// GET /api/payment/create - Check payment status
export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const { searchParams } = new URL(req.url)
        const paymentId = searchParams.get('paymentId')
        const orderCode = searchParams.get('orderCode')

        if (!paymentId && !orderCode) {
            return NextResponse.json(
                { error: 'Thiếu paymentId hoặc orderCode' },
                { status: 400 }
            )
        }

        // Find payment in database
        const payment = await prisma.payment.findFirst({
            where: {
                userId: userId,
                OR: [
                    { id: paymentId || undefined },
                    { payosOrderCode: orderCode ? Number(orderCode) : undefined }
                ]
            }
        })

        if (!payment) {
            return NextResponse.json(
                { error: 'Không tìm thấy thông tin thanh toán' },
                { status: 404 }
            )
        }

        // If already successful, return immediately
        if (payment.status === 'SUCCESS') {
            return NextResponse.json({
                success: true,
                data: {
                    status: payment.status,
                    paidAt: payment.paidAt,
                    amount: payment.amount
                }
            })
        }

        // Check with PayOS
        if (payment.payosOrderCode) {
            try {
                const payos = getPayOSClient()
                const payosInfo = await payos.paymentRequests.get(payment.payosOrderCode)

                // Update payment status if paid
                if (payosInfo.status === 'PAID' && payment.status === 'PENDING') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'SUCCESS',
                            paidAt: new Date()
                        }
                    })

                    // Create or update subscription
                    await createOrUpdateSubscription(userId)
                }

                return NextResponse.json({
                    success: true,
                    data: {
                        status: payosInfo.status,
                        paymentStatus: payment.status,
                        amount: payment.amount
                    }
                })
            } catch (error) {
                console.error('[Payment] Error checking PayOS status:', error)
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                status: payment.status,
                amount: payment.amount
            }
        })

    } catch (error) {
        console.error('[Payment] Error checking payment status:', error)
        return NextResponse.json(
            { error: 'Lỗi kiểm tra trạng thái thanh toán' },
            { status: 500 }
        )
    }
}

// Helper function to create or update subscription
async function createOrUpdateSubscription(userId: string) {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1) // Add 1 month

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
        where: {
            userId: userId,
            status: 'ACTIVE'
        }
    })

    if (existingSubscription) {
        // Update existing subscription
        await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
                planTier: 'PLUS',
                currentPeriodEnd: endDate,
                updatedAt: now
            }
        })
    } else {
        // Create new subscription
        await prisma.subscription.create({
            data: {
                userId: userId,
                planTier: 'PLUS',
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: endDate
            }
        })
    }

    // Update user's plan tier
    await prisma.user.update({
        where: { id: userId },
        data: { planTier: 'PLUS' }
    })
}

// src/app/api/webhook/payos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import PayOS from '@payos/node'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Khởi tạo PayOS client
const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID!,
    process.env.PAYOS_API_KEY!,
    process.env.PAYOS_CHECKSUM_KEY!
)

// Verify webhook signature từ PayOS
function verifyWebhookData(data: any, signature: string): boolean {
    try {
        // PayOS sử dụng HMAC SHA256 để sign webhook data
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY!
        const signData = JSON.stringify(data)

        const hmac = crypto.createHmac('sha256', checksumKey)
        hmac.update(signData)
        const computedSignature = hmac.digest('hex')

        return computedSignature === signature
    } catch (error) {
        console.error('[Webhook] Error verifying signature:', error)
        return false
    }
}

export async function POST(req: NextRequest) {
    try {
        // Lấy signature từ header
        const signature = req.headers.get('x-payos-signature') || ''

        // Parse body
        const body = await req.json()

        console.log('[Webhook] Received PayOS webhook:', {
            code: body.code,
            desc: body.desc,
            data: body.data
        })

        // Verify signature (tạm comment nếu test)
        // if (!verifyWebhookData(body.data, signature)) {
        //   console.error('[Webhook] Invalid signature')
        //   return NextResponse.json(
        //     { error: 'Invalid signature' },
        //     { status: 401 }
        //   )
        // }

        // Kiểm tra webhook event đã được xử lý chưa (idempotency)
        const webhookId = body.data?.paymentLinkId || `webhook_${Date.now()}`

        const existingEvent = await prisma.webhookEvent.findUnique({
            where: { externalId: webhookId }
        })

        if (existingEvent?.status === 'PROCESSED') {
            console.log('[Webhook] Already processed:', webhookId)
            return NextResponse.json({
                code: '00',
                desc: 'Already processed'
            })
        }

        // Lưu webhook event
        const webhookEvent = await prisma.webhookEvent.upsert({
            where: { externalId: webhookId },
            update: {
                attempts: { increment: 1 },
                rawPayload: body
            },
            create: {
                externalId: webhookId,
                eventType: body.desc || 'payment.webhook',
                source: 'payos',
                status: 'PENDING',
                rawPayload: body
            }
        })

        // Xử lý webhook theo status
        if (body.code === '00' && body.desc === 'success') {
            // Thanh toán thành công
            await handlePaymentSuccess(body.data, webhookEvent.id)
        } else if (body.code === '01' || body.desc === 'failed') {
            // Thanh toán thất bại
            await handlePaymentFailed(body.data, webhookEvent.id)
        } else if (body.desc === 'cancelled') {
            // Thanh toán bị hủy
            await handlePaymentCancelled(body.data, webhookEvent.id)
        }

        // Trả về response cho PayOS
        return NextResponse.json({
            code: '00',
            desc: 'success'
        })

    } catch (error: any) {
        console.error('[Webhook] Error processing:', error)

        return NextResponse.json(
            {
                code: '99',
                desc: 'Internal error',
                error: error.message
            },
            { status: 500 }
        )
    }
}

// Xử lý thanh toán thành công
async function handlePaymentSuccess(data: any, webhookEventId: string) {
    try {
        console.log('[Webhook] Processing payment success:', data)

        const orderCode = data.orderCode
        const amount = data.amount
        const paymentId = data.paymentLinkId

        // Tìm payment record
        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { payosOrderCode: Number(orderCode) },
                    { payosPaymentId: paymentId }
                ]
            }
        })

        if (!payment) {
            console.error('[Webhook] Payment not found:', orderCode)
            throw new Error('Payment not found')
        }

        // Kiểm tra amount có khớp không
        if (payment.amount !== amount) {
            console.error('[Webhook] Amount mismatch:', {
                expected: payment.amount,
                received: amount
            })
            throw new Error('Amount mismatch')
        }

        // Transaction để update payment và tạo subscription
        await prisma.$transaction(async (tx) => {
            // 1. Update payment status
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'SUCCESS',
                    paidAt: new Date(),
                    metadata: {
                        ...((payment.metadata as any) || {}),
                        webhookData: data
                    }
                }
            })

            // 2. Tạo hoặc update subscription
            const now = new Date()
            const endDate = new Date(now)
            endDate.setMonth(endDate.getMonth() + 1) // Plus 1 tháng

            // Check existing subscription
            const existingSubscription = await tx.subscription.findFirst({
                where: {
                    userId: payment.userId,
                    status: 'ACTIVE'
                }
            })

            if (existingSubscription) {
                // Extend existing subscription
                let newEndDate = new Date(existingSubscription.currentPeriodEnd)

                // Nếu subscription đã hết hạn, tính từ bây giờ
                if (newEndDate < now) {
                    newEndDate = endDate
                } else {
                    // Còn hạn thì cộng thêm 1 tháng
                    newEndDate.setMonth(newEndDate.getMonth() + 1)
                }

                await tx.subscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                        planTier: 'PLUS',
                        currentPeriodEnd: newEndDate,
                        status: 'ACTIVE',
                        payosSubscriptionId: paymentId
                    }
                })
            } else {
                // Create new subscription
                await tx.subscription.create({
                    data: {
                        userId: payment.userId,
                        planTier: 'PLUS',
                        status: 'ACTIVE',
                        currentPeriodStart: now,
                        currentPeriodEnd: endDate,
                        payosSubscriptionId: paymentId
                    }
                })
            }

            // 3. Update user plan tier
            await tx.user.update({
                where: { id: payment.userId },
                data: {
                    planTier: 'PLUS',
                    monthlyTokenUsed: 0 // Reset token usage
                }
            })

            // 4. Tạo invoice record
            await tx.invoice.create({
                data: {
                    userId: payment.userId,
                    invoiceNumber: `INV${orderCode}`,
                    amount: amount,
                    currency: 'VND',
                    status: 'PAID',
                    paidDate: new Date(),
                    metadata: {
                        payosOrderCode: orderCode,
                        payosPaymentId: paymentId,
                        plan: 'PLUS'
                    }
                }
            })

            // 5. Update webhook event status
            await tx.webhookEvent.update({
                where: { id: webhookEventId },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date()
                }
            })
        })

        console.log('[Webhook] Payment success processed:', payment.id)

        // TODO: Gửi email xác nhận cho user
        // await sendPaymentConfirmationEmail(payment.userId)

    } catch (error) {
        console.error('[Webhook] Error handling payment success:', error)

        // Mark webhook as failed
        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
        })

        throw error
    }
}

// Xử lý thanh toán thất bại
async function handlePaymentFailed(data: any, webhookEventId: string) {
    try {
        console.log('[Webhook] Processing payment failed:', data)

        const orderCode = data.orderCode
        const paymentId = data.paymentLinkId

        // Update payment status
        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { payosOrderCode: Number(orderCode) },
                    { payosPaymentId: paymentId }
                ]
            }
        })

        if (payment) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    metadata: {
                        ...((payment.metadata as any) || {}),
                        failedReason: data.reason || 'Unknown',
                        webhookData: data
                    }
                }
            })
        }

        // Update webhook event
        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                status: 'PROCESSED',
                processedAt: new Date()
            }
        })

        console.log('[Webhook] Payment failed processed:', payment?.id)

    } catch (error) {
        console.error('[Webhook] Error handling payment failed:', error)

        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
        })
    }
}

// Xử lý thanh toán bị hủy
async function handlePaymentCancelled(data: any, webhookEventId: string) {
    try {
        console.log('[Webhook] Processing payment cancelled:', data)

        const orderCode = data.orderCode
        const paymentId = data.paymentLinkId

        // Update payment status
        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { payosOrderCode: Number(orderCode) },
                    { payosPaymentId: paymentId }
                ]
            }
        })

        if (payment) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'CANCELLED',
                    metadata: {
                        ...((payment.metadata as any) || {}),
                        cancelledAt: new Date(),
                        webhookData: data
                    }
                }
            })
        }

        // Update webhook event
        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                status: 'PROCESSED',
                processedAt: new Date()
            }
        })

        console.log('[Webhook] Payment cancelled processed:', payment?.id)

    } catch (error) {
        console.error('[Webhook] Error handling payment cancelled:', error)

        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
        })
    }
}

// GET method để test webhook endpoint
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'PayOS webhook endpoint is running',
        timestamp: new Date().toISOString()
    })
}
// src/app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

// CÁCH 1: Import với require (cho CommonJS module)


// Khởi tạo PayOS client
const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID!,
    process.env.PAYOS_API_KEY!,
    process.env.PAYOS_CHECKSUM_KEY!
)

// HOẶC CÁCH 2: Nếu vẫn lỗi, thử cách này
// import PayOSLib from '@payos/node'
// const PayOS = PayOSLib.default || PayOSLib
// const payos = new PayOS(...)

export async function POST(req: NextRequest) {
    try {
        // Lấy userId từ session
        const userId = await requireUserId()
        const PayOS = (await import('@payos/node')).default || (await import('@payos/node'))

        // Khởi tạo PayOS client
        const payos = new PayOS(
            process.env.PAYOS_CLIENT_ID!,
            process.env.PAYOS_API_KEY!,
            process.env.PAYOS_CHECKSUM_KEY!
        )
        // Kiểm tra user
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

        // Kiểm tra nếu đã có gói PLUS active
        if (user.subscriptions.length > 0 && user.subscriptions[0].planTier === 'PLUS') {
            return NextResponse.json(
                { error: 'Bạn đã có gói Plus đang hoạt động' },
                { status: 400 }
            )
        }

        // Tạo order code duy nhất (PayOS yêu cầu number <= 9007199254740991)
        const orderCode = Number(String(Date.now()).slice(-9))

        // Thông tin thanh toán
        const amount = 279000 // 279.000 VND
        const description = 'Nâng cấp gói Plus - AI Chat'
        const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`

        // Tạo payment data cho PayOS
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

        // Gọi PayOS API để tạo link thanh toán
        const paymentLinkResponse = await payos.createPaymentLink(paymentData)

        console.log('[Payment] PayOS response:', paymentLinkResponse)

        // Lưu thông tin payment vào database
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

        // Trả về thông tin cho frontend
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

        // Xử lý lỗi từ PayOS
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

// GET method để kiểm tra trạng thái payment
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

        // Tìm payment trong database
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

        // Nếu payment đã SUCCESS thì trả về luôn
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

        // Kiểm tra với PayOS
        if (payment.payosOrderCode) {
            try {
                const payosInfo = await payos.getPaymentLinkInformation(payment.payosOrderCode)

                // Cập nhật status nếu đã thanh toán thành công
                if (payosInfo.status === 'PAID' && payment.status !== 'SUCCESS') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'SUCCESS',
                            paidAt: new Date()
                        }
                    })

                    // Tạo hoặc cập nhật subscription
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

// Helper function để tạo/update subscription
async function createOrUpdateSubscription(userId: string) {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1) // Plus 1 tháng

    // Tìm subscription hiện tại
    const existingSubscription = await prisma.subscription.findFirst({
        where: {
            userId: userId,
            status: 'ACTIVE'
        }
    })

    if (existingSubscription) {
        // Update existing
        await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
                planTier: 'PLUS',
                currentPeriodEnd: endDate,
                updatedAt: now
            }
        })
    } else {
        // Create new
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

    // Update user's planTier
    await prisma.user.update({
        where: { id: userId },
        data: { planTier: 'PLUS' }
    })
}
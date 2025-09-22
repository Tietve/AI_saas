
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'





const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID!,
    process.env.PAYOS_API_KEY!,
    process.env.PAYOS_CHECKSUM_KEY!
)






export async function POST(req: NextRequest) {
    try {
        
        const userId = await requireUserId()
        const PayOS = (await import('@payos/node')).default || (await import('@payos/node'))

        
        const payos = new PayOS(
            process.env.PAYOS_CLIENT_ID!,
            process.env.PAYOS_API_KEY!,
            process.env.PAYOS_CHECKSUM_KEY!
        )
        
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

        
        if (user.subscriptions.length > 0 && user.subscriptions[0].planTier === 'PLUS') {
            return NextResponse.json(
                { error: 'Bạn đã có gói Plus đang hoạt động' },
                { status: 400 }
            )
        }

        
        const orderCode = Number(String(Date.now()).slice(-9))

        
        const amount = 279000 
        const description = 'Nâng cấp gói Plus - AI Chat'
        const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`

        
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

        
        const paymentLinkResponse = await payos.createPaymentLink(paymentData)

        console.log('[Payment] PayOS response:', paymentLinkResponse)

        
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

        
        if (payment.payosOrderCode) {
            try {
                const payosInfo = await payos.getPaymentLinkInformation(payment.payosOrderCode)

                
                if (payosInfo.status === 'PAID' && payment.status !== 'SUCCESS') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'SUCCESS',
                            paidAt: new Date()
                        }
                    })

                    
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


async function createOrUpdateSubscription(userId: string) {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1) 

    
    const existingSubscription = await prisma.subscription.findFirst({
        where: {
            userId: userId,
            status: 'ACTIVE'
        }
    })

    if (existingSubscription) {
        
        await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
                planTier: 'PLUS',
                currentPeriodEnd: endDate,
                updatedAt: now
            }
        })
    } else {
        
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

    
    await prisma.user.update({
        where: { id: userId },
        data: { planTier: 'PLUS' }
    })
}
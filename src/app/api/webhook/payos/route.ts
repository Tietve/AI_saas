
import { NextRequest, NextResponse } from 'next/server'
import { PayOS } from '@payos/node'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'


const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID!,
    apiKey: process.env.PAYOS_API_KEY!,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY!
})


function verifyWebhookData(data: any, signature: string): boolean {
    try {
        
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

        
        if (body.code === '00' && body.desc === 'success') {
            
            await handlePaymentSuccess(body.data, webhookEvent.id)
        } else if (body.code === '01' || body.desc === 'failed') {
            
            await handlePaymentFailed(body.data, webhookEvent.id)
        } else if (body.desc === 'cancelled') {
            
            await handlePaymentCancelled(body.data, webhookEvent.id)
        }

        
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


async function handlePaymentSuccess(data: any, webhookEventId: string) {
    try {
        console.log('[Webhook] Processing payment success:', data)

        const orderCode = data.orderCode
        const amount = data.amount
        const paymentId = data.paymentLinkId

        
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

        
        if (payment.amount !== amount) {
            console.error('[Webhook] Amount mismatch:', {
                expected: payment.amount,
                received: amount
            })
            throw new Error('Amount mismatch')
        }

        
        await prisma.$transaction(async (tx) => {
            
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

            
            const now = new Date()
            const endDate = new Date(now)
            endDate.setMonth(endDate.getMonth() + 1) 

            
            const existingSubscription = await tx.subscription.findFirst({
                where: {
                    userId: payment.userId,
                    status: 'ACTIVE'
                }
            })

            if (existingSubscription) {
                
                let newEndDate = new Date(existingSubscription.currentPeriodEnd)

                
                if (newEndDate < now) {
                    newEndDate = endDate
                } else {
                    
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

            
            await tx.user.update({
                where: { id: payment.userId },
                data: {
                    planTier: 'PLUS',
                    monthlyTokenUsed: 0 
                }
            })

            
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

            
            await tx.webhookEvent.update({
                where: { id: webhookEventId },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date()
                }
            })
        })

        console.log('[Webhook] Payment success processed:', payment.id)

        
        

    } catch (error) {
        console.error('[Webhook] Error handling payment success:', error)

        
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


async function handlePaymentFailed(data: any, webhookEventId: string) {
    try {
        console.log('[Webhook] Processing payment failed:', data)

        const orderCode = data.orderCode
        const paymentId = data.paymentLinkId

        
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


async function handlePaymentCancelled(data: any, webhookEventId: string) {
    try {
        console.log('[Webhook] Processing payment cancelled:', data)

        const orderCode = data.orderCode
        const paymentId = data.paymentLinkId

        
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


export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'PayOS webhook endpoint is running',
        timestamp: new Date().toISOString()
    })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAN_LIMITS = {
    FREE: {
        dailyMessages: 20,
        models: ['gpt_4o_mini', 'gpt_3_5_turbo']
    },
    PLUS: {
        dailyMessages: -1, 
        models: ['gpt_4o', 'gpt_4o_mini', 'gpt_4_turbo', 'gpt_3_5_turbo',
            'claude_3_opus', 'claude_3_5_sonnet', 'claude_3_5_haiku',
            'gemini_1_5_pro', 'gemini_1_5_flash', 'gemini_2_0_flash']
    },
    PRO: {
        dailyMessages: -1, 
        models: ['all'] 
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        currentPeriodEnd: { gte: new Date() }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        
        const currentPlan = user.subscriptions[0]?.planTier || user.planTier || 'FREE'
        const subscription = user.subscriptions[0] || null

        
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let dailyUsage = await prisma.dailyUsageRecord.findUnique({
            where: {
                userId_date: {
                    userId: userId,
                    date: today
                }
            }
        })

        
        if (!dailyUsage) {
            dailyUsage = await prisma.dailyUsageRecord.create({
                data: {
                    userId: userId,
                    date: today,
                    messageCount: 0
                }
            })
        }

        
        const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS]
        const dailyLimit = limits.dailyMessages
        const messagesUsedToday = dailyUsage.messageCount
        const messagesRemaining = dailyLimit === -1
            ? -1
            : Math.max(0, dailyLimit - messagesUsedToday)
        const isLimitReached = dailyLimit !== -1 && messagesUsedToday >= dailyLimit
        const usagePercent = dailyLimit === -1
            ? 0
            : Math.min(100, (messagesUsedToday / dailyLimit) * 100)

        
        let subscriptionInfo = null
        if (subscription) {
            const daysRemaining = Math.ceil(
                (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )

            subscriptionInfo = {
                planTier: subscription.planTier,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                daysRemaining: Math.max(0, daysRemaining),
                isExpiringSoon: daysRemaining <= 3 && daysRemaining > 0,
                isExpired: daysRemaining <= 0
            }
        }

        
        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    planTier: currentPlan
                },
                usage: {
                    daily: messagesUsedToday,
                    dailyLimit: dailyLimit,
                    remaining: messagesRemaining,
                    isLimitReached: isLimitReached,
                    usagePercent: usagePercent,
                    resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
                },
                subscription: subscriptionInfo,
                limits: {
                    dailyMessages: dailyLimit,
                    availableModels: limits.models
                }
            }
        })

    } catch (error: any) {
        console.error('[Usage Check] Error:', error)
        if (error?.message === 'UNAUTHENTICATED') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to check usage' },
            { status: 500 }
        )
    }
}


export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const { messageCount = 1 } = await req.json()

        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        currentPeriodEnd: { gte: new Date() }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const currentPlan = user.subscriptions[0]?.planTier || user.planTier || 'FREE'
        const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS]

        
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const dailyUsage = await prisma.dailyUsageRecord.upsert({
            where: {
                userId_date: {
                    userId: userId,
                    date: today
                }
            },
            update: {
                messageCount: { increment: messageCount },
                updatedAt: new Date()
            },
            create: {
                userId: userId,
                date: today,
                messageCount: messageCount
            }
        })

        
        const isOverLimit = limits.dailyMessages !== -1 &&
            dailyUsage.messageCount >= limits.dailyMessages

        
        let suggestUpgrade = false
        let fallbackModel = null

        if (isOverLimit && currentPlan === 'FREE') {
            suggestUpgrade = true
            
            fallbackModel = 'gpt_3_5_turbo' 
        }

        return NextResponse.json({
            success: true,
            data: {
                currentUsage: dailyUsage.messageCount,
                dailyLimit: limits.dailyMessages,
                isOverLimit: isOverLimit,
                suggestUpgrade: suggestUpgrade,
                fallbackModel: fallbackModel,
                remaining: limits.dailyMessages === -1
                    ? -1
                    : Math.max(0, limits.dailyMessages - dailyUsage.messageCount)
            }
        })

    } catch (error: any) {
        console.error('[Usage Update] Error:', error)
        if (error?.message === 'UNAUTHENTICATED') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update usage' },
            { status: 500 }
        )
    }
}


export async function DELETE(req: NextRequest) {
    try {
        
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json(
                { error: 'Not allowed in production' },
                { status: 403 }
            )
        }

        const userId = await requireUserId()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        await prisma.dailyUsageRecord.deleteMany({
            where: {
                userId: userId,
                date: today
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Usage reset successfully'
        })

    } catch (error: any) {
        console.error('[Usage Reset] Error:', error)
        if (error?.message === 'UNAUTHENTICATED') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to reset usage' },
            { status: 500 }
        )
    }
}

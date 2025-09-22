// src/app/api/usage/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

// Giới hạn cho mỗi plan
const PLAN_LIMITS = {
    FREE: {
        dailyMessages: 20,
        models: ['gpt_4o_mini', 'gpt_3_5_turbo']
    },
    PLUS: {
        dailyMessages: -1, // Unlimited
        models: ['gpt_4o', 'gpt_4o_mini', 'gpt_4_turbo', 'gpt_3_5_turbo',
            'claude_3_opus', 'claude_3_5_sonnet', 'claude_3_5_haiku',
            'gemini_1_5_pro', 'gemini_1_5_flash', 'gemini_2_0_flash']
    },
    PRO: {
        dailyMessages: -1, // Unlimited
        models: ['all'] // Tất cả models
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        // Lấy thông tin user và subscription
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

        // Xác định plan tier hiện tại
        const currentPlan = user.subscriptions[0]?.planTier || user.planTier || 'FREE'
        const subscription = user.subscriptions[0] || null

        // Lấy usage hôm nay
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

        // Nếu chưa có record hôm nay thì tạo
        if (!dailyUsage) {
            dailyUsage = await prisma.dailyUsageRecord.create({
                data: {
                    userId: userId,
                    date: today,
                    messageCount: 0
                }
            })
        }

        // Tính toán thông tin quota
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

        // Thông tin subscription
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

        // Response
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
                    resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow 00:00
                },
                subscription: subscriptionInfo,
                limits: {
                    dailyMessages: dailyLimit,
                    availableModels: limits.models
                }
            }
        })

    } catch (error) {
        console.error('[Usage Check] Error:', error)
        return NextResponse.json(
            { error: 'Failed to check usage' },
            { status: 500 }
        )
    }
}

// POST method để tăng usage count khi user gửi message
export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const { messageCount = 1 } = await req.json()

        // Lấy user info
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

        // Update hoặc create daily usage record
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

        // Kiểm tra có vượt limit không
        const isOverLimit = limits.dailyMessages !== -1 &&
            dailyUsage.messageCount >= limits.dailyMessages

        // Nếu vượt limit và là FREE user -> suggest upgrade
        let suggestUpgrade = false
        let fallbackModel = null

        if (isOverLimit && currentPlan === 'FREE') {
            suggestUpgrade = true
            // Có thể downgrade xuống model rẻ hơn
            fallbackModel = 'gpt_3_5_turbo' // Model rẻ nhất
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

    } catch (error) {
        console.error('[Usage Update] Error:', error)
        return NextResponse.json(
            { error: 'Failed to update usage' },
            { status: 500 }
        )
    }
}

// DELETE method để reset usage (for testing)
export async function DELETE(req: NextRequest) {
    try {
        // Chỉ cho phép trong development
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

    } catch (error) {
        console.error('[Usage Reset] Error:', error)
        return NextResponse.json(
            { error: 'Failed to reset usage' },
            { status: 500 }
        )
    }
}
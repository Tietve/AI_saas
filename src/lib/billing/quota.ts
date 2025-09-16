// lib/billing/quota.ts
import { prisma } from '@/lib/db'
import { ModelId, PlanTier } from '@prisma/client'
import { PLAN_LIMITS } from './limits'
import { calcCostUsd } from './costs'

export type CanSpendResult =
    | { ok: true; remaining: number; limit: number }
    | { ok: false; reason: 'NO_USER' | 'OVER_LIMIT' | 'PER_REQUEST_TOO_LARGE'; remaining: number; limit: number; wouldExceedBy?: number }

export async function getUserLimits(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { planTier: true } })
    if (!user) return null
    const conf = PLAN_LIMITS[user.planTier]
    return { ...conf } // { monthlyTokenLimit, perRequestMaxTokens }
}

/**
 * Kiểm tra xem có đủ hạn mức để "dự kiến chi" estimateTokens hay không.
 * - estimateTokens: tổng token (input + output dự kiến) cho request này.
 */
export async function canSpend(userId: string, estimateTokens: number): Promise<CanSpendResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { planTier: true, monthlyTokenUsed: true },
    })
    if (!user) {
        return { ok: false, reason: 'NO_USER', remaining: 0, limit: 0 }
    }
    const { monthlyTokenLimit, perRequestMaxTokens } = PLAN_LIMITS[user.planTier]

    if (estimateTokens > perRequestMaxTokens) {
        return {
            ok: false,
            reason: 'PER_REQUEST_TOO_LARGE',
            remaining: Math.max(0, monthlyTokenLimit - user.monthlyTokenUsed),
            limit: monthlyTokenLimit,
            wouldExceedBy: estimateTokens - perRequestMaxTokens,
        }
    }

    const projected = user.monthlyTokenUsed + estimateTokens
    if (projected > monthlyTokenLimit) {
        return {
            ok: false,
            reason: 'OVER_LIMIT',
            remaining: Math.max(0, monthlyTokenLimit - user.monthlyTokenUsed),
            limit: monthlyTokenLimit,
            wouldExceedBy: projected - monthlyTokenLimit,
        }
    }

    return {
        ok: true,
        remaining: monthlyTokenLimit - projected,
        limit: monthlyTokenLimit,
    }
}

/**
 * Ghi nhận usage sau khi gọi model xong.
 * - Nếu costUsd không truyền vào, sẽ tự tính theo bảng giá.
 * - Meta có thể chứa: { requestId, latencyMs, conversationId, messageId, providerRawStats, ... }
 * - "idempotency mềm": nếu meta.requestId được cung cấp, ta kiểm tra thô để tránh ghi trùng trong 1 phút gần nhất.
 */
export async function recordUsage(args: {
    userId: string
    model: ModelId
    tokensIn: number
    tokensOut: number
    costUsd?: number
    meta?: any
}) {
    const { userId, model, tokensIn, tokensOut } = args
    const costUsd = typeof args.costUsd === 'number' ? args.costUsd : calcCostUsd(model, tokensIn, tokensOut)

    const requestId: string | undefined = args?.meta?.requestId
    if (requestId) {
        const dup = await prisma.tokenUsage.findFirst({
            where: {
                userId,
                model,
                createdAt: { gte: new Date(Date.now() - 60_000) },
                meta: { path: ['requestId'], equals: requestId } as any,
            },
            select: { id: true },
        })
        if (dup) return { skipped: true, reason: 'DUPLICATE_REQUEST_ID' as const }
    }

    const totalTokens = (tokensIn || 0) + (tokensOut || 0)

    const res = await prisma.$transaction(async (tx) => {
        // 🔧 SỬA Ở ĐÂY: connect user thay vì phụ thuộc vào userId trực tiếp
        const usage = await tx.tokenUsage.create({
            data: {
                user: { connect: { id: userId } },   // <— quan trọng
                model,
                tokensIn,
                tokensOut,
                costUsd,
                meta: args.meta ?? {},
            },
        })
        const user = await tx.user.update({
            where: { id: userId },
            data: { monthlyTokenUsed: { increment: totalTokens } },
            select: { monthlyTokenUsed: true, planTier: true },
        })
        return { usage, user }
    })

    return {
        saved: true,
        tokenUsageId: res.usage.id,
        newMonthlyUsed: res.user.monthlyTokenUsed,
        plan: res.user.planTier,
        costUsd,
    }
}

/**
 * Dùng cho UI "quota bar".
 */
export async function getUsageSummary(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { monthlyTokenUsed: true, planTier: true },
    })
    if (!user) return null
    const limit = PLAN_LIMITS[user.planTier].monthlyTokenLimit
    const used = user.monthlyTokenUsed
    const remaining = Math.max(0, limit - used)
    const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
    return { used, limit, remaining, percent, plan: user.planTier as PlanTier }
}

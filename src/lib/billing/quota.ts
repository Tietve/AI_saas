
import { prisma } from '@/lib/prisma'
import { ModelId, PlanTier } from '@prisma/client'
import { PLAN_LIMITS } from './limits'
import { calcCostUsd } from './costs'
import { enhancedCache, CacheKeys, CacheTTL } from '@/lib/cache/redis-client'
import { performanceMonitor } from '@/lib/monitoring/performance'

export type CanSpendResult =
    | { ok: true; remaining: number; limit: number }
    | { ok: false; reason: 'NO_USER' | 'OVER_LIMIT' | 'PER_REQUEST_TOO_LARGE'; remaining: number; limit: number; wouldExceedBy?: number }

export async function getUserLimits(userId: string) {
    const cacheKey = CacheKeys.userLimits(userId)
    
    // Try cache first
    const cached = await enhancedCache.get(cacheKey)
    if (cached) {
        return cached
    }

    // Fallback to database
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { planTier: true } })
    if (!user) return null
    
    const conf = PLAN_LIMITS[user.planTier]
    const result = { ...conf }
    
    // Cache the result
    await enhancedCache.set(cacheKey, result, CacheTTL.USER_DATA)
    
    return result
}


export async function canSpend(userId: string, estimateTokens: number): Promise<CanSpendResult> {
    return performanceMonitor.measureDbQuery(
        'canSpend - find user by id',
        async () => {
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
    )
}


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
        
        const usage = await tx.tokenUsage.create({
            data: {
                user: { connect: { id: userId } },   
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


export async function getUsageSummary(userId: string) {
    const cacheKey = CacheKeys.usageSummary(userId)
    
    // Try cache first
    const cached = await enhancedCache.get(cacheKey)
    if (cached) {
        return cached
    }

    // Fallback to database
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { monthlyTokenUsed: true, planTier: true },
    })
    if (!user) return null
    
    const limit = PLAN_LIMITS[user.planTier].monthlyTokenLimit
    const used = user.monthlyTokenUsed
    const remaining = Math.max(0, limit - used)
    const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
    
    const result = { used, limit, remaining, percent, plan: user.planTier as PlanTier }
    
    // Cache the result (short TTL for usage data)
    await enhancedCache.set(cacheKey, result, CacheTTL.USAGE_DATA)
    
    return result
}

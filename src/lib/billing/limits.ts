// lib/billing/limits.ts
import { PlanTier } from '@prisma/client'

export type Limits = {
    monthlyTokenLimit: number
    perRequestMaxTokens: number
}

export const PLAN_LIMITS: Record<PlanTier, Limits> = {
    FREE: { monthlyTokenLimit: 50_000,  perRequestMaxTokens: 8_000 },
    PLUS: { monthlyTokenLimit: 300_000, perRequestMaxTokens: 16_000 },
    PRO:  { monthlyTokenLimit: 1_500_000, perRequestMaxTokens: 32_000 },
}

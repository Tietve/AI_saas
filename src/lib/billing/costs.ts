// lib/billing/costs.ts
import { ModelId } from '@prisma/client'

export type PricePerK = { in: number; out: number } // USD per 1K tokens

export const PRICES_PER_K: Record<ModelId, PricePerK> = {
    gpt5_thinking: { in: 0.8, out: 2.4 },
    gpt5_mini:     { in: 0.15, out: 0.6 },
    gpt4o_mini:    { in: 0.05, out: 0.2 },
}

export function calcCostUsd(model: ModelId, tokensIn: number, tokensOut: number) {
    const p = PRICES_PER_K[model]
    const cost = (tokensIn * p.in + tokensOut * p.out) / 1000
    // làm tròn 6 chữ số thập phân để ổn định
    return Math.round(cost * 1e6) / 1e6
}

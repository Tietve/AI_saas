
import { ModelId } from '@prisma/client'

export type PricePerK = { in: number; out: number } 

export const PRICES_PER_K: Record<ModelId, PricePerK> = {
    
    gpt_4_turbo: { in: 10, out: 30 },
    gpt_4o: { in: 5, out: 15 },
    gpt_4o_mini: { in: 0.15, out: 0.6 },
    gpt_3_5_turbo: { in: 0.5, out: 1.5 },
    
    
    claude_3_opus: { in: 15, out: 75 },
    claude_3_5_sonnet: { in: 3, out: 15 },
    claude_3_5_haiku: { in: 1, out: 5 },
    
    
    gemini_1_5_pro: { in: 3.5, out: 10.5 },
    gemini_1_5_flash: { in: 0.075, out: 0.3 },
    gemini_2_0_flash: { in: 0, out: 0 }, 
    

    gpt_5: { in: 10, out: 30 },
    gpt_5_mini: { in: 0.8, out: 2.4 },
    gpt_5_nano: { in: 0.15, out: 0.6 },
    gpt_4_1_nano: { in: 0.05, out: 0.2 },
}

export function calcCostUsd(model: ModelId, tokensIn: number, tokensOut: number) {
    const p = PRICES_PER_K[model]
    if (!p) {
        
        const fallback = PRICES_PER_K.gpt_4o_mini
        return (tokensIn * fallback.in + tokensOut * fallback.out) / 1000
    }
    const cost = (tokensIn * p.in + tokensOut * p.out) / 1000
    return Math.round(cost * 1e6) / 1e6
}
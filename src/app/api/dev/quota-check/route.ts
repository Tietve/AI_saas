
import { NextResponse } from 'next/server'
import { canSpend } from '@/lib/billing/quota'
import { estimateTokensFromText } from '@/lib/tokenizer/estimate'


export async function POST(req: Request) {
    try {
        const { userId, content, outputReserve = 500 } = await req.json()
        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

        const estimate = estimateTokensFromText(content || '') + Number(outputReserve)
        const check = await canSpend(userId, estimate)
        return NextResponse.json({ estimate, check })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
    }
}

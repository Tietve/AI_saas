import { NextResponse } from 'next/server'
import { recordUsage } from '@/lib/billing/quota'
import { ModelId } from '@prisma/client'

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // 1) Validate userId (bắt lỗi chưa chọn Environment trong Postman)
        const userId = String(body.userId || '')
        if (!userId || userId.includes('{{')) {
            return NextResponse.json(
                { error: 'Invalid userId. Hãy chọn Environment trong Postman (AI SaaS Local) hoặc truyền userId thật.' },
                { status: 400 }
            )
        }

        // 2) Map model string -> enum an toàn
        const modelStr = String(body.model || 'gpt5_mini') as keyof typeof ModelId
        const modelEnum = ModelId[modelStr] ?? ModelId.gpt5_mini

        // 3) Ép kiểu số an toàn (tránh NaN)
        const toNumber = (v: any) => {
            const n = typeof v === 'number' ? v : Number(String(v ?? '0'))
            return Number.isFinite(n) ? n : 0
        }
        const tokensIn = toNumber(body.tokensIn)
        const tokensOut = toNumber(body.tokensOut)

        // 4) Ghi usage
        const out = await recordUsage({
            userId,
            model: modelEnum,
            tokensIn,
            tokensOut,
            meta: {
                requestId: body.requestId,
                conversationId: body.conversationId,
                messageId: body.messageId,
            },
        })

        return NextResponse.json(out)
    } catch (e: any) {
        console.error('[usage-record]', e)
        return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
    }
}

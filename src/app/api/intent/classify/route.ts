import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireUserId } from '../../../../lib/auth/session'

export const runtime = 'nodejs'

function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
}

const SYSTEM = `Bạn là bộ phân loại ý định ngắn gọn. Trả về JSON một dòng, field "intent":
- "image": khi người dùng muốn tạo sinh ảnh, thiết kế, vẽ, logo, poster, icon, banner, minh hoạ, hình nền, v.v.
- "text": khi chỉ muốn trả lời văn bản.
Chỉ trả JSON hợp lệ, không thêm chữ khác.`

export async function POST(req: NextRequest) {
    try {
        await requireUserId()
        const { message } = await req.json()
        const text = (message || '').toString().trim()
        if (!text) return json(400, { error: 'MISSING_MESSAGE' })
        if (!process.env.OPENAI_API_KEY) return json(500, { error: 'OPENAI_API_KEY missing' })

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        // Use gpt-4o-mini for intent classification (cheap and reliable)
        const model = process.env.INTENT_MODEL || 'gpt-4o-mini'
        const completion = await client.chat.completions.create({
            model,
            temperature: 0,
            messages: [
                { role: 'system', content: SYSTEM },
                { role: 'user', content: `Hãy phân loại câu sau:\n${text}\n\nTrả JSON một dòng.` }
            ],
            max_tokens: 50
        })

        const raw = completion.choices[0]?.message?.content?.trim() || ''
        let intent: 'image' | 'text' = 'text'
        try {
            const parsed = JSON.parse(raw)
            if (parsed && (parsed.intent === 'image' || parsed.intent === 'text')) {
                intent = parsed.intent
            }
        } catch {
            // fallback heuristic if model returned text
            const t = text.toLowerCase()
            if (/(tạo|vẽ|thiết kế|làm)[^\n]{0,30}(logo|poster|icon|banner|ảnh|hình|background|wallpaper|minh hoạ|minh họa)/i.test(t)) {
                intent = 'image'
            }
        }

        return json(200, { intent })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: msg })
    }
}



import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
// import { requireUserId } from '../../../../lib/auth/session'

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
        // Intent classification doesn't require authentication
        const { message } = await req.json()
        const text = (message || '').toString().trim()
        if (!text) return json(400, { error: 'MISSING_MESSAGE' })

        // Use heuristic approach for better performance and to avoid encoding issues
        const t = text.toLowerCase()
        
        // Test individual patterns
        const hasAction = /(tạo|vẽ|thiết kế|làm|tao|ve|thiet ke|lam|create|make|design|draw)/i.test(t)
        const hasImage = /(logo|poster|icon|banner|ảnh|hình|anh|hinh|background|wallpaper|minh hoạ|minh họa|minh hoa|minh hoa|image|picture|graphic)/i.test(t)
        
        const intent: 'image' | 'text' = (hasAction && hasImage) ? 'image' : 'text'

        return json(200, { intent })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: msg })
    }
}



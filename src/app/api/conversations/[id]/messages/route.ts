import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    })
}

// Query: ?limit=30&cursor=<messageId> (trả về từ cũ → mới)
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params   // ✅ Next 15: phải await

        const { searchParams } = new URL(req.url)
        const limit = Math.min(Number(searchParams.get('limit') ?? 30), 100)
        const cursor = searchParams.get('cursor') || undefined

        const convo = await prisma.conversation.findFirst({ where: { id, userId }, select: { id: true } })
        if (!convo) return json(404, { error: 'NOT_FOUND' })

        const rows = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
        })

        const items = rows.slice(0, limit).map(m => ({
            id: m.id,
            role: m.role.toLowerCase(),
            content: m.content,
            createdAt: m.createdAt
        }))

        const nextCursor = rows.length > limit ? rows[rows.length - 1].id : null
        return json(200, { items, nextCursor })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(401, { error: msg })
    }
}

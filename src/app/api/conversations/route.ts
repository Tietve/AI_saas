import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    })
}

function int(v: string | null, d: number) {
    const n = Number.parseInt(String(v ?? ''), 10)
    return Number.isFinite(n) && n > 0 ? n : d
}

export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()
        const { searchParams } = new URL(req.url)
        const page = int(searchParams.get('page'), 1)
        const pageSize = int(searchParams.get('pageSize'), 20)
        const q = (searchParams.get('q') || '').trim()

        const where: any = { userId }
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { systemPrompt: { contains: q, mode: 'insensitive' } },
            ]
        }

        const [total, rows] = await Promise.all([
            prisma.conversation.count({ where }),
            prisma.conversation.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true, title: true, updatedAt: true, createdAt: true,
                    _count: { select: { messages: true } },
                    messages: {
                        select: { content: true, role: true, createdAt: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            })
        ])

        const items = rows.map(r => ({
            id: r.id,
            title: r.title ?? 'Untitled',
            updatedAt: r.updatedAt,
            createdAt: r.createdAt,
            messageCount: r._count.messages,
            lastPreview: r.messages[0]?.content?.slice(0, 120) ?? ''
        }))

        return json(200, { page, pageSize, total, totalPages: Math.ceil(total / pageSize), items })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(401, { error: msg })
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()
        const body = await req.json().catch(() => ({}))
        const title = (body?.title ?? '').toString().trim() || 'New chat'
        const systemPrompt = body?.systemPrompt ? String(body.systemPrompt) : null

        const created = await prisma.conversation.create({
            data: { userId, title, systemPrompt: systemPrompt || undefined },
            select: { id: true, title: true, createdAt: true, updatedAt: true }
        })
        return json(201, { item: created })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(401, { error: msg })
    }
}

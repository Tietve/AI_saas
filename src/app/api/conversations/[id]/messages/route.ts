import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    })
}

// GET /api/conversations/[id]/messages
export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params

        // Get query params for pagination
        const searchParams = req.nextUrl.searchParams
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const cursor = searchParams.get('cursor') // message id for cursor-based pagination

        // Check ownership
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })
        if (!convo) return json(404, { error: 'NOT_FOUND' })

        // Get messages with pagination
        const messages = await prisma.message.findMany({
            where: {
                conversationId: id,
                ...(cursor ? {
                    createdAt: {
                        lt: await prisma.message.findUnique({
                            where: { id: cursor },
                            select: { createdAt: true }
                        }).then(m => m?.createdAt || new Date())
                    }
                } : {})
            },
            select: {
                id: true,
                role: true,
                content: true,
                model: true,
                promptTokens: true,
                completionTokens: true,
                latencyMs: true,
                createdAt: true,
                attachments: {
                    select: {
                        id: true,
                        kind: true,
                        url: true,
                        meta: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1 // Take one extra to check if there's more
        })

        const hasMore = messages.length > limit
        const items = hasMore ? messages.slice(0, -1) : messages

        // Reverse to get chronological order
        items.reverse()

        return json(200, {
            items,
            hasMore,
            nextCursor: hasMore ? items[0]?.id : null
        })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}

// POST /api/conversations/[id]/messages
export async function POST(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        const body = await req.json()

        const { role, content, model, promptTokens, completionTokens, latencyMs, idempotencyKey } = body

        // Validate required fields
        if (!role || !content) {
            return json(400, { error: 'MISSING_REQUIRED_FIELDS' })
        }

        // Check ownership
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })
        if (!convo) return json(404, { error: 'NOT_FOUND' })

        // Check for idempotency
        if (idempotencyKey) {
            const existing = await prisma.message.findUnique({
                where: {
                    conversationId_idempotencyKey: {
                        conversationId: id,
                        idempotencyKey
                    }
                },
                select: {
                    id: true,
                    role: true,
                    content: true,
                    createdAt: true
                }
            })
            if (existing) {
                return json(200, { item: existing, duplicate: true })
            }
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                role,
                content,
                model,
                promptTokens,
                completionTokens,
                latencyMs,
                idempotencyKey
            },
            select: {
                id: true,
                role: true,
                content: true,
                model: true,
                promptTokens: true,
                completionTokens: true,
                latencyMs: true,
                createdAt: true
            }
        })

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() }
        })

        return json(201, { item: message })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}
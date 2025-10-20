import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    })
}


export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params

        
        const searchParams = req.nextUrl.searchParams
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const cursor = searchParams.get('cursor') 

        
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })
        if (!convo) return json(404, { error: 'NOT_FOUND' })

        // Handle cursor-based pagination
        let whereClause: any = { conversationId: id }

        if (cursor) {
            const cursorMessage = await prisma.message.findUnique({
                where: { id: cursor },
                select: { createdAt: true }
            })
            if (cursorMessage) {
                whereClause.createdAt = { lt: cursorMessage.createdAt }
            }
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
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
            take: limit + 1 
        })

        const hasMore = messages.length > limit
        const items = hasMore ? messages.slice(0, -1) : messages

        
        items.reverse()

    } catch (err: unknown) {
        const userId = await requireUserId().catch(() => 'anonymous') // Safely get userId for logging
        const { id } = await ctx.params
        const cursor = req.nextUrl.searchParams.get('cursor')

        console.error(
            `[Messages GET] Failed to fetch messages. ` +
            `User: ${userId}, Convo: ${id}, Cursor: ${cursor}.`,
            {
                error: err,
                errorMessage: err instanceof Error ? err.message : String(err),
                errorStack: err instanceof Error ? err.stack : undefined
            }
        )

        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
        return json(500, { error: 'Internal Server Error', details: errorMessage })
    }
}


export async function POST(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        const body = await req.json()

        const { role, content, model, promptTokens, completionTokens, latencyMs, idempotencyKey } = body

        
        if (!role || !content) {
            return json(400, { error: 'MISSING_REQUIRED_FIELDS' })
        }

        
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })
        if (!convo) return json(404, { error: 'NOT_FOUND' })

        
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
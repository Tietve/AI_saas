import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    // Enhanced logging for debugging production issues
    const requestId = crypto.randomUUID().slice(0, 8)
    const startTime = Date.now()
    
    console.log(`[${requestId}] GET /api/conversations/[id]/messages - START`, {
        url: req.url,
        method: req.method,
        headers: {
            cookie: req.headers.get('cookie')?.substring(0, 50) + '...',
            userAgent: req.headers.get('user-agent'),
            referer: req.headers.get('referer'),
        }
    })
    
    try {
        console.log(`[${requestId}] Verifying user authentication...`)
        const userId = await requireUserId()
        console.log(`[${requestId}] User authenticated: ${userId}`)
        
        const { id } = await ctx.params
        console.log(`[${requestId}] Conversation ID: ${id}`)

        
        const searchParams = req.nextUrl.searchParams
        const limitParam = searchParams.get('limit')
        const limitParsed = parseInt(limitParam || '50', 10)
        const limit = isNaN(limitParsed) 
            ? 50  // Default if parse fails
            : Math.min(Math.max(limitParsed, 1), 100)  // Clamp between 1-100
        const cursor = searchParams.get('cursor')
        
        console.log(`[${requestId}] Query params:`, { limit, cursor })

        
        console.log(`[${requestId}] Checking conversation ownership...`)
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })
        if (!convo) {
            console.log(`[${requestId}] Conversation not found or unauthorized`)
            return json(404, { error: 'NOT_FOUND' })
        }
        console.log(`[${requestId}] Conversation found and authorized`)

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

        console.log(`[${requestId}] Fetching messages...`, { whereClause, limit })
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
        
        console.log(`[${requestId}] Found ${messages.length} messages`)

        const hasMore = messages.length > limit
        const items = hasMore ? messages.slice(0, -1) : messages

        
        items.reverse()
        
        const duration = Date.now() - startTime
        console.log(`[${requestId}] Success - returning ${items.length} messages (${duration}ms)`)

        return json(200, {
            items,
            hasMore,
            nextCursor: hasMore ? messages[messages.length - 2]?.id : null
        })

    } catch (err: unknown) {
        const duration = Date.now() - startTime
        // Don't re-call requireUserId in catch - it will throw again!
        let userId = 'unauthenticated'
        const { id } = await ctx.params.catch(() => ({ id: 'unknown' }))
        const cursor = req.nextUrl.searchParams.get('cursor')
        
        const errorInfo = {
            requestId,
            duration,
            userId,
            conversationId: id,
            cursor,
            url: req.url,
            errorType: err?.constructor?.name || 'Unknown',
            errorMessage: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
        }

        console.error(`[${requestId}] FAILED (${duration}ms):`, errorInfo)
        
        // Check if it's an authentication error
        if (err instanceof Error && err.message === 'UNAUTHENTICATED') {
            console.error(`[${requestId}] Authentication failed - no valid session`)
            return json(401, { 
                error: 'UNAUTHENTICATED', 
                message: 'Authentication required. Please sign in again.' 
            })
        }

        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
        return json(500, { 
            error: 'INTERNAL_SERVER_ERROR', 
            message: errorMessage,
            requestId 
        })
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
        // Check if it's an authentication error
        if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
            return json(401, { 
                error: 'UNAUTHENTICATED',
                message: 'Authentication required'
            })
        }
        
        // Check if it's a validation error
        if (e instanceof Error && (e.message.includes('required') || e.message.includes('validation'))) {
            return json(400, { 
                error: 'VALIDATION_ERROR',
                message: e.message
            })
        }
        
        // Everything else is internal error
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: 'INTERNAL_ERROR', message: msg })
    }
}

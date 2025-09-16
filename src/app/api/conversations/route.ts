// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

// Helper function để format response
function jsonResponse(status: number, data: any) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    })
}

// GET: Lấy danh sách conversations
export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
        const query = searchParams.get('q')?.trim()

        // Build where clause
        const where: any = { userId }
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { systemPrompt: { contains: query, mode: 'insensitive' } }
            ]
        }

        // Get total count và data
        const [total, conversations] = await Promise.all([
            prisma.conversation.count({ where }),
            prisma.conversation.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    title: true,
                    model: true,
                    systemPrompt: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { messages: true }
                    },
                    messages: {
                        select: { content: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            })
        ])

        // Format items cho frontend
        const items = conversations.map(conv => ({
            id: conv.id,
            title: conv.title || 'Untitled',
            model: conv.model,
            systemPrompt: conv.systemPrompt,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            messageCount: conv._count.messages,
            lastMessage: conv.messages[0]?.content?.slice(0, 100) || ''
        }))

        return jsonResponse(200, {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items
        })

    } catch (error: any) {
        console.error('[GET /api/conversations] Error:', error)

        if (error.message === 'UNAUTHENTICATED') {
            return jsonResponse(401, { error: 'Authentication required' })
        }

        return jsonResponse(500, {
            error: 'Internal server error',
            message: error.message
        })
    }
}

// POST: Tạo conversation mới
export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const body = await req.json().catch(() => ({}))
        const title = body.title?.trim() || 'New Chat'
        const systemPrompt = body.systemPrompt?.trim()
        const model = body.model || 'gpt_4o_mini'

        const conversation = await prisma.conversation.create({
            data: {
                userId,
                title,
                systemPrompt,
                model
            },
            select: {
                id: true,
                title: true,
                model: true,
                systemPrompt: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return jsonResponse(201, {
            item: {
                ...conversation,
                createdAt: conversation.createdAt.toISOString(),
                updatedAt: conversation.updatedAt.toISOString()
            }
        })

    } catch (error: any) {
        console.error('[POST /api/conversations] Error:', error)

        if (error.message === 'UNAUTHENTICATED') {
            return jsonResponse(401, { error: 'Authentication required' })
        }

        return jsonResponse(500, {
            error: 'Internal server error',
            message: error.message
        })
    }
}
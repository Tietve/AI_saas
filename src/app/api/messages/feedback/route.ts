import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const { searchParams } = new URL(req.url)
        const messageId = searchParams.get('messageId')

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
        }

        const feedback = await prisma.messageFeedback.findUnique({
            where: {
                messageId_userId: {
                    messageId,
                    userId
                }
            }
        })

        return NextResponse.json({ feedback: feedback?.feedback || null })
    } catch (error) {
        console.error('[Feedback] GET Error:', error)
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json({ 
            error: 'Internal error',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const { messageId, feedback } = await req.json()

        if (!messageId || !feedback || !['like', 'dislike'].includes(feedback)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // Lấy conversationId từ message
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { conversationId: true }
        })

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 })
        }

        // Sử dụng upsert với constraint đúng
        const result = await prisma.messageFeedback.upsert({
            where: {
                messageId_userId: {
                    messageId,
                    userId
                }
            },
            update: {
                feedback,
                updatedAt: new Date()
            },
            create: {
                messageId,
                userId,
                conversationId: message.conversationId,
                feedback
            }
        })

        return NextResponse.json({ success: true, feedback: result })
    } catch (error) {
        console.error('[Feedback] POST Error:', error)
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json({ 
            error: 'Internal error',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 500 })
    }
}
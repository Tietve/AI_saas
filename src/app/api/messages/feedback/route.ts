import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { messageId, feedback, conversationId } = await req.json()

        if (!messageId || !feedback || !['like', 'dislike'].includes(feedback)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // Lưu hoặc update feedback
        const result = await prisma.messageFeedback.upsert({
            where: {
                messageId_userId: {
                    messageId,
                    userId: session.user.id
                }
            },
            update: {
                feedback,
                updatedAt: new Date()
            },
            create: {
                messageId,
                userId: session.user.id,
                conversationId,
                feedback
            }
        })

        return NextResponse.json({ success: true, feedback: result })
    } catch (error) {
        console.error('[Feedback] Error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
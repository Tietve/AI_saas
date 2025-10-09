import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        // Test database connection
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Test MessageFeedback model
        const feedbackCount = await prisma.messageFeedback.count({
            where: { userId }
        })

        return NextResponse.json({ 
            success: true, 
            user: { id: user.id, email: user.email },
            feedbackCount,
            message: 'Database connection working'
        })
    } catch (error) {
        console.error('[Test Feedback] Error:', error)
        return NextResponse.json({ 
            error: 'Database error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

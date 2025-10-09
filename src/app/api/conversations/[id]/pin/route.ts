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

/**
 * POST /api/conversations/:id/pin
 * Toggle pin status for a conversation
 */
export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params

        // Verify ownership
        const conversation = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true, pinned: true }
        })

        if (!conversation) {
            return json(404, { error: 'NOT_FOUND' })
        }

        // Toggle pin status
        const updated = await prisma.conversation.update({
            where: { id },
            data: { pinned: !conversation.pinned },
            select: {
                id: true,
                title: true,
                pinned: true,
                updatedAt: true
            }
        })

        return json(200, { item: updated })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[POST /api/conversations/:id/pin] Error:', msg)
        return json(400, { error: msg })
    }
}

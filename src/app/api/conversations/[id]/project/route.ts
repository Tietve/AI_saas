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
 * POST /api/conversations/:id/project
 * Assign conversation to a project (or remove from project if projectId is null)
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        const body = await req.json().catch(() => ({}))
        const projectId = body.projectId // can be string or null

        // Verify conversation ownership
        const conversation = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })

        if (!conversation) {
            return json(404, { error: 'NOT_FOUND' })
        }

        // If projectId is provided, verify project ownership
        if (projectId) {
            const project = await prisma.project.findFirst({
                where: { id: projectId, userId },
                select: { id: true }
            })

            if (!project) {
                return json(404, { error: 'PROJECT_NOT_FOUND' })
            }
        }

        // Update conversation
        const updated = await prisma.conversation.update({
            where: { id },
            data: { projectId },
            select: {
                id: true,
                projectId: true,
                updatedAt: true
            }
        })

        return json(200, { item: updated })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[POST /api/conversations/:id/project] Error:', msg)
        return json(400, { error: msg })
    }
}

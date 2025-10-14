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
 * GET /api/projects/:id
 * Get a single project
 */
export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params

        const project = await prisma.project.findFirst({
            where: { id, userId },
            include: {
                _count: {
                    select: { conversations: true }
                }
            }
        })

        if (!project) return json(404, { error: 'NOT_FOUND' })

        return json(200, {
            item: {
                id: project.id,
                name: project.name,
                description: project.description,
                color: project.color,
                icon: project.icon,
                createdAt: project.createdAt.toISOString(),
                updatedAt: project.updatedAt.toISOString(),
                conversationCount: project._count.conversations
            }
        })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}

/**
 * PATCH /api/projects/:id
 * Update a project
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        const body = await req.json().catch(() => ({}))

        const name = typeof body?.name === 'string' ? body.name.trim() : undefined
        const description = typeof body?.description === 'string' ? body.description.trim() : undefined
        const color = typeof body?.color === 'string' ? body.color.trim() : undefined
        const icon = typeof body?.icon === 'string' ? body.icon.trim() : undefined

        if (name === undefined && description === undefined && color === undefined && icon === undefined) {
            return json(400, { error: 'NO_UPDATE_FIELDS' })
        }

        // Verify ownership
        const owned = await prisma.project.findFirst({ where: { id, userId }, select: { id: true } })
        if (!owned) return json(404, { error: 'NOT_FOUND' })

        // Update project
        const updated = await prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(color !== undefined ? { color } : {}),
                ...(icon !== undefined ? { icon } : {}),
            },
            include: {
                _count: {
                    select: { conversations: true }
                }
            }
        })

        return json(200, {
            item: {
                id: updated.id,
                name: updated.name,
                description: updated.description,
                color: updated.color,
                icon: updated.icon,
                updatedAt: updated.updatedAt.toISOString(),
                conversationCount: updated._count.conversations
            }
        })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}

/**
 * DELETE /api/projects/:id
 * Delete a project (conversations will be set to projectId: null)
 */
export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params

        // Verify ownership
        const owned = await prisma.project.findFirst({ where: { id, userId }, select: { id: true } })
        if (!owned) return json(404, { error: 'NOT_FOUND' })

        // Delete project (conversations will be set to null due to onDelete: SetNull)
        await prisma.project.delete({ where: { id } })

        return json(200, { ok: true })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}

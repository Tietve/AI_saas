import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'

function jsonResponse(status: number, data: any) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    })
}

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { conversations: true }
                }
            }
        })

        const items = projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            color: project.color,
            icon: project.icon,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            conversationCount: project._count.conversations
        }))

        return jsonResponse(200, { items })

    } catch (error: any) {
        console.error('[GET /api/projects] Error:', error)

        if (error.message === 'UNAUTHENTICATED') {
            return jsonResponse(401, { error: 'Authentication required' })
        }

        return jsonResponse(500, {
            error: 'Internal server error',
            message: error.message
        })
    }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId()

        const body = await req.json().catch(() => ({}))
        const name = body.name?.trim()
        const description = body.description?.trim()
        const color = body.color?.trim() || '#3b82f6'
        const icon = body.icon?.trim() || 'Folder'

        if (!name) {
            return jsonResponse(400, { error: 'Project name is required' })
        }

        const project = await prisma.project.create({
            data: {
                userId,
                name,
                description,
                color,
                icon
            },
            include: {
                _count: {
                    select: { conversations: true }
                }
            }
        })

        return jsonResponse(201, {
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

    } catch (error: any) {
        console.error('[POST /api/projects] Error:', error)

        if (error.message === 'UNAUTHENTICATED') {
            return jsonResponse(401, { error: 'Authentication required' })
        }

        return jsonResponse(500, {
            error: 'Internal server error',
            message: error.message
        })
    }
}

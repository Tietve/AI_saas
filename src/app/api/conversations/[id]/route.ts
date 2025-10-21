/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     tags:
 *       - Conversations
 *     summary: Get conversation by ID
 *     description: Retrieves a single conversation with full details
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Conversation ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/Conversation'
 *       404:
 *         description: Conversation not found or not owned by user
 *       400:
 *         description: Bad request
 *   patch:
 *     tags:
 *       - Conversations
 *     summary: Update conversation
 *     description: Updates conversation properties (title, system prompt, model, metadata)
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Conversation ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               systemPrompt:
 *                 type: string
 *               model:
 *                 type: string
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Conversation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Invalid model or no update fields
 *       404:
 *         description: Conversation not found or not owned by user
 *   delete:
 *     tags:
 *       - Conversations
 *     summary: Delete conversation
 *     description: Permanently deletes a conversation and all its messages
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Conversation ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Conversation not found or not owned by user
 *       400:
 *         description: Bad request
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth/session'
import { isAllowedModel } from '@/lib/ai/models'


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


export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        
        // Validate conversationId (don't cast to Number, it's a cuid string)
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return json(400, { 
                error: 'INVALID_CONVERSATION_ID',
                message: 'conversationId must be a valid string'
            })
        }
        
        const convo = await prisma.conversation.findFirst({
            where: { id: id.trim(), userId },
            select: {
                id: true,
                title: true,
                systemPrompt: true,
                model: true,
                createdAt: true,
                updatedAt: true,
                meta: true
            },
        })
        if (!convo) return json(404, { error: 'NOT_FOUND', message: 'Conversation not found or unauthorized' })
        return json(200, { item: convo })
    } catch (e: unknown) {
        // Check if it's an authentication error
        if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
            return json(401, { 
                error: 'UNAUTHENTICATED',
                message: 'Authentication required'
            })
        }
        
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: 'INTERNAL_ERROR', message: msg })
    }
}


export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        
        // Validate conversationId (don't cast to Number, it's a cuid string)
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return json(400, { 
                error: 'INVALID_CONVERSATION_ID',
                message: 'conversationId must be a valid string'
            })
        }
        
        const body = await req.json().catch(() => ({}))

        // Accept both {title} and {name} for compatibility
        const titleField = typeof body?.title === 'string' ? body.title.trim() : 
                          typeof body?.name === 'string' ? body.name.trim() : 
                          undefined
        const systemPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt : undefined
        const model = typeof body?.model === 'string' ? body.model : undefined
        const meta = body?.meta !== undefined ? body.meta : undefined

        if (model !== undefined && !isAllowedModel(model)) {
            return json(400, { 
                error: 'INVALID_MODEL',
                message: `Model '${model}' is not allowed`
            })
        }
        if (titleField === undefined && systemPrompt === undefined && model === undefined && meta === undefined) {
            return json(400, { 
                error: 'NO_UPDATE_FIELDS',
                message: 'At least one field (title/name, systemPrompt, model, or meta) must be provided'
            })
        }

        
        const owned = await prisma.conversation.findFirst({ 
            where: { id: id.trim(), userId }, 
            select: { id: true } 
        })
        if (!owned) return json(404, { 
            error: 'NOT_FOUND',
            message: 'Conversation not found or unauthorized'
        })

        
        const updated = await prisma.conversation.update({
            where: { id: id.trim() },
            data: {
                ...(titleField !== undefined ? { title: titleField || 'Untitled' } : {}),
                ...(systemPrompt !== undefined ? { systemPrompt } : {}),
                ...(model !== undefined ? { model } : {}),
                ...(meta !== undefined ? { meta } : {}),
            },
            select: {
                id: true,
                title: true,
                systemPrompt: true,
                model: true,
                updatedAt: true,
                meta: true
            },
        })
        return json(200, { item: updated })
    } catch (e: unknown) {
        // Check if it's an authentication error
        if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
            return json(401, { 
                error: 'UNAUTHENTICATED',
                message: 'Authentication required'
            })
        }
        
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: 'INTERNAL_ERROR', message: msg })
    }
}


export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        
        // Validate conversationId (don't cast to Number, it's a cuid string)
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return json(400, { 
                error: 'INVALID_CONVERSATION_ID',
                message: 'conversationId must be a valid string'
            })
        }

        
        const owned = await prisma.conversation.findFirst({ 
            where: { id: id.trim(), userId }, 
            select: { id: true } 
        })
        if (!owned) return json(404, { 
            error: 'NOT_FOUND',
            message: 'Conversation not found or unauthorized'
        })

        
        await prisma.conversation.delete({ where: { id: id.trim() } })
        return json(200, { ok: true, message: 'Conversation deleted successfully' })
    } catch (e: unknown) {
        // Check if it's an authentication error
        if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
            return json(401, { 
                error: 'UNAUTHENTICATED',
                message: 'Authentication required'
            })
        }
        
        const msg = e instanceof Error ? e.message : String(e)
        return json(500, { error: 'INTERNAL_ERROR', message: msg })
    }
}
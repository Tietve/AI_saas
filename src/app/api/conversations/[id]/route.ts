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
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
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
        if (!convo) return json(404, { error: 'NOT_FOUND' })
        return json(200, { item: convo })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}


export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params
        const body = await req.json().catch(() => ({}))

        const title = typeof body?.title === 'string' ? body.title.trim() : undefined
        const systemPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt : undefined
        const model = typeof body?.model === 'string' ? body.model : undefined
        const meta = body?.meta !== undefined ? body.meta : undefined

        if (model !== undefined && !isAllowedModel(model)) {
            return json(400, { error: 'INVALID_MODEL' })
        }
        if (title === undefined && systemPrompt === undefined && model === undefined && meta === undefined) {
            return json(400, { error: 'NO_UPDATE_FIELDS' })
        }

        
        const owned = await prisma.conversation.findFirst({ where: { id, userId }, select: { id: true } })
        if (!owned) return json(404, { error: 'NOT_FOUND' })

        
        const updated = await prisma.conversation.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title: title || 'Untitled' } : {}),
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
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}


export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const userId = await requireUserId()
        const { id } = await ctx.params

        
        const owned = await prisma.conversation.findFirst({ where: { id, userId }, select: { id: true } })
        if (!owned) return json(404, { error: 'NOT_FOUND' })

        
        await prisma.conversation.delete({ where: { id } })
        return json(200, { ok: true })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}
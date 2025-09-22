import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";


function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    })
}

export async function DELETE(
    _: NextRequest,
    ctx: { params: Promise<{ id: string, messageId: string }> }
) {
    try {
        const userId = await requireUserId()
        const { id, messageId } = await ctx.params

        
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
            select: { id: true }
        })
        if (!convo) return json(404, { error: 'NOT_FOUND' })

        
        await prisma.message.delete({
            where: {
                id: messageId,
                conversationId: id
            }
        })

        return json(200, { ok: true })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return json(400, { error: msg })
    }
}
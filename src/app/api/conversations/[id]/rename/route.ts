import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from '@/lib/auth/session';


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const userId = await requireUserId();
    const { title } = await req.json();

    if (!title?.trim()) {
        return new Response(JSON.stringify({ error: "EMPTY_TITLE" }), { status: 400 });
    }

    const convo = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!convo) return new Response("NOT_FOUND", { status: 404 });

    const updated = await prisma.conversation.update({
        where: { id },
        data: { title: title.trim() },
    });

    return Response.json({ conversation: updated });
}

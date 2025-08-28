import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;               // 👈 phải await
    const userId = await requireUserId();

    const convo = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!convo) return new Response("NOT_FOUND", { status: 404 });

    const messages = await prisma.message.findMany({
        where: { conversationId: convo.id },
        orderBy: { createdAt: "asc" },
        take: 200,
    });

    return Response.json({ messages });
}

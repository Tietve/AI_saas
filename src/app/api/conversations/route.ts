// 📁 File: src/app/api/conversations/route.ts (list/create conversation)
// ============================================================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";


export async function GET() {
    const userId = await requireUserId();
    const items = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    return Response.json({ items });
}


export async function POST(req: NextRequest) {
    const userId = await requireUserId();
    const { title, systemPrompt } = (await req.json()) as { title?: string; systemPrompt?: string };
    const c = await prisma.conversation.create({ data: { userId, title: title?.slice(0, 200) || "New chat", systemPrompt } });
    return Response.json({ id: c.id });
}
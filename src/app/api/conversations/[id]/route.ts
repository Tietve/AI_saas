import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

// Tắt cache / bật dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;
// (tuỳ chọn) nếu bạn dùng edge ở nơi khác, bảo đảm route này chạy Node.js
export const runtime = "nodejs";

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
}

/**
 * (Tuỳ chọn) GET 1 conversation: tiện debug nhanh trong Postman/curl
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;                 // ✅ Next 15: phải await
    const userId = await requireUserId();

    const convo = await prisma.conversation.findFirst({
        where: { id, userId },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    if (!convo) return json({ error: "NOT_FOUND" }, 404);
    return json({ conversation: convo });
}

/**
 * DELETE /api/conversations/:id
 * Xoá an toàn bằng transaction (attachments -> messages -> conversation)
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;                 // ✅ phải await
    const userId = await requireUserId();

    // Bảo đảm cuộc hội thoại thuộc user hiện tại
    const convo = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!convo) return json({ error: "NOT_FOUND" }, 404);

    // Xoá theo transaction để không dính khoá ngoại
    await prisma.$transaction([
        prisma.attachment.deleteMany({ where: { conversationId: id } }),
        prisma.message.deleteMany({ where: { conversationId: id } }),
        prisma.conversation.delete({ where: { id } }),
    ]);

    return json({ ok: true }, 200);
}

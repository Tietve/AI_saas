// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getProvider } from "@/lib/provider";
import { hashIdempotency } from "@/lib/ids";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export const POST = withRateLimit(async (req: Request) => {
    try {
        const userId = await requireUserId(); // 401 nếu chưa đăng nhập

        // 1) Parse body
        const body = (await req.json()) as {
            conversationId?: string;
            message: string;
            systemPrompt?: string;
            temperature?: number;
            force?: boolean;
            idempotencyKey?: string;
        };
        const headerIdem = req.headers.get("Idempotency-Key") || undefined;

        const msg = (body?.message ?? "").trim();
        if (!msg) {
            return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400, headers: noStore() });
        }

        // 2) Lấy hoặc tạo conversation
        let convoId = (body.conversationId || "").trim();
        if (convoId) {
            const exists = await prisma.conversation.findFirst({ where: { id: convoId, userId } });
            if (!exists) {
                const created = await prisma.conversation.create({
                    data: { userId, title: msg.slice(0, 80), systemPrompt: body.systemPrompt },
                });
                convoId = created.id;
            }
        } else {
            const created = await prisma.conversation.create({
                data: { userId, title: msg.slice(0, 80), systemPrompt: body.systemPrompt },
            });
            convoId = created.id;
        }

        // 3) Idempotency (scoped theo hội thoại, áp dụng cho ASSISTANT)
        const minuteBucket = Math.floor(Date.now() / 60_000);
        let idem =
            body.idempotencyKey ||
            headerIdem ||
            hashIdempotency({ userId, conversationId: convoId, m: msg, bucket: minuteBucket });

        // Trả kết quả cũ nếu có
        const dupAssistant = await prisma.message.findFirst({
            where: { conversationId: convoId, role: "ASSISTANT", idempotencyKey: idem },
            orderBy: { createdAt: "desc" },
            select: { content: true },
        });
        if (dupAssistant && !body.force) {
            return NextResponse.json(
                { conversationId: convoId, reply: dupAssistant.content, meta: { cached: true, idempotencyKey: idem } },
                { headers: noStore() }
            );
        }
        if (dupAssistant && body.force) {
            idem = `${idem}:retry:${Date.now()}`;
        }

        // 4) Lưu USER message (không set idempotencyKey)
        await prisma.message.create({
            data: { conversationId: convoId, role: "USER", content: msg },
        });

        // 5) Lịch sử & convo (lấy cả model)
        const limit = Number(process.env.MAX_HISTORY || 16);
        const history = await prisma.message.findMany({
            where: { conversationId: convoId },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: { role: true, content: true },
        });
        const convo = await prisma.conversation.findUnique({
            where: { id: convoId },
            select: { systemPrompt: true, model: true }, // ✅ lấy cả model
        });

        const messages = [
            ...(convo?.systemPrompt ? [{ role: "system" as const, content: convo.systemPrompt }] : []),
            ...history
                .reverse()
                .map((m) => ({ role: m.role.toLowerCase() as "user" | "assistant", content: m.content })),
            { role: "user" as const, content: msg },
        ];

        // 6) MOCK
        if (process.env.MOCK_AI === "1") {
            const mockReply = `ĐÃ NHẬN: "${msg}" (mock, không gọi AI)`;
            await prisma.message.create({
                data: {
                    conversationId: convoId,
                    role: "ASSISTANT",
                    content: mockReply,
                    model: "mock",
                    idempotencyKey: idem,
                },
            });
            await prisma.conversation.update({ where: { id: convoId }, data: { updatedAt: new Date() } });

            return NextResponse.json(
                {
                    conversationId: convoId,
                    reply: mockReply,
                    meta: { cached: false, idempotencyKey: idem, provider: "mock" },
                },
                { headers: noStore() }
            );
        }

        // 7) Provider thật
        const provider = getProvider();
        const model = (convo?.model && typeof convo.model === "string" ? convo.model : undefined) || DEFAULT_MODEL_ID;
        const out = await provider.chat({
            model,
            messages,
            temperature: body.temperature ?? 0.3,
        });

        const safeReply = (out.content ?? "").trim() || "Xin lỗi, model không trả nội dung.";

        // 8) Lưu ASSISTANT
        await prisma.message.create({
            data: {
                conversationId: convoId,
                role: "ASSISTANT",
                content: safeReply,
                model: out.model ?? model,
                promptTokens: out.promptTokens ?? undefined,
                completionTokens: out.completionTokens ?? undefined,
                latencyMs: out.latencyMs ?? undefined,
                idempotencyKey: idem,
            },
        });

        // 9) Cập nhật updatedAt để nổi lên đầu
        await prisma.conversation.update({ where: { id: convoId }, data: { updatedAt: new Date() } });

        // 10) Trả về
        return NextResponse.json(
            {
                conversationId: convoId,
                reply: safeReply,
                meta: {
                    cached: false,
                    idempotencyKey: idem,
                    provider: provider.name,
                    requestedModel: model,
                    upstreamModel: out.model ?? model,
                    usage: {
                        promptTokens: out.promptTokens ?? null,
                        completionTokens: out.completionTokens ?? null,
                    },
                    latencyMs: out.latencyMs ?? null,
                },
            },
            { headers: noStore() }
        );
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const code = msg === "UNAUTHENTICATED" ? 401 : 500;
        return NextResponse.json({ error: msg }, { status: code, headers: noStore() });
    }
}, { scope: "chat-json", limit: 20, windowMs: 60_000, burst: 20 });

// ————— helpers —————
function noStore() {
    return { "Cache-Control": "no-store" } as Record<string, string>;
}

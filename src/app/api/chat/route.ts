import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { getProvider } from "@/lib/provider";
import { consumeToken } from "@/lib/rateLimit";
import { hashIdempotency } from "@/lib/ids";

export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId();

        // 1) Rate limit ngắn hạn (anti-spam)
        const rl = consumeToken(`chat:${userId}`, Number(process.env.RATE_PM || 60));
        if (!rl.ok) {
            return new Response(JSON.stringify({ error: "RATE_LIMIT" }), {
                status: 429,
                headers: { "Cache-Control": "no-store" },
            });
        }

        // 2) Parse body
        const body = (await req.json()) as {
            conversationId?: string;
            message: string;
            systemPrompt?: string;
            temperature?: number;
            force?: boolean;
            idempotencyKey?: string;
        };
        const headerIdem = req.headers.get("Idempotency-Key") || undefined;

        if (!body?.message?.trim()) {
            return new Response(JSON.stringify({ error: "EMPTY_MESSAGE" }), {
                status: 400,
                headers: { "Cache-Control": "no-store" },
            });
        }

        // 3) Lấy hoặc tạo conversation
        let convoId = body.conversationId;
        if (convoId) {
            const exists = await prisma.conversation.findFirst({ where: { id: convoId, userId } });
            if (!exists) {
                const created = await prisma.conversation.create({
                    data: { userId, title: body.message.slice(0, 80), systemPrompt: body.systemPrompt },
                });
                convoId = created.id;
            }
        } else {
            const created = await prisma.conversation.create({
                data: { userId, title: body.message.slice(0, 80), systemPrompt: body.systemPrompt },
            });
            convoId = created.id;
        }

        // --- Idempotency ---
        const minuteBucket = Math.floor(Date.now() / 60_000);
        let idem =
            body.idempotencyKey ||
            hashIdempotency({ userId, conversationId: convoId, m: body.message, bucket: minuteBucket });

        const dup = await prisma.message.findFirst({ where: { idempotencyKey: idem } });
        if (dup) {
            const last = await prisma.message.findFirst({
                where: { conversationId: convoId!, role: "ASSISTANT" },
                orderBy: { createdAt: "desc" },
            });

            if (!body.force && last?.content?.trim()) {
                return Response.json({
                    conversationId: convoId,
                    reply: last.content,
                    meta: { cached: true, idempotencyKey: idem },
                });
            }
            idem = `${idem}:retry:${Date.now()}`;
        }

        // --- Lưu USER message ---
        await prisma.message.create({
            data: {
                conversationId: convoId!,
                role: "USER",
                content: body.message,
                idempotencyKey: idem,
            },
        });

        // 6) Lịch sử
        const history = await prisma.message.findMany({
            where: { conversationId: convoId! },
            orderBy: { createdAt: "asc" },
            take: Number(process.env.MAX_HISTORY || 16),
        });
        const convo = await prisma.conversation.findUnique({ where: { id: convoId! } });
        const messages = [
            ...(convo?.systemPrompt ? [{ role: "system" as const, content: convo.systemPrompt }] : []),
            ...history.map((m) => ({ role: m.role.toLowerCase() as "user" | "assistant", content: m.content })),
        ];

        // 7) MOCK (dev)
        if (process.env.MOCK_AI === "1") {
            const mockReply = `ĐÃ NHẬN: "${body.message}" (mock, không gọi AI)`;
            await prisma.message.create({
                data: { conversationId: convoId!, role: "ASSISTANT", content: mockReply, model: "mock" },
            });
            return Response.json(
                { conversationId: convoId, reply: mockReply, meta: { cached: false, idempotencyKey: idem, provider: "mock" } },
                { headers: { "Cache-Control": "no-store" } }
            );
        }

        // 8) Gọi OpenAI provider
        const provider = getProvider();
        const model = process.env.AI_MODEL || "gpt-4o";   // 🔥 default = gpt-4o
        const out = await provider.chat({
            model,
            messages,
            temperature: body.temperature ?? 0.3,
        });

        const safeReply = (out.content ?? "").trim() || "Xin lỗi, model không trả nội dung.";

        // 9) Lưu ASSISTANT message
        await prisma.message.create({
            data: {
                conversationId: convoId!,
                role: "ASSISTANT",
                content: safeReply,
                model: out.model ?? model,
                promptTokens: out.promptTokens ?? undefined,
                completionTokens: out.completionTokens ?? undefined,
                latencyMs: out.latencyMs ?? undefined,
            },
        });

        // 10) Trả về (thêm thông tin model để bạn debug dễ)
        return Response.json(
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
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (e: any) {
        const msg = e?.message || "UNKNOWN";
        const code = msg === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: msg }), {
            status: code,
            headers: { "Cache-Control": "no-store" },
        });
    }
}

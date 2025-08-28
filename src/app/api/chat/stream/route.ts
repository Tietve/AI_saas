import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { getProvider } from "@/lib/provider";
import { consumeToken } from "@/lib/rateLimit";
import { hashIdempotency } from "@/lib/ids";

export const dynamic = "force-dynamic"; // đảm bảo không bị cache

function sseInit() {
    return {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    };
}

function sseLine(obj: any) {
    return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: NextRequest) {
    let convoId: string | undefined;

    try {
        const userId = await requireUserId();

        // Rate limit ngắn hạn
        const rl = consumeToken(`chat:${userId}`, Number(process.env.RATE_PM || 60));
        if (!rl.ok) {
            return new Response(sseLine({ error: "RATE_LIMIT", done: true }), sseInit());
        }

        const body = (await req.json()) as {
            conversationId?: string;
            message: string;
            systemPrompt?: string;
            temperature?: number;
            force?: boolean;
            idempotencyKey?: string;
        };

        if (!body?.message?.trim()) {
            return new Response(sseLine({ error: "EMPTY_MESSAGE", done: true }), sseInit());
        }

        // Lấy / tạo conversation TRƯỚC
        convoId = body.conversationId;
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

        // Idempotency theo hội thoại + bucket phút
        const minuteBucket = Math.floor(Date.now() / 60_000);
        let idem =
            body.idempotencyKey ||
            hashIdempotency({ userId, conversationId: convoId, m: body.message, bucket: minuteBucket });

        const dup = await prisma.message.findFirst({ where: { idempotencyKey: idem } });
        if (dup && !body.force) {
            // Đã xử lý trước đó -> stream lại câu trả lời gần nhất (1 phát)
            const last = await prisma.message.findFirst({
                where: { conversationId: dup.conversationId, role: "ASSISTANT" },
                orderBy: { createdAt: "desc" },
            });

            const stream = new ReadableStream({
                start(controller) {
                    const enc = new TextEncoder();
                    // 👇 báo meta trước
                    controller.enqueue(enc.encode(`data: ${JSON.stringify({ meta: { conversationId: convoId, cached: true } })}\n\n`));

                    controller.enqueue(enc.encode(`data: ${JSON.stringify({ contentDelta: last?.content || "[Empty previous assistant message]" })}\n\n`));
                    controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                    controller.close();
                }

            });

            return new Response(stream, sseInit());
        }

        // Nếu muốn xử lý tiếp (force hoặc cache rỗng) -> đổi key tránh @unique
        if (dup) idem = `${idem}:retry:${Date.now()}`;

        // Lưu USER message
        await prisma.message.create({
            data: {
                conversationId: convoId!,
                role: "USER",
                content: body.message,
                idempotencyKey: idem,
            },
        });

        // Chuẩn bị lịch sử
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

        // MOCK mode: phát vài chunk giả cho chắc
        if (process.env.MOCK_AI === "1") {
            const chunks = [`ĐÃ`, ` NHẬN: "`, body.message, `" (mock)`];
            const stream = new ReadableStream({
                async start(controller) {
                    const enc = new TextEncoder();
                    for (const c of chunks) {
                        controller.enqueue(enc.encode(sseLine({ contentDelta: c })));
                        await new Promise((r) => setTimeout(r, 80));
                    }
                    controller.enqueue(enc.encode(sseLine({ done: true })));

                    // Lưu full assistant vào DB
                    await prisma.message.create({
                        data: {
                            conversationId: convoId!,
                            role: "ASSISTANT",
                            content: chunks.join(""),
                            model: "mock",
                        },
                    });

                    controller.close();
                },
            });
            return new Response(stream, sseInit());
        }

        // Provider thật
        const provider = getProvider();
        const model = process.env.AI_MODEL || "gpt-4o-mini";
        const aiStream = provider.stream({
            model,
            messages,
            temperature: body.temperature ?? 0.3,
        });

        let full = "";

        const stream = new ReadableStream({
            async start(controller) {
                const enc = new TextEncoder();

                try {
                    for await (const chunk of aiStream) {
                        if (chunk.contentDelta) {
                            full += chunk.contentDelta;
                            controller.enqueue(enc.encode(sseLine({ contentDelta: chunk.contentDelta })));
                        }
                        if (chunk.done) break;
                    }

                    const safe = full.trim() || "Xin lỗi, hiện model không trả nội dung. Vui lòng thử lại.";
                    // Lưu assistant vào DB
                    await prisma.message.create({
                        data: {
                            conversationId: convoId!,
                            role: "ASSISTANT",
                            content: safe,
                            model,
                        },
                    });

                    controller.enqueue(enc.encode(sseLine({ done: true })));
                    controller.close();
                } catch (err: any) {
                    // đẩy lỗi ra stream cho client biết
                    controller.enqueue(enc.encode(sseLine({ error: err?.message || "STREAM_ERROR", done: true })));
                    controller.close();
                }
            },
        });

        return new Response(stream, sseInit());
    } catch (e: any) {
        // Lỗi sớm (chưa kịp tạo stream) -> trả 200 + SSE 1 dòng báo lỗi
        return new Response(sseLine({ error: e?.message || "UNKNOWN", conversationId: convoId, done: true }), sseInit());
    }
}

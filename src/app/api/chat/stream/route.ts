// src/app/api/chat/stream/route.ts
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getProvider } from "@/lib/provider";
import { hashIdempotency } from "@/lib/ids";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export const dynamic = "force-dynamic"; // đảm bảo không cache

function sseInit() {
    return {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    };
}
function sseLine(obj: unknown) {
    return `data: ${JSON.stringify(obj)}\n\n`;
}

// ⚠️ withRateLimit kỳ vọng (req: Request) => Promise<Response>
export const POST = withRateLimit(async (req: Request) => {
    let convoId: string | undefined;

    try {
        const userId = await requireUserId(); // 401 nếu chưa đăng nhập

        // Parse body
        const body = (await req.json()) as {
            conversationId?: string;
            message: string;
            systemPrompt?: string;
            temperature?: number;
            force?: boolean;
            idempotencyKey?: string;
        };

        const msg = (body?.message ?? "").trim();
        if (!msg) {
            // SSE trả 1 dòng lỗi + done
            return new Response(sseLine({ error: "EMPTY_MESSAGE", done: true }), sseInit());
        }

        // Lấy / tạo conversation TRƯỚC
        convoId = (body.conversationId || "").trim();
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

        // Idempotency theo hội thoại + bucket phút (áp dụng cho ASSISTANT message)
        const minuteBucket = Math.floor(Date.now() / 60_000);
        let idem =
            body.idempotencyKey ||
            hashIdempotency({ userId, conversationId: convoId, m: msg, bucket: minuteBucket });

        // Tìm câu trả lời assistant đã ghi với key này TRONG CÙNG HỘI THOẠI
        const dupAssistant = await prisma.message.findFirst({
            where: { conversationId: convoId!, role: "ASSISTANT", idempotencyKey: idem },
            orderBy: { createdAt: "desc" },
            select: { content: true },
        });

        if (dupAssistant && !body.force) {
            // Trả lại từ cache (1 phát)
            const stream = new ReadableStream({
                start(controller) {
                    const enc = new TextEncoder();
                    controller.enqueue(
                        enc.encode(sseLine({ meta: { conversationId: convoId, cached: true } })),
                    );
                    controller.enqueue(enc.encode(sseLine({ contentDelta: dupAssistant.content })));
                    controller.enqueue(enc.encode(sseLine({ done: true })));
                    controller.close();
                },
            });
            return new Response(stream, sseInit());
        }
        if (dupAssistant && body.force) {
            // Ép chạy lại → đổi key để không đụng unique (convoId, idempotencyKey)
            idem = `${idem}:retry:${Date.now()}`;
        }

        // LƯU USER message (❗️không set idempotencyKey ở USER để tránh conflict)
        await prisma.message.create({
            data: { conversationId: convoId!, role: "USER", content: msg },
        });

        // Lịch sử: lấy mới nhất → đảo ngược để giữ thứ tự thời gian cũ → mới
        const limit = Number(process.env.MAX_HISTORY || 16);
        const history = await prisma.message.findMany({
            where: { conversationId: convoId! },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: { role: true, content: true },
        });
        const convo = await prisma.conversation.findUnique({
            where: { id: convoId! },
            select: { systemPrompt: true, model: true }, // ✅ LẤY CẢ model
        });

        const messages = [
            ...(convo?.systemPrompt ? [{ role: "system" as const, content: convo.systemPrompt }] : []),
            ...history
                .reverse()
                .map((m) => ({
                    role: m.role.toLowerCase() as "user" | "assistant",
                    content: m.content,
                })),
        ];

        // MOCK mode
        if (process.env.MOCK_AI === "1") {
            const chunks = [`ĐÃ`, ` NHẬN: "`, msg, `" (mock)`];
            const stream = new ReadableStream({
                async start(controller) {
                    const enc = new TextEncoder();
                    controller.enqueue(
                        enc.encode(sseLine({ meta: { conversationId: convoId, cached: false } })),
                    );
                    for (const c of chunks) {
                        controller.enqueue(enc.encode(sseLine({ contentDelta: c })));
                        await new Promise((r) => setTimeout(r, 80));
                    }
                    const full = chunks.join("");

                    await prisma.message.create({
                        data: {
                            conversationId: convoId!,
                            role: "ASSISTANT",
                            content: full,
                            model: "mock",
                            idempotencyKey: idem,
                        },
                    });
                    await prisma.conversation.update({
                        where: { id: convoId! },
                        data: { updatedAt: new Date() },
                    });

                    controller.enqueue(enc.encode(sseLine({ done: true })));
                    controller.close();
                },
            });
            return new Response(stream, sseInit());
        }

        // Provider thật (stream)
        const provider = getProvider();
        const model = convo?.model ?? DEFAULT_MODEL_ID; // ✅ chọn model từ hội thoại, fallback default
        const aiStream = provider.stream({
            model,
            messages,
            temperature: body.temperature ?? 0.3,
        });

        let full = "";
        const stream = new ReadableStream({
            async start(controller) {
                const enc = new TextEncoder();
                controller.enqueue(
                    enc.encode(sseLine({ meta: { conversationId: convoId, cached: false } })),
                );

                try {
                    for await (const chunk of aiStream) {
                        if (chunk.contentDelta) {
                            full += chunk.contentDelta;
                            controller.enqueue(enc.encode(sseLine({ contentDelta: chunk.contentDelta })));
                        }
                        if (chunk.done) break;
                    }

                    const safe =
                        full.trim() || "Xin lỗi, hiện model không trả nội dung. Vui lòng thử lại.";

                    await prisma.message.create({
                        data: {
                            conversationId: convoId!,
                            role: "ASSISTANT",
                            content: safe,
                            model,
                            idempotencyKey: idem,
                        },
                    });
                    await prisma.conversation.update({
                        where: { id: convoId! },
                        data: { updatedAt: new Date() },
                    });

                    controller.enqueue(enc.encode(sseLine({ done: true })));
                    controller.close();
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    controller.enqueue(
                        enc.encode(sseLine({ error: message || "STREAM_ERROR", done: true })),
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, sseInit());
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return new Response(
            sseLine({ error: message || "UNKNOWN", conversationId: convoId, done: true }),
            sseInit(),
        );
    }
}, { scope: "chat-stream", limit: 20, windowMs: 60_000, burst: 20 });

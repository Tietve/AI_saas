import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ModelId, Role } from '@prisma/client'
import { estimateTokensFromText, estimateTokensFromMessages } from '@/lib/tokenizer/estimate'
import { getUsageSummary, canSpend, recordUsage } from '@/lib/billing/quota'
import { defaultModel, cheaperAlternatives, toProviderModelId } from '@/lib/ai/models'
import { streamChat } from '@/lib/ai/adapter'
import { streamSSEFromGenerator } from '@/lib/http/sse'
import { withRateLimit } from '@/lib/rate-limit/withRateLimit'
import { getUserIdFromSession } from '@/lib/auth/session'

const DEBUG = process.env.NODE_ENV === 'development'

type SendReq = {
    conversationId?: string
    content?: string
    model?: string
    requestId?: string
    systemPrompt?: string  // Added to accept bot's system prompt
    botId?: string  // Added to track which bot is being used
}

const HISTORY_LIMIT = 20
const OUTPUT_RESERVE = 500
const MAX_INPUT_CHARS = 8_000

export const POST = withRateLimit(async (req: Request) => {
    try {
        const body = (await req.json()) as SendReq

        // Auth (DEV): thay bằng session thực sau
        const userId = await getUserIdFromSession()
        if (!userId) return json(401, { code: 'UNAUTHENTICATED' })

        // Validate content
        const rawContent = String(body?.content ?? '').trim()
        if (!rawContent) return json(400, { code: 'BAD_REQUEST', message: 'Thiếu content.' })
        if (rawContent.length > MAX_INPUT_CHARS) {
            return json(400, { code: 'PER_REQUEST_TOO_LARGE', message: `Nội dung quá dài (> ${MAX_INPUT_CHARS} ký tự).` })
        }

        // Get system prompt from request (bot personality) or use default
        const botSystemPrompt = body?.systemPrompt
        const botId = body?.botId

        // ——— Conversation: cho phép auto-create khi rỗng hoặc "new"
        const requestedConvId = (body?.conversationId ?? '').trim()
        const requestedModel = coerceModelId(body?.model)
        const convo = await ensureConversation({
            userId,
            conversationId: requestedConvId,
            initialTitle: rawContent.slice(0, 80) || 'New chat',
            initialModel: requestedModel ?? defaultModel(),
            // Store bot system prompt and ID in conversation if it's a new conversation
            initialSystemPrompt: requestedConvId === 'new' || !requestedConvId ? botSystemPrompt : undefined,
            initialBotId: requestedConvId === 'new' || !requestedConvId ? botId : undefined
        })
        if (!convo) {
            return json(404, { code: 'NOT_FOUND', message: 'Conversation không tồn tại hoặc không thuộc về bạn.' })
        }

        // Idempotency: nếu requestId đã có assistant message -> trả lại ngay
        if (body?.requestId) {
            const existing = await prisma.message.findFirst({
                where: { conversationId: convo.id, role: Role.ASSISTANT, idempotencyKey: body.requestId },
                select: { content: true }
            })

            if (existing?.content) {
                const cached = existing.content
                async function* once() {
                    yield { delta: cached }
                }
                return streamSSEFromGenerator(once())
            }
        }

        // --- Model resolver: map string -> ModelId enum
        const getDesiredModel = (requestedModel?: ModelId | null, convo?: { model: string | null } ): ModelId => {
            // 1) Nếu body có model và hợp lệ enum
            if (requestedModel && Object.values(ModelId).includes(requestedModel as ModelId)) {
                return requestedModel as ModelId
            }

            // 2) Nếu Conversation có model (đang lưu dạng string)
            if (convo?.model) {
                const modelPartRaw = convo.model.split(':').pop() || convo.model
                const key = modelPartRaw.toLowerCase()

                const modelMapping: Record<string, ModelId> = {
                    // OpenAI
                    'gpt-4o-mini': ModelId.gpt_4o_mini,
                    'gpt-4o': ModelId.gpt_4o,
                    'gpt-4-turbo': ModelId.gpt_4_turbo,
                    'gpt-3.5-turbo': ModelId.gpt_3_5_turbo,

                    // Anthropic
                    'claude-3-opus': ModelId.claude_3_opus,
                    'claude-3.5-sonnet': ModelId.claude_3_5_sonnet,
                    'claude-3.5-haiku': ModelId.claude_3_5_haiku,

                    // Google
                    'gemini-1.5-pro': ModelId.gemini_1_5_pro,
                    'gemini-1.5-flash': ModelId.gemini_1_5_flash,
                    'gemini-2.0-flash': ModelId.gemini_2_0_flash,

                    // Legacy
                    'gpt5_mini': ModelId.gpt5_mini,
                    'gpt4o_mini': ModelId.gpt4o_mini,
                }

                const mapped = modelMapping[key]
                if (mapped) return mapped
            }

            // 3) Fallback
            return defaultModel()
        }

        const desiredModel: ModelId = getDesiredModel(requestedModel, convo)

        // Lấy 20 tin NHỮNG LẦN GẦN NHẤT
        const recent = await prisma.message.findMany({
            where: { conversationId: convo.id },
            orderBy: { createdAt: 'desc' },
            select: { role: true, content: true },
            take: HISTORY_LIMIT
        })
        const preparedHistory = recent
            .reverse()
            .map(m => ({ role: m.role.toLowerCase() as 'user' | 'assistant' | 'system', content: m.content }))

        // Ước lượng token
        const estimateIn = estimateTokensFromMessages(preparedHistory) + estimateTokensFromText(rawContent)
        const estimateOut = OUTPUT_RESERVE
        const estimateTotal = estimateIn + estimateOut

        // Quota guard
        const preCheck = await canSpend(userId, estimateTotal)
        if (!preCheck.ok) {
            if (preCheck.reason === 'PER_REQUEST_TOO_LARGE') {
                return json(400, { code: 'PER_REQUEST_TOO_LARGE', message: 'Thông điệp quá dài, hãy rút gọn hoặc chia nhỏ.' })
            }
            const q = await getUsageSummary(userId)
            return json(402, { code: 'QUOTA_EXCEEDED', message: 'Bạn đã vượt hạn mức tháng.', quota: q })
        }

        // Lưu USER message
        await prisma.message.create({
            data: { conversationId: convo.id, role: Role.USER, content: rawContent }
        })

        // Determine which system prompt to use
        // Priority: bot system prompt from request > conversation system prompt > default
        const effectiveSystemPrompt = botSystemPrompt || convo.systemPrompt || 'You are a helpful AI assistant.'

        // Build messages gửi provider
        const sys = [{ role: 'system' as const, content: effectiveSystemPrompt }]
        const allMessages = [...sys, ...preparedHistory, { role: 'user' as const, content: rawContent }]

        // Streaming với fallback provider
        const controller = new AbortController()
        const startedAt = Date.now()
        const candidates: { enum: ModelId; id: string }[] = [
            { enum: desiredModel, id: toProviderModelId(desiredModel) },
            ...cheaperAlternatives(desiredModel).map(m => ({ enum: m, id: toProviderModelId(m) }))
        ]

        const gen = (async function* () {
            let picked: { enum: ModelId; id: string } | null = null
            let fullText = ''
            const promptTokens = estimateIn
            let lastErrorMessage = ''

            // Add metadata about conversation and bot
            yield {
                meta: {
                    conversationId: convo.id,
                    model: desiredModel,
                    systemPrompt: effectiveSystemPrompt
                }
            }

            for (const c of candidates) {
                try {
                    picked = c
                    for await (const chunk of streamChat({
                        model: c.id,
                        system: effectiveSystemPrompt,
                        messages: allMessages,
                        signal: controller.signal
                    })) {
                        const delta = chunk.delta ?? ''
                        if (delta) {
                            fullText += delta
                            yield { delta }
                        }
                        if (DEBUG && delta) {
                            console.log('[chat/send] Streaming delta:', delta.substring(0, 50))
                        }
                    }
                    // OK -> dừng fallback
                    break
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    lastErrorMessage = msg
                    const low = msg.toLowerCase()
                    const isHard = low.includes('input too large') || low.includes('content too long') || low.includes('invalid api key')
                    if (isHard) break
                    continue
                }
            }

            if (!picked || (fullText.length === 0 && lastErrorMessage)) {
                throw new Error(lastErrorMessage || 'Model unavailable')
            }

            const latencyMs = Date.now() - startedAt
            const completionTokens = estimateTokensFromText(fullText)

            // Lưu ASSISTANT message
            let assistantMsgId: string | null = null
            try {
                const assistantMsg = await prisma.message.create({
                    data: {
                        conversationId: convo.id,
                        role: Role.ASSISTANT,
                        content: fullText,
                        model: picked.id,
                        promptTokens,
                        completionTokens,
                        latencyMs,
                        idempotencyKey: body?.requestId ?? null
                    },
                    select: { id: true }
                })
                assistantMsgId = assistantMsg.id
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                if (msg.toLowerCase().includes('unique') && body?.requestId) {
                    const assistantMsg = await prisma.message.create({
                        data: {
                            conversationId: convo.id,
                            role: Role.ASSISTANT,
                            content: fullText,
                            model: picked.id,
                            promptTokens,
                            completionTokens,
                            latencyMs,
                            idempotencyKey: `${body.requestId}:${Date.now()}`
                        },
                        select: { id: true }
                    })
                    assistantMsgId = assistantMsg.id
                } else {
                    throw e
                }
            }

            // Cập nhật updatedAt của Conversation
            await prisma.conversation.update({
                where: { id: convo.id },
                data: { updatedAt: new Date() }
            })

            // Ghi usage
            await recordUsage({
                userId,
                model: picked.enum,
                tokensIn: promptTokens,
                tokensOut: completionTokens,
                meta: {
                    requestId: body?.requestId,
                    conversationId: convo.id,
                    messageId: assistantMsgId!,
                    latencyMs
                }
            })

            // Signal completion
            yield { done: true }
        })()

        return streamSSEFromGenerator(gen, {
            onClose: () => controller.abort()
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[chat/send]', message)
        return json(500, { code: 'INTERNAL', message })
    }
}, { scope: 'chat-send', limit: 20, windowMs: 60_000, burst: 20 })

// ---------- Helpers ----------
function json(status: number, data: unknown) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
}

function coerceModelId(input?: string | null): ModelId | null {
    if (!input) return null

    if ((Object.values(ModelId) as string[]).includes(input as string)) {
        return input as ModelId
    }

    const key = input.toLowerCase()
    const modelMapping: Record<string, ModelId> = {
        'gpt-4o-mini': ModelId.gpt_4o_mini,
        'gpt-4o': ModelId.gpt_4o,
        'gpt-4-turbo': ModelId.gpt_4_turbo,
        'gpt-3.5-turbo': ModelId.gpt_3_5_turbo,
        'claude-3-opus': ModelId.claude_3_opus,
        'claude-3.5-sonnet': ModelId.claude_3_5_sonnet,
        'claude-3.5-haiku': ModelId.claude_3_5_haiku,
        'gemini-1.5-pro': ModelId.gemini_1_5_pro,
        'gemini-1.5-flash': ModelId.gemini_1_5_flash,
        'gemini-2.0-flash': ModelId.gemini_2_0_flash,
    }

    return modelMapping[key] ?? null
}

async function ensureConversation(args: {
    userId: string
    conversationId?: string
    initialTitle: string
    initialModel: ModelId
    initialSystemPrompt?: string  // Added to store bot system prompt
    initialBotId?: string  // Added to store bot ID
}) {
    const cid = (args.conversationId ?? '').trim().toLowerCase()

    // Auto create new conversation
    if (!cid || cid === 'new') {
        return prisma.conversation.create({
            data: {
                userId: args.userId,
                title: args.initialTitle,
                model: args.initialModel,
                systemPrompt: args.initialSystemPrompt,  // Store bot's system prompt
                botId: args.initialBotId  // Store bot ID
            },
            select: { id: true, userId: true, systemPrompt: true, model: true, botId: true }
        })
    }

    // Find existing conversation
    const found = await prisma.conversation.findUnique({
        where: { id: args.conversationId! },
        select: { id: true, userId: true, systemPrompt: true, model: true, botId: true }
    })
    if (!found || found.userId !== args.userId) return null
    return found
}
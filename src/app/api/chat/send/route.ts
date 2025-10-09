/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send chat message (production endpoint)
 *     description: |
 *       Primary chat endpoint with full feature support including:
 *       - Multi-provider AI routing (OpenAI, Anthropic, Google)
 *       - Streaming responses via Server-Sent Events
 *       - File attachments (images, PDFs, documents)
 *       - Usage quota management and billing
 *       - Rate limiting and daily limits for free tier
 *       - Idempotency support
 *       - Automatic model fallback
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: User's message content
 *                 example: Explain quantum computing
 *               conversationId:
 *                 type: string
 *                 description: Conversation ID or 'new' for new conversation
 *                 example: clxxx123456
 *               model:
 *                 type: string
 *                 description: Requested AI model (restricted for free tier)
 *                 enum: [gpt-4o-mini, gpt-4o, gpt-3.5-turbo, claude-3.5-sonnet, gemini-1.5-flash]
 *               systemPrompt:
 *                 type: string
 *                 description: System prompt for the conversation
 *               botId:
 *                 type: string
 *                 description: Bot personality ID
 *               requestId:
 *                 type: string
 *                 description: Idempotency key for request deduplication
 *               attachments:
 *                 type: array
 *                 description: File attachments (images, PDFs, documents)
 *                 items:
 *                   type: object
 *                   properties:
 *                     kind:
 *                       type: string
 *                       enum: [image, file, pdf, document]
 *                     url:
 *                       type: string
 *                     meta:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         mimeType:
 *                           type: string
 *                         extractedText:
 *                           type: string
 *     responses:
 *       200:
 *         description: Streaming SSE response with chat chunks
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: |
 *                 Server-Sent Events stream containing:
 *                 - meta: conversation metadata
 *                 - delta: text chunks
 *                 - done: completion signal
 *       400:
 *         description: Invalid request (content too large, missing content, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   enum: [BAD_REQUEST, PER_REQUEST_TOO_LARGE]
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: UNAUTHENTICATED
 *       402:
 *         description: Quota exceeded or daily limit reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   enum: [QUOTA_EXCEEDED, DAILY_LIMIT_EXCEEDED]
 *                 message:
 *                   type: string
 *                 showUpgrade:
 *                   type: boolean
 *                 quota:
 *                   type: object
 *                 usage:
 *                   type: object
 *       404:
 *         description: User or conversation not found
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: RATE_LIMITED
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { ModelId, Role, Prisma } from '@prisma/client'
import { estimateTokensFromText, estimateTokensFromMessages } from '@/lib/tokenizer/estimate'
import { getUsageSummary, canSpend, recordUsage } from '@/lib/billing/quota'
import { defaultModel, cheaperAlternatives, toProviderModelId } from '@/lib/ai/models'
import { streamChat } from '@/lib/ai/adapter'
import { streamSSEFromGenerator } from '@/lib/http/sse'
import { getUserIdFromSession } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
const DEBUG = process.env.NODE_ENV === 'development'

type AttachmentPayload = {
    id?: string
    kind?: string
    url?: string
    meta?: unknown
}

type NormalizedAttachment = {
    kind: 'image' | 'file' | 'pdf' | 'document'
    url: string
    meta?: Prisma.InputJsonValue
}

type SendReq = {
    conversationId?: string
    content?: string
    model?: string
    requestId?: string
    systemPrompt?: string
    botId?: string
    attachments?: AttachmentPayload[]
}

const HISTORY_LIMIT = 20
const OUTPUT_RESERVE = 500
const MAX_INPUT_CHARS = 8_000

const FREE_MODELS = ['gpt_4o_mini', 'gpt_3_5_turbo']
const FALLBACK_MODEL = ModelId.gpt_3_5_turbo

// Simple rate limiting without complex wrappers
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const limit = 60
    const window = 60000 // 1 minute

    const userLimit = requestCounts.get(userId)

    if (!userLimit || now > userLimit.resetTime) {
        requestCounts.set(userId, { count: 1, resetTime: now + window })
        return true
    }

    if (userLimit.count >= limit) {
        return false
    }

    userLimit.count++
    return true
}

export async function POST(req: Request) {
    try {
        // Get userId first
        const userId = await getUserIdFromSession()

        if (!userId) {
            return json(401, { code: 'UNAUTHENTICATED' })
        }

        // Simple rate limiting
        if (!checkRateLimit(userId)) {
            return json(429, {
                code: 'RATE_LIMITED',
                message: 'Too many requests. Please try again later.'
            })
        }

        const body = (await req.json()) as SendReq

        const attachments = normalizeAttachments(body?.attachments)

        // Debug logging
        if (body?.attachments && body.attachments.length > 0) {
            console.log('[chat/send] Received attachments:', JSON.stringify(body.attachments, null, 2))
            console.log('[chat/send] Normalized attachments:', JSON.stringify(attachments, null, 2))
        }

        const rawContent = String(body?.content ?? '').trim()

        if (rawContent.length > MAX_INPUT_CHARS) {
            return json(400, {
                code: 'PER_REQUEST_TOO_LARGE',
                message: `Nội dung quá dài (> ${MAX_INPUT_CHARS} ký tự).`
            })
        }

        if (!rawContent && attachments.length === 0) {
            return json(400, {
                code: 'BAD_REQUEST',
                message: 'Thiếu nội dung hoặc tệp đính kèm.'
            })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        currentPeriodEnd: { gte: new Date() }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!user) {
            return json(404, {
                code: 'NOT_FOUND',
                message: 'User không tồn tại.'
            })
        }

        const currentPlan = user.subscriptions[0]?.planTier || user.planTier || 'FREE'
        const isFreeTier = currentPlan === 'FREE'

        // Check daily limit for free users
        if (isFreeTier) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const dailyUsage = await prisma.dailyUsageRecord.findUnique({
                where: {
                    userId_date: {
                        userId: userId,
                        date: today
                    }
                }
            })

            const messagesUsedToday = dailyUsage?.messageCount || 0
            const dailyLimit = 20

            if (messagesUsedToday >= dailyLimit) {
                return json(402, {
                    code: 'DAILY_LIMIT_EXCEEDED',
                    message: `Bạn đã hết ${dailyLimit} tin nhắn miễn phí hôm nay.`,
                    showUpgrade: true,
                    usage: {
                        daily: messagesUsedToday,
                        dailyLimit: dailyLimit,
                        resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                })
            }
        }

        const textOnlyCombined = combineContentWithAttachments(rawContent, attachments)
        const firstAttachmentName = attachments
            .map(att => getMetaString(att.meta, 'name'))
            .find(name => typeof name === 'string') as string | undefined

        const botSystemPrompt = body?.systemPrompt
        const botId = body?.botId

        const requestedConvId = (body?.conversationId ?? '').trim()
        let requestedModel = coerceModelId(body?.model)

        // Restrict models for FREE users
        if (isFreeTier && requestedModel) {
            const modelStr = requestedModel.toString()
            if (!FREE_MODELS.includes(modelStr)) {
                console.log(`[chat/send] FREE user tried to use ${modelStr}, fallback to ${FALLBACK_MODEL}`)
                requestedModel = FALLBACK_MODEL
            }
        }

        const initialPreview = rawContent || firstAttachmentName || 'New chat'

        const convo = await ensureConversation({
            userId,
            conversationId: requestedConvId,
            initialTitle: initialPreview.slice(0, 80) || 'New chat',
            initialModel: requestedModel ?? (isFreeTier ? FALLBACK_MODEL : defaultModel()),
            initialSystemPrompt: requestedConvId === 'new' || !requestedConvId ? botSystemPrompt : undefined,
            initialBotId: requestedConvId === 'new' || !requestedConvId ? botId : undefined
        })

        if (!convo) {
            return json(404, {
                code: 'NOT_FOUND',
                message: 'Conversation không tồn tại hoặc không thuộc về bạn.'
            })
        }

        // Check idempotency
        if (body?.requestId) {
            const existing = await prisma.message.findFirst({
                where: {
                    conversationId: convo.id,
                    role: Role.ASSISTANT,
                    idempotencyKey: body.requestId
                },
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

        const desiredModel = getDesiredModel(requestedModel, convo, isFreeTier)

        // Get message history
        const recent = await prisma.message.findMany({
            where: { conversationId: convo.id },
            orderBy: { createdAt: 'desc' },
            select: {
                role: true,
                content: true,
                attachments: {
                    select: {
                        kind: true,
                        url: true,
                        meta: true
                    }
                }
            },
            take: HISTORY_LIMIT
        })

        const preparedHistory = recent
            .reverse()
            .map(m => ({
                role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
                content: combineContentWithAttachments(m.content, normalizeAttachments(m.attachments))
            }))

        // Check quota
        const estimateIn = estimateTokensFromMessages(preparedHistory) + estimateTokensFromText(textOnlyCombined)
        const estimateOut = OUTPUT_RESERVE
        const estimateTotal = estimateIn + estimateOut

        const preCheck = await canSpend(userId, estimateTotal)
        if (!preCheck.ok) {
            if (preCheck.reason === 'PER_REQUEST_TOO_LARGE') {
                return json(400, {
                    code: 'PER_REQUEST_TOO_LARGE',
                    message: 'Thông điệp quá dài, hãy rút gọn hoặc chia nhỏ.'
                })
            }
            const q = await getUsageSummary(userId)
            return json(402, {
                code: 'QUOTA_EXCEEDED',
                message: 'Bạn đã vượt hạn mức.',
                showUpgrade: isFreeTier,
                quota: q
            })
        }

        // Update daily usage for free users
        if (isFreeTier) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            await prisma.dailyUsageRecord.upsert({
                where: {
                    userId_date: {
                        userId: userId,
                        date: today
                    }
                },
                update: {
                    messageCount: { increment: 1 },
                    modelUsed: desiredModel.toString(),
                    updatedAt: new Date()
                },
                create: {
                    userId: userId,
                    date: today,
                    messageCount: 1,
                    modelUsed: desiredModel.toString()
                }
            })
        }

        // Save user message
        const userDbMessage = await prisma.message.create({
            data: {
                conversationId: convo.id,
                role: Role.USER,
                content: rawContent
            },
            select: { id: true }
        })

        if (attachments.length > 0) {
            await prisma.attachment.createMany({
                data: attachments.map(att => ({
                    conversationId: convo.id,
                    messageId: userDbMessage.id,
                    kind: att.kind,
                    url: att.url,
                    meta: att.meta === undefined ? undefined : att.meta
                }))
            })
        }

        const effectiveSystemPrompt = botSystemPrompt || convo.systemPrompt || 'You are a helpful AI assistant.'
        const sys = [{ role: 'system' as const, content: effectiveSystemPrompt }]

        // Build messages for AI
        const providerModelId = toProviderModelId(desiredModel)
        const isOpenAIVision = providerModelId.includes('gpt-4o') || providerModelId.includes('gpt-4-turbo')

        const imageAttachments = attachments.filter(a => a.kind === 'image')
        const finalUserMessage = (isOpenAIVision && imageAttachments.length > 0)
            ? {
                role: 'user' as const,
                content: await buildMultimodalContent(rawContent, imageAttachments)
            }
            : { role: 'user' as const, content: textOnlyCombined }

        const allMessages = [...sys, ...preparedHistory, finalUserMessage]

        const controller = new AbortController()
        const startedAt = Date.now()

        let candidates: { enum: ModelId; id: string }[]
        if (isFreeTier) {
            candidates = [{ enum: desiredModel, id: toProviderModelId(desiredModel) }]
        } else {
            candidates = [
                { enum: desiredModel, id: toProviderModelId(desiredModel) },
                ...cheaperAlternatives(desiredModel).map(m => ({ enum: m, id: toProviderModelId(m) }))
            ]
        }

        // Create the streaming generator
        const gen = createStreamingGenerator({
            candidates,
            allMessages,
            effectiveSystemPrompt,
            controller,
            estimateIn,
            convo,
            currentPlan,
            desiredModel,
            userId,
            body,
            startedAt
        })

        // Return the SSE stream response
        return streamSSEFromGenerator(gen, {
            onClose: () => controller.abort()
        })

    } catch (error) {
        console.error('[Chat Send] Unexpected error:', error)
        return json(500, {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred.'
        })
    }
}

// Create the streaming generator separately
async function* createStreamingGenerator(params: {
    candidates: { enum: ModelId; id: string }[]
    allMessages: any[]
    effectiveSystemPrompt: string
    controller: AbortController
    estimateIn: number
    convo: any
    currentPlan: string
    desiredModel: ModelId
    userId: string
    body: any
    startedAt: number
}) {
    const {
        candidates,
        allMessages,
        effectiveSystemPrompt,
        controller,
        estimateIn,
        convo,
        currentPlan,
        desiredModel,
        userId,
        body,
        startedAt
    } = params

    let picked: { enum: ModelId; id: string } | null = null
    let fullText = ''
    const promptTokens = estimateIn
    let lastErrorMessage = ''

    // Send metadata first
    yield {
        meta: {
            conversationId: convo.id,
            model: desiredModel,
            systemPrompt: effectiveSystemPrompt,
            planTier: currentPlan
        }
    }

    // Try each candidate model
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
            break // Success
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            lastErrorMessage = msg
            const low = msg.toLowerCase()
            const isHard = low.includes('input too large') ||
                low.includes('content too long') ||
                low.includes('invalid api key')
            if (isHard) break
            continue
        }
    }

    if (!picked || (fullText.length === 0 && lastErrorMessage)) {
        throw new Error(lastErrorMessage || 'Model unavailable')
    }

    const latencyMs = Date.now() - startedAt
    const completionTokens = estimateTokensFromText(fullText)

    // Save assistant message
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


    // Update conversation timestamp
    await prisma.conversation.update({
        where: { id: convo.id },
        data: { updatedAt: new Date() }
    })

    // Record usage
    await recordUsage({
        userId,
        model: picked.enum,
        tokensIn: promptTokens,
        tokensOut: completionTokens,
        meta: {
            requestId: body?.requestId,
            conversationId: convo.id,
            messageId: assistantMsgId!,
            latencyMs,
            planTier: currentPlan
        }
    })

    yield { done: true }
}

// Helper functions
function normalizeAttachments(input: unknown): NormalizedAttachment[] {
    if (!Array.isArray(input)) return []

    const normalized: NormalizedAttachment[] = []
    for (const item of input) {
        if (!item || typeof item !== 'object') continue
        const raw = item as { kind?: unknown; url?: unknown; meta?: unknown }
        if (typeof raw.url !== 'string') continue

        const kind = raw.kind === 'image' ? 'image' : 'file'
        let meta: Prisma.InputJsonValue | undefined
        if (raw.meta !== undefined) {
            if (raw.meta === null) {
                meta = undefined
            } else if (typeof raw.meta === 'object') {
                meta = raw.meta as Prisma.InputJsonValue
            }
        }

        normalized.push({ kind, url: raw.url, meta })
    }

    return normalized
}

function getMetaString(meta: Prisma.InputJsonValue | undefined, key: string): string | undefined {
    if (!meta || typeof meta !== 'object' || meta === null) return undefined
    const record = meta as Record<string, unknown>
    const value = record[key]
    return typeof value === 'string' ? value : undefined
}

function buildAttachmentSummary(attachments: NormalizedAttachment[]): string {
    if (!attachments.length) return ''

    const sections: string[] = []

    attachments.forEach((att, index) => {
        const name = getMetaString(att.meta, 'name') ?? att.url.split('/').pop() ?? att.url
        const mime = getMetaString(att.meta, 'mimeType')
        const extractedText = getMetaString(att.meta, 'extractedText')

        console.log('[buildAttachmentSummary] Processing attachment:', {
            index,
            name,
            mime,
            hasExtractedText: !!extractedText,
            extractedTextLength: extractedText?.length || 0
        })

        // Build header for this attachment
        const parts = [name]
        if (mime) parts.push(mime)
        const header = `${index + 1}. ${parts.filter(Boolean).join(' · ')}`.trim()

        // If there's extracted text, include it
        if (extractedText && extractedText.length > 0) {
            sections.push(`${header}\n\nNội dung tài liệu:\n---\n${extractedText}\n---`)
        } else {
            sections.push(header)
        }
    })

    return sections.join('\n\n')
}

function combineContentWithAttachments(content: string, attachments: NormalizedAttachment[]): string {
    const summary = buildAttachmentSummary(attachments)
    if (!summary) {
        return content
    }

    const segments: string[] = []
    if (content && content.trim().length > 0) {
        segments.push(content)
    }
    segments.push(`Đính kèm:\n${summary}`)
    return segments.join('\n\n')
}

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
        'gpt-5-nano': ModelId.gpt_5_nano,
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

function getDesiredModel(requestedModel: ModelId | null, convo: any, isFreeTier: boolean): ModelId {
    const FREE_MODELS = ['gpt_4o_mini', 'gpt_3_5_turbo']
    const FALLBACK_MODEL = ModelId.gpt_3_5_turbo

    if (requestedModel && Object.values(ModelId).includes(requestedModel as ModelId)) {
        if (isFreeTier) {
            const modelStr = (requestedModel as ModelId).toString()
            if (!FREE_MODELS.includes(modelStr)) {
                return FALLBACK_MODEL
            }
        }
        return requestedModel as ModelId
    }

    if (convo?.model) {
        const modelPartRaw = convo.model.split(':').pop() || convo.model
        const key = modelPartRaw.toLowerCase()

        const modelMapping: Record<string, ModelId> = {
            'gpt-4o-mini': ModelId.gpt_4o_mini,
            'gpt-4o': ModelId.gpt_4o,
            'gpt-5-nano': ModelId.gpt_5_nano,
            'gpt-4-turbo': ModelId.gpt_4_turbo,
            'gpt-3.5-turbo': ModelId.gpt_3_5_turbo,
            'claude-3-opus': ModelId.claude_3_opus,
            'claude-3.5-sonnet': ModelId.claude_3_5_sonnet,
            'claude-3.5-haiku': ModelId.claude_3_5_haiku,
            'gemini-1.5-pro': ModelId.gemini_1_5_pro,
            'gemini-1.5-flash': ModelId.gemini_1_5_flash,
            'gemini-2.0-flash': ModelId.gemini_2_0_flash,
        }

        const mapped = modelMapping[key]
        if (mapped) {
            if (isFreeTier && !FREE_MODELS.includes(mapped.toString())) {
                return FALLBACK_MODEL
            }
            return mapped
        }
    }

    return isFreeTier ? FALLBACK_MODEL : defaultModel()
}

async function buildMultimodalContent(rawContent: string, imageAttachments: NormalizedAttachment[]) {
    const parts = []

    if (rawContent) {
        parts.push({ type: 'text', text: rawContent })
    }

    for (const att of imageAttachments) {
        const imageUrl = await processImageAttachment(att)
        parts.push({ type: 'image_url', image_url: { url: imageUrl } })
    }

    return parts
}

async function processImageAttachment(att: { url: string; meta?: Prisma.InputJsonValue }): Promise<string> {
    try {
        const u = new URL(att.url)
        const host = u.hostname
        const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')
        if (!isLocalhost) {
            return att.url
        }
    } catch {}

    // Try to convert to base64 for local files
    const mime = getMetaString(att.meta as any, 'mimeType')
    const filePath = att.url.startsWith('/')
        ? path.join(process.cwd(), 'public', att.url)
        : path.join(process.cwd(), 'public', att.url)

    try {
        const data = await fs.readFile(filePath)
        const base64 = data.toString('base64')
        const inferredMime = mime || inferMimeFromPath(filePath) || 'image/png'
        return `data:${inferredMime};base64,${base64}`
    } catch {
        // Fallback to URL
        return toAbsoluteUrl(att.url)
    }
}

function inferMimeFromPath(p: string): string | null {
    const ext = path.extname(p).toLowerCase()
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
    if (ext === '.png') return 'image/png'
    if (ext === '.gif') return 'image/gif'
    if (ext === '.webp') return 'image/webp'
    return null
}

function toAbsoluteUrl(url: string): string {
    try {
        new URL(url)
        return url
    } catch {
        const origin = process.env.NEXT_PUBLIC_APP_URL || ''
        if (!origin) return url
        const base = origin.endsWith('/') ? origin.slice(0, -1) : origin
        return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
    }
}

async function ensureConversation(args: {
    userId: string
    conversationId?: string
    initialTitle: string
    initialModel: ModelId
    initialSystemPrompt?: string
    initialBotId?: string
}) {
    const cid = (args.conversationId ?? '').trim().toLowerCase()

    if (!cid || cid === 'new') {
        return prisma.conversation.create({
            data: {
                userId: args.userId,
                title: args.initialTitle,
                model: args.initialModel,
                systemPrompt: args.initialSystemPrompt,
                botId: args.initialBotId
            },
            select: { id: true, userId: true, systemPrompt: true, model: true, botId: true }
        })
    }

    const found = await prisma.conversation.findUnique({
        where: { id: args.conversationId! },
        select: { id: true, userId: true, systemPrompt: true, model: true, botId: true }
    })

    if (!found || found.userId !== args.userId) return null
    return found
}
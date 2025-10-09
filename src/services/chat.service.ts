/**
 * Chat Service
 *
 * Business logic for chat operations.
 * Orchestrates AI provider calls, quota checks, and message storage.
 */

import { injectable, inject } from 'tsyringe'
import { ConversationRepository } from '@/repositories/conversation.repository'
import { MessageRepository } from '@/repositories/message.repository'
import { QuotaService } from './quota.service'
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway'
import { estimateTokensFromText, estimateTokensFromMessages } from '@/lib/tokenizer/estimate'
import { ModelId, Role } from '@prisma/client'
import { logger, logAiRequest } from '@/lib/logger'

export interface SendMessageInput {
  userId: string
  conversationId?: string
  content: string
  model?: string
  systemPrompt?: string
  botId?: string
  requestId?: string
  attachments?: any[]
}

export interface SendMessageResult {
  conversationId: string
  messageId: string
  response: string
  model: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  latency: number
  cached: boolean
}

const HISTORY_LIMIT = 20
const OUTPUT_RESERVE = 500

@injectable()
export class ChatService {
  constructor(
    @inject(ConversationRepository) private conversationRepo: ConversationRepository,
    @inject(MessageRepository) private messageRepo: MessageRepository,
    @inject(QuotaService) private quotaService: QuotaService,
    @inject(MultiProviderGateway) private aiGateway: MultiProviderGateway
  ) {}

  /**
   * Send a chat message and get AI response
   */
  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const startTime = Date.now()

    // 1. Get or create conversation
    const conversation = await this.ensureConversation(input)

    // 2. Check for cached response (idempotency)
    if (input.requestId) {
      const cached = await this.messageRepo.findByIdempotencyKey(
        conversation.id,
        input.requestId
      )

      if (cached) {
        logger.info({ requestId: input.requestId }, 'Returning cached response (idempotency)')
        return {
          conversationId: conversation.id,
          messageId: cached.id,
          response: cached.content,
          model: cached.model || 'unknown',
          tokensIn: cached.promptTokens || 0,
          tokensOut: cached.completionTokens || 0,
          costUsd: 0,
          latency: Date.now() - startTime,
          cached: true,
        }
      }
    }

    // 3. Get message history for context
    const history = await this.messageRepo.getRecentForContext(
      conversation.id,
      HISTORY_LIMIT
    )

    const preparedHistory = history.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    // 4. Estimate tokens and check quota
    const estimateIn = estimateTokensFromMessages(preparedHistory) + estimateTokensFromText(input.content)
    const estimateOut = OUTPUT_RESERVE
    const estimateTotal = estimateIn + estimateOut

    const quotaCheck = await this.quotaService.canSpend(input.userId, estimateTotal)

    if (!quotaCheck.ok) {
      const error = new Error(quotaCheck.reason || 'QUOTA_EXCEEDED')
      error.name = quotaCheck.reason || 'QUOTA_EXCEEDED'
      throw error
    }

    // 5. Save user message
    const userMessage = await this.messageRepo.create({
      conversationId: conversation.id,
      role: Role.USER,
      content: input.content,
    })

    // 6. Call AI provider
    const systemPrompt = input.systemPrompt || conversation.systemPrompt || 'You are a helpful AI assistant.'
    const finalModel = input.model || conversation.model

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...preparedHistory,
      { role: 'user' as const, content: input.content },
    ]

    let aiResponse
    try {
      aiResponse = await this.aiGateway.routeRequest(input.content, {
        model: finalModel,
        messages,
      } as any)
    } catch (error) {
      logger.error({ err: error, userId: input.userId }, 'AI provider failed')
      throw new Error('AI_PROVIDER_FAILED')
    }

    const latency = Date.now() - startTime

    // 7. Save assistant message
    const assistantMessage = await this.messageRepo.create({
      conversationId: conversation.id,
      role: Role.ASSISTANT,
      content: aiResponse.content,
      model: aiResponse.model,
      promptTokens: aiResponse.usage?.promptTokens || estimateIn,
      completionTokens: aiResponse.usage?.completionTokens || estimateTokensFromText(aiResponse.content),
      latencyMs: latency,
      idempotencyKey: input.requestId,
    })

    // 8. Update conversation timestamp
    await this.conversationRepo.touch(conversation.id)

    // 9. Record usage
    const modelId = this.parseModelId(aiResponse.model || finalModel)
    await this.quotaService.recordUsage({
      userId: input.userId,
      model: modelId,
      tokensIn: aiResponse.usage?.promptTokens || estimateIn,
      tokensOut: aiResponse.usage?.completionTokens || estimateTokensFromText(aiResponse.content),
      costUsd: aiResponse.usage?.totalCost,
      meta: {
        requestId: input.requestId,
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        latencyMs: latency,
      },
    })

    return {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      response: aiResponse.content,
      model: aiResponse.model || finalModel,
      tokensIn: aiResponse.usage?.promptTokens || estimateIn,
      tokensOut: aiResponse.usage?.completionTokens || 0,
      costUsd: aiResponse.usage?.totalCost || 0,
      latency,
      cached: aiResponse.cached || false,
    }
  }

  /**
   * Get or create conversation
   */
  private async ensureConversation(input: SendMessageInput) {
    if (!input.conversationId || input.conversationId === 'new') {
      // Create new conversation
      return await this.conversationRepo.create({
        userId: input.userId,
        title: input.content.substring(0, 80) || 'New chat',
        model: input.model || 'gpt-4o-mini',
        systemPrompt: input.systemPrompt,
        botId: input.botId,
      })
    }

    // Get existing conversation
    const conversation = await this.conversationRepo.findById(input.conversationId)

    if (!conversation) {
      throw new Error('CONVERSATION_NOT_FOUND')
    }

    // Verify ownership
    if (conversation.userId !== input.userId) {
      throw new Error('FORBIDDEN')
    }

    return conversation
  }

  /**
   * Parse model ID from string
   */
  private parseModelId(model: string): ModelId {
    const mapping: Record<string, ModelId> = {
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

    return mapping[model] || ModelId.gpt_4o_mini
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, userId: string, limit = 50) {
    // Verify ownership
    const belongsToUser = await this.conversationRepo.belongsToUser(conversationId, userId)
    if (!belongsToUser) {
      throw new Error('FORBIDDEN')
    }

    return await this.messageRepo.findByConversationId(conversationId, { limit })
  }

  /**
   * Get user conversations
   */
  async getConversations(userId: string, limit = 50) {
    return await this.conversationRepo.findByUserId(userId, { limit })
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    // Verify ownership
    const belongsToUser = await this.conversationRepo.belongsToUser(conversationId, userId)
    if (!belongsToUser) {
      throw new Error('FORBIDDEN')
    }

    await this.conversationRepo.delete(conversationId)
  }
}

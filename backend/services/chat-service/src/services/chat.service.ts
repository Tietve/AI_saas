import { conversationRepository } from '../repositories/conversation.repository';
import { messageRepository } from '../repositories/message.repository';
import { tokenUsageRepository } from '../repositories/token-usage.repository';
import { openaiService, ChatMessage } from './openai.service'; // DEPRECATED: Use LLMService instead
import { billingClientService } from './billing-client.service';
import { db as prisma, withRetry } from '../config/database';

// NEW: Shared LLM Service with multi-provider support
import { LLMService, LLMProvider, LLMConfig } from '@saas/shared/services';
import { LLMGenerationResult } from '@saas/shared/services';
import { costMonitorService } from './cost-monitor.service';

export interface SendMessageResult {
  messageId: string;
  content: string;
  tokenCount: number;
  conversationId: string;
}

export class ChatService {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  /**
   * Auto-select LLM provider based on query complexity and user tier
   *
   * Strategy:
   * - Free users: Cloudflare Llama-2 for simple queries, GPT-3.5 for complex
   * - Paid users: GPT-3.5 for simple, GPT-4o for complex
   *
   * Complexity factors:
   * - Query length
   * - Technical terms
   * - Multiple questions
   */
  private selectProvider(userMessage: string, isPaidUser: boolean = false): LLMProvider {
    const complexity = this.estimateComplexity(userMessage);

    // Budget mode (free users or cost-conscious)
    if (!isPaidUser) {
      // Simple queries (<0.3): Use Llama-2 (saves 99% vs GPT-4)
      if (complexity < 0.3) {
        return LLMProvider.LLAMA2;
      }
      // Medium complexity (0.3-0.7): Use GPT-3.5 (saves 90% vs GPT-4)
      else if (complexity < 0.7) {
        return LLMProvider.GPT35_TURBO;
      }
      // High complexity (>0.7): Still use GPT-3.5 (cheaper but good quality)
      else {
        return LLMProvider.GPT35_TURBO;
      }
    }

    // Quality mode (paid users)
    else {
      // Simple queries: Use GPT-3.5 (faster and cheaper)
      if (complexity < 0.5) {
        return LLMProvider.GPT35_TURBO;
      }
      // Complex queries: Use GPT-4o (best quality)
      else {
        return LLMProvider.GPT4O;
      }
    }
  }

  /**
   * Estimate query complexity (0-1 scale)
   */
  private estimateComplexity(query: string): number {
    let score = 0;

    // Length factor
    if (query.length > 300) score += 0.3;
    else if (query.length > 150) score += 0.2;
    else score += 0.1;

    // Technical/analytical terms
    const complexTerms = /\b(explain|analyze|compare|detail|implement|optimize|algorithm|evaluate|summarize|code|debug)\b/i;
    if (complexTerms.test(query)) score += 0.3;

    // Multiple questions
    const questionMarks = (query.match(/\?/g) || []).length;
    if (questionMarks > 2) score += 0.2;
    else if (questionMarks > 1) score += 0.1;

    // List/comprehensive requests
    if (/\b(list|all|every|each|comprehensive)\b/i.test(query)) score += 0.2;

    return Math.min(score, 1);
  }

  /**
   * Convert messages to simple prompt format for LLM service
   */
  private messagesToPrompt(messages: ChatMessage[]): string {
    return messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    sessionCookie: string,
    model: string = 'gpt-4'
  ): Promise<SendMessageResult> {
    // Create conversation if not exists
    let conversation;
    if (conversationId) {
      conversation = await conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation không tồn tại');
      }
      if (conversation.userId !== userId) {
        throw new Error('Bạn không có quyền truy cập conversation này');
      }
    } else {
      // Create new conversation with title from first message
      const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
      conversation = await conversationRepository.create(userId, title, model);
    }

    // Estimate tokens needed for this request
    const estimatedPromptTokens = openaiService.estimateTokens(userMessage) + 500; // Add buffer for history
    const estimatedCompletionTokens = 2000; // Max tokens for response
    const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;

    // Check quota before processing
    const quotaCheck = await billingClientService.canUseTokens(userId, estimatedTotalTokens, sessionCookie);

    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.error || 'Đã hết quota sử dụng. Vui lòng nâng cấp gói.');
    }

    // Save user message
    const userTokenCount = openaiService.estimateTokens(userMessage);
    const userMessageRecord = await messageRepository.create({
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
      tokenCount: userTokenCount
    });

    // Get conversation history
    const messages = await messageRepository.findByConversationId(conversation.id);

    // Build chat history for OpenAI
    const chatHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Select optimal provider based on query complexity
    // TODO: Get user tier from billing service to determine if paid user
    const isPaidUser = false; // Default to free tier for now
    const selectedProvider = this.selectProvider(userMessage, isPaidUser);

    console.log(`[ChatService] Selected provider: ${selectedProvider} (complexity: ${this.estimateComplexity(userMessage).toFixed(2)})`);

    // Get AI response using selected provider
    let aiResponse;
    let actualProvider = selectedProvider;

    try {
      // For now, use OpenAI service for GPT models (fallback to GPT-3.5)
      // TODO: Full migration to shared LLM service when chat completion support is added
      if (selectedProvider === LLMProvider.GPT4O) {
        aiResponse = await openaiService.createChatCompletion(chatHistory, 'gpt-4o');
      } else if (selectedProvider === LLMProvider.GPT35_TURBO) {
        aiResponse = await openaiService.createChatCompletion(chatHistory, 'gpt-3.5-turbo');
      } else if (selectedProvider === LLMProvider.LLAMA2) {
        // Fallback to GPT-3.5 for Llama-2 (Cloudflare chat not implemented yet)
        console.warn('[ChatService] Llama-2 not supported for chat yet, falling back to GPT-3.5');
        aiResponse = await openaiService.createChatCompletion(chatHistory, 'gpt-3.5-turbo');
        actualProvider = LLMProvider.GPT35_TURBO;
      } else {
        // Default fallback
        aiResponse = await openaiService.createChatCompletion(chatHistory, model);
      }
    } catch (error) {
      console.error(`[ChatService] Error with ${selectedProvider}, falling back to GPT-3.5`);
      aiResponse = await openaiService.createChatCompletion(chatHistory, 'gpt-3.5-turbo');
      actualProvider = LLMProvider.GPT35_TURBO;
    }

    // Save assistant message
    const assistantMessage = await messageRepository.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.content,
      tokenCount: aiResponse.completionTokens,
      model: aiResponse.model
    });

    // Calculate cost using shared LLM service
    const estimatedCost = this.llm.estimateCost(aiResponse.totalTokens, actualProvider);

    // Record token usage with cost tracking
    await tokenUsageRepository.create({
      userId,
      messageId: assistantMessage.id,
      model: aiResponse.model,
      promptTokens: aiResponse.promptTokens,
      completionTokens: aiResponse.completionTokens,
      totalTokens: aiResponse.totalTokens
    });

    // Log cost metrics for monitoring
    console.log(`[ChatService] Cost: $${estimatedCost.toFixed(6)} | Provider: ${actualProvider} | Tokens: ${aiResponse.totalTokens}`);

    // Track cost in cost monitor service
    await costMonitorService.trackCost(userId, actualProvider, aiResponse.totalTokens, assistantMessage.id);

    // TODO: Publish event to update user's monthly token usage via auth-service
    // In microservices, chat-service shouldn't directly modify User table
    // await withRetry(() =>
    //   prisma.user.update({
    //     where: { id: userId },
    //     data: {
    //       monthlyTokenUsed: {
    //         increment: aiResponse.totalTokens
    //       }
    //     }
    //   })
    // );

    return {
      messageId: assistantMessage.id,
      content: aiResponse.content,
      tokenCount: aiResponse.totalTokens,
      conversationId: conversation.id
    };
  }

  /**
   * Send message and stream AI response
   */
  async streamMessage(
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
    sessionCookie: string,
    model: string = 'gpt-4',
    onChunk: (chunk: string) => void
  ): Promise<SendMessageResult> {
    // Create conversation if not exists
    let conversation;
    if (conversationId) {
      conversation = await conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation không tồn tại');
      }
      if (conversation.userId !== userId) {
        throw new Error('Bạn không có quyền truy cập conversation này');
      }
    } else {
      // Create new conversation with title from first message
      const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
      conversation = await conversationRepository.create(userId, title, model);
    }

    // Estimate tokens needed for this request
    const estimatedPromptTokens = openaiService.estimateTokens(userMessage) + 500;
    const estimatedCompletionTokens = 2000;
    const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;

    // Check quota before processing
    const quotaCheck = await billingClientService.canUseTokens(userId, estimatedTotalTokens, sessionCookie);

    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.error || 'Đã hết quota sử dụng. Vui lòng nâng cấp gói.');
    }

    // Save user message
    const userTokenCount = openaiService.estimateTokens(userMessage);
    const userMessageRecord = await messageRepository.create({
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
      tokenCount: userTokenCount
    });

    // Get conversation history
    const messages = await messageRepository.findByConversationId(conversation.id);

    // Build chat history for OpenAI
    const chatHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Select optimal provider based on query complexity
    const isPaidUser = false; // TODO: Get from billing service
    const selectedProvider = this.selectProvider(userMessage, isPaidUser);

    console.log(`[ChatService] Streaming with provider: ${selectedProvider} (complexity: ${this.estimateComplexity(userMessage).toFixed(2)})`);

    // Stream AI response using selected provider
    let fullContent = '';
    let totalTokens = 0;
    let actualProvider = selectedProvider;

    try {
      // For now, use OpenAI service for streaming (Llama-2 streaming not implemented)
      if (selectedProvider === LLMProvider.LLAMA2) {
        console.warn('[ChatService] Llama-2 streaming not supported, falling back to GPT-3.5');
        actualProvider = LLMProvider.GPT35_TURBO;
      }

      const streamModel = actualProvider === LLMProvider.GPT4O ? 'gpt-4o' : 'gpt-3.5-turbo';

      for await (const chunk of openaiService.createStreamingChatCompletion(chatHistory, streamModel)) {
        fullContent += chunk;
        totalTokens = openaiService.estimateTokens(fullContent);
        onChunk(chunk); // Send chunk to SSE client
      }
    } catch (error) {
      console.error(`[ChatService] Streaming error with ${selectedProvider}, falling back to GPT-3.5`);
      // Fallback to GPT-3.5
      actualProvider = LLMProvider.GPT35_TURBO;
      for await (const chunk of openaiService.createStreamingChatCompletion(chatHistory, 'gpt-3.5-turbo')) {
        fullContent += chunk;
        totalTokens = openaiService.estimateTokens(fullContent);
        onChunk(chunk);
      }
    }

    // Save complete assistant message
    const completionTokens = openaiService.estimateTokens(fullContent);
    const assistantMessage = await messageRepository.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: fullContent,
      tokenCount: completionTokens,
      model
    });

    // Record token usage with cost tracking
    const promptTokens = openaiService.estimateTokens(userMessage);
    totalTokens = promptTokens + completionTokens;

    // Calculate cost using shared LLM service
    const estimatedCost = this.llm.estimateCost(totalTokens, actualProvider);

    await tokenUsageRepository.create({
      userId,
      messageId: assistantMessage.id,
      model: actualProvider, // Use actual provider instead of requested model
      promptTokens,
      completionTokens,
      totalTokens
    });

    // Log cost metrics for monitoring
    console.log(`[ChatService] Streaming cost: $${estimatedCost.toFixed(6)} | Provider: ${actualProvider} | Tokens: ${totalTokens}`);

    // Track cost in cost monitor service
    await costMonitorService.trackCost(userId, actualProvider, totalTokens, assistantMessage.id);

    // TODO: Publish event to update user's monthly token usage via auth-service
    // In microservices, chat-service shouldn't directly modify User table
    // await withRetry(() =>
    //   prisma.user.update({
    //     where: { id: userId },
    //     data: {
    //       monthlyTokenUsed: {
    //         increment: totalTokens
    //       }
    //     }
    //   })
    // );

    return {
      messageId: assistantMessage.id,
      content: fullContent,
      tokenCount: totalTokens,
      conversationId: conversation.id
    };
  }

  /**
   * Get conversation with messages
   */
  async getConversation(userId: string, conversationId: string) {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation không tồn tại');
    }

    if (conversation.userId !== userId) {
      throw new Error('Bạn không có quyền truy cập conversation này');
    }

    return conversation;
  }

  /**
   * Get all conversations for user
   */
  async getUserConversations(userId: string) {
    return conversationRepository.findByUserId(userId);
  }

  /**
   * Rename conversation
   */
  async renameConversation(userId: string, conversationId: string, title: string) {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation không tồn tại');
    }

    if (conversation.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật conversation này');
    }

    return conversationRepository.updateTitle(conversationId, title);
  }

  /**
   * Pin/Unpin conversation
   */
  async pinConversation(userId: string, conversationId: string, pinned: boolean) {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation không tồn tại');
    }

    if (conversation.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật conversation này');
    }

    return conversationRepository.updatePinned(conversationId, pinned);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(userId: string, conversationId: string) {
    const isOwner = await conversationRepository.isOwner(conversationId, userId);

    if (!isOwner) {
      throw new Error('Bạn không có quyền xóa conversation này');
    }

    await conversationRepository.delete(conversationId);
  }

  /**
   * Get user's monthly token usage
   */
  async getMonthlyUsage(userId: string): Promise<number> {
    return tokenUsageRepository.getMonthlyUsage(userId);
  }
}

export const chatService = new ChatService();

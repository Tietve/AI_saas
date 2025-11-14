import { PrismaClient } from '@prisma/client';
import { conversationRepository } from '../repositories/conversation.repository';
import { messageRepository } from '../repositories/message.repository';
import { tokenUsageRepository } from '../repositories/token-usage.repository';
import { openaiService, ChatMessage } from './openai.service';
import { billingClientService } from './billing-client.service';
import { costTracker } from '../../../../shared/monitoring/cost-tracker.service';

const prisma = new PrismaClient();

export interface SendMessageResult {
  messageId: string;
  content: string;
  tokenCount: number;
  conversationId: string;
}

export class ChatService {
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

    // Build chat history for OpenAI
    // NOTE: conversation.messages already includes all messages from findById
    // We need to add the new user message to the history
    const allMessages = [
      ...(conversation.messages || []),
      userMessageRecord
    ];

    const chatHistory: ChatMessage[] = allMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Get AI response
    const aiResponse = await openaiService.createChatCompletion(chatHistory, model);

    // Save assistant message
    const assistantMessage = await messageRepository.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.content,
      tokenCount: aiResponse.completionTokens,
      model: aiResponse.model
    });

    // Record token usage
    await tokenUsageRepository.create({
      userId,
      messageId: assistantMessage.id,
      model: aiResponse.model,
      promptTokens: aiResponse.promptTokens,
      completionTokens: aiResponse.completionTokens,
      totalTokens: aiResponse.totalTokens
    });

    // Update user's monthly token usage and invalidate quota cache
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyTokenUsed: {
          increment: aiResponse.totalTokens
        }
      }
    });

    // Invalidate quota cache after usage update
    await billingClientService.invalidateQuotaCache(userId);

    // Track OpenAI cost (only if not from cache)
    if (!aiResponse.cached) {
      const cost = this.calculateOpenAICost(aiResponse.totalTokens, aiResponse.model);
      await costTracker.recordCost({
        service: 'openai',
        amount: cost,
        timestamp: Date.now(),
        metadata: {
          userId,
          model: aiResponse.model,
          tokens: aiResponse.totalTokens,
          conversationId: conversation.id,
        },
      });
    }

    return {
      messageId: assistantMessage.id,
      content: aiResponse.content,
      tokenCount: aiResponse.totalTokens,
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
   * Delete conversation
   */
  async deleteConversation(userId: string, conversationId: string) {
    // Optimize: Check ownership using existing conversation fetch
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation không tồn tại');
    }

    if (conversation.userId !== userId) {
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

  /**
   * Calculate OpenAI cost based on model and tokens
   */
  private calculateOpenAICost(tokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4'];
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;

    return (tokens / 1000) * avgPrice;
  }
}

export const chatService = new ChatService();

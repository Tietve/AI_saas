import { PrismaClient } from '@prisma/client';
import { conversationRepository } from '../repositories/conversation.repository';
import { messageRepository } from '../repositories/message.repository';
import { tokenUsageRepository } from '../repositories/token-usage.repository';
import { openaiService, ChatMessage } from './openai.service';
import { billingClientService } from './billing-client.service';

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

    // Get conversation history
    const messages = await messageRepository.findByConversationId(conversation.id);

    // Build chat history for OpenAI
    const chatHistory: ChatMessage[] = messages.map(msg => ({
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

    // Update user's monthly token usage
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyTokenUsed: {
          increment: aiResponse.totalTokens
        }
      }
    });

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

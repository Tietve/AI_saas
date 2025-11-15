/**
 * Chat Service Unit Tests
 *
 * Tests for chat business logic including:
 * - Full chat flow (create → send → receive)
 * - Message persistence (database)
 * - Token usage tracking
 * - Conversation history retrieval
 * - Integration with billing service
 * - Quota enforcement
 * - Error propagation
 */

import { ChatService } from '../../src/services/chat.service';
import { conversationRepository } from '../../src/repositories/conversation.repository';
import { messageRepository } from '../../src/repositories/message.repository';
import { tokenUsageRepository } from '../../src/repositories/token-usage.repository';
import { openaiService } from '../../src/services/openai.service';
import { billingClientService } from '../../src/services/billing-client.service';
import { costMonitorService } from '../../src/services/cost-monitor.service';
import { LLMProvider } from '../../../shared/services/types';

// Mock all dependencies
jest.mock('../../src/repositories/conversation.repository');
jest.mock('../../src/repositories/message.repository');
jest.mock('../../src/repositories/token-usage.repository');
jest.mock('../../src/services/openai.service');
jest.mock('../../src/services/billing-client.service');
jest.mock('../../src/services/cost-monitor.service');

describe('ChatService', () => {
  let service: ChatService;

  const mockUserId = 'user-123';
  const mockConversationId = 'conv-123';
  const mockSessionCookie = 'session-cookie';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService();
  });

  describe('sendMessage', () => {
    it('should create new conversation if conversationId is not provided', async () => {
      const userMessage = 'Hello, how are you?';
      const mockConversation = {
        id: 'conv-new',
        userId: mockUserId,
        title: 'Hello, how are you?',
        model: 'gpt-4',
        pinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserMessageRecord = {
        id: 'msg-user-1',
        conversationId: 'conv-new',
        role: 'user',
        content: userMessage,
        tokenCount: 10,
        model: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAssistantMessage = {
        id: 'msg-asst-1',
        conversationId: 'conv-new',
        role: 'assistant',
        content: 'I am doing well, thank you!',
        tokenCount: 15,
        model: 'gpt-4',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAIResponse = {
        content: 'I am doing well, thank you!',
        model: 'gpt-4',
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
      };

      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
        usage: { remaining: 95000 },
      });

      (conversationRepository.create as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (messageRepository.create as jest.Mock)
        .mockResolvedValueOnce(mockUserMessageRecord)
        .mockResolvedValueOnce(mockAssistantMessage);
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue([
        mockUserMessageRecord,
      ]);
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue(
        mockAIResponse
      );
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.sendMessage(
        mockUserId,
        undefined,
        userMessage,
        mockSessionCookie
      );

      expect(conversationRepository.create).toHaveBeenCalledWith(
        mockUserId,
        'Hello, how are you?',
        'gpt-4'
      );
      expect(result.conversationId).toBe('conv-new');
      expect(result.content).toBe('I am doing well, thank you!');
    });

    it('should use existing conversation if conversationId is provided', async () => {
      const userMessage = 'What is AI?';
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'AI Discussion',
        model: 'gpt-4',
        pinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-1',
        conversationId: mockConversationId,
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue({
        content: 'AI is...',
        model: 'gpt-4',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.sendMessage(
        mockUserId,
        mockConversationId,
        userMessage,
        mockSessionCookie
      );

      expect(conversationRepository.findById).toHaveBeenCalledWith(
        mockConversationId
      );
      expect(conversationRepository.create).not.toHaveBeenCalled();
      expect(result.conversationId).toBe(mockConversationId);
    });

    it('should throw error if conversation not found', async () => {
      (conversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.sendMessage(
          mockUserId,
          mockConversationId,
          'Hello',
          mockSessionCookie
        )
      ).rejects.toThrow('Conversation không tồn tại');
    });

    it('should throw error if user does not own conversation', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: 'different-user',
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );

      await expect(
        service.sendMessage(
          mockUserId,
          mockConversationId,
          'Hello',
          mockSessionCookie
        )
      ).rejects.toThrow('Bạn không có quyền truy cập conversation này');
    });

    it('should check quota before processing', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: false,
        error: 'Quota exceeded',
      });

      await expect(
        service.sendMessage(
          mockUserId,
          mockConversationId,
          'Hello',
          mockSessionCookie
        )
      ).rejects.toThrow('Quota exceeded');

      expect(billingClientService.canUseTokens).toHaveBeenCalled();
    });

    it('should save user message to database', async () => {
      const userMessage = 'Test message';
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-1',
        conversationId: mockConversationId,
        role: 'user',
        content: userMessage,
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(5);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue({
        content: 'Response',
        model: 'gpt-4',
        promptTokens: 5,
        completionTokens: 10,
        totalTokens: 15,
      });
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      await service.sendMessage(
        mockUserId,
        mockConversationId,
        userMessage,
        mockSessionCookie
      );

      expect(messageRepository.create).toHaveBeenCalledWith({
        conversationId: mockConversationId,
        role: 'user',
        content: userMessage,
        tokenCount: 5,
      });
    });

    it('should save assistant message to database', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      const mockAIResponse = {
        content: 'AI Response',
        model: 'gpt-4',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-asst',
        conversationId: mockConversationId,
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue(
        mockAIResponse
      );
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      await service.sendMessage(
        mockUserId,
        mockConversationId,
        'Hello',
        mockSessionCookie
      );

      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: mockConversationId,
          role: 'assistant',
          content: 'AI Response',
          tokenCount: 20,
          model: 'gpt-4',
        })
      );
    });

    it('should record token usage', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      const mockAIResponse = {
        content: 'Response',
        model: 'gpt-4',
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40,
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-asst',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue(
        mockAIResponse
      );
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      await service.sendMessage(
        mockUserId,
        mockConversationId,
        'Hello',
        mockSessionCookie
      );

      expect(tokenUsageRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        messageId: 'msg-asst',
        model: 'gpt-4',
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40,
      });
    });

    it('should return message result with all required fields', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-123',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue({
        content: 'Test response',
        model: 'gpt-4',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.sendMessage(
        mockUserId,
        mockConversationId,
        'Hello',
        mockSessionCookie
      );

      expect(result).toEqual({
        messageId: 'msg-123',
        content: 'Test response',
        tokenCount: 30,
        conversationId: mockConversationId,
      });
    });
  });

  describe('streamMessage', () => {
    it('should stream AI response chunks', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      const chunks = ['Hello', ' ', 'World'];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-123',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (
        openaiService.createStreamingChatCompletion as jest.Mock
      ).mockReturnValue(mockStream());
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      const receivedChunks: string[] = [];
      const onChunk = (chunk: string) => receivedChunks.push(chunk);

      const result = await service.streamMessage(
        mockUserId,
        mockConversationId,
        'Hello',
        mockSessionCookie,
        'gpt-4',
        onChunk
      );

      expect(receivedChunks).toEqual(['Hello', ' ', 'World']);
      expect(result.content).toBe('Hello World');
    });

    it('should save complete message after streaming', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      async function* mockStream() {
        yield 'Complete ';
        yield 'response';
      }

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-123',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (
        openaiService.createStreamingChatCompletion as jest.Mock
      ).mockReturnValue(mockStream());
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      await service.streamMessage(
        mockUserId,
        mockConversationId,
        'Hello',
        mockSessionCookie,
        'gpt-4',
        () => {}
      );

      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: 'Complete response',
        })
      );
    });
  });

  describe('getConversation', () => {
    it('should return conversation if user owns it', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );

      const result = await service.getConversation(
        mockUserId,
        mockConversationId
      );

      expect(result).toEqual(mockConversation);
    });

    it('should throw error if conversation not found', async () => {
      (conversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getConversation(mockUserId, mockConversationId)
      ).rejects.toThrow('Conversation không tồn tại');
    });

    it('should throw error if user does not own conversation', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: 'different-user',
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );

      await expect(
        service.getConversation(mockUserId, mockConversationId)
      ).rejects.toThrow('Bạn không có quyền truy cập conversation này');
    });
  });

  describe('getUserConversations', () => {
    it('should return all user conversations', async () => {
      const mockConversations = [
        { id: 'conv-1', userId: mockUserId, title: 'Chat 1' },
        { id: 'conv-2', userId: mockUserId, title: 'Chat 2' },
      ];

      (conversationRepository.findByUserId as jest.Mock).mockResolvedValue(
        mockConversations
      );

      const result = await service.getUserConversations(mockUserId);

      expect(result).toEqual(mockConversations);
      expect(conversationRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId
      );
    });
  });

  describe('renameConversation', () => {
    it('should rename conversation if user owns it', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Old Title',
      };

      const updatedConversation = {
        ...mockConversation,
        title: 'New Title',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (conversationRepository.updateTitle as jest.Mock).mockResolvedValue(
        updatedConversation
      );

      const result = await service.renameConversation(
        mockUserId,
        mockConversationId,
        'New Title'
      );

      expect(conversationRepository.updateTitle).toHaveBeenCalledWith(
        mockConversationId,
        'New Title'
      );
      expect(result.title).toBe('New Title');
    });

    it('should throw error if conversation not found', async () => {
      (conversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.renameConversation(mockUserId, mockConversationId, 'New Title')
      ).rejects.toThrow('Conversation không tồn tại');
    });
  });

  describe('pinConversation', () => {
    it('should pin conversation if user owns it', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        pinned: false,
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (conversationRepository.updatePinned as jest.Mock).mockResolvedValue({
        ...mockConversation,
        pinned: true,
      });

      await service.pinConversation(mockUserId, mockConversationId, true);

      expect(conversationRepository.updatePinned).toHaveBeenCalledWith(
        mockConversationId,
        true
      );
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation if user owns it', async () => {
      (conversationRepository.isOwner as jest.Mock).mockResolvedValue(true);
      (conversationRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteConversation(mockUserId, mockConversationId);

      expect(conversationRepository.delete).toHaveBeenCalledWith(
        mockConversationId
      );
    });

    it('should throw error if user does not own conversation', async () => {
      (conversationRepository.isOwner as jest.Mock).mockResolvedValue(false);

      await expect(
        service.deleteConversation(mockUserId, mockConversationId)
      ).rejects.toThrow('Bạn không có quyền xóa conversation này');

      expect(conversationRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getMonthlyUsage', () => {
    it('should return monthly token usage', async () => {
      (tokenUsageRepository.getMonthlyUsage as jest.Mock).mockResolvedValue(
        5000
      );

      const result = await service.getMonthlyUsage(mockUserId);

      expect(result).toBe(5000);
      expect(tokenUsageRepository.getMonthlyUsage).toHaveBeenCalledWith(
        mockUserId
      );
    });
  });

  describe('Provider Selection & Cost Tracking', () => {
    beforeEach(() => {
      (costMonitorService.trackCost as jest.Mock).mockResolvedValue(undefined);
    });

    it('should select GPT-3.5 for simple queries (free users)', async () => {
      const simpleMessage = 'Hi'; // Low complexity
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-123',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(5);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue({
        content: 'Hello!',
        model: 'gpt-3.5-turbo',
        promptTokens: 5,
        completionTokens: 10,
        totalTokens: 15,
      });
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      await service.sendMessage(
        mockUserId,
        mockConversationId,
        simpleMessage,
        mockSessionCookie
      );

      // Should call GPT-3.5 or Llama-2 (fallback to GPT-3.5)
      expect(openaiService.createChatCompletion).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/gpt-3.5-turbo|gpt-4o/)
      );
    });

    it('should track costs after message generation', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-123',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);
      (openaiService.createChatCompletion as jest.Mock).mockResolvedValue({
        content: 'Response',
        model: 'gpt-3.5-turbo',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      await service.sendMessage(
        mockUserId,
        mockConversationId,
        'Test message',
        mockSessionCookie
      );

      // Should track cost
      expect(costMonitorService.trackCost).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String), // provider
        30, // total tokens
        'msg-123' // message ID
      );
    });

    it('should fallback to GPT-3.5 on error', async () => {
      const mockConversation = {
        id: mockConversationId,
        userId: mockUserId,
        title: 'Test',
        model: 'gpt-4',
      };

      (conversationRepository.findById as jest.Mock).mockResolvedValue(
        mockConversation
      );
      (billingClientService.canUseTokens as jest.Mock).mockResolvedValue({
        allowed: true,
      });
      (messageRepository.create as jest.Mock).mockResolvedValue({
        id: 'msg-123',
      });
      (messageRepository.findByConversationId as jest.Mock).mockResolvedValue(
        []
      );
      (openaiService.estimateTokens as jest.Mock).mockReturnValue(10);

      // First call fails, second succeeds (fallback)
      (openaiService.createChatCompletion as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          content: 'Fallback response',
          model: 'gpt-3.5-turbo',
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        });
      (tokenUsageRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.sendMessage(
        mockUserId,
        mockConversationId,
        'Test message',
        mockSessionCookie
      );

      // Should succeed with fallback
      expect(result.content).toBe('Fallback response');
      expect(openaiService.createChatCompletion).toHaveBeenCalledTimes(2);
    });
  });
});

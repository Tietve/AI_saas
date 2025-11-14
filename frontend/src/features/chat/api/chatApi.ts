import { chatClient } from '@/shared/api/client';
import type {
  SendMessageRequest,
  SendMessageResponse,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
  GetUsageResponse,
  Conversation,
} from './types';

/**
 * Chat API
 * All endpoints require authentication (JWT in httpOnly cookie)
 */
export const chatApi = {
  /**
   * Send a message to the AI
   * POST /api/chat
   */
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await chatClient.post<SendMessageResponse>('/chat', data);
    return response.data;
  },

  /**
   * Get all conversations for the current user
   * GET /api/conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    const response = await chatClient.get<GetConversationsResponse>('/conversations');
    return response.data.conversations;
  },

  /**
   * Get a single conversation with all messages
   * GET /api/conversations/:id
   */
  getConversation: async (id: string): Promise<Conversation> => {
    const response = await chatClient.get<GetConversationResponse>(
      `/conversations/${id}`
    );
    return response.data.conversation;
  },

  /**
   * Rename a conversation
   * PATCH /api/conversations/:id
   */
  renameConversation: async (id: string, title: string): Promise<Conversation> => {
    const response = await chatClient.patch<{ conversation: Conversation }>(
      `/conversations/${id}`,
      { title }
    );
    return response.data.conversation;
  },

  /**
   * Pin or unpin a conversation
   * PATCH /api/conversations/:id/pin
   */
  pinConversation: async (id: string, pinned: boolean): Promise<Conversation> => {
    const response = await chatClient.patch<{ conversation: Conversation }>(
      `/conversations/${id}/pin`,
      { pinned }
    );
    return response.data.conversation;
  },

  /**
   * Delete a conversation
   * DELETE /api/conversations/:id
   */
  deleteConversation: async (id: string): Promise<void> => {
    await chatClient.delete<DeleteConversationResponse>(`/conversations/${id}`);
  },

  /**
   * Get monthly token usage
   * GET /api/usage
   */
  getUsage: async (): Promise<GetUsageResponse> => {
    const response = await chatClient.get<GetUsageResponse>('/usage');
    return response.data;
  },
};

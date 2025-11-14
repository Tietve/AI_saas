// Chat API Types

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount: number;
  model?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface SendMessageRequest {
  conversationId?: string;
  message: string;
  model?: string;
}

export interface SendMessageResponse {
  ok: boolean;
  conversationId: string;
  messageId: string;
  content: string;
  tokenCount: number;
}

export interface GetConversationsResponse {
  ok: boolean;
  conversations: Conversation[];
}

export interface GetConversationResponse {
  ok: boolean;
  conversation: Conversation;
}

export interface DeleteConversationResponse {
  ok: boolean;
  message: string;
}

export interface TokenUsage {
  used: number;
  limit: number;
  planTier: 'free' | 'plus' | 'pro';
}

export interface GetUsageResponse {
  ok: boolean;
  usage: TokenUsage;
}

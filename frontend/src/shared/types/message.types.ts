/**
 * Message type definitions
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenCount?: number;
  isPinned?: boolean;
}

export type MessageRole = Message['role'];

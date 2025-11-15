/**
 * Message Test Fixtures
 */

export const mockUserMessage = {
  id: 'msg-user-1',
  conversationId: 'conv-123',
  role: 'user' as const,
  content: 'What is the capital of France?',
  tokenCount: 10,
  model: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockAssistantMessage = {
  id: 'msg-asst-1',
  conversationId: 'conv-123',
  role: 'assistant' as const,
  content: 'The capital of France is Paris.',
  tokenCount: 15,
  model: 'gpt-4',
  createdAt: new Date('2024-01-01T00:00:01Z'),
  updatedAt: new Date('2024-01-01T00:00:01Z'),
};

export const mockMessages = [
  mockUserMessage,
  mockAssistantMessage,
  {
    id: 'msg-user-2',
    conversationId: 'conv-123',
    role: 'user' as const,
    content: 'Tell me more about Paris',
    tokenCount: 8,
    model: null,
    createdAt: new Date('2024-01-01T00:00:02Z'),
    updatedAt: new Date('2024-01-01T00:00:02Z'),
  },
];

export const mockChatHistory = [
  { role: 'user' as const, content: 'Hello' },
  { role: 'assistant' as const, content: 'Hi! How can I help you?' },
  { role: 'user' as const, content: 'What is the capital of France?' },
];

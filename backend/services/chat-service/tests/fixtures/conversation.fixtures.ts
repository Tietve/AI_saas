/**
 * Conversation Test Fixtures
 */

export const mockConversation = {
  id: 'conv-123',
  userId: 'user-123',
  title: 'Test Conversation',
  model: 'gpt-4',
  pinned: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  messages: [],
};

export const mockConversationWithMessages = {
  ...mockConversation,
  messages: [
    {
      id: 'msg-1',
      conversationId: 'conv-123',
      role: 'user',
      content: 'Hello',
      tokenCount: 5,
      model: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-123',
      role: 'assistant',
      content: 'Hi! How can I help you?',
      tokenCount: 10,
      model: 'gpt-4',
      createdAt: new Date('2024-01-01T00:01:00Z'),
      updatedAt: new Date('2024-01-01T00:01:00Z'),
    },
  ],
};

export const mockConversations = [
  mockConversation,
  {
    id: 'conv-456',
    userId: 'user-123',
    title: 'Another Conversation',
    model: 'gpt-3.5-turbo',
    pinned: true,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    messages: [],
  },
];

/**
 * Mock Conversation Data Fixtures
 */

export interface MockMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  createdAt: string;
}

export interface MockConversation {
  id: string;
  userId: string;
  title: string;
  messages: MockMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export const mockConversations: MockConversation[] = [
  {
    id: 'conv-1',
    userId: '1',
    title: 'What is React?',
    model: 'gpt-4',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'What is React?',
        tokens: 4,
        createdAt: '2025-01-01T10:00:00.000Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'React is a JavaScript library for building user interfaces, developed by Facebook. It allows developers to create reusable UI components and manage application state efficiently.',
        tokens: 35,
        createdAt: '2025-01-01T10:00:02.000Z',
      },
    ],
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:02.000Z',
  },
  {
    id: 'conv-2',
    userId: '1',
    title: 'Explain TypeScript',
    model: 'gpt-4',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Explain TypeScript',
        tokens: 3,
        createdAt: '2025-01-02T10:00:00.000Z',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing, interfaces, and advanced tooling support.',
        tokens: 30,
        createdAt: '2025-01-02T10:00:02.000Z',
      },
    ],
    createdAt: '2025-01-02T10:00:00.000Z',
    updatedAt: '2025-01-02T10:00:02.000Z',
  },
  {
    id: 'conv-3',
    userId: '2',
    title: 'Advanced Node.js patterns',
    model: 'gpt-4-turbo',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'What are some advanced Node.js patterns?',
        tokens: 8,
        createdAt: '2025-01-03T10:00:00.000Z',
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: 'Advanced Node.js patterns include: Event-driven architecture, Streams for handling large data, Worker threads for CPU-intensive tasks, and Cluster mode for scaling.',
        tokens: 40,
        createdAt: '2025-01-03T10:00:03.000Z',
      },
    ],
    createdAt: '2025-01-03T10:00:00.000Z',
    updatedAt: '2025-01-03T10:00:03.000Z',
  },
];

export const mockUsageStats = {
  '1': {
    totalTokens: 72,
    totalMessages: 4,
    totalConversations: 2,
    currentMonth: {
      tokens: 72,
      messages: 4,
      conversations: 2,
    },
  },
  '2': {
    totalTokens: 48,
    totalMessages: 2,
    totalConversations: 1,
    currentMonth: {
      tokens: 48,
      messages: 2,
      conversations: 1,
    },
  },
};

// Helper functions
export const getConversationsByUserId = (userId: string): MockConversation[] => {
  return mockConversations.filter(conv => conv.userId === userId && !conv.deletedAt);
};

export const getConversationById = (id: string): MockConversation | undefined => {
  return mockConversations.find(conv => conv.id === id && !conv.deletedAt);
};

export const createNewConversation = (
  userId: string,
  title: string,
  model: string = 'gpt-4'
): MockConversation => {
  const newId = `conv-${Date.now()}`;
  return {
    id: newId,
    userId,
    title,
    model,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const addMessageToConversation = (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokens: number = 0
): MockMessage => {
  return {
    id: `msg-${Date.now()}`,
    role,
    content,
    tokens,
    createdAt: new Date().toISOString(),
  };
};

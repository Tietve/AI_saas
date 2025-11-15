/**
 * Test Conversation Fixtures
 *
 * Pre-defined test conversations and messages
 */

export interface TestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TestConversation {
  title: string;
  messages: TestMessage[];
  model: string;
}

/**
 * Sample test conversations
 */
export const TEST_CONVERSATIONS: Record<string, TestConversation> = {
  SIMPLE_CHAT: {
    title: 'Simple Test Chat',
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Hello! How are you?' },
      { role: 'assistant', content: 'I am doing well, thank you for asking!' }
    ]
  },

  MULTI_TURN: {
    title: 'Multi-turn Conversation',
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'What is the capital of France?' },
      { role: 'assistant', content: 'The capital of France is Paris.' },
      { role: 'user', content: 'What is its population?' },
      { role: 'assistant', content: 'Paris has a population of approximately 2.2 million people.' }
    ]
  },

  LONG_CONVERSATION: {
    title: 'Long Conversation',
    model: 'gpt-3.5-turbo',
    messages: Array(20).fill(null).map((_, i) => [
      { role: 'user' as const, content: `This is test message number ${i + 1}` },
      { role: 'assistant' as const, content: `Response to message ${i + 1}` }
    ]).flat()
  }
};

/**
 * Generate test messages for quota testing
 */
export function generateQuotaTestMessages(count: number): TestMessage[] {
  return Array(count).fill(null).map((_, i) => ({
    role: 'user' as const,
    content: `Quota test message ${i + 1}: ${'a'.repeat(100)}` // ~100 chars each
  }));
}

/**
 * Sample chat message templates
 */
export const MESSAGE_TEMPLATES = {
  GREETING: 'Hello! Can you help me with something?',
  QUESTION: 'What is the meaning of life?',
  CODE_REQUEST: 'Write a hello world program in Python',
  FOLLOW_UP: 'Can you explain that in more detail?',
  LONG_MESSAGE: 'This is a very long message that contains a lot of text to test token counting. '.repeat(50),
  SPECIAL_CHARS: 'Test with special chars: 你好 🌟 ñ á é í ó ú',
  MARKDOWN: '# Title\n\n- Item 1\n- Item 2\n\n```python\nprint("hello")\n```'
};

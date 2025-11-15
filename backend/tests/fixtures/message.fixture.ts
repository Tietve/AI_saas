import { faker } from '@faker-js/faker';

export interface MessageFixtureOptions {
  conversationId?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  contentType?: string;
  model?: string;
  tokenCount?: number;
}

/**
 * Creates a message fixture with realistic data
 * @param conversationId - The conversation this message belongs to
 * @param overrides - Optional overrides for message properties
 * @returns Message data ready for database insertion
 */
export function createMessageFixture(
  conversationId: string,
  overrides: MessageFixtureOptions = {}
) {
  const role = overrides.role || 'user';
  const content = overrides.content || (
    role === 'user'
      ? faker.helpers.arrayElement([
          'Can you help me understand this code?',
          'How do I implement authentication in Node.js?',
          'What are the best practices for API design?',
          'Explain this error message to me',
          'How can I optimize this database query?',
          'What is the difference between REST and GraphQL?',
          'How do I handle file uploads in Express?',
          'Can you review my code for security issues?'
        ])
      : faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 }))
  );

  const tokenCount = overrides.tokenCount ?? Math.ceil(content.length / 4);

  return {
    conversationId,
    role,
    content,
    contentType: overrides.contentType || 'text',
    tokenCount,
    model: overrides.model || null,
    deletedAt: null,
    deletedBy: null,
    createdAt: faker.date.recent({ days: 7 })
  };
}

/**
 * Creates a user message fixture (convenience function)
 */
export function createUserMessageFixture(
  conversationId: string,
  overrides: MessageFixtureOptions = {}
) {
  return createMessageFixture(conversationId, { ...overrides, role: 'user' });
}

/**
 * Creates an assistant message fixture (convenience function)
 */
export function createAssistantMessageFixture(
  conversationId: string,
  overrides: MessageFixtureOptions = {}
) {
  return createMessageFixture(conversationId, { ...overrides, role: 'assistant' });
}

/**
 * Creates a system message fixture (convenience function)
 */
export function createSystemMessageFixture(
  conversationId: string,
  overrides: MessageFixtureOptions = {}
) {
  return createMessageFixture(conversationId, {
    ...overrides,
    role: 'system',
    content: overrides.content || 'System message: You are a helpful AI assistant.'
  });
}

/**
 * Creates a message thread (alternating user/assistant messages)
 * @param conversationId - The conversation this thread belongs to
 * @param count - Number of message pairs (user + assistant)
 * @returns Array of message data alternating between user and assistant
 */
export function createMessageThreadFixture(
  conversationId: string,
  count: number,
  model?: string
) {
  const messages = [];

  for (let i = 0; i < count; i++) {
    // User message
    messages.push(createUserMessageFixture(conversationId, { model }));

    // Assistant response
    messages.push(createAssistantMessageFixture(conversationId, { model }));
  }

  return messages;
}

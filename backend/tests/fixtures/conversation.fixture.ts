import { faker } from '@faker-js/faker';

export interface ConversationFixtureOptions {
  userId?: string;
  title?: string;
  model?: string;
  pinned?: boolean;
  status?: string;
  temperature?: number;
}

/**
 * Creates a conversation fixture with realistic data
 * @param userId - The user who owns the conversation
 * @param overrides - Optional overrides for conversation properties
 * @returns Conversation data ready for database insertion
 */
export function createConversationFixture(
  userId: string,
  overrides: ConversationFixtureOptions = {}
) {
  return {
    userId,
    title: overrides.title || faker.helpers.arrayElement([
      'Project Planning Discussion',
      'Code Review Session',
      'Technical Architecture',
      'Bug Investigation',
      'Feature Brainstorming',
      'API Design Review',
      'Database Optimization',
      'Security Review',
      'Performance Analysis',
      'Documentation Update'
    ]),
    model: overrides.model || faker.helpers.arrayElement([
      'gpt-4',
      'gpt-3.5-turbo',
      'claude-3'
    ]),
    pinned: overrides.pinned ?? faker.datatype.boolean(0.2), // 20% chance
    status: overrides.status || 'active',
    temperature: overrides.temperature ?? faker.number.float({
      min: 0.5,
      max: 1.5,
      fractionDigits: 1
    }),
    createdAt: faker.date.recent({ days: 30 }),
    updatedAt: new Date()
  };
}

/**
 * Creates multiple conversation fixtures for a user
 * @param userId - The user who owns the conversations
 * @param count - Number of conversations to create
 * @param overrides - Optional overrides applied to all conversations
 * @returns Array of conversation data
 */
export function createManyConversationFixtures(
  userId: string,
  count: number,
  overrides: ConversationFixtureOptions = {}
) {
  const conversations = [];
  for (let i = 0; i < count; i++) {
    conversations.push(createConversationFixture(userId, overrides));
  }
  return conversations;
}

/**
 * Creates a pinned conversation fixture (convenience function)
 */
export function createPinnedConversationFixture(
  userId: string,
  overrides: ConversationFixtureOptions = {}
) {
  return createConversationFixture(userId, { ...overrides, pinned: true });
}

/**
 * Creates an archived conversation fixture (convenience function)
 */
export function createArchivedConversationFixture(
  userId: string,
  overrides: ConversationFixtureOptions = {}
) {
  return createConversationFixture(userId, { ...overrides, status: 'archived' });
}

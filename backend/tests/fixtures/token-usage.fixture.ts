import { faker } from '@faker-js/faker';

export interface TokenUsageFixtureOptions {
  userId?: string;
  conversationId?: string;
  messageId?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * Calculates cost based on model and token count
 */
function calculateCost(model: string, totalTokens: number): number {
  const costPerToken = model === 'gpt-4' ? 0.00003 : 0.000002;
  return Number((totalTokens * costPerToken).toFixed(6));
}

/**
 * Creates a token usage fixture with realistic data
 * @param userId - The user who incurred the usage
 * @param overrides - Optional overrides for token usage properties
 * @returns Token usage data ready for database insertion
 */
export function createTokenUsageFixture(
  userId: string,
  overrides: TokenUsageFixtureOptions = {}
) {
  const model = overrides.model || faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo']);
  const promptTokens = overrides.promptTokens ?? faker.number.int({ min: 100, max: 1000 });
  const completionTokens = overrides.completionTokens ?? faker.number.int({ min: 200, max: 2000 });
  const totalTokens = promptTokens + completionTokens;
  const cost = calculateCost(model, totalTokens);

  return {
    userId,
    conversationId: overrides.conversationId || null,
    messageId: overrides.messageId || null,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    createdAt: faker.date.recent({ days: 30 })
  };
}

/**
 * Creates a GPT-4 token usage fixture (higher cost)
 */
export function createGpt4TokenUsageFixture(
  userId: string,
  overrides: TokenUsageFixtureOptions = {}
) {
  return createTokenUsageFixture(userId, { ...overrides, model: 'gpt-4' });
}

/**
 * Creates a GPT-3.5 token usage fixture (lower cost)
 */
export function createGpt35TokenUsageFixture(
  userId: string,
  overrides: TokenUsageFixtureOptions = {}
) {
  return createTokenUsageFixture(userId, { ...overrides, model: 'gpt-3.5-turbo' });
}

/**
 * Creates multiple token usage records
 * @param userId - The user who incurred the usage
 * @param count - Number of usage records to create
 * @param overrides - Optional overrides applied to all records
 * @returns Array of token usage data
 */
export function createManyTokenUsageFixtures(
  userId: string,
  count: number,
  overrides: TokenUsageFixtureOptions = {}
) {
  const usageRecords = [];
  for (let i = 0; i < count; i++) {
    usageRecords.push(createTokenUsageFixture(userId, overrides));
  }
  return usageRecords;
}

/**
 * Creates token usage for a conversation
 * @param userId - The user who owns the conversation
 * @param conversationId - The conversation ID
 * @param count - Number of usage records
 * @returns Array of token usage data for the conversation
 */
export function createConversationTokenUsageFixtures(
  userId: string,
  conversationId: string,
  count: number
) {
  return createManyTokenUsageFixtures(userId, count, { conversationId });
}

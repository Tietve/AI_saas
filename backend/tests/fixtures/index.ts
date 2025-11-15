/**
 * Test Fixtures for Database Seeding and Testing
 *
 * This module provides factory functions for generating realistic test data
 * across all services (Auth, Chat, Billing).
 *
 * Usage:
 * ```typescript
 * import { createUserFixture, createConversationFixture } from '../fixtures';
 *
 * const user = await createUserFixture({ planTier: 'PRO' });
 * const conversation = createConversationFixture(user.id, { model: 'gpt-4' });
 * ```
 */

// User fixtures
export {
  createUserFixture,
  createManyUserFixtures,
  createVerifiedUserFixture,
  createProUserFixture,
  createPlusUserFixture,
  createFreeUserFixture,
  type UserFixtureOptions
} from './user.fixture';

// Conversation fixtures
export {
  createConversationFixture,
  createManyConversationFixtures,
  createPinnedConversationFixture,
  createArchivedConversationFixture,
  type ConversationFixtureOptions
} from './conversation.fixture';

// Message fixtures
export {
  createMessageFixture,
  createUserMessageFixture,
  createAssistantMessageFixture,
  createSystemMessageFixture,
  createMessageThreadFixture,
  type MessageFixtureOptions
} from './message.fixture';

// Subscription fixtures
export {
  createSubscriptionFixture,
  createActiveSubscriptionFixture,
  createCanceledSubscriptionFixture,
  createTrialingSubscriptionFixture,
  createProSubscriptionFixture,
  type SubscriptionFixtureOptions
} from './subscription.fixture';

// Payment fixtures
export {
  createPaymentFixture,
  createSuccessfulPaymentFixture,
  createFailedPaymentFixture,
  createPendingPaymentFixture,
  createProPaymentFixture,
  createPaymentHistoryFixture,
  type PaymentFixtureOptions
} from './payment.fixture';

// Token usage fixtures
export {
  createTokenUsageFixture,
  createGpt4TokenUsageFixture,
  createGpt35TokenUsageFixture,
  createManyTokenUsageFixtures,
  createConversationTokenUsageFixtures,
  type TokenUsageFixtureOptions
} from './token-usage.fixture';

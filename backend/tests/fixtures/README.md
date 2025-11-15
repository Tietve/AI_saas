# Test Fixtures

This directory contains factory functions for generating realistic test data across all services.

## Overview

Fixtures are factory functions that generate consistent, realistic test data for:
- **Users** - Auth service user accounts
- **Conversations** - Chat service conversations
- **Messages** - Chat messages in conversations
- **Subscriptions** - Billing service subscriptions
- **Payments** - Payment records
- **Token Usage** - API usage tracking

## Usage

### Basic Usage

```typescript
import { createUserFixture, createConversationFixture } from '../fixtures';

// Create a user with default values
const user = await createUserFixture();

// Create a user with custom values
const proUser = await createUserFixture({
  email: 'pro@example.com',
  planTier: 'PRO',
  isEmailVerified: true
});

// Create a conversation for the user
const conversation = createConversationFixture(user.id, {
  title: 'My Test Chat',
  model: 'gpt-4'
});
```

### In Integration Tests

```typescript
import { PrismaClient } from '@prisma/client';
import { createUserFixture, createConversationFixture } from '../fixtures';

const prisma = new PrismaClient();

describe('Chat API', () => {
  beforeEach(async () => {
    // Create test user
    const userData = await createUserFixture({ planTier: 'PRO' });
    await prisma.user.create({ data: userData });
  });

  it('should create a conversation', async () => {
    // Test implementation
  });
});
```

## Available Fixtures

### User Fixtures

**`createUserFixture(overrides?)`**
- Creates a user with realistic data
- Returns: User data ready for database insertion

**Convenience Functions:**
- `createVerifiedUserFixture()` - Verified email
- `createProUserFixture()` - PRO tier user
- `createPlusUserFixture()` - PLUS tier user
- `createFreeUserFixture()` - FREE tier user
- `createManyUserFixtures(count)` - Multiple users

**Options:**
```typescript
{
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  planTier?: 'FREE' | 'PLUS' | 'PRO' | 'ENTERPRISE';
  isEmailVerified?: boolean;
  monthlyTokenUsed?: number;
}
```

### Conversation Fixtures

**`createConversationFixture(userId, overrides?)`**
- Creates a conversation for a user
- Returns: Conversation data

**Convenience Functions:**
- `createPinnedConversationFixture()` - Pinned conversation
- `createArchivedConversationFixture()` - Archived conversation
- `createManyConversationFixtures(userId, count)` - Multiple conversations

**Options:**
```typescript
{
  title?: string;
  model?: string;
  pinned?: boolean;
  status?: string;
  temperature?: number;
}
```

### Message Fixtures

**`createMessageFixture(conversationId, overrides?)`**
- Creates a message in a conversation
- Returns: Message data

**Convenience Functions:**
- `createUserMessageFixture()` - User message
- `createAssistantMessageFixture()` - AI response
- `createSystemMessageFixture()` - System message
- `createMessageThreadFixture(conversationId, count)` - Alternating user/assistant messages

**Options:**
```typescript
{
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  contentType?: string;
  model?: string;
  tokenCount?: number;
}
```

### Subscription Fixtures

**`createSubscriptionFixture(userId, overrides?)`**
- Creates a subscription for a user
- Returns: Subscription data

**Convenience Functions:**
- `createActiveSubscriptionFixture()` - Active subscription
- `createCanceledSubscriptionFixture()` - Canceled subscription
- `createTrialingSubscriptionFixture()` - Trialing subscription
- `createProSubscriptionFixture()` - PRO subscription

**Options:**
```typescript
{
  planTier?: 'FREE' | 'PLUS' | 'PRO';
  status?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  cancelAtPeriodEnd?: boolean;
}
```

### Payment Fixtures

**`createPaymentFixture(userId, overrides?)`**
- Creates a payment record
- Returns: Payment data

**Convenience Functions:**
- `createSuccessfulPaymentFixture()` - Successful payment
- `createFailedPaymentFixture()` - Failed payment
- `createPendingPaymentFixture()` - Pending payment
- `createProPaymentFixture()` - PRO plan payment
- `createPaymentHistoryFixture(userId, count)` - Payment history

**Options:**
```typescript
{
  planTier?: 'FREE' | 'PLUS' | 'PRO';
  amount?: number;
  currency?: string;
  status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  stripePaymentId?: string;
  stripeInvoiceId?: string;
  description?: string;
}
```

### Token Usage Fixtures

**`createTokenUsageFixture(userId, overrides?)`**
- Creates a token usage record
- Returns: Token usage data

**Convenience Functions:**
- `createGpt4TokenUsageFixture()` - GPT-4 usage (higher cost)
- `createGpt35TokenUsageFixture()` - GPT-3.5 usage (lower cost)
- `createManyTokenUsageFixtures(userId, count)` - Multiple records
- `createConversationTokenUsageFixtures(userId, conversationId, count)` - Conversation usage

**Options:**
```typescript
{
  conversationId?: string;
  messageId?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
}
```

## Example: Complete Test Setup

```typescript
import { PrismaClient } from '@prisma/client';
import {
  createProUserFixture,
  createConversationFixture,
  createMessageThreadFixture,
  createProSubscriptionFixture
} from '../fixtures';

const prisma = new PrismaClient();

async function setupTestData() {
  // Create a PRO user
  const userData = await createProUserFixture({
    email: 'test@example.com'
  });
  const user = await prisma.user.create({ data: userData });

  // Create a conversation
  const conversationData = createConversationFixture(user.id, {
    model: 'gpt-4'
  });
  const conversation = await prisma.conversation.create({
    data: conversationData
  });

  // Create a message thread (5 user/assistant pairs = 10 messages)
  const messages = createMessageThreadFixture(conversation.id, 5, 'gpt-4');
  await prisma.message.createMany({ data: messages });

  // Create a subscription
  const subscriptionData = createProSubscriptionFixture(user.id);
  await prisma.subscription.create({ data: subscriptionData });

  return { user, conversation };
}
```

## Benefits

✅ **Consistent Data** - Same structure across tests
✅ **Realistic Values** - Uses Faker.js for realistic data
✅ **Type-Safe** - Full TypeScript support
✅ **Flexible** - Easy to override any field
✅ **Fast** - No API calls, pure data generation
✅ **Maintainable** - Single source of truth for test data

## Related

- See `../seeds/seed.ts` for database seeding script
- See `../integration/` for integration tests using these fixtures

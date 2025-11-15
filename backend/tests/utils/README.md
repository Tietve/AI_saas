# Test Utilities Documentation

Shared test utilities to reduce duplication and improve test maintainability across the codebase.

## 📁 Files Overview

- **`test-helpers.ts`** - Core testing utilities (mocks, assertions, async helpers)
- **`mock-factories.ts`** - External API response mocks (OpenAI, Stripe, etc.)
- **`db-helpers.ts`** - Database operations (seeding, cleanup, user creation)
- **`index.ts`** - Centralized exports for easy importing

## 🚀 Quick Start

```typescript
import {
  // Test Helpers
  createMockUser,
  generateTestEmail,
  assertSuccess,
  waitForCondition,

  // Mock Factories
  mockOpenAIResponse,
  mockStripeSubscription,

  // Database Helpers
  createTestUser,
  cleanDatabase
} from '@tests/utils';
```

## 📚 API Reference

### Test Helpers (`test-helpers.ts`)

#### Mock Creators

```typescript
// Create mock objects with sensible defaults
createMockUser(overrides?)
createMockConversation(overrides?)
createMockMessage(overrides?)
createMockDocument(overrides?)
createMockSubscription(overrides?)
```

**Example:**
```typescript
const user = createMockUser({
  email: 'custom@example.com',
  planTier: 'PRO'
});
// Returns: { id, email, planTier: 'PRO', ... }
```

#### Express Mocks

```typescript
// Create mock Express req/res/next
createMockRequest(overrides?)
createMockResponse()
createMockNext()
```

**Example:**
```typescript
const req = createMockRequest({
  body: { message: 'Hello' },
  user: createMockUser()
});

const res = createMockResponse();
const next = createMockNext();

await controller(req, res, next);

expect(res.status).toHaveBeenCalledWith(200);
expect(res.json).toHaveBeenCalled();
```

#### Async Helpers

```typescript
// Wait for condition to become true
waitForCondition(condition: () => boolean | Promise<boolean>, timeout?, interval?)

// Sleep for specified milliseconds
sleep(ms: number)

// Retry function until it succeeds
retry(fn, maxAttempts?, delayMs?)

// Measure execution time
measureExecutionTime(fn)
```

**Examples:**
```typescript
// Wait for database record
await waitForCondition(async () => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user !== null;
}, 5000);

// Sleep between operations
await sleep(1000);

// Retry flaky operation
const result = await retry(
  async () => await fetchData(),
  3, // max attempts
  1000 // delay between attempts
);

// Measure performance
const { result, duration } = await measureExecutionTime(async () => {
  return await heavyOperation();
});
console.log(`Took ${duration}ms`);
```

#### Assertion Helpers

```typescript
// Assert function throws error
assertThrows(fn, expectedMessage?)

// Assert API response success
assertSuccess(response, expectedStatus?)

// Assert API response error
assertError(response, expectedStatus?)

// Extract session cookie from headers
extractSessionCookie(headers)
```

**Examples:**
```typescript
// Assert throws
const error = await assertThrows(
  async () => { throw new Error('Failed'); },
  'Failed'
);

// Assert HTTP success
const res = await request(app).get('/api/users');
assertSuccess(res, 200);

// Assert HTTP error
const errorRes = await request(app).post('/api/auth/login');
assertError(errorRes, 401);

// Extract session
const sessionCookie = extractSessionCookie(response.headers);
```

#### Utility Functions

```typescript
// Generate random test data
generateTestEmail(prefix?)
generateTestPassword()
generateRandomString(length?)

// Mock console output
mockConsole()
```

**Examples:**
```typescript
const email = generateTestEmail('integration');
// Returns: integration-1699999999-abc123@test.example

const password = generateTestPassword();
// Returns: TestPass1a2b3c4d5e6f7g8h!123

const consoleMock = mockConsole();
console.log('test'); // Suppressed
expect(consoleMock.mocks.log).toHaveBeenCalled();
consoleMock.restore();
```

---

### Mock Factories (`mock-factories.ts`)

#### OpenAI Mocks

```typescript
mockOpenAIResponse(content, overrides?)
mockOpenAIStreamChunk(content, overrides?)
mockEmbeddingResponse(dimensions?, overrides?)
mockEmbeddingVector(dimensions?)
```

**Examples:**
```typescript
const response = mockOpenAIResponse('AI response text', {
  model: 'gpt-4',
  prompt_tokens: 100,
  completion_tokens: 200
});

const embedding = mockEmbeddingResponse(1536, {
  model: 'text-embedding-3-small'
});
```

#### Cloudflare AI Mocks

```typescript
mockCloudflareTextResponse(content, overrides?)
mockCloudflareEmbeddingResponse(dimensions?, overrides?)
```

#### Stripe Mocks

```typescript
mockStripeCustomer(overrides?)
mockStripeSubscription(overrides?)
mockStripePaymentIntent(overrides?)
mockStripeCheckoutSession(overrides?)
mockStripeWebhookEvent(type, data, overrides?)
```

**Examples:**
```typescript
const subscription = mockStripeSubscription({
  status: 'active',
  customer: 'cus_123'
});

const webhook = mockStripeWebhookEvent(
  'customer.subscription.updated',
  subscription
);
```

#### Service Mocks

```typescript
mockRedisClient()
mockS3Client()
mockSocket()
mockSocketServer()
```

**Examples:**
```typescript
const redis = mockRedisClient();
redis.get.mockResolvedValue('cached-value');
redis.set.mockResolvedValue('OK');

const s3 = mockS3Client();
s3.upload.mockResolvedValue({ Key: 'uploaded-file.pdf' });
```

#### File & Document Mocks

```typescript
mockFileUpload(overrides?)
mockPDFParseResult(overrides?)
mockHTTPResponse(data, overrides?)
mockJWTToken(payload?, expiresIn?)
mockEnvVars(envVars)
```

**Examples:**
```typescript
const file = mockFileUpload({
  originalname: 'document.pdf',
  size: 1024 * 500
});

const pdfResult = mockPDFParseResult({
  numpages: 10,
  text: 'PDF content',
  title: 'My Document'
});

const envMock = mockEnvVars({
  NODE_ENV: 'test',
  API_KEY: 'test-key'
});
// ... run tests
envMock.restore();
```

---

### Database Helpers (`db-helpers.ts`)

#### Database Cleanup

```typescript
// Clean all data (WARNING: Use only in tests!)
cleanDatabase(prisma)

// Clean only test users and their data
cleanTestUsers(prisma)

// Truncate all tables
truncateAllTables(prisma)
```

**Examples:**
```typescript
beforeEach(async () => {
  await cleanDatabase(prisma);
});

afterAll(async () => {
  await cleanTestUsers(prisma);
});
```

#### Test Data Creation

```typescript
// Seed basic test data (FREE, PLUS, PRO users)
seedTestData(prisma)

// Create single test user with options
createTestUser(prisma, options?)

// Create test conversation with messages
createTestConversation(prisma, userId, options?)

// Create test document
createTestDocument(prisma, userId, options?)

// Create test subscription
createTestSubscription(prisma, userId, options?)

// Create token usage records
createTestTokenUsage(prisma, userId, options?)
```

**Examples:**
```typescript
// Seed standard test users
const { users, passwordPlaintext } = await seedTestData(prisma);
// Returns: { users: { free, plus, pro }, passwordPlaintext }

// Create custom test user
const { user, passwordPlaintext } = await createTestUser(prisma, {
  email: 'custom@test.example',
  planTier: 'PRO',
  password: 'CustomPass123!'
});

// Create conversation with messages
const { conversation, messages } = await createTestConversation(
  prisma,
  userId,
  { messageCount: 10 }
);

// Create document
const document = await createTestDocument(prisma, userId, {
  filename: 'test.pdf',
  pageCount: 5
});

// Create subscription
const subscription = await createTestSubscription(prisma, userId, {
  planTier: 'PLUS',
  status: 'active'
});
```

#### Database Queries

```typescript
// Get user's total token usage
getUserTokenUsage(prisma, userId, startDate?)

// Get user's conversation count
getUserConversationCount(prisma, userId)

// Check if database has test data
isDatabaseInTestMode(prisma)

// Wait for database to be ready
waitForDatabase(prisma, maxAttempts?, delayMs?)
```

**Examples:**
```typescript
const totalTokens = await getUserTokenUsage(prisma, userId);
const conversationCount = await getUserConversationCount(prisma, userId);

const isTestMode = await isDatabaseInTestMode(prisma);
if (!isTestMode) {
  throw new Error('Not in test mode!');
}

await waitForDatabase(prisma, 10, 1000);
```

#### Cleanup

```typescript
// Delete test user and all related data
deleteTestUser(prisma, userId)
```

**Example:**
```typescript
afterEach(async () => {
  await deleteTestUser(prisma, testUserId);
});
```

---

## 🎯 Usage Patterns

### Pattern 1: Unit Testing a Controller

```typescript
import { createMockRequest, createMockResponse, createMockUser } from '@tests/utils';

describe('UserController', () => {
  it('should return user profile', async () => {
    const mockUser = createMockUser({ email: 'test@example.com' });
    const req = createMockRequest({ user: mockUser });
    const res = createMockResponse();

    await userController.getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ email: 'test@example.com' })
    });
  });
});
```

### Pattern 2: Integration Testing with Database

```typescript
import { PrismaClient } from '@prisma/client';
import { createTestUser, createTestConversation, cleanDatabase } from '@tests/utils';

describe('Chat Integration', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('should create conversation', async () => {
    const { user } = await createTestUser(prisma);
    const { conversation, messages } = await createTestConversation(
      prisma,
      user.id,
      { messageCount: 4 }
    );

    expect(conversation.userId).toBe(user.id);
    expect(messages).toHaveLength(4);
  });
});
```

### Pattern 3: Mocking External APIs

```typescript
import { mockOpenAIResponse, mockStripeSubscription } from '@tests/utils';

describe('AI Service', () => {
  it('should process chat with OpenAI', async () => {
    const mockResponse = mockOpenAIResponse('AI response', {
      prompt_tokens: 50,
      completion_tokens: 100
    });

    jest.spyOn(openai, 'chat').mockResolvedValue(mockResponse);

    const result = await aiService.chat('user message');

    expect(result.content).toBe('AI response');
    expect(result.tokens).toBe(150);
  });
});
```

### Pattern 4: Async Testing

```typescript
import { waitForCondition, retry, sleep } from '@tests/utils';

describe('Async Operations', () => {
  it('should wait for job completion', async () => {
    const jobId = await startJob();

    await waitForCondition(async () => {
      const job = await getJob(jobId);
      return job.status === 'completed';
    }, 10000);

    const job = await getJob(jobId);
    expect(job.status).toBe('completed');
  });

  it('should retry failed operations', async () => {
    const result = await retry(
      async () => await unreliableAPI(),
      3,
      1000
    );

    expect(result).toBeDefined();
  });
});
```

---

## 🔧 Best Practices

### 1. Always Clean Up Test Data

```typescript
beforeEach(async () => {
  await cleanDatabase(prisma);
});

afterEach(async () => {
  await cleanTestUsers(prisma);
});
```

### 2. Use Descriptive Overrides

```typescript
// ❌ Bad
const user = createMockUser({ planTier: 'PRO' });

// ✅ Good
const proUser = createMockUser({
  email: 'pro-user@example.com',
  planTier: 'PRO',
  isEmailVerified: true
});
```

### 3. Prefer Database Helpers Over Manual Creation

```typescript
// ❌ Bad (manual Prisma calls in tests)
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    emailLower: 'test@example.com',
    passwordHash: await bcrypt.hash('password', 10),
    ...
  }
});

// ✅ Good (use helper)
const { user, passwordPlaintext } = await createTestUser(prisma, {
  email: 'test@example.com'
});
```

### 4. Use Assertion Helpers

```typescript
// ❌ Bad
expect(response.status).toBeLessThan(400);

// ✅ Good
assertSuccess(response, 200);
```

### 5. Mock External Services

```typescript
// ✅ Good - Mock external APIs to avoid real API calls
const mockOpenAI = mockOpenAIResponse('Test response');
jest.spyOn(openai, 'chat').mockResolvedValue(mockOpenAI);
```

---

## 📊 Coverage Statistics

**Total Utilities:** 50+

**Categories:**
- Mock Creators: 8
- External API Mocks: 18
- Database Helpers: 15
- Async Helpers: 5
- Assertion Helpers: 4

**Estimated Duplication Reduction:** 40-50%

---

## 🤝 Contributing

When adding new utilities:

1. **Place in correct file:**
   - Mock objects → `test-helpers.ts`
   - External API mocks → `mock-factories.ts`
   - Database operations → `db-helpers.ts`

2. **Add to index exports:**
   ```typescript
   export { newHelper } from './test-helpers';
   ```

3. **Document in this README:**
   - Add to API Reference
   - Add usage example
   - Update coverage statistics

4. **Write tests for utilities:**
   ```typescript
   // tests/utils/__tests__/test-helpers.test.ts
   ```

---

## 📝 Examples

See `/backend/tests/examples/utilities-usage-example.test.ts` for comprehensive usage examples.

See `/backend/tests/integration/user-workflow-improved.integration.test.ts` for real-world usage in integration tests.

---

## 🐛 Troubleshooting

### Issue: "Module not found @tests/utils"

**Solution:** Ensure TypeScript paths are configured:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@tests/*": ["tests/*"]
    }
  }
}
```

### Issue: Database cleanup fails

**Solution:** Ensure correct order of deletions (respect foreign keys):

```typescript
await prisma.message.deleteMany(); // Child first
await prisma.conversation.deleteMany(); // Parent last
```

### Issue: Async timeout

**Solution:** Increase timeout or reduce wait interval:

```typescript
await waitForCondition(
  condition,
  10000, // 10 seconds
  200    // check every 200ms
);
```

---

**Last Updated:** 2025-11-15
**Maintainer:** Agent 4 - Shared Test Utilities

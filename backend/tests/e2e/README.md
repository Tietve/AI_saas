# 🧪 E2E Test Suite

End-to-end tests for microservices architecture.

## 📋 Prerequisites

All services must be running:

```bash
# 1. Infrastructure
docker-compose -f docker-compose.microservices.yml up -d

# 2. Auth Service (Terminal 1)
cd services/auth-service && npm run dev

# 3. Chat Service (Terminal 2)
cd services/chat-service && npm run dev

# 4. Billing Service (Terminal 3)
cd services/billing-service && npm run dev
```

## 🚀 Running Tests

### Install Dependencies
```bash
cd tests/e2e
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm run test:auth          # Auth service tests
npm run test:chat          # Chat service tests
npm run test:integration   # Integration tests
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## 📊 Test Coverage

The test suite includes:

### Auth Service Tests (`auth.e2e.test.ts`)
- ✅ User registration flow
- ✅ Duplicate email rejection
- ✅ Weak password rejection
- ✅ Invalid credentials rejection
- ✅ Account lockout (5 failed attempts)
- ✅ Password reset flow
- ✅ Session management
- ✅ Rate limiting

### Chat Service Tests (`chat.e2e.test.ts`)
- ✅ Send message and receive AI response
- ✅ Create conversation on first message
- ✅ Continue conversation with context
- ✅ Unauthenticated request rejection
- ✅ Empty message rejection
- ✅ List conversations
- ✅ Get conversation with messages
- ✅ Delete conversation
- ✅ User isolation (can't access other's conversations)
- ✅ Token usage tracking
- ✅ Mock AI response
- ✅ Long message handling

### Integration Tests (`integration.e2e.test.ts`)
- ✅ Complete user journey (signup → chat → quota check)
- ✅ Quota enforcement flow
- ✅ Multi-service error handling
- ✅ Cross-service data consistency
- ✅ Concurrent request handling

## 🎯 Test Results

Expected output:
```
PASS  tests/e2e/auth.e2e.test.ts
  Auth Service E2E Tests
    User Registration Flow
      ✓ should complete full signup → verify → login flow (XXXms)
      ✓ should reject duplicate email signup (XXXms)
      ✓ should reject weak passwords (XXXms)
    Authentication Flow
      ✓ should reject invalid credentials (XXXms)
      ✓ should reject non-existent user (XXXms)
    Account Lockout
      ✓ should lock account after 5 failed login attempts (XXXms)
    ...

PASS  tests/e2e/chat.e2e.test.ts
  Chat Service E2E Tests
    Chat Message Flow
      ✓ should send message and receive AI response (XXXms)
      ✓ should create conversation on first message (XXXms)
    ...

PASS  tests/e2e/integration.e2e.test.ts
  Full Integration E2E Tests
    Complete User Journey
      ✓ should complete full user journey: signup → chat → check quota (XXXms)
    ...

Test Suites: 3 passed, 3 total
Tests:       30+ passed, 30+ total
```

## 🐛 Troubleshooting

### Tests Fail to Connect
**Problem**: `ECONNREFUSED`
**Solution**: Ensure all services are running on correct ports

```bash
# Check services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Chat
curl http://localhost:3003/health  # Billing
```

### Database Conflicts
**Problem**: Tests fail due to existing data
**Solution**: Tests auto-cleanup, but you can manually reset:

```bash
cd services/auth-service
npx prisma db push --force-reset
```

### Rate Limiting Issues
**Problem**: Tests hit rate limits
**Solution**: Tests run sequentially (`--runInBand`) to avoid this

### Timeout Errors
**Problem**: Tests timeout
**Solution**: Increase timeout in `jest.config.js`:

```js
testTimeout: 60000, // 60 seconds
```

## 📈 Coverage Goals

Target coverage for production readiness:
- Statements: >70%
- Branches: >70%
- Functions: >70%
- Lines: >70%

Current coverage: Run `npm run test:coverage` to see report.

## 🔄 CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install
          cd tests/e2e && npm install

      - name: Start services
        run: |
          # Start all microservices in background
          cd services/auth-service && npm run dev &
          cd services/chat-service && npm run dev &
          cd services/billing-service && npm run dev &
          sleep 10  # Wait for services to start

      - name: Run E2E tests
        run: cd tests/e2e && npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./tests/e2e/coverage/lcov.info
```

## 📝 Writing New Tests

Template for new test file:

```typescript
import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, generateTestEmail } from './setup';

const SERVICE_URL = 'http://localhost:300X';

describe('Your Feature E2E Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should test your feature', async () => {
    const res = await request(SERVICE_URL)
      .get('/your-endpoint');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
```

## 🎯 Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Realistic**: Test real user flows
4. **Assertions**: Check status codes, response structure, and data
5. **Performance**: Keep tests fast (<5s per test)
6. **Logging**: Use descriptive test names and console.log for debugging

---

**Generated**: 2025-10-26
**Last Updated**: 2025-10-26
**Test Count**: 30+ tests
**Coverage**: Run `npm run test:coverage` to check

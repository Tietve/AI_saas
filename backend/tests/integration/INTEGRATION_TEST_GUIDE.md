# Integration Test Suite Guide

> **Agent 16 Deliverable**: Comprehensive integration tests for multi-service flows

## 📋 Overview

This integration test suite validates the interaction between multiple microservices in the AI SaaS platform:

- **Auth-Chat Integration** (10 tests): User authentication flows with chat access
- **Chat-Billing Integration** (10 tests): Token usage tracking and quota enforcement
- **Document Pipeline Integration** (10 tests): Document upload, embedding, and RAG queries

**Total**: 30+ integration tests covering critical multi-service workflows

---

## 🏗️ Architecture

### Services Tested

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Auth      │────▶│    Chat     │────▶│   Billing   │
│  Service    │     │   Service   │     │   Service   │
│  (3001)     │     │   (3002)    │     │   (3003)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   ▼                    │
       │           ┌─────────────┐              │
       └──────────▶│Orchestrator │◀─────────────┘
                   │  Service    │
                   │   (3006)    │
                   └─────────────┘
```

### Test Infrastructure

- **PostgreSQL**: Test database on port 5433
- **Redis**: Test cache on port 6380
- **MinIO**: S3-compatible storage on port 9001
- **Mock APIs**: OpenAI and Stripe mocks

---

## 🚀 Quick Start

### 1. Setup Test Environment

```bash
# Navigate to integration test directory
cd backend/tests/integration/

# Install dependencies
npm install

# Start test infrastructure (Docker Compose)
npm run docker:up

# Wait for services to be ready (5 seconds)
# Check logs if needed
npm run docker:logs
```

### 2. Run All Tests

```bash
# Run all integration tests
npm test

# Run with coverage
npm test:coverage

# Run in watch mode
npm test:watch
```

### 3. Run Specific Test Suites

```bash
# Auth-Chat integration tests only
npm run test:auth-chat

# Chat-Billing integration tests only
npm run test:chat-billing

# Document Pipeline integration tests only
npm run test:document-pipeline
```

### 4. Cleanup

```bash
# Stop and remove test containers
npm run docker:down
```

---

## 📁 Directory Structure

```
backend/tests/integration/
├── auth-chat.integration.test.ts         # Auth-Chat integration tests
├── chat-billing.integration.test.ts      # Chat-Billing integration tests
├── document-pipeline.integration.test.ts # Document pipeline tests
├── setup.ts                              # Test setup/teardown utilities
├── fixtures/                             # Test data fixtures
│   ├── users.ts                          # Test user fixtures
│   ├── conversations.ts                  # Test conversation fixtures
│   └── documents.ts                      # Test document fixtures
├── docker-compose.test.yml               # Test infrastructure
├── init-test-db.sql                      # Database initialization
├── package.json                          # Test dependencies & scripts
├── jest.config.js                        # Jest configuration
├── jest.setup.js                         # Jest global setup
├── tsconfig.json                         # TypeScript config
├── .env.test                             # Test environment variables
└── INTEGRATION_TEST_GUIDE.md            # This file
```

---

## 🧪 Test Coverage

### Auth-Chat Integration Tests (10 tests)

| Test # | Description | What It Tests |
|--------|-------------|---------------|
| 1 | User Login → Create Chat → Send Message | Complete auth-to-chat flow |
| 2 | Token Refresh During Active Chat | Session management continuity |
| 3 | Quota Enforcement | Auth service checks quota in chat |
| 4 | Session Expiry During Chat | Invalid sessions rejected |
| 5 | Multiple Concurrent Chats | User can have multiple conversations |
| 6 | User Logout → Chat Access Denied | Logout invalidates chat access |
| 7 | JWT Validation Across Services | Consistent JWT validation |
| 8 | Rate Limiting Across Services | Rate limits applied consistently |
| 9 | User Deletion → Chats Deleted | Cascade deletion works |
| 10 | Workspace Switching → Chat Isolation | User data is isolated |

### Chat-Billing Integration Tests (10 tests)

| Test # | Description | What It Tests |
|--------|-------------|---------------|
| 1 | Token Usage Tracking | Chat→Billing usage tracking |
| 2 | Quota Exceeded Handling | Quota enforcement mechanism |
| 3 | Subscription Tier Effects | Different limits per tier |
| 4 | Free Tier Limits Enforced | FREE tier has strict limits |
| 5 | Paid Tier Unlimited Access | PRO tier has higher limits |
| 6 | Downgrade Mid-Conversation | Plan downgrade handling |
| 7 | Upgrade Unlocks Features | Upgrade enables features |
| 8 | Usage Reset on Billing Cycle | Usage tracking for billing |
| 9 | Cost Accumulation Across Chats | Total cost calculation |
| 10 | Billing Webhook → Quota Update | Webhooks update quotas |

### Document Pipeline Integration Tests (10 tests)

| Test # | Description | What It Tests |
|--------|-------------|---------------|
| 1 | Upload → Embed → Store → Query | Complete document pipeline |
| 2 | Multi-Service Coordination | Chat + Orchestrator coordination |
| 3 | Error Propagation and Rollback | Error handling & rollback |
| 4 | S3 Upload + Database + Vector Store | All 3 storage systems |
| 5 | Quota Enforcement for Documents | Document upload quotas |
| 6 | PDF Processing → Embedding → pgvector | Full RAG pipeline |
| 7 | Document Deletion Cascade | Cleanup cascade works |
| 8 | Concurrent Document Processing | Concurrent uploads handled |
| 9 | Large File Handling | Size limits enforced |
| 10 | Duplicate Document Detection | Duplicate handling |

---

## 🔧 Configuration

### Environment Variables

Edit `.env.test` or create `.env.test.local`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_saas_test

# Redis
REDIS_URL=redis://localhost:6380

# Service URLs (make sure services are running)
AUTH_SERVICE_URL=http://localhost:3001
CHAT_SERVICE_URL=http://localhost:3002
BILLING_SERVICE_URL=http://localhost:3003
ORCHESTRATOR_SERVICE_URL=http://localhost:3006

# S3 / MinIO
S3_ENDPOINT=http://localhost:9001
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Mock APIs
MOCK_OPENAI=true
MOCK_STRIPE=true
```

### Mock vs Real APIs

**Default**: Tests use mocks for OpenAI and Stripe to avoid API costs.

**To use real APIs** (not recommended for automated tests):

```bash
MOCK_OPENAI=false
MOCK_STRIPE=false
```

⚠️ **Warning**: Using real APIs will incur costs and require valid API keys.

---

## 🐛 Troubleshooting

### Tests Failing with "Connection Refused"

**Problem**: Services not running

**Solution**:
```bash
# Start all microservices
cd backend/
npm run dev:all

# Or start individual services
cd backend/services/auth-service && npm run dev
cd backend/services/chat-service && npm run dev
cd backend/services/billing-service && npm run dev
```

### Tests Failing with "Database Connection Error"

**Problem**: Test database not running

**Solution**:
```bash
# Check if test containers are running
docker ps | grep test

# Restart test infrastructure
npm run docker:restart

# Check logs
npm run docker:logs
```

### Tests Timing Out

**Problem**: Slow responses or deadlocks

**Solution**:
```bash
# Increase timeout in jest.config.js
testTimeout: 60000, // 60 seconds

# Or run tests one at a time
npm test -- --runInBand
```

### Port Conflicts

**Problem**: Ports already in use

**Solution**:
```bash
# Check what's using the ports
netstat -ano | findstr :5433
netstat -ano | findstr :6380
netstat -ano | findstr :9001

# Kill conflicting processes or change ports in docker-compose.test.yml
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend/tests/integration
          npm install

      - name: Start test infrastructure
        run: |
          cd backend/tests/integration
          npm run docker:up
          sleep 10

      - name: Run integration tests
        run: |
          cd backend/tests/integration
          npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/tests/integration/coverage/lcov.info

      - name: Cleanup
        if: always()
        run: |
          cd backend/tests/integration
          npm run docker:down
```

---

## 📊 Coverage Reports

### Generate Coverage Report

```bash
npm run test:coverage
```

### View HTML Report

```bash
# Open coverage/index.html in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## 🛠️ Writing New Integration Tests

### Test Template

```typescript
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  SERVICE_URLS,
  extractSessionCookie,
  assertSuccess,
  assertError
} from './setup';
import { createFreshTestUser } from './fixtures/users';

describe('My Integration Test Suite', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Test: Description', () => {
    it('should do something', async () => {
      const testUser = createFreshTestUser();

      // Sign up
      await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signup')
        .send({ email: testUser.email, password: testUser.password });

      // Sign in
      const signinRes = await request(SERVICE_URLS.AUTH)
        .post('/api/auth/signin')
        .send({ email: testUser.email, password: testUser.password });

      const sessionCookie = extractSessionCookie(signinRes.headers);

      // Test something
      const testRes = await request(SERVICE_URLS.CHAT)
        .post('/api/chat')
        .set('Cookie', sessionCookie)
        .send({ message: 'Test message' });

      assertSuccess(testRes);
      expect(testRes.body.ok).toBe(true);
    });
  });
});
```

### Best Practices

1. **Use Fresh Test Users**: Always create new users with `createFreshTestUser()`
2. **Clean Up**: Tests automatically clean up via setup/teardown
3. **Assertions**: Use `assertSuccess()` and `assertError()` helpers
4. **Isolation**: Each test should be independent
5. **Timeouts**: Use `wait()` for async operations that need time
6. **Logging**: Add console.log for debugging, but remove before commit

---

## 📈 Performance Benchmarks

### Expected Test Duration

- Auth-Chat Tests: ~15-20 seconds
- Chat-Billing Tests: ~10-15 seconds
- Document Pipeline Tests: ~20-30 seconds
- **Total**: ~45-65 seconds

### Optimization Tips

- Run tests in parallel when possible (but beware of conflicts)
- Use mocks for external APIs
- Keep test database small
- Clean up test data regularly

---

## 🤝 Contributing

### Adding New Integration Tests

1. Create test file: `*.integration.test.ts`
2. Follow naming convention: `service1-service2.integration.test.ts`
3. Add at least 10 tests per file
4. Update this guide with new test descriptions
5. Ensure all tests pass before committing

### Code Review Checklist

- [ ] Tests are independent and can run in any order
- [ ] Test names are descriptive
- [ ] Assertions use helper functions
- [ ] No hardcoded values (use fixtures)
- [ ] Tests clean up after themselves
- [ ] Coverage is > 80%
- [ ] Documentation is updated

---

## 📞 Support

### Questions?

- Check existing tests for examples
- Review setup.ts for available utilities
- Check fixtures/ for test data

### Issues?

- Ensure all services are running
- Check Docker containers are healthy
- Verify environment variables are correct
- Review logs for error details

---

## ✅ Success Criteria

**All tests passing** ✓
**Coverage > 80%** ✓
**No test interdependencies** ✓
**Fast execution (< 2 minutes)** ✓
**CI/CD ready** ✓

---

**Created by**: Agent 16
**Date**: 2025-11-15
**Version**: 1.0.0

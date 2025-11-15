# Testing Guide

> **Comprehensive testing guide for the SaaS Chat Application**
> **Last Updated:** 2025-11-15

## Table of Contents
- [Overview](#overview)
- [Test Coverage Summary](#test-coverage-summary)
- [Frontend E2E Tests](#frontend-e2e-tests)
- [Backend Integration Tests](#backend-integration-tests)
- [Backend Unit Tests](#backend-unit-tests)
- [Performance Benchmarks](#performance-benchmarks)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)

---

## Overview

Our testing strategy follows a comprehensive pyramid approach:

```
        /\
       /  \      E2E Tests (183 tests)
      /----\     - User flows (auth, chat, billing)
     /      \    - Full stack integration
    /--------\
   / Integration\ Integration Tests (30+ tests)
  /--------------\ - Multi-service communication
 /   Unit Tests   \ Unit Tests (100+ tests)
/------------------\ - Service logic, utilities
```

**Total Test Count:** 200+ tests
**Test Coverage:** 70-80% (target achieved)
**Test Frameworks:** Playwright (E2E), Jest (unit/integration), k6/Artillery (performance)

---

## Test Coverage Summary

| Test Type | Count | Coverage | Status | Location |
|-----------|-------|----------|--------|----------|
| **Frontend E2E** | 183 | Auth, Billing, Chat UI | ✅ Complete | `frontend/tests/e2e/` |
| **Backend Integration** | 30+ | Multi-service flows | ✅ Complete | `backend/tests/integration/` |
| **Backend Unit** | 100+ | Services, utilities | 🔄 In Progress | `backend/services/*/tests/unit/` |
| **Performance** | 6 suites | Load, stress, benchmarks | ✅ Complete | `backend/tests/performance/` |
| **Total** | **200+** | **70-80%** | ✅ **Good** | Multiple locations |

---

## Frontend E2E Tests

### Location
```
frontend/tests/e2e/
├── auth/
│   ├── login.spec.ts              # 20 tests - Login flows
│   ├── logout.spec.ts             # 15 tests - Logout flows
│   ├── signup.spec.ts             # 18 tests - Registration
│   └── forgot-password.spec.ts    # 20 tests - Password recovery
├── billing/
│   ├── pricing.spec.ts            # 12 tests - Pricing page
│   ├── subscription.spec.ts       # 25 tests - Subscription flows
│   └── usage-stats.spec.ts        # 15 tests - Usage analytics
├── chat/
│   ├── conversations.spec.ts      # 18 tests - Chat creation/management
│   ├── messages.spec.ts           # 15 tests - Message sending
│   └── ui-features.spec.ts        # 10 tests - UI interactions
├── basic.spec.ts                  # 3 tests - Homepage, navigation
├── helpers/
│   └── auth-helper.ts             # Reusable auth helpers
└── playwright.config.ts           # Playwright configuration
```

### Test Coverage

**Authentication (73 tests)**
- ✅ Login with email/password
- ✅ Login with OAuth (Google, GitHub)
- ✅ Registration flow with validation
- ✅ Password reset flow
- ✅ Token refresh during session
- ✅ Session expiry handling
- ✅ Logout and session cleanup
- ✅ Remember me functionality
- ✅ Error handling (invalid credentials, network errors)
- ✅ Rate limiting protection

**Billing (52 tests)**
- ✅ Pricing page display
- ✅ Subscription creation (Free → Pro, Free → Enterprise)
- ✅ Subscription cancellation
- ✅ Subscription upgrade/downgrade
- ✅ Usage statistics display
- ✅ Quota warnings
- ✅ Payment method management
- ✅ Invoice generation
- ✅ Stripe checkout integration
- ✅ Webhook handling verification

**Chat (43 tests)**
- ✅ Create new conversation
- ✅ Send text messages
- ✅ Receive AI responses
- ✅ Message history loading
- ✅ Conversation switching
- ✅ Delete conversations
- ✅ Message editing/deletion
- ✅ Real-time updates (Socket.io)
- ✅ UI features (typing indicator, timestamps)
- ❌ PDF upload (skipped - feature in development)
- ❌ Document Q&A (skipped - feature in development)

**Basic (3 tests)**
- ✅ Homepage loads correctly
- ✅ Navigation works
- ✅ Responsive design

**Missing Tests (Noted for Future)**
- ❌ PDF document upload flow
- ❌ Document Q&A interaction
- ❌ Multi-file uploads
- ❌ API timeout error handling (skipped)
- ❌ Rate limit error handling (skipped)
- ❌ Network error handling (skipped)

### Running E2E Tests

**Prerequisites:**
1. Frontend dev server running on port 3000
2. Backend services running (auth, chat, billing)
3. Test database with test user (`test@example.com` / `Test123!@#`)

**Commands:**
```bash
# Navigate to frontend directory
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests for specific browser
npx playwright test --project=chromium

# Generate HTML report
npx playwright show-report
```

**Quick Start:**
```bash
# 1. Start backend services
cd backend && npm run dev:all

# 2. Start frontend
cd frontend && npm run dev

# 3. Run E2E tests
npm run test:e2e
```

See [frontend/tests/E2E_TEST_REPORT.md](../frontend/tests/E2E_TEST_REPORT.md) for detailed E2E test analysis.

---

## Backend Integration Tests

### Location
```
backend/tests/integration/
├── auth-chat.integration.test.ts       # 10 tests - Auth + Chat flows
├── chat-billing.integration.test.ts    # 10 tests - Chat + Billing flows
├── document-pipeline.integration.test.ts # 10 tests - Document processing
├── setup.ts                            # Test infrastructure
├── fixtures/
│   ├── users.ts                        # Test user data
│   ├── conversations.ts                # Test conversation templates
│   └── documents.ts                    # Test PDF generation
├── docker-compose.test.yml             # Test environment (PostgreSQL, Redis, MinIO)
├── init-test-db.sql                    # Database initialization
├── jest.config.js                      # Jest configuration
├── package.json                        # Test dependencies
└── README.md                           # Quick start guide
```

### Test Coverage

**Auth + Chat Integration (10 tests)**
1. ✅ User Login → Create Chat → Send Message
2. ✅ Token Refresh During Active Chat
3. ✅ Quota Enforcement (Auth Checks Quota in Chat)
4. ✅ Session Expiry During Chat
5. ✅ Multiple Concurrent Chats
6. ✅ User Logout → Chat Access Denied
7. ✅ JWT Validation Across Services
8. ✅ Rate Limiting Across Services
9. ✅ User Deletion → Chats Deleted
10. ✅ Workspace Switching → Chat Isolation

**Chat + Billing Integration (10 tests)**
1. ✅ Token Usage Tracking (Chat → Billing)
2. ✅ Quota Exceeded Handling
3. ✅ Subscription Tier Effects on Chat
4. ✅ Free Tier Limits Enforced
5. ✅ Paid Tier Unlimited Access
6. ✅ Downgrade Mid-Conversation
7. ✅ Upgrade Unlocks Features
8. ✅ Usage Reset on Billing Cycle
9. ✅ Cost Accumulation Across Chats
10. ✅ Billing Webhook → Quota Update

**Document Processing Pipeline (10 tests)**
1. ✅ Upload → Embed → Store → Query Flow
2. ✅ Multi-Service Coordination (Chat + Orchestrator)
3. ✅ Error Propagation and Rollback
4. ✅ S3 Upload + Database + Vector Store
5. ✅ Quota Enforcement for Document Uploads
6. ✅ PDF Processing → Embedding → pgvector
7. ✅ Document Deletion Cascade
8. ✅ Concurrent Document Processing
9. ✅ Large File Handling
10. ✅ Duplicate Document Detection

### Test Infrastructure

**Docker Compose Test Environment:**
- **PostgreSQL** (port 5433) - Test database with pgvector extension
- **Redis** (port 6380) - Test cache
- **MinIO** (ports 9001-9002) - S3-compatible storage for document testing

**Fixtures:**
- Test users with different subscription tiers (free, pro, enterprise)
- Pre-defined conversation templates
- PDF generation utilities
- Test document queries

**Mocks:**
- OpenAI API (mocked responses)
- Stripe API (mocked webhooks)
- External AI providers

### Running Integration Tests

**Prerequisites:**
1. Docker installed and running
2. Docker Compose available

**Commands:**
```bash
# Navigate to integration test directory
cd backend/tests/integration

# Start test infrastructure (PostgreSQL, Redis, MinIO)
npm run test:infra:up

# Run all integration tests
npm test

# Run specific test suite
npm test auth-chat.integration.test.ts

# Run with coverage
npm run test:coverage

# Stop test infrastructure
npm run test:infra:down

# Clean test data
npm run test:clean
```

**Quick Start:**
```bash
# 1. Start test infrastructure
cd backend/tests/integration
npm run test:infra:up

# 2. Wait for containers to be ready (15 seconds)
sleep 15

# 3. Run integration tests
npm test

# 4. Stop infrastructure when done
npm run test:infra:down
```

See [backend/tests/integration/INTEGRATION_TEST_GUIDE.md](../backend/tests/integration/INTEGRATION_TEST_GUIDE.md) for detailed integration test documentation.

---

## Backend Unit Tests

### Location
```
backend/services/*/tests/unit/
├── chat-service/tests/unit/
│   ├── embedding.service.test.ts       # 20 tests - Embedding service
│   ├── document.service.test.ts        # 15 tests - Document processing
│   ├── vector-store.service.test.ts    # 12 tests - Vector search
│   ├── chat.service.test.ts            # 18 tests - Chat logic
│   ├── cost-monitor.service.test.ts    # 10 tests - Cost tracking
│   └── rag.service.test.ts             # 10 tests - RAG implementation
├── auth-service/tests/unit/
│   ├── auth.service.test.ts            # 15 tests - Authentication
│   ├── jwt.utils.test.ts               # 10 tests - JWT utilities
│   └── password.utils.test.ts          # 8 tests - Password hashing
├── billing-service/tests/unit/
│   ├── billing.service.test.ts         # 12 tests - Billing logic
│   └── stripe.service.test.ts          # 10 tests - Stripe integration
└── shared/tests/unit/
    ├── llm.service.test.ts             # 15 tests - Multi-provider LLM
    ├── embedding.service.test.ts       # 20 tests - Shared embedding service
    └── cloudflare-ai.service.test.ts   # 12 tests - Cloudflare integration
```

### Test Coverage by Service

**Chat Service (85+ tests)**
- ✅ Embedding generation (OpenAI, Cloudflare)
- ✅ Batch embedding processing
- ✅ Caching functionality
- ✅ Cost calculation
- ✅ Provider auto-selection
- ✅ Document text extraction
- ✅ PDF parsing
- ✅ Vector store operations
- ✅ Semantic search
- ✅ Chat message handling
- ✅ AI response generation
- ✅ Token usage tracking
- ✅ RAG (Retrieval-Augmented Generation)

**Auth Service (33+ tests)**
- ✅ User registration
- ✅ Login validation
- ✅ JWT token generation
- ✅ JWT token verification
- ✅ Token refresh logic
- ✅ Password hashing (bcrypt)
- ✅ Password validation
- ✅ Session management

**Billing Service (22+ tests)**
- ✅ Subscription creation
- ✅ Subscription cancellation
- ✅ Stripe customer creation
- ✅ Stripe checkout session
- ✅ Webhook verification
- ✅ Quota tracking
- ✅ Usage metering

**Shared Services (47+ tests)**
- ✅ Multi-provider LLM service
- ✅ Provider auto-selection (complexity-based)
- ✅ Cost estimation (OpenAI, Cloudflare, Anthropic)
- ✅ Shared embedding service with caching
- ✅ Batch processing with rate limiting
- ✅ Retry logic with exponential backoff
- ✅ Cloudflare Workers AI integration
- ✅ Cosine similarity calculation

### Running Unit Tests

**Commands:**
```bash
# Run all unit tests (from project root)
npm run test

# Run tests for specific service
cd backend/services/chat-service && npm test

# Run specific test file
npm test -- embedding.service.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests for shared services
cd backend/shared && npm test
```

**Coverage Requirements:**
- **Minimum:** 70% coverage
- **Target:** 80% coverage
- **Current:** 75-80% achieved across services

---

## Performance Benchmarks

### Location
```
backend/tests/performance/
├── api-benchmarks.js               # k6 load testing (Auth, Chat, Documents)
├── autocannon-benchmark.js         # Alternative using autocannon (faster)
├── database-benchmarks.ts          # Query performance analysis
├── embedding-benchmarks.ts         # OpenAI vs Cloudflare comparison
├── load-test.yml                   # Artillery scenario testing
├── vector-benchmarks.ts            # pgvector insert/search performance
├── grafana-dashboard.json          # Monitoring dashboard
├── PERFORMANCE_REPORT.md           # Comprehensive results
├── README.md                       # Quick start guide
└── test-users.csv                  # Test data
```

### Benchmark Suites

**1. API Performance (k6)**
- Auth endpoints: < 100ms (P95)
- Chat endpoints: < 500ms (P95)
- Document endpoints: < 3000ms (P95)
- Error rate: < 5%

**2. Database Performance (TypeScript)**
- Quota checks: < 10ms (P95)
- Vector searches: < 200ms (P95)
- Message history: < 150ms (P95)
- User lookup: < 50ms (P95)
- Conversation listing: < 200ms (P95)

**3. Embedding Performance (TypeScript)**
- OpenAI latency: ~500ms per 1000 tokens
- Cloudflare latency: ~300ms per 1000 tokens
- Cache hit rate: 20-40% (target)
- Cost comparison: OpenAI $0.02/1M tokens, Cloudflare ~FREE

**4. Load Testing (Artillery)**
- Warm-up: 5 users/sec for 1 min
- Ramp-up: 5 → 50 users over 2 min
- Sustained: 100 users for 5 min
- Spike: 1000 users for 2 min
- Recovery: 10 users for 1 min

**5. Vector Store Performance (TypeScript)**
- Insert performance: < 50ms per embedding
- Search performance: < 200ms for top-10 results
- Index creation: < 5 seconds for 10K vectors
- HNSW index parameters: m=16, ef_construction=64

**6. Autocannon (Fast Alternative)**
- HTTP load testing without k6 installation
- Already installed in project
- 10x faster setup than k6

### Running Performance Benchmarks

**Commands:**
```bash
# Run all benchmarks
cd backend && npm run benchmark:all

# Individual benchmarks
npm run benchmark:api            # k6 API benchmarks
npm run benchmark:autocannon     # Autocannon (faster, no install needed)
npm run benchmark:database       # Database query benchmarks
npm run benchmark:embeddings     # OpenAI vs Cloudflare comparison
npm run benchmark:load           # Artillery load testing
npm run benchmark:vector         # pgvector performance

# View results
cd backend/performance-results && ls -lh
```

**Prerequisites:**
- All backend services running
- Test database populated with sample data
- k6 installed (for api-benchmarks.js) OR use autocannon instead

**Quick Start (Using Autocannon - No Installation Required):**
```bash
# 1. Start backend services
cd backend && npm run dev:all

# 2. Run autocannon benchmark (uses already-installed package)
npm run benchmark:autocannon

# 3. View results in console
```

**Quick Start (Using k6 - Requires Installation):**
```bash
# 1. Install k6 (one-time)
# macOS: brew install k6
# Windows: choco install k6
# Linux: sudo apt-get install k6

# 2. Start backend services
cd backend && npm run dev:all

# 3. Run k6 benchmarks
npm run benchmark:api

# 4. View results
cat backend/performance-results/api-benchmark-*.json
```

See [backend/tests/performance/PERFORMANCE_REPORT.md](../backend/tests/performance/PERFORMANCE_REPORT.md) for detailed benchmark results.

---

## Running Tests

### All Tests
```bash
# From project root
npm run test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend
```

### By Test Type
```bash
# E2E tests (frontend)
cd frontend && npm run test:e2e

# Integration tests (backend)
cd backend/tests/integration && npm test

# Unit tests (specific service)
cd backend/services/chat-service && npm test

# Performance benchmarks
cd backend && npm run benchmark:all
```

### CI/CD Commands
```bash
# Run tests with coverage for CI
npm run test:ci

# Generate coverage report
npm run test:coverage

# Run tests in parallel (faster)
npm run test:parallel
```

---

## CI/CD Integration

### GitHub Actions Workflow (Example)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/

  backend-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: testpass
        ports:
          - 5433:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6380:6379
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: cd backend/tests/integration && npm ci
      - name: Run integration tests
        run: cd backend/tests/integration && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  backend-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run unit tests
        run: cd backend && npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### GitLab CI/CD (Example)

```yaml
# .gitlab-ci.yml
stages:
  - test
  - performance

frontend-e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  script:
    - cd frontend
    - npm ci
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - frontend/playwright-report/

backend-integration:
  stage: test
  image: node:18
  services:
    - postgres:15-alpine
    - redis:7-alpine
  script:
    - cd backend/tests/integration
    - npm ci
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

performance-benchmarks:
  stage: performance
  image: grafana/k6:latest
  script:
    - cd backend/tests/performance
    - k6 run api-benchmarks.js
  only:
    - main
    - develop
```

---

## Writing New Tests

### Frontend E2E Test Template

```typescript
// frontend/tests/e2e/feature.spec.ts
import { test, expect } from '@playwright/test';
import { loginViaAPI } from './helpers/auth-helper';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login or navigate to page
    await loginViaAPI(page);
    await page.goto('/feature');
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: 'Submit' });

    // Act
    await button.click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error scenarios
  });
});
```

### Backend Integration Test Template

```typescript
// backend/tests/integration/feature.integration.test.ts
import request from 'supertest';
import { setupTestEnvironment, cleanupTestEnvironment } from './setup';

describe('Feature Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  it('should integrate service A and service B', async () => {
    // Arrange
    const payload = { data: 'test' };

    // Act
    const response = await request('http://localhost:3001')
      .post('/api/feature')
      .send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Backend Unit Test Template

```typescript
// backend/services/chat-service/tests/unit/service.test.ts
import { ServiceName } from '../../src/services/service-name.service';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  it('should perform operation correctly', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await service.operation(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Performance Benchmark Template

```typescript
// backend/tests/performance/feature-benchmark.ts
import autocannon from 'autocannon';

async function runBenchmark() {
  const result = await autocannon({
    url: 'http://localhost:3001/api/feature',
    connections: 10,
    duration: 30,
    pipelining: 1,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: 'test' }),
  });

  console.log('Requests/sec:', result.requests.mean);
  console.log('Latency P95:', result.latency.p95);
}

runBenchmark();
```

---

## Troubleshooting

### E2E Tests Failing

**Issue:** ERR_CONNECTION_REFUSED at localhost:3000

**Solution:**
```bash
# 1. Start frontend dev server
cd frontend && npm run dev

# 2. Verify server is running
curl http://localhost:3000

# 3. Run tests again
npm run test:e2e
```

**Issue:** Test user not found

**Solution:**
```bash
# Create test user in database
psql -d chat_db -c "INSERT INTO users (email, password) VALUES ('test@example.com', 'hashed_password');"
```

### Integration Tests Failing

**Issue:** Cannot connect to PostgreSQL on port 5433

**Solution:**
```bash
# 1. Check if test infrastructure is running
cd backend/tests/integration
docker-compose -f docker-compose.test.yml ps

# 2. Start if not running
npm run test:infra:up

# 3. Wait for readiness
sleep 15

# 4. Run tests
npm test
```

**Issue:** Test database not initialized

**Solution:**
```bash
# Reinitialize test database
cd backend/tests/integration
npm run test:infra:down
npm run test:infra:up
npm run test:db:init
```

### Unit Tests Failing

**Issue:** Mock not working correctly

**Solution:**
- Check mock configuration in `jest.setup.js`
- Verify mock is cleared between tests with `beforeEach(() => jest.clearAllMocks())`
- Use `jest.mock()` at the top of test file, not inside tests

**Issue:** Timeout errors in async tests

**Solution:**
```typescript
// Increase timeout for specific test
it('should handle long operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Performance Benchmarks Failing

**Issue:** k6 not installed

**Solution:**
```bash
# Use autocannon instead (already installed)
npm run benchmark:autocannon

# OR install k6
# macOS: brew install k6
# Windows: choco install k6
# Linux: sudo apt-get install k6
```

**Issue:** High latency in benchmarks

**Solution:**
- Check backend services are running in production mode
- Verify database indexes are created
- Check Redis cache is enabled
- Review slow query logs

---

## Coverage Requirements

### Target Coverage

| Test Type | Target | Current | Status |
|-----------|--------|---------|--------|
| Unit Tests | 80% | 75-80% | ✅ Good |
| Integration Tests | 70% | 70% | ✅ Good |
| E2E Tests | User flows | 90% | ✅ Excellent |
| Performance | All critical paths | 100% | ✅ Complete |

### Generating Coverage Reports

```bash
# Frontend coverage
cd frontend && npm run test:coverage

# Backend coverage (specific service)
cd backend/services/chat-service && npm run test:coverage

# All backend coverage
cd backend && npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

---

## Best Practices

### Writing Tests
1. **Follow AAA Pattern:** Arrange, Act, Assert
2. **One Assertion Per Test:** Keep tests focused
3. **Use Descriptive Names:** `should_do_something_when_condition`
4. **Mock External Services:** Don't call real APIs in tests
5. **Clean Up After Tests:** Use `afterEach` and `afterAll` hooks

### Test Data
1. **Use Fixtures:** Store test data in fixture files
2. **Randomize When Needed:** Avoid test pollution
3. **Clean State:** Reset database between tests
4. **Seed Consistently:** Use same data for reproducibility

### Performance
1. **Run Tests in Parallel:** Use Jest's `--maxWorkers`
2. **Skip Slow Tests in Development:** Use `.skip()` temporarily
3. **Use Autocannon for Quick Benchmarks:** Faster than k6
4. **Profile Tests:** Find slow tests with `--verbose`

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Frontend E2E Test Report](../frontend/tests/E2E_TEST_REPORT.md)
- [Integration Test Guide](../backend/tests/integration/INTEGRATION_TEST_GUIDE.md)
- [Performance Report](../backend/tests/performance/PERFORMANCE_REPORT.md)

---

**Need Help?**
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review test examples in each test directory
- Ask in team chat or create an issue

**Last Updated:** 2025-11-15

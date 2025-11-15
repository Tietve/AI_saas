# Testing Strategy for Node.js/TypeScript Microservices

**Date:** 2025-11-15
**Author:** Researcher Agent
**Context:** Pre-optimization code quality assessment for My-SaaS-Chat

---

## Executive Summary

Current state: Jest configured with 70% coverage target, minimal test files present.
Recommendation: Maintain Jest, enhance with contract testing, add performance/E2E layers.

---

## 1. RECOMMENDED TESTING STACK

### Core Unit/Integration Testing

**Choice: Jest (Current) - KEEP**
- Already configured with ts-jest
- 70% coverage threshold set (good baseline)
- Mature ecosystem, battle-tested
- Supertest already installed for API testing

**Alternative considered: Vitest**
- 10-20x faster in watch mode
- Native ESM/TS support
- Migration cost not justified for current stage
- Consider for new microservices

### Contract Testing (ADD - HIGH PRIORITY)

**Tool: Pact**
```bash
npm install --save-dev @pact-foundation/pact
```

**Why critical for microservices:**
- Validates API contracts between services
- Catches breaking changes before deployment
- Reduces integration test complexity
- auth-service ↔ chat-service ↔ billing-service contracts

**Implementation pattern:**
```typescript
// Consumer test (chat-service)
describe('Auth Service Contract', () => {
  const provider = new Pact({
    consumer: 'chat-service',
    provider: 'auth-service'
  });

  it('validates JWT token', async () => {
    await provider.addInteraction({
      state: 'user exists',
      uponReceiving: 'a request to validate token',
      withRequest: {
        method: 'POST',
        path: '/api/auth/validate',
        headers: { 'Authorization': 'Bearer token' }
      },
      willRespondWith: {
        status: 200,
        body: { userId: '123', valid: true }
      }
    });
  });
});
```

### Performance Testing

**Tool: k6 (RECOMMENDED)**
```bash
# Install k6 via package manager
choco install k6  # Windows
```

**When to use k6 over Artillery:**
- Need detailed metrics (p95, p99 latencies)
- Large-scale load testing (1000+ concurrent users)
- Grafana/Prometheus integration
- Complex scenarios with shared state

**Tool: Artillery (ALTERNATIVE - easier setup)**
```bash
npm install --save-dev artillery
```

**When to use Artillery:**
- Quick smoke tests
- Simple HTTP/WebSocket testing
- YAML configuration preferred
- Smaller projects

**Recommendation: Start with Artillery, graduate to k6**

### E2E Testing

**Tool: Playwright (RECOMMENDED)**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Setup for microservices:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:4000', // API Gateway
  },
  projects: [
    { name: 'api', testDir: './tests/e2e/api' },
    { name: 'flows', testDir: './tests/e2e/flows' }
  ]
});
```

**Write 3-10 tests only:**
- User registration → login → create chat → send message
- Subscription flow: signup → upgrade → billing webhook
- Document upload → embedding generation → Q&A

### Code Quality Tools

**ESLint (Current) - ENHANCE**
```bash
npm install --save-dev eslint-plugin-sonarjs
```

**Add to .eslintrc:**
```json
{
  "plugins": ["@typescript-eslint", "sonarjs"],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:sonarjs/recommended"
  ],
  "rules": {
    "sonarjs/cognitive-complexity": ["error", 15],
    "sonarjs/no-duplicate-string": "error"
  }
}
```

**Coverage Tool: NYC (ADD for multi-service)**
```bash
npm install --save-dev nyc
```

**Why NYC over Jest coverage:**
- Aggregates coverage across microservices
- Works with any test runner
- Better for monorepo setups

---

## 2. COVERAGE TARGETS

### Tier 1: Critical Paths (90%+ coverage)
- `auth.service.ts` - JWT generation/validation
- `openai.service.ts` - AI API calls
- `stripe.service.ts` - Payment processing
- `billing.controller.ts` - Webhooks
- `document.service.ts` - PDF processing
- `cost-monitor.service.ts` - Budget tracking

### Tier 2: Business Logic (80%+ coverage)
- All controllers
- Service layer functions
- Middleware (auth, validation, error)
- Database models (Prisma queries)

### Tier 3: Utilities (70%+ coverage)
- Helper functions
- Validators
- Formatters

### Exempt from coverage:
- Config files
- Index/barrel files
- Type definitions
- Generated Prisma client

### Current vs Target:

| Metric | Current | Target Month 1 | Target Month 3 |
|--------|---------|----------------|----------------|
| Lines | 70% | 75% | 80% |
| Branches | 70% | 75% | 80% |
| Functions | 70% | 80% | 85% |
| Statements | 70% | 75% | 80% |

**Philosophy:**
- Coverage ≠ quality, but indicates untested code
- Focus on key user stories, not 100% coverage
- Verify critical features tested, not just coverage %

---

## 3. QUICK ASSESSMENT CHECKLIST

### Phase 1: Immediate (Week 1)

**Code Quality Scan:**
```bash
# 1. Run existing tests
cd backend/services/auth-service && npm test

# 2. Generate coverage report
npm run test:coverage

# 3. Run linter
npm run lint

# 4. Check for security issues
npm audit

# 5. Analyze bundle (if applicable)
npm run build && du -sh dist/
```

**Manual checks:**
- [ ] Review test files: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- [ ] Count test files vs source files ratio (target: 1:1)
- [ ] Check for N+1 queries in services
- [ ] Verify error handling patterns
- [ ] Review Prisma indexes

### Phase 2: Automated Assessment (Week 2)

**Install SonarQube Community (FREE):**
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```

**Scan project:**
```bash
npm install --save-dev sonarqube-scanner

# sonar-project.properties
sonar.projectKey=my-saas-chat
sonar.sources=backend/services
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

**Metrics to track:**
- Code smells (target: <50)
- Bugs (target: 0)
- Vulnerabilities (target: 0)
- Duplications (target: <3%)
- Cognitive complexity (target: <15 per function)

### Phase 3: Performance Baseline (Week 2-3)

**Artillery smoke test:**
```yaml
# artillery-test.yml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Auth flow'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
      - get:
          url: '/api/chats'
          headers:
            Authorization: 'Bearer {{ token }}'
```

**Run:**
```bash
npx artillery run artillery-test.yml
```

**Target metrics:**
- p50 latency: <100ms
- p95 latency: <200ms
- p99 latency: <500ms
- Error rate: <0.1%

---

## 4. AUTOMATED TESTING SETUP

### CI/CD Pipeline (GitHub Actions)

**File: `.github/workflows/test.yml`**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        service: [auth-service, chat-service, billing-service]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: |
          cd backend/services/${{ matrix.service }}
          npm ci

      - name: Run tests
        run: |
          cd backend/services/${{ matrix.service }}
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage/lcov.info

  contract-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - name: Run Pact tests
        run: npm run test:contract

      - name: Publish Pact contracts
        run: npx pact-broker publish

  e2e-tests:
    needs: contract-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:alpine
    steps:
      - name: Start services
        run: docker-compose up -d

      - name: Run E2E tests
        run: npx playwright test

  performance-tests:
    needs: e2e-tests
    runs-on: ubuntu-latest
    steps:
      - name: Run load tests
        run: npx artillery run artillery-test.yml

      - name: Check thresholds
        run: |
          if [ $p95_latency -gt 200 ]; then
            echo "Performance regression detected"
            exit 1
          fi
```

### Pre-commit Hooks

**Install Husky:**
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**File: `.husky/pre-commit`**
```bash
#!/bin/sh
npx lint-staged
```

**File: `package.json`**
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests --passWithNoTests"
    ]
  }
}
```

### Test Data Management

**Use Docker for test databases:**
```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"

  redis-test:
    image: redis:alpine
    ports:
      - "6380:6379"
```

**Seed test data:**
```typescript
// tests/fixtures/seed.ts
import { PrismaClient } from '@prisma/client';

export async function seedTestData() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.TEST_DATABASE_URL
  });

  await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed_password'
    }
  });
}
```

---

## 5. INTEGRATION TESTING BEST PRACTICES

### Microservices Patterns

**1. Component Tests (Primary Focus)**
```typescript
// Test entire service via API
describe('Auth Service', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
    await seedTestData();
  });

  it('should register and login user', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'pass123' });

    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'new@test.com', password: 'pass123' });

    expect(res2.body).toHaveProperty('token');
  });
});
```

**2. Mock External Services**
```typescript
// Use Nock for HTTP mocking
import nock from 'nock';

describe('Chat Service - OpenAI Integration', () => {
  it('should call OpenAI API', async () => {
    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { content: 'AI response' } }]
      });

    const response = await chatService.sendMessage('Hello');
    expect(response).toBe('AI response');
  });
});
```

**3. Database Isolation**
```typescript
// Use transactions for test isolation
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

**4. Limited E2E Tests**
```typescript
// Only 3-10 critical flow tests
test('Complete user journey', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('#email', 'user@test.com');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');

  await page.click('text=New Chat');
  await page.fill('textarea', 'Hello AI');
  await page.click('button:has-text("Send")');

  await expect(page.locator('.message')).toContainText('Hello AI');
});
```

---

## 6. PERFORMANCE TESTING STRATEGY

### k6 Load Test Example

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 50 },   // Steady state
    { duration: '1m', target: 100 },  // Spike
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p95<200', 'p99<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const loginRes = http.post('http://localhost:4000/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== '',
  });

  const token = loginRes.json('token');

  const chatRes = http.get('http://localhost:4000/api/chats', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(chatRes, {
    'chats retrieved': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run:**
```bash
k6 run load-test.js
```

### Cost Monitoring Tests

```typescript
// Test budget enforcement
describe('Cost Monitor', () => {
  it('should block requests when budget exceeded', async () => {
    // Simulate 100 API calls
    for (let i = 0; i < 100; i++) {
      await chatService.sendMessage('test');
    }

    // Next call should fail
    await expect(
      chatService.sendMessage('overflow')
    ).rejects.toThrow('Budget exceeded');
  });
});
```

---

## 7. CURRENT STATE ASSESSMENT

### Existing Setup (Positive)
✅ Jest configured with ts-jest
✅ 70% coverage threshold set
✅ Supertest installed for API testing
✅ ESLint with TypeScript support
✅ Basic test structure (unit/integration/e2e folders)

### Gaps Identified
❌ Minimal test files (only 3 found)
❌ No contract testing between services
❌ No performance testing setup
❌ No E2E tests for critical flows
❌ No CI/CD test automation
❌ No code quality metrics tracking
❌ No test data management

### Risk Assessment
🔴 HIGH: Missing contract tests → breaking changes undetected
🔴 HIGH: No performance baselines → production issues
🟡 MEDIUM: Low actual coverage → bugs slip through
🟡 MEDIUM: No E2E tests → integration failures
🟢 LOW: Configuration good, just need implementation

---

## 8. IMPLEMENTATION ROADMAP

### Week 1: Foundation
- [ ] Run coverage report, document baseline
- [ ] Add eslint-plugin-sonarjs
- [ ] Write 5 critical unit tests per service
- [ ] Set up Docker test databases

### Week 2: Contract & Integration
- [ ] Install Pact
- [ ] Write auth-service ↔ chat-service contract
- [ ] Write chat-service ↔ billing-service contract
- [ ] Add 10 integration tests per service

### Week 3: Performance & E2E
- [ ] Install Artillery
- [ ] Write smoke tests for all endpoints
- [ ] Install Playwright
- [ ] Write 5 E2E critical flows

### Week 4: Automation
- [ ] Set up GitHub Actions workflow
- [ ] Configure SonarQube scanner
- [ ] Add pre-commit hooks
- [ ] Document testing guidelines

### Month 2-3: Continuous Improvement
- [ ] Increase coverage to 80%
- [ ] Add k6 for advanced load testing
- [ ] Set up Codecov reporting
- [ ] Establish testing culture

---

## 9. COST CONSIDERATIONS

### Free Tools
- Jest, Playwright, Artillery (free/OSS)
- SonarQube Community Edition (free)
- GitHub Actions (2000 min/month free)
- Codecov (free for open source)

### Paid Tools (Optional)
- Pact Broker ($0-99/month, can self-host free)
- SonarCloud ($10+/month for private repos)
- k6 Cloud ($49+/month, CLI free)

### Time Investment
- Initial setup: 40-60 hours
- Ongoing per feature: +30% dev time
- ROI: 5x reduction in production bugs

---

## 10. SUCCESS METRICS

Track weekly:
- Coverage % (target: +2% per week)
- Test count (target: +10 tests per week)
- CI/CD success rate (target: >95%)
- Test execution time (target: <5 min)
- P95 latency (target: <200ms)

Track monthly:
- Production bugs (target: -50% MoM)
- Deployment frequency (target: +100% MoM)
- Mean time to recovery (target: -30% MoM)
- Developer confidence score (survey)

---

## REFERENCES

- Jest: https://jestjs.io/
- Vitest: https://vitest.dev/
- Pact: https://pact.io/
- k6: https://k6.io/
- Artillery: https://artillery.io/
- Playwright: https://playwright.dev/
- SonarQube: https://sonarqube.org/
- GitHub Actions: https://docs.github.com/actions
- Node.js Testing Best Practices: https://github.com/goldbergyoni/nodejs-testing-best-practices

---

**Next Steps:**
1. Run assessment checklist (Phase 1)
2. Review results with team
3. Prioritize gaps based on risk
4. Begin Week 1 implementation
5. Iterate and improve

**Critical Decision Point:**
Before adding new features, recommend spending 2-3 weeks establishing testing foundation to prevent technical debt accumulation.

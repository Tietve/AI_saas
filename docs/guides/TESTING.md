# Testing Guide

Complete guide to testing in the AI SaaS platform.

**Version**: 1.0.0
**Updated**: 2025-11-14

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Types](#testing-types)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Load Testing](#load-testing)
7. [Test Coverage](#test-coverage)
8. [Best Practices](#best-practices)

---

## Overview

### Testing Framework Stack

- **Unit Testing**: Jest (with TypeScript support)
- **Integration Testing**: Jest + containers (Docker)
- **E2E Testing**: Playwright
- **Load Testing**: k6
- **Performance Testing**: Autocannon

### Test Organization

```
tests/
├── unit/
│   ├── auth/
│   ├── chat/
│   ├── billing/
│   └── analytics/
├── integration/
│   ├── auth-service.test.ts
│   ├── chat-service.test.ts
│   └── billing-service.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── chat.spec.ts
│   └── billing.spec.ts
└── load/
    ├── auth-load.js
    ├── chat-load.js
    └── stress-test.js
```

---

## Testing Types

### Unit Tests
- Test individual functions/classes
- Fast (< 1 second each)
- No external dependencies
- High coverage target: 95%

### Integration Tests
- Test service interactions
- Use real databases
- Moderate speed (< 5 seconds)
- Coverage target: 85%

### E2E Tests
- Test full user workflows
- Test entire system
- Slower (< 1 minute per test)
- Critical paths only

### Load Tests
- Test performance under load
- Identify bottlenecks
- Stress test infrastructure
- Test scaling behavior

---

## Unit Testing

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Run in watch mode
npm run test:unit -- --watch

# Run specific test
npm run test:unit -- --testNamePattern="signup"

# Run specific file
npm run test:unit -- services/auth-service/src/__tests__/auth.service.test.ts
```

### Test Structure

```typescript
describe('AuthService', () => {
  let authService: AuthService;
  let mockDatabase: jest.Mocked<Database>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    // Setup mocks
    mockDatabase = jest.createMockFromModule('database');
    mockEmailService = jest.createMockFromModule('email-service');

    // Create instance with mocked dependencies
    authService = new AuthService(mockDatabase, mockEmailService);
  });

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create new user with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      mockDatabase.users.create.mockResolvedValue({
        id: 'user-123',
        email,
        password: 'hashed',
        createdAt: new Date()
      });

      // Act
      const result = await authService.signup(email, password);

      // Assert
      expect(result.email).toBe(email);
      expect(mockDatabase.users.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerification).toHaveBeenCalled();
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      mockDatabase.users.findOne.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      });

      // Act & Assert
      await expect(
        authService.signup('test@example.com', 'password123')
      ).rejects.toThrow('Email already exists');
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPassword = '123'; // Too weak

      // Act & Assert
      await expect(
        authService.signup('test@example.com', weakPassword)
      ).rejects.toThrow('Password too weak');
    });
  });
});
```

### Mocking Best Practices

```typescript
// ✅ Good: Mock dependencies, test behavior
describe('ChatService', () => {
  it('should call OpenAI when generating response', async () => {
    const mockOpenAI = jest.fn().mockResolvedValue({
      choices: [{ text: 'Hello!' }],
      usage: { total_tokens: 50 }
    });

    const service = new ChatService(mockOpenAI);
    await service.sendMessage('Hello');

    expect(mockOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ messages: expect.any(Array) })
    );
  });
});

// ❌ Bad: Mocking implementation details
describe('ChatService', () => {
  it('should work', async () => {
    const service = new ChatService();
    const result = service.sendMessage('Hello');
    // Too vague, doesn't verify behavior
  });
});
```

### Testing Async Code

```typescript
// ✅ Good: Testing Promises
it('should return user data', async () => {
  const user = await userService.getUserById('123');
  expect(user.name).toBe('John');
});

// ✅ Good: Testing error handling
it('should throw error for invalid ID', async () => {
  await expect(
    userService.getUserById('invalid')
  ).rejects.toThrow('User not found');
});

// ✅ Good: Testing setTimeout/intervals
jest.useFakeTimers();
it('should retry after delay', async () => {
  const mockFn = jest.fn().mockRejectedValueOnce(new Error('timeout'));
  const service = new RetryService(mockFn);

  service.executeWithRetry('test');
  jest.advanceTimersByTime(1000);

  expect(mockFn).toHaveBeenCalledTimes(2);
});
jest.useRealTimers();
```

---

## Integration Testing

### Running Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run specific service
npm run test:integration -- auth-service.test.ts

# Run in watch mode
npm run test:integration -- --watch
```

### Integration Test Setup

```typescript
// integration/auth-service.test.ts
import { createTestDatabase, cleanupDatabase } from '../test-utils';
import { AuthService } from '../../src/services/auth.service';

describe('AuthService Integration', () => {
  let db;
  let authService: AuthService;

  beforeAll(async () => {
    // Start real database
    db = await createTestDatabase();
    authService = new AuthService(db);
  });

  afterAll(async () => {
    await cleanupDatabase(db);
  });

  afterEach(async () => {
    // Clear data between tests
    await db.users.deleteMany({});
    await db.sessions.deleteMany({});
  });

  describe('Complete signup flow', () => {
    it('should complete signup and send verification email', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Act
      const user = await authService.signup(email, password);

      // Assert
      expect(user.email).toBe(email);
      expect(user.emailVerified).toBe(false);

      // Verify user in database
      const savedUser = await db.users.findOne({ email });
      expect(savedUser).toBeDefined();
      expect(savedUser.password).not.toBe(password); // Should be hashed

      // Verify email verification record
      const verification = await db.emailVerifications.findOne({ userId: user.id });
      expect(verification).toBeDefined();
      expect(verification.isVerified).toBe(false);
    });

    it('should sign in and create session', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'SecurePass123!';
      await authService.signup(email, password);

      // Act
      const session = await authService.signin(email, password);

      // Assert
      expect(session.token).toBeDefined();
      expect(session.user.email).toBe(email);

      // Verify session in database
      const savedSession = await db.sessions.findOne({ token: session.token });
      expect(savedSession).toBeDefined();
    });
  });
});
```

### Test Database Setup

```typescript
// test-utils/database.ts
import { Pool } from 'pg';

export async function createTestDatabase() {
  // Create test database
  const testDbName = `test_db_${Date.now()}`;
  await createDatabase(testDbName);

  // Connect and run migrations
  const pool = new Pool({
    connectionString: `postgresql://user:password@localhost:5432/${testDbName}`
  });

  await runMigrations(pool);

  return {
    pool,
    async query(sql, params) {
      return pool.query(sql, params);
    },
    async close() {
      await pool.end();
      await dropDatabase(testDbName);
    }
  };
}
```

---

## E2E Testing

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run with UI
npm run test:e2e -- --ui

# Run in debug mode
npm run test:e2e -- --debug

# Generate report
npm run test:e2e -- --reporter=html
```

### E2E Test Example

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:5173/login');
  });

  test('should complete signup flow', async ({ page }) => {
    // Click signup link
    await page.click('a:has-text("Sign up")');

    // Fill signup form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password-confirm"]', 'SecurePass123!');

    // Submit form
    await page.click('button:has-text("Create Account")');

    // Verify success
    await page.waitForURL('**/verify-email');
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should complete signin flow', async ({ page }) => {
    // Fill signin form
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Verify success
    await page.waitForURL('**/chat');
    await expect(page.locator('text=New conversation')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    // Fill with wrong password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Verify error
    await expect(
      page.locator('text=Invalid email or password')
    ).toBeVisible();
  });
});

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsTestUser(page);
    await page.goto('http://localhost:5173/chat');
  });

  test('should send message and get response', async ({ page }) => {
    // Type message
    await page.fill('textarea[placeholder="Type your message"]', 'Hello AI');

    // Send message
    await page.click('button[aria-label="Send message"]');

    // Wait for response
    await page.waitForSelector('.ai-message');

    // Verify response exists
    const aiMessages = page.locator('.ai-message');
    await expect(aiMessages).toHaveCount(1);
  });

  test('should show token usage', async ({ page }) => {
    await page.click('text=Usage');

    // Verify usage display
    await expect(page.locator('text=Tokens used')).toBeVisible();
  });
});
```

### Page Object Pattern

```typescript
// e2e/pages/login-page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5173/login');
  }

  async fillEmail(email: string) {
    await this.page.fill('input[name="email"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('input[name="password"]', password);
  }

  async clickSignIn() {
    await this.page.click('button:has-text("Sign in")');
  }

  async signin(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }
}

// e2e/auth.spec.ts
test('should signin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.signin('test@example.com', 'password123');
  // Continue...
});
```

---

## Load Testing

### Running Load Tests

```bash
# Run all load tests
npm run load:all

# Run specific scenario
npm run load:auth
npm run load:chat
npm run load:billing

# Run stress test
npm run load:stress

# Run spike test
npm run load:spike

# Monitor endurance test
npm run load:monitor
```

### Load Test Example (k6)

```javascript
// load/scenarios/auth-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  const email = `test${Math.random()}@example.com`;
  const password = 'SecurePass123!';

  // Test signup
  const signupRes = http.post(`${BASE_URL}/auth/signup`, {
    email,
    password
  });

  check(signupRes, {
    'signup status 200': (r) => r.status === 200,
    'signup creates user': (r) => r.body.includes(email),
  });

  sleep(1);

  // Test signin
  const signinRes = http.post(`${BASE_URL}/auth/signin`, {
    email,
    password
  });

  check(signinRes, {
    'signin status 200': (r) => r.status === 200,
    'signin returns token': (r) => r.body.includes('token'),
  });

  sleep(1);
}
```

### Stress Test

```javascript
// load/scenarios/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Stress test
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.5'],
  },
};

export default function() {
  // Heavy load test
  const res = http.get(`${BASE_URL}/api/chat/conversations`);
  check(res, {
    'status 200': (r) => r.status === 200,
  });
}
```

---

## Test Coverage

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Targets

| Component | Target | Critical |
|-----------|--------|----------|
| Auth Service | 95% | 98% |
| Chat Service | 85% | 95% |
| Billing Service | 90% | 95% |
| API Gateway | 80% | 85% |
| Utilities | 80% | N/A |

### Coverage by Type

```json
{
  "statements": 85,
  "branches": 80,
  "functions": 85,
  "lines": 85
}
```

---

## Best Practices

### ✅ Do's

1. **Test Behavior, Not Implementation**
   ```typescript
   // Good: Tests behavior
   expect(result.user.email).toBe(email);

   // Bad: Tests implementation
   expect(mockDatabase.query).toHaveBeenCalled();
   ```

2. **One Assertion Per Test (Mostly)**
   ```typescript
   // Good: Clear failure reason
   it('should hash password', async () => {
     const result = await hashPassword('pass');
     expect(result).not.toBe('pass');
   });
   ```

3. **Test Edge Cases**
   ```typescript
   it('should handle null input', () => {
     const result = sanitize(null);
     expect(result).toBe('');
   });
   ```

4. **Use Descriptive Names**
   ```typescript
   // Good
   it('should return 400 when email already exists')

   // Bad
   it('should work')
   ```

5. **Keep Tests DRY**
   ```typescript
   const commonSetup = () => ({
     email: 'test@example.com',
     password: 'Pass123!'
   });
   ```

### ❌ Don'ts

1. **Don't Test Framework Code**
   ```typescript
   // Don't test this - it's Express, not our code
   it('should have route', () => {
     expect(app._router.stack).toContain(route);
   });
   ```

2. **Don't Use Sleep/Delays**
   ```typescript
   // Bad: Slow, unreliable
   it('should...', async () => {
     await new Promise(r => setTimeout(r, 1000));
   });

   // Good: Use jest.useFakeTimers()
   jest.useFakeTimers();
   ```

3. **Don't Couple Tests to Implementation**
   ```typescript
   // Bad: If we change internal ID, test breaks
   expect(user.internalId).toBe('123');

   // Good: Test observable behavior
   expect(user.email).toBe('test@example.com');
   ```

4. **Don't Skip Error Cases**
   ```typescript
   // Bad: Only tests happy path
   it('should create user', async () => {
     const user = await service.createUser(data);
     expect(user).toBeDefined();
   });

   // Good: Also test errors
   it('should throw for duplicate email', async () => {
     // ...
   });
   ```

---

## Debugging Tests

### Debug Specific Test

```bash
# Debug single test
node --inspect-brk ./node_modules/.bin/jest \
  --testNamePattern="specific test" \
  --runInBand

# Open chrome://inspect
```

### Debug E2E Test

```bash
# Open UI for Playwright
npm run test:e2e -- --ui

# Debug specific test
npm run test:e2e -- --debug auth.spec.ts
```

### View Test Output

```bash
# Show console.log in tests
npm run test -- --verbose

# Show only failed tests
npm run test -- --verbose --failureOnly
```

---

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Commits to main
- Scheduled daily (2 AM UTC)

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

---

## Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **k6 Documentation**: https://k6.io/docs/
- **Testing Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices


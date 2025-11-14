# MSW Implementation Summary

## Overview
Complete MSW (Mock Service Worker) v2.11.6 setup for API mocking in tests and development.

## Files Created

### Core Files (4)
- ✅ `server.ts` - Node.js server for Jest/Vitest tests
- ✅ `browser.ts` - Browser worker for Storybook/dev mode
- ✅ `index.ts` - Main exports for easy imports
- ✅ `README.md` - Complete documentation

### Handlers (4)
- ✅ `handlers/auth.ts` - Authentication endpoints (6 endpoints)
- ✅ `handlers/chat.ts` - Chat/conversation endpoints (6 endpoints)
- ✅ `handlers/billing.ts` - Billing/subscription endpoints (7 endpoints)
- ✅ `handlers/index.ts` - Handler aggregation & exports

### Fixtures (4)
- ✅ `fixtures/user.ts` - Mock users, tokens, helpers
- ✅ `fixtures/conversations.ts` - Mock chats, messages, usage stats
- ✅ `fixtures/plans.ts` - Mock billing plans, subscriptions, usage
- ✅ `fixtures/index.ts` - Fixture exports

### Examples (2)
- ✅ `setupTests.example.ts` - Example test setup file
- ✅ `example.test.ts` - Example test cases

**Total: 14 files created**

---

## Endpoints Mocked

### 🔐 Authentication (6 endpoints)

| Method | Endpoint | Status | Features |
|--------|----------|--------|----------|
| POST | `/api/auth/signin` | ✅ | Validates credentials, returns JWT + refresh token |
| POST | `/api/auth/signup` | ✅ | Checks duplicates, creates user, returns tokens |
| GET | `/api/auth/me` | ✅ | Validates Bearer token, returns user info |
| POST | `/api/auth/signout` | ✅ | Clears refresh token cookie |
| POST | `/api/auth/refresh` | ✅ | Validates refresh token, issues new JWT |
| POST | `/api/auth/signin/error` | ✅ | Error scenario (500) |

**Test Credentials:**
```
User 1 (Free): test@example.com / password123
User 2 (Pro): premium@example.com / premium123
User 3 (Enterprise): admin@example.com / admin123
```

### 💬 Chat (6 endpoints)

| Method | Endpoint | Status | Features |
|--------|----------|--------|----------|
| POST | `/api/chat` | ✅ | Sends message, returns AI response, tracks tokens |
| GET | `/api/conversations` | ✅ | Lists user conversations with metadata |
| GET | `/api/conversations/:id` | ✅ | Gets single conversation with all messages |
| PATCH | `/api/conversations/:id` | ✅ | Updates conversation title |
| DELETE | `/api/conversations/:id` | ✅ | Soft deletes conversation |
| GET | `/api/usage` | ✅ | Returns token/message usage stats |

**Error scenarios:**
- POST `/api/chat/error` → 503 Service Unavailable
- GET `/api/conversations/nonexistent` → 404 Not Found

### 💳 Billing (7 endpoints)

| Method | Endpoint | Status | Features |
|--------|----------|--------|----------|
| GET | `/api/billing/plans` | ✅ | Returns all 4 plans (Free, Starter, Pro, Enterprise) |
| GET | `/api/billing/subscription` | ✅ | Gets user's current subscription |
| POST | `/api/billing/subscribe` | ✅ | Creates/updates subscription |
| POST | `/api/billing/cancel` | ✅ | Cancels at period end |
| POST | `/api/billing/reactivate` | ✅ | Reactivates canceled subscription |
| GET | `/api/billing/usage` | ✅ | Returns usage vs limits with percentages |
| GET | `/api/billing/invoices` | ✅ | Returns mock invoice history |

**Error scenarios:**
- POST `/api/billing/subscribe/error` → 402 Payment Failed
- GET `/api/billing/subscription/none` → 404 No Subscription

**Total: 19 endpoints mocked**

---

## Mock Data

### Users (3 test users)
```typescript
testUser: {
  id: '1',
  email: 'test@example.com',
  plan: 'Free',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

premiumUser: {
  id: '2',
  email: 'premium@example.com',
  plan: 'Pro',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

adminUser: {
  id: '3',
  email: 'admin@example.com',
  plan: 'Enterprise',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### Conversations (3 mock conversations)
- **conv-1**: "What is React?" (User 1, 2 messages, GPT-4)
- **conv-2**: "Explain TypeScript" (User 1, 2 messages, GPT-4)
- **conv-3**: "Advanced Node.js patterns" (User 2, 2 messages, GPT-4 Turbo)

### Billing Plans (4 plans)
| Plan | Price | Tokens | Conversations | Models |
|------|-------|--------|---------------|--------|
| Free | $0 | 10k | 10 | GPT-3.5 |
| Starter | $9.99 | 100k | 100 | GPT-3.5, GPT-4 |
| Pro | $29.99 | 1M | Unlimited | GPT-3.5, GPT-4, GPT-4 Turbo |
| Enterprise | $99.99 | Unlimited | Unlimited | All models |

---

## Key Features

### ✅ Realistic Behavior
- Network delays (50-150ms) to simulate real API
- Proper HTTP status codes (200, 201, 400, 401, 404, 500, 503)
- JWT token validation
- Bearer authentication
- Cookie handling (refresh tokens)
- Request body validation
- User authorization checks

### ✅ Test-Friendly
- Easy handler overrides for specific tests
- Error scenario endpoints built-in
- Resettable state between tests
- Type-safe request/response bodies
- Helper functions for common operations

### ✅ Developer Experience
- Complete TypeScript types
- Comprehensive documentation
- Example test file included
- Setup file template provided
- Browser mode for Storybook/dev

### ✅ Production-Ready
- MSW v2 API (latest)
- Follows REST conventions
- Matches real API behavior
- Includes edge cases
- Error handling examples

---

## Usage Examples

### Basic Test
```typescript
import { server } from './mocks/server';
import { mockTokens } from './mocks/fixtures';

test('fetch user conversations', async () => {
  const response = await fetch('/api/conversations', {
    headers: { Authorization: `Bearer ${mockTokens.testUser}` },
  });

  const data = await response.json();
  expect(data.conversations).toBeDefined();
});
```

### Override Handler
```typescript
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

test('handle server error', async () => {
  server.use(
    http.get('/api/conversations', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );

  // Test error handling...
});
```

### Use Fixtures
```typescript
import { mockUsers, mockPlans } from './mocks/fixtures';

test('display plan details', () => {
  const plan = mockPlans[0]; // Free plan
  expect(plan.price).toBe(0);
  expect(plan.features).toHaveLength(4);
});
```

---

## Setup Instructions

### 1. For Jest/Vitest Tests

Create `src/tests/setupTests.ts`:
```typescript
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Configure in `jest.config.js` or `vitest.config.ts`:
```javascript
// Jest
setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts']

// Vitest
test: { setupFiles: ['./src/tests/setupTests.ts'] }
```

### 2. For Browser/Dev Mode

In `src/main.tsx`:
```typescript
async function enableMocking() {
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_API === 'true') {
    const { worker } = await import('./tests/mocks/browser');
    return worker.start();
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
```

---

## Testing Checklist

### Authentication Flow
- ✅ Login with valid credentials
- ✅ Login with invalid credentials (401)
- ✅ Signup with new user
- ✅ Signup with existing email (409)
- ✅ Get user with valid token
- ✅ Get user without token (401)
- ✅ Get user with expired token (401)
- ✅ Refresh token flow
- ✅ Logout flow

### Chat Flow
- ✅ Send message to new conversation
- ✅ Send message to existing conversation
- ✅ Get all conversations
- ✅ Get single conversation
- ✅ Update conversation title
- ✅ Delete conversation
- ✅ Get usage statistics
- ✅ Unauthorized access (401)
- ✅ Conversation not found (404)

### Billing Flow
- ✅ Get all plans
- ✅ Get user subscription
- ✅ Create new subscription
- ✅ Upgrade subscription
- ✅ Cancel subscription
- ✅ Reactivate subscription
- ✅ Get usage stats
- ✅ Get invoices
- ✅ Payment failure (402)
- ✅ No subscription (404)

---

## Advanced Features

### Request Validation
- Email format checking
- Password requirements
- Required fields validation
- Type checking on request bodies

### State Management
- In-memory conversation storage
- Subscription state tracking
- Soft delete implementation
- Auto-generated IDs/timestamps

### Helper Functions
```typescript
// User helpers
getUserByEmail(email: string)
getUserByToken(token: string)

// Conversation helpers
getConversationsByUserId(userId: string)
getConversationById(id: string)
createNewConversation(...)
addMessageToConversation(...)

// Billing helpers
getPlanById(planId: string)
getSubscriptionByUserId(userId: string)
getUsageByUserId(userId: string)
```

---

## Performance

### Network Delays
- Auth endpoints: 50-100ms
- Chat endpoints: 100-150ms (simulates AI processing)
- Billing endpoints: 50-150ms (simulates Stripe API)

### Scalability
- Handles unlimited requests
- No memory leaks (resets between tests)
- Efficient pattern matching
- Minimal overhead

---

## Future Enhancements

### Potential Additions
- [ ] WebSocket mocking for real-time chat
- [ ] File upload endpoints
- [ ] Rate limiting simulation
- [ ] Pagination helpers
- [ ] Search/filter endpoints
- [ ] Workspace management endpoints
- [ ] User preferences endpoints
- [ ] Analytics endpoints
- [ ] More error scenarios
- [ ] Performance profiling

### Maintenance
- Update fixtures when API changes
- Add new endpoints as features grow
- Keep in sync with backend API
- Update MSW when new versions release

---

## Benefits

### For Testing
✅ No need for test database
✅ Consistent test data
✅ Fast test execution
✅ Easy error simulation
✅ Isolated test environment

### For Development
✅ Work without backend running
✅ Test edge cases easily
✅ Rapid prototyping
✅ Storybook integration
✅ Demo mode support

### For Team
✅ Shared test data
✅ Clear API contracts
✅ Easy onboarding
✅ Documentation by example
✅ Reduced flakiness

---

## Troubleshooting

### Handlers Not Working
- Check server is started in `beforeAll`
- Verify URL matches exactly
- Check request method (GET/POST/etc)
- Ensure MSW is latest version

### Type Errors
- Use type assertions: `await request.json() as { ... }`
- Import types from fixtures
- Check MSW type definitions

### Test Failures
- Reset handlers in `afterEach`
- Clear state between tests
- Check for timing issues
- Verify mock data consistency

---

## Resources

- **MSW Docs**: https://mswjs.io
- **GitHub**: https://github.com/mswjs/msw
- **Migration Guide**: https://mswjs.io/docs/migrations/1.x-to-2.x
- **Examples**: See `example.test.ts` in this directory

---

## Summary

✅ **Complete MSW setup** with 19 endpoints across 3 domains
✅ **Production-ready** with realistic delays and proper error handling
✅ **Well-documented** with README, examples, and inline comments
✅ **Type-safe** with full TypeScript support
✅ **Test-friendly** with fixtures, helpers, and reset capabilities
✅ **Maintainable** with clear structure and separation of concerns

**Ready to use in tests immediately!**

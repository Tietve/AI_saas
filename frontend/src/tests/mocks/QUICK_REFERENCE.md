# MSW Quick Reference Card

## 🚀 Quick Start

### Import in Tests
```typescript
import { server, mockUsers, mockTokens } from '@/tests/mocks';

// Use default mocks - they work automatically!
test('login works', async () => {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  expect(res.ok).toBe(true);
});
```

### Override for Errors
```typescript
import { server } from '@/tests/mocks';
import { http, HttpResponse } from 'msw';

test('handle errors', async () => {
  server.use(
    http.post('/api/chat', () =>
      HttpResponse.json({ error: 'AI offline' }, { status: 503 })
    )
  );
  // Test error handling...
});
```

---

## 🔑 Test Credentials

```typescript
// Free user
email: 'test@example.com'
password: 'password123'
token: mockTokens.testUser

// Pro user
email: 'premium@example.com'
password: 'premium123'
token: mockTokens.premiumUser

// Enterprise user
email: 'admin@example.com'
password: 'admin123'
token: mockTokens.adminUser
```

---

## 📋 Common Patterns

### Auth Test
```typescript
const res = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${mockTokens.testUser}` }
});
```

### Chat Test
```typescript
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${mockTokens.testUser}`
  },
  body: JSON.stringify({ message: 'Hello!' })
});
```

### Billing Test
```typescript
const res = await fetch('/api/billing/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${mockTokens.testUser}`
  },
  body: JSON.stringify({ planId: 'plan-pro' })
});
```

---

## 🔍 Endpoints at a Glance

### Auth
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register
- `GET /api/auth/me` - Get user
- `POST /api/auth/signout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Chat
- `POST /api/chat` - Send message
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation
- `PATCH /api/conversations/:id` - Update title
- `DELETE /api/conversations/:id` - Delete
- `GET /api/usage` - Usage stats

### Billing
- `GET /api/billing/plans` - Get plans
- `GET /api/billing/subscription` - Get subscription
- `POST /api/billing/subscribe` - Subscribe
- `POST /api/billing/cancel` - Cancel
- `POST /api/billing/reactivate` - Reactivate
- `GET /api/billing/usage` - Usage stats
- `GET /api/billing/invoices` - Invoices

---

## 💾 Using Fixtures

```typescript
import { mockUsers, mockConversations, mockPlans } from '@/tests/mocks';

// Use in tests
const user = mockUsers.testUser;
const conv = mockConversations[0];
const plan = mockPlans[0]; // Free plan
```

---

## ⚙️ Setup (One Time)

### Create setupTests.ts
```typescript
import { server } from '@/tests/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Configure Jest/Vitest
```javascript
// jest.config.js
setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts']

// vitest.config.ts
test: { setupFiles: ['./src/tests/setupTests.ts'] }
```

---

## 🐛 Debugging

### Check Handler Matches
```typescript
// In test - see what's intercepted
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url);
});
```

### Force Error
```typescript
// Use built-in error endpoints
fetch('/api/auth/signin/error') // → 500
fetch('/api/chat/error') // → 503
fetch('/api/billing/subscribe/error') // → 402
```

---

## 📚 Full Docs

- **README.md** - Complete documentation
- **IMPLEMENTATION_SUMMARY.md** - What's included
- **example.test.ts** - Example test cases
- **setupTests.example.ts** - Example setup

---

## 💡 Pro Tips

1. **Always reset handlers**: `afterEach(() => server.resetHandlers())`
2. **Override per test**: Use `server.use(...)` for one-off changes
3. **Check tokens**: Use `mockTokens` for auth headers
4. **Simulate delays**: All handlers have realistic delays built-in
5. **Test errors**: Override handlers to return error responses

---

## 📞 Need Help?

1. Check `README.md` for details
2. Look at `example.test.ts` for patterns
3. See `IMPLEMENTATION_SUMMARY.md` for complete endpoint list
4. Read MSW docs: https://mswjs.io

---

**🎯 That's it! Your tests now have 19 fully mocked API endpoints.**

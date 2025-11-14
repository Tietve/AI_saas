# MSW (Mock Service Worker) Setup

Complete API mocking system using MSW v2.11.6 for testing and development.

## Directory Structure

```
mocks/
├── handlers/           # API endpoint handlers
│   ├── auth.ts        # Authentication endpoints
│   ├── chat.ts        # Chat & conversation endpoints
│   ├── billing.ts     # Billing & subscription endpoints
│   └── index.ts       # Handler exports
├── fixtures/          # Mock data
│   ├── user.ts        # User data & tokens
│   ├── conversations.ts # Chat conversations & messages
│   ├── plans.ts       # Billing plans & subscriptions
│   └── index.ts       # Fixture exports
├── server.ts          # Node.js server (for tests)
├── browser.ts         # Browser worker (for Storybook/dev)
└── index.ts           # Main exports
```

## Quick Start

### 1. Setup in Tests (Jest/Vitest)

Create `src/tests/setupTests.ts`:

```typescript
import { server } from './mocks/server';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### 2. Use in Test Files

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

test('handles authentication', async () => {
  render(<LoginForm />);

  // Use default mocks - login succeeds
  fireEvent.click(screen.getByText('Sign In'));

  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
});

test('handles login error', async () => {
  // Override handler for this test
  server.use(
    http.post('/api/auth/signin', () => {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    })
  );

  render(<LoginForm />);
  // ... test error handling
});
```

### 3. Use in Browser (Development/Storybook)

In your `src/index.tsx` or `src/main.tsx`:

```typescript
async function enableMocking() {
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_API === 'true') {
    const { worker } = await import('./tests/mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

## Mocked Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Test Credentials |
|--------|----------|-------------|------------------|
| POST | `/api/auth/signin` | User login | test@example.com / password123 |
| POST | `/api/auth/signup` | User registration | Any valid email/password |
| GET | `/api/auth/me` | Get current user | Requires Bearer token |
| POST | `/api/auth/signout` | User logout | Requires Bearer token |
| POST | `/api/auth/refresh` | Refresh token | Requires refresh token cookie |

### Chat (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message & get AI response |
| GET | `/api/conversations` | Get all user conversations |
| GET | `/api/conversations/:id` | Get single conversation |
| PATCH | `/api/conversations/:id` | Update conversation (title) |
| DELETE | `/api/conversations/:id` | Delete conversation (soft) |
| GET | `/api/usage` | Get usage statistics |

### Billing (`/api/billing`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/plans` | Get all available plans |
| GET | `/api/billing/subscription` | Get user's subscription |
| POST | `/api/billing/subscribe` | Create/update subscription |
| POST | `/api/billing/cancel` | Cancel subscription |
| POST | `/api/billing/reactivate` | Reactivate subscription |
| GET | `/api/billing/usage` | Get billing usage stats |
| GET | `/api/billing/invoices` | Get billing history |

## Mock Data

### Test Users

```typescript
// User 1 - Free plan
email: 'test@example.com'
password: 'password123'
token: mockTokens.testUser

// User 2 - Pro plan
email: 'premium@example.com'
password: 'premium123'
token: mockTokens.premiumUser

// User 3 - Enterprise plan
email: 'admin@example.com'
password: 'admin123'
token: mockTokens.adminUser
```

### Plans

- **Free**: $0/month - 10k tokens, 10 conversations, GPT-3.5
- **Starter**: $9.99/month - 100k tokens, 100 conversations, GPT-4
- **Pro**: $29.99/month - 1M tokens, unlimited conversations, GPT-4 Turbo
- **Enterprise**: $99.99/month - Unlimited everything

## Advanced Usage

### Custom Handlers for Specific Tests

```typescript
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

test('handles network error', async () => {
  server.use(
    http.post('/api/chat', () => {
      return HttpResponse.error();
    })
  );

  // Test network error handling
});
```

### Using Fixtures Directly

```typescript
import { mockUsers, mockConversations, mockPlans } from './mocks/fixtures';

test('displays user info', () => {
  const user = mockUsers.testUser;
  render(<UserProfile user={user} />);
  expect(screen.getByText(user.username)).toBeInTheDocument();
});
```

### Delay Customization

All handlers include realistic delays (50-150ms). To adjust:

```typescript
// In handler file
await delay(500); // 500ms delay for slow network simulation
```

## Error Scenarios

Built-in error endpoints for testing:

```typescript
// Auth errors
POST /api/auth/signin/error → 500 Internal Server Error
GET /api/auth/me/expired → 401 Token Expired

// Chat errors
POST /api/chat/error → 503 Service Unavailable
GET /api/conversations/nonexistent → 404 Not Found

// Billing errors
POST /api/billing/subscribe/error → 402 Payment Failed
GET /api/billing/subscription/none → 404 No Subscription
```

## Best Practices

1. **Reset handlers after each test**: Always call `server.resetHandlers()` in `afterEach`
2. **Use specific overrides**: Override handlers in individual tests when needed
3. **Test both success and error cases**: Use default handlers for happy path, override for errors
4. **Keep fixtures realistic**: Update mock data to match real API responses
5. **Document custom handlers**: Add comments for complex handler logic

## Troubleshooting

### Handlers not intercepting requests

- Ensure server is started before tests (`beforeAll`)
- Check that request URL matches handler pattern exactly
- Verify MSW is properly configured in test setup

### Type errors with request body

```typescript
// Type the request body
const body = await request.json() as { email: string; password: string };
```

### Handlers firing in wrong order

- MSW uses first-match strategy
- More specific handlers should come before generic ones
- Use `server.resetHandlers()` between tests

## Resources

- [MSW Documentation](https://mswjs.io)
- [MSW v2 Migration Guide](https://mswjs.io/docs/migrations/1.x-to-2.x)
- [Testing Best Practices](https://mswjs.io/docs/best-practices)

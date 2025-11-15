# E2E Tests - Quick Start Guide

> **Quick reference for running E2E tests successfully**

## TL;DR

```bash
# 1. Start backend services
cd backend
npm run dev:all

# 2. Start frontend (in another terminal)
cd frontend
npm run dev

# 3. Run E2E tests (in another terminal)
cd frontend
npm run test:e2e
```

---

## Prerequisites Checklist

- [ ] PostgreSQL running (port 5432)
- [ ] Redis running (port 6379)
- [ ] Backend services running:
  - [ ] Auth service (port 3001)
  - [ ] Chat service (port 3003)
  - [ ] Billing service (port 3004)
- [ ] Frontend dev server (port 3000)
- [ ] Test user exists: `test@example.com` / `Test123!@#`

---

## Quick Commands

### Run All E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

### Run Tests in Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug Tests
```bash
npm run test:e2e:debug
```

### View HTML Report
```bash
npx playwright show-report
```

---

## Verification Steps

### 1. Check Services Are Running

```bash
# Check all ports
lsof -i :3000 :3001 :3003 :3004 :5432 :6379

# Or individually
curl http://localhost:3000/          # Frontend
curl http://localhost:3001/health    # Auth service
curl http://localhost:3003/health    # Chat service
curl http://localhost:3004/health    # Billing service
```

### 2. Verify Test User Exists

```bash
# Option 1: Sign up via UI
open http://localhost:3000/signup

# Option 2: Direct database insert (if needed)
# Connect to PostgreSQL and create user
```

### 3. Check Environment Variables

```bash
# Frontend .env
cat frontend/.env | grep VITE_API_URL
# Should show: VITE_API_URL=http://localhost:4000/api (or backend URL)
```

---

## Troubleshooting

### Tests fail with ERR_CONNECTION_REFUSED

**Problem:** Frontend server not running
```bash
# Solution:
cd frontend
npm run dev
```

### Tests fail: "User not found" or "Invalid credentials"

**Problem:** Test user doesn't exist
```bash
# Solution:
# 1. Go to http://localhost:3000/signup
# 2. Create user: test@example.com / Test123!@#
```

### Tests timeout or hang

**Problem:** Backend services not responding
```bash
# Solution:
cd backend
npm run dev:all

# Check logs for errors
```

### Playwright browser not installed

**Problem:** Chromium browser missing
```bash
# Solution:
npx playwright install chromium
```

---

## Test Organization

```
frontend/tests/e2e/
├── auth/
│   ├── login.spec.ts       (23 tests - Login flows)
│   ├── logout.spec.ts      (22 tests - Logout flows)
│   └── signup.spec.ts      (28 tests - Signup flows)
├── billing/
│   ├── pricing-page.spec.ts    (17 tests - Pricing display)
│   ├── subscription.spec.ts    (17 tests - Subscription management)
│   └── usage-stats.spec.ts     (18 tests - Token usage stats)
├── chat/
│   ├── conversations.spec.ts   (14 tests - Conversation management)
│   ├── send-message.spec.ts    (11 tests - Message sending)
│   ├── ui-features.spec.ts     (18 tests - UI interactions)
│   └── auth-helper.ts          (Helper functions)
└── example.spec.ts             (3 tests - Basic navigation)
```

---

## Test Metrics

| Category | Tests | Status |
|----------|-------|--------|
| Authentication | 73 | Comprehensive |
| Billing | 52 | Comprehensive |
| Chat | 43 | Missing PDF tests |
| UI/UX | 18 | Good coverage |
| **Total** | **183** | **Well-structured** |

---

## Next Steps After Tests Pass

1. **Add Missing Tests:**
   - PDF upload flow
   - Document Q&A interaction
   - Error handling tests (currently skipped)

2. **Improve Test Stability:**
   - Add test database seeding
   - Implement proper cleanup
   - Mock external APIs

3. **CI/CD Integration:**
   - Add GitHub Actions workflow
   - Auto-run on pull requests
   - Generate test reports

---

## Helpful Resources

- **Full Test Report:** `frontend/tests/E2E_TEST_REPORT.md`
- **Playwright Docs:** https://playwright.dev/docs/intro
- **Test Helpers:** `frontend/tests/e2e/chat/auth-helper.ts`
- **Config File:** `frontend/playwright.config.ts`

---

## Quick Reference

### Common Test Patterns

```typescript
// Navigate to page
await page.goto('/login');

// Fill form
await page.fill('input[type="email"]', 'test@example.com');
await page.fill('input[type="password"]', 'Password123!');

// Click button
await page.click('button[type="submit"]');

// Wait for navigation
await page.waitForURL('**/chat');

// Assert element visible
await expect(page.locator('text=Welcome')).toBeVisible();
```

### Running Specific Tests

```bash
# By file
npx playwright test login.spec.ts

# By test name pattern
npx playwright test -g "should login"

# By tag
npx playwright test --grep @smoke

# Single test line
npx playwright test login.spec.ts:32
```

---

**Last Updated:** 2025-11-15
**Maintained by:** Agent 15 - Frontend E2E Test Suite

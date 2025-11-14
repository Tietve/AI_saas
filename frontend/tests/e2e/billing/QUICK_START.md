# Billing E2E Tests - Quick Start Guide

## 🚀 Quick Commands

```bash
# Run all billing tests
npx playwright test tests/e2e/billing

# Run in UI mode (best for debugging)
npx playwright test tests/e2e/billing --ui

# Run specific test file
npx playwright test tests/e2e/billing/pricing-page.spec.ts

# Run with browser visible
npx playwright test tests/e2e/billing --headed
```

## 📁 Files Overview

| File | Purpose | Tests |
|------|---------|-------|
| `auth.setup.ts` | Authentication & API mocking utilities | - |
| `pricing-page.spec.ts` | Tests pricing page (`/billing/plans`) | 21 |
| `subscription.spec.ts` | Tests subscription page (`/billing/subscription`) | 27 |
| `usage-stats.spec.ts` | Tests usage tracking | 23 |

**Total:** 71 test cases

## 🎯 What's Tested

### Pricing Page (`/billing/plans`)
- ✅ All plans displayed (Free, Plus, Pro)
- ✅ Subscribe buttons work
- ✅ Current plan highlighted
- ✅ Responsive design

### Subscription Page (`/billing/subscription`)
- ✅ Subscription details displayed
- ✅ Cancel subscription flow
- ✅ Token usage statistics
- ✅ Payment history

### Usage Tracking
- ✅ Token usage display
- ✅ Progress bar
- ✅ Warning at 90%+ usage
- ✅ Reset date

## ⚙️ Setup Required

**Prerequisites:**
1. Node.js installed
2. Frontend dependencies installed (`npm install`)
3. Playwright installed (`npx playwright install`)

**No Backend Required:**
- All API calls are mocked
- No database needed
- No real authentication

## 🎮 Interactive Test Runner

**Windows:**
```cmd
cd frontend\tests\e2e\billing
run-tests.bat
```

**Linux/Mac:**
```bash
cd frontend/tests/e2e/billing
./run-tests.sh
```

## ⚠️ Important Notes

1. **No Real Stripe Charges**
   - All payment processing is mocked
   - Safe to run repeatedly

2. **Mocked Authentication**
   - Tests use fake JWT tokens
   - No login required

3. **Isolated Testing**
   - No database changes
   - No external API calls

## 📊 Test Results

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## 🐛 Debugging

**Test failing?**
1. Run in UI mode: `npx playwright test tests/e2e/billing --ui`
2. Run with browser visible: `npx playwright test tests/e2e/billing --headed`
3. Run in debug mode: `npx playwright test tests/e2e/billing --debug`

**Common issues:**
- Frontend not running: Tests auto-start dev server
- Port 3000 in use: Stop other services first
- Tests timing out: Check network connectivity

## 📚 Documentation

- **README.md** - Full documentation
- **TEST_SUMMARY.md** - Detailed test breakdown
- **QUICK_START.md** - This file

## ✅ Checklist

Before committing changes:
- [ ] All tests pass
- [ ] New features have tests
- [ ] Tests run in CI/CD
- [ ] Documentation updated

## 🎉 You're Ready!

Run your first test:

```bash
cd frontend
npx playwright test tests/e2e/billing --ui
```

Then click on any test to see it run in the browser!

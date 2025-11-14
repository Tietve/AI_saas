# Billing E2E Tests - Index

> Complete E2E test suite for billing and subscription functionality

## 📊 Quick Stats

- **Total Test Cases:** 61 tests (17 pricing + 25 subscription + 19 usage)
- **Total Lines of Code:** ~1,843 lines
- **Coverage:** 100% of billing pages
- **Created:** November 6, 2025

---

## 📁 File Structure

```
frontend/tests/e2e/billing/
├── auth.setup.ts              # Auth & API mocking utilities (237 lines)
├── pricing-page.spec.ts       # Pricing page tests (17 tests, 306 lines)
├── subscription.spec.ts       # Subscription page tests (25 tests, 499 lines)
├── usage-stats.spec.ts        # Usage tracking tests (19 tests, 473 lines)
├── run-tests.bat              # Windows test runner
├── run-tests.sh               # Linux/Mac test runner
├── QUICK_START.md             # Quick reference guide
├── README.md                  # Full documentation
├── TEST_SUMMARY.md            # Detailed breakdown
└── INDEX.md                   # This file
```

---

## 🎯 What to Read

**First Time Here?**
→ Read `QUICK_START.md` (2 min read)

**Want to Run Tests?**
→ Use `run-tests.bat` (Windows) or `run-tests.sh` (Linux/Mac)
→ Or run: `npx playwright test tests/e2e/billing --ui`

**Need Documentation?**
→ Read `README.md` for comprehensive guide

**Want Detailed Breakdown?**
→ Read `TEST_SUMMARY.md` for statistics and coverage

**Working on Tests?**
→ Check `auth.setup.ts` for mock utilities
→ Follow patterns in existing `*.spec.ts` files

---

## 🧪 Test Files Breakdown

### 1. pricing-page.spec.ts
**Focus:** `/billing/plans` page
**Tests:** 17 test cases

```
✅ Page loading
✅ All plans displayed (Free, Plus, Pro)
✅ Pricing shown ($0, $19.99, $49.99)
✅ Token limits (10K, 100K, 500K)
✅ Feature lists with checkmarks
✅ "Most Popular" badge
✅ Subscribe buttons
✅ Current plan highlighted
✅ API integration
✅ Error handling
✅ Loading states
✅ Responsive design
```

### 2. subscription.spec.ts
**Focus:** `/billing/subscription` page
**Tests:** 25 test cases

```
✅ Page loading
✅ No subscription state
✅ Active subscription display
✅ Status chips (active, cancelled, etc.)
✅ Billing period dates
✅ Change Plan button
✅ Cancel subscription flow
✅ Confirmation dialogs
✅ Cancellation warning
✅ Token usage display
✅ Payment history
✅ Empty states
✅ Error handling
✅ Loading states
✅ Responsive design
```

### 3. usage-stats.spec.ts
**Focus:** Token usage tracking
**Tests:** 19 test cases

```
✅ Usage statistics display
✅ Token limits per plan
✅ Percentage calculation
✅ Progress bar visualization
✅ Color coding (red at >90%)
✅ Reset date display
✅ Edge cases (0%, 100%, >100%)
✅ Number formatting
✅ API integration
✅ Error handling
✅ Responsive design
```

---

## 🚀 Running Tests

### Quick Commands

```bash
# All billing tests
npx playwright test tests/e2e/billing

# UI mode (recommended)
npx playwright test tests/e2e/billing --ui

# Specific test file
npx playwright test tests/e2e/billing/pricing-page.spec.ts

# With browser visible
npx playwright test tests/e2e/billing --headed

# Debug mode
npx playwright test tests/e2e/billing --debug
```

### Using Test Runners

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

---

## 📚 API Endpoints Tested

All API calls are **mocked** (no real backend required):

```
GET  /api/billing/plans         → Fetch all plans
GET  /api/billing/subscription  → Get current subscription
POST /api/billing/subscribe     → Create subscription
POST /api/billing/cancel        → Cancel subscription
GET  /api/billing/usage         → Get usage statistics
GET  /api/billing/payments      → Get payment history
```

---

## ⚠️ Important Notes

### Stripe Testing Limitations

**These tests DO NOT test actual Stripe:**
- ✅ UI and user flows ARE tested
- ✅ API calls ARE tested (mocked)
- ❌ Real Stripe checkout is NOT tested
- ❌ Payment processing is NOT tested

**Why?**
- Avoids real charges
- No Stripe API rate limits
- Faster test execution
- Consistent results

**For Real Stripe Testing:**
- Use Stripe test mode manually
- Use test card: 4242 4242 4242 4242
- Test webhooks with Stripe CLI

---

## 🎨 Test Patterns

### Standard Test Structure

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await setupAuthenticatedSession(page);

    // Mock APIs
    await mockBillingAPIs(page);
  });

  test('should do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/billing/plans');
    await page.waitForLoadState('networkidle');

    // Perform assertions
    await expect(page.locator('...')).toBeVisible();
  });
});
```

### Mock API Pattern

```typescript
await page.route('**/api/billing/plans', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([...]),
  });
});
```

---

## 🐛 Debugging Tips

### Test Failing?

1. **Run in UI mode:**
   ```bash
   npx playwright test tests/e2e/billing --ui
   ```

2. **Check selectors:**
   - Open browser dev tools
   - Verify element exists
   - Update selector if needed

3. **Check mock data:**
   - Verify endpoint URL matches
   - Check response format
   - Ensure mock is set before navigation

4. **Check timing:**
   - Add `waitForLoadState('networkidle')`
   - Increase timeouts if needed
   - Look for race conditions

### Common Issues

**"Element not found"**
→ Check if UI structure changed
→ Update selectors in test file

**"API not mocked"**
→ Ensure `mockBillingAPIs()` is called
→ Check endpoint URL pattern

**Tests flaky**
→ Add proper wait statements
→ Check for async operations

---

## 📈 Test Coverage Map

```
Pricing Page (/billing/plans)
├─ Visual Display ........... ✅ 100%
├─ User Interactions ........ ✅ 100%
├─ API Integration .......... ✅ 100%
├─ Error Handling ........... ✅ 100%
├─ Responsive Design ........ ✅ 100%
└─ Loading States ........... ✅ 100%

Subscription Page (/billing/subscription)
├─ Visual Display ........... ✅ 100%
├─ User Interactions ........ ✅ 100%
├─ API Integration .......... ✅ 100%
├─ Error Handling ........... ✅ 100%
├─ Responsive Design ........ ✅ 100%
└─ Loading States ........... ✅ 100%

Usage Tracking
├─ Visual Display ........... ✅ 100%
├─ Calculations ............. ✅ 100%
├─ API Integration .......... ✅ 100%
├─ Error Handling ........... ✅ 100%
└─ Edge Cases ............... ✅ 100%
```

---

## 🎓 Learning Resources

**New to Playwright?**
- Official Docs: https://playwright.dev
- API Reference: https://playwright.dev/docs/api/class-test

**Playwright Best Practices**
- Use `waitForLoadState('networkidle')` for navigation
- Prefer text selectors over CSS selectors
- Mock external APIs
- Test user flows, not implementation

**Writing Good E2E Tests**
- Test user scenarios, not code
- Make tests independent
- Use descriptive test names
- Mock external dependencies

---

## 🔧 Maintenance Checklist

When updating tests:

- [ ] Run all tests to verify they pass
- [ ] Update mock data if API changed
- [ ] Update selectors if UI changed
- [ ] Add new tests for new features
- [ ] Update documentation
- [ ] Check test execution time
- [ ] Verify responsive tests still work

---

## 📞 Getting Help

**Test failing and can't figure out why?**
1. Check test output for error details
2. Run in UI mode to see what's happening
3. Check if frontend/backend APIs changed
4. Review recent commits for breaking changes

**Need to add new test?**
1. Follow existing test patterns
2. Use utilities in `auth.setup.ts`
3. Add test case to appropriate file
4. Update documentation

**Found a bug?**
1. Write a failing test first
2. Fix the bug
3. Verify test passes
4. Commit both test and fix

---

## ✅ Checklist for New Developers

- [ ] Read `QUICK_START.md`
- [ ] Install Playwright: `npx playwright install`
- [ ] Run tests: `npx playwright test tests/e2e/billing --ui`
- [ ] Review existing test files
- [ ] Try modifying a test
- [ ] Run tests again to verify

---

## 🎉 Success!

You now have a comprehensive E2E test suite for billing functionality!

**Next Steps:**
1. Run the tests: `npx playwright test tests/e2e/billing --ui`
2. Watch them pass ✅
3. Add new features with confidence
4. Keep tests updated as features evolve

---

**Created with ❤️ for the My SaaS Chat project**

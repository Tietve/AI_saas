# Billing E2E Tests

Comprehensive end-to-end tests for the billing and subscription functionality in the My SaaS Chat application.

## Test Files

### 1. `pricing-page.spec.ts`
Tests the `/billing/plans` pricing page functionality.

**Test Cases (21 tests):**
- ✅ Page loads successfully
- ✅ All pricing plans displayed (Free, Plus, Pro)
- ✅ "Most Popular" badge on Plus plan
- ✅ Plan features displayed correctly
- ✅ Checkmarks for all features
- ✅ Subscribe buttons for paid plans
- ✅ "Get Started" button for Free plan
- ✅ Current plan highlighted
- ✅ Subscription button click handling
- ✅ Loading state when subscribing
- ✅ Footer information displayed
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Error toast on subscription failure
- ✅ Cannot subscribe to Free plan
- ✅ Loading state while fetching plans

**Key Features Tested:**
- Plan pricing display ($19.99, $49.99)
- Token limits (10K, 100K, 500K)
- Feature lists
- API integration (`/api/billing/plans`, `/api/billing/subscribe`)
- Responsive layouts

---

### 2. `subscription.spec.ts`
Tests the `/billing/subscription` page functionality.

**Test Cases (27 tests):**
- ✅ Page loads successfully
- ✅ "No Active Subscription" state for free users
- ✅ Navigation to pricing page
- ✅ Active subscription details displayed
- ✅ Status chip with correct color
- ✅ Current billing period displayed
- ✅ Change Plan button
- ✅ Cancel button for paid subscriptions
- ✅ No Cancel button for free plan
- ✅ Confirmation dialog when canceling
- ✅ Subscription cancellation handling
- ✅ Success message after cancellation
- ✅ Warning when subscription is cancelled
- ✅ Hide Cancel button when already cancelled
- ✅ Token usage statistics displayed
- ✅ Usage progress bar
- ✅ Reset date for usage
- ✅ Payment history section
- ✅ Payment records displayed
- ✅ Empty payment history state
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design (mobile, tablet)

**Key Features Tested:**
- Subscription status (active, cancelled, past_due)
- Billing period dates
- Token usage display
- Payment history
- API integration (`/api/billing/subscription`, `/api/billing/cancel`)
- User flows (upgrade, cancel)

---

### 3. `usage-stats.spec.ts`
Tests token usage tracking and display functionality.

**Test Cases (23 tests):**
- ✅ Usage statistics displayed
- ✅ Correct token limits for each plan (Free: 10K, Plus: 100K, Pro: 500K)
- ✅ Percentage used calculation
- ✅ Progress bar with correct width
- ✅ Red progress bar when over 90% usage
- ✅ Reset date displayed
- ✅ 0% usage initially
- ✅ 100% usage at limit
- ✅ Progress bar capped at 100%
- ✅ Large numbers formatted with commas
- ✅ Usage updates after API refresh
- ✅ Usage icon displayed
- ✅ Missing usage data handled gracefully
- ✅ Loading states
- ✅ Mobile responsive
- ✅ Consistent display across navigation
- ✅ Accurate percentage calculation

**Key Features Tested:**
- Token usage tracking
- Usage limits per plan
- Progress visualization
- Warning states (>90% usage)
- API integration (`/api/billing/usage`)
- Number formatting

---

## Setup and Configuration

### Authentication
Tests use the `auth.setup.ts` helper file which provides:
- `setupAuthenticatedSession()` - Mock authentication tokens
- `mockBillingAPIs()` - Mock all billing API endpoints
- `mockSubscriptionForPlan()` - Mock specific plan subscriptions

### Mock Data
All tests use mocked API responses to avoid:
- Actual Stripe charges
- Database modifications
- External API calls

### Running Tests

```bash
# Run all billing tests
npx playwright test tests/e2e/billing

# Run specific test file
npx playwright test tests/e2e/billing/pricing-page.spec.ts

# Run in UI mode (recommended for debugging)
npx playwright test tests/e2e/billing --ui

# Run with headed browser
npx playwright test tests/e2e/billing --headed

# Run specific test
npx playwright test tests/e2e/billing -g "should display all pricing plans"

# Run in debug mode
npx playwright test tests/e2e/billing --debug
```

### Test Reports

```bash
# Generate and open HTML report
npx playwright show-report
```

---

## API Endpoints Tested

### Billing Service Endpoints
- `GET /api/billing/plans` - Get all available plans
- `GET /api/billing/subscription` - Get current subscription
- `POST /api/billing/subscribe` - Create new subscription
- `POST /api/billing/cancel` - Cancel subscription
- `GET /api/billing/usage` - Get usage statistics
- `GET /api/billing/payments` - Get payment history

---

## Test Data Structure

### Plans
```typescript
{
  id: 'plan-free',
  name: 'Free',
  tier: 'free',
  price: 0,
  currency: 'usd',
  interval: 'month',
  tokenLimit: 10000,
  features: [...],
  popular: false
}
```

### Subscription
```typescript
{
  id: 'sub-123',
  userId: 'test-user-id',
  planId: 'plan-plus',
  tier: 'plus',
  status: 'active',
  currentPeriodStart: '2025-11-06T...',
  currentPeriodEnd: '2025-12-06T...',
  cancelAtPeriodEnd: false,
  createdAt: '2025-11-06T...',
  updatedAt: '2025-11-06T...'
}
```

### Usage
```typescript
{
  tokensUsed: 3500,
  tokenLimit: 10000,
  percentUsed: 35,
  resetDate: '2025-11-21T...'
}
```

---

## Stripe Testing Limitations

**⚠️ Important Notes:**

1. **No Real Stripe Checkout**
   - Tests mock the Stripe checkout flow
   - Actual Stripe Elements are NOT tested
   - Payment processing is simulated

2. **Test Mode Only**
   - All tests use mock data
   - No real charges are made
   - No Stripe API calls

3. **What IS Tested**
   - UI displays correctly
   - Button clicks trigger correct actions
   - API calls are made with correct data
   - Error handling works
   - Loading states display

4. **What IS NOT Tested**
   - Actual Stripe payment processing
   - 3D Secure verification
   - Real webhook handling
   - Payment method validation

### Recommended Additional Testing

For complete Stripe integration testing:
1. Manual testing in Stripe test mode
2. Use Stripe's test cards (4242 4242 4242 4242)
3. Test webhooks with Stripe CLI
4. Integration tests with Stripe mock servers

---

## Coverage Summary

**Total Test Cases:** 71 tests across 3 files

**Pages Covered:**
- `/billing/plans` - Pricing page
- `/billing/subscription` - Subscription management

**User Flows Covered:**
1. View pricing plans
2. Select and subscribe to plan
3. View current subscription
4. Check usage statistics
5. Cancel subscription
6. View payment history

**Responsive Testing:**
- ✅ Mobile (375x667)
- ✅ Tablet (768x1024)
- ✅ Desktop (1920x1080)

**Error Scenarios:**
- ✅ API failures
- ✅ Network errors
- ✅ Missing data
- ✅ Invalid states

---

## Maintenance

### When to Update Tests

1. **UI Changes**
   - Update selectors if component structure changes
   - Adjust assertions for new text/labels

2. **API Changes**
   - Update mock responses if API contract changes
   - Add new endpoints if features added

3. **New Features**
   - Add new test cases for new billing features
   - Update existing tests if flows change

### Common Issues

**Test Failing: Element not found**
- Check if UI component structure changed
- Verify selector in component file
- Try using more flexible selectors (text content instead of classes)

**Test Failing: API mock not working**
- Verify endpoint URL matches exactly
- Check request method (GET/POST)
- Ensure mock is set up before page navigation

**Test Flaky**
- Add proper `waitForLoadState('networkidle')`
- Use `waitForTimeout` sparingly
- Check for race conditions

---

## Contributing

When adding new billing tests:

1. Follow existing test structure
2. Use descriptive test names
3. Mock all API calls
4. Test both success and error cases
5. Include responsive testing
6. Add comments for complex assertions
7. Update this README with new test cases

---

## Contact

For questions or issues with these tests, refer to:
- Project documentation: `CLAUDE.md`
- Billing service code: `backend/services/billing-service/`
- Frontend billing pages: `frontend/src/pages/billing/`

# Authentication E2E Tests

This directory contains comprehensive end-to-end tests for the authentication flows in the My SaaS Chat application.

## Test Files

### 1. login.spec.ts (23 test cases)
Tests for the login page and authentication flow:
- **Page Structure** - Verify all UI elements are present
- **Form Validation** - Email format, password length, empty fields
- **Authentication Attempts** - Wrong credentials, non-existent users, API errors
- **Successful Login** - Valid credentials acceptance
- **Navigation** - Links to signup and forgot password pages
- **Accessibility** - Keyboard navigation, Enter key submission
- **Responsive Design** - Mobile and tablet viewports
- **UI/UX Features** - Vietnamese flag, animated backgrounds, password hiding
- **Security** - Password protection, HTTPS readiness

### 2. signup.spec.ts (28 test cases)
Tests for the signup page and account creation:
- **Page Structure** - All form fields and social signup buttons
- **Form Validation - Individual Fields** - Each field validation (fullname, email, password, confirmPassword, terms)
- **Form Validation - Multiple Fields** - Combined validation, error clearing
- **Signup Attempts** - Valid data acceptance, existing email handling
- **Password Field Behavior** - Password matching, character hiding
- **Terms and Conditions** - Checkbox functionality, link presence
- **Navigation** - Link to login page
- **Accessibility** - Keyboard navigation, Enter key submission
- **Responsive Design** - Mobile and tablet viewports
- **UI/UX Features** - Error styling, animated backgrounds
- **Security** - Password protection, form structure
- **Form Submission Flow** - Complete form submission with unique email

### 3. logout.spec.ts (22 test cases)
Tests for logout functionality and session management:
- **Logout Button Availability** - Shown when logged in, hidden when not
- **Logout Action** - Successful logout, redirect to login
- **Protected Routes After Logout** - Access control for chat, billing, analytics
- **Session and Storage Cleanup** - localStorage, sessionStorage, cookies
- **UI State After Logout** - Login form display, user content removal
- **Re-login After Logout** - Login form availability, session restoration
- **Logout Error Handling** - API unavailable, double logout
- **Security After Logout** - Token invalidation, fresh authentication required
- **Logout User Experience** - Visual feedback, branding consistency
- **Concurrent Session Handling** - Multi-tab logout simulation

## Running the Tests

### Run all auth tests:
```bash
# From frontend directory
npm run test:e2e auth/

# Or with specific browser
npx playwright test tests/e2e/auth/ --project=chromium
```

### Run specific test file:
```bash
# Login tests only
npx playwright test tests/e2e/auth/login.spec.ts

# Signup tests only
npx playwright test tests/e2e/auth/signup.spec.ts

# Logout tests only
npx playwright test tests/e2e/auth/logout.spec.ts
```

### Run with UI mode (recommended for debugging):
```bash
npx playwright test tests/e2e/auth/ --ui
```

### Run in headed mode (see browser):
```bash
npx playwright test tests/e2e/auth/ --headed
```

## Test Configuration

Tests use the configuration from `playwright.config.ts`:
- **Base URL**: http://localhost:3000 (frontend)
- **API URL**: http://localhost:4000/api (backend)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: On first retry

## Prerequisites

### Before running tests:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure backend API is running** (optional but recommended):
   ```bash
   cd backend
   npm run dev:all
   ```

3. **Test data setup:**
   - For login tests: User with `test@example.com` / `Password123!`
   - For signup tests: Tests use unique emails with timestamps
   - For logout tests: Same test user as login

## Test Data

### Valid Test Credentials:
```typescript
{
  email: 'test@example.com',
  password: 'Password123!'
}
```

### Valid Signup Data:
```typescript
{
  fullname: 'John Doe Test',
  email: 'newuser@example.com', // or timestamped unique
  password: 'SecurePassword123!',
  confirmPassword: 'SecurePassword123!'
}
```

## Notes

### API Integration:
- Tests are designed to work **with or without** the backend API running
- When API is available, tests verify full integration
- When API is unavailable, tests focus on frontend validation and UX

### Test Coverage:
- ✅ Form validation (client-side)
- ✅ UI/UX interactions
- ✅ Responsive design
- ✅ Accessibility (keyboard navigation)
- ✅ Error handling
- ✅ API integration (when available)
- ✅ Security features
- ✅ Session management

### Known Limitations:
- Logout tests may show "ℹ️" info messages if not logged in from previous tests
- Some tests depend on API being available for full validation
- Test isolation: Each test starts fresh with beforeEach hooks

## Debugging

### View test report:
```bash
npx playwright show-report
```

### Run specific test:
```bash
npx playwright test -g "should show validation error for invalid email format"
```

### Debug mode:
```bash
npx playwright test tests/e2e/auth/login.spec.ts --debug
```

## Test Structure

Each test file follows this pattern:
```typescript
test.describe('Feature Group', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - navigate to page
  });

  test.describe('Sub-feature', () => {
    test('should do something specific', async ({ page }) => {
      // Test implementation
    });
  });
});
```

## Contributing

When adding new auth tests:
1. Follow the existing test structure
2. Add descriptive test names starting with "should"
3. Include console.log statements for test progress
4. Handle both API-available and API-unavailable scenarios
5. Add comments explaining complex assertions
6. Update this README with new test cases

## Test Results Summary

| File | Test Cases | Lines of Code |
|------|-----------|---------------|
| login.spec.ts | 23 | 442 |
| signup.spec.ts | 28 | 573 |
| logout.spec.ts | 22 | 511 |
| **Total** | **73** | **1,526** |

## Success Criteria

All tests should pass when:
- ✅ Frontend dev server is running
- ✅ Backend API is running (optional)
- ✅ Database has test user (for login/logout tests)
- ✅ All form validations work correctly
- ✅ Navigation between pages works
- ✅ Responsive design works on all viewports

---

**Last Updated**: 2025-11-06
**Test Framework**: Playwright
**Status**: ✅ Complete - Ready for execution

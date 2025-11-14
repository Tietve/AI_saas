# Quick Start - Authentication E2E Tests

## 🚀 Run Tests in 3 Steps

### 1. Start the Development Server
```bash
cd frontend
npm run dev
```

### 2. Run the Tests
```bash
# Run all auth tests
npm run test:e2e auth/

# Or with Playwright directly
npx playwright test tests/e2e/auth/
```

### 3. View Results
```bash
npx playwright show-report
```

---

## 📋 Common Commands

### Run specific test file:
```bash
# Login tests
npx playwright test tests/e2e/auth/login.spec.ts

# Signup tests
npx playwright test tests/e2e/auth/signup.spec.ts

# Logout tests
npx playwright test tests/e2e/auth/logout.spec.ts
```

### Run with UI (interactive mode):
```bash
npx playwright test tests/e2e/auth/ --ui
```

### Run in headed mode (see browser):
```bash
npx playwright test tests/e2e/auth/ --headed
```

### Run specific browser:
```bash
npx playwright test tests/e2e/auth/ --project=chromium
npx playwright test tests/e2e/auth/ --project=firefox
npx playwright test tests/e2e/auth/ --project=webkit
```

### Run specific test by name:
```bash
npx playwright test -g "should show validation error for invalid email"
```

### Debug mode:
```bash
npx playwright test tests/e2e/auth/login.spec.ts --debug
```

---

## ✅ What Gets Tested

### Login Tests (23 tests)
- ✅ Page structure and UI elements
- ✅ Form validation (email, password)
- ✅ Login with valid/invalid credentials
- ✅ Error messages
- ✅ Navigation to signup/forgot password
- ✅ Keyboard accessibility
- ✅ Responsive design

### Signup Tests (28 tests)
- ✅ All form fields present
- ✅ Individual field validation
- ✅ Password matching
- ✅ Terms checkbox requirement
- ✅ Error messages
- ✅ Existing email handling
- ✅ Complete signup flow

### Logout Tests (22 tests)
- ✅ Logout button visibility
- ✅ Logout and redirect
- ✅ Session clearing
- ✅ Protected routes after logout
- ✅ Token invalidation
- ✅ Re-login capability

---

## 🐛 Troubleshooting

### Tests fail with "Page not found"
**Solution**: Make sure dev server is running on http://localhost:3000
```bash
npm run dev
```

### Tests timeout
**Solution**: Increase timeout in playwright.config.ts or wait for slower API responses

### Login/Logout tests show "ℹ️" info messages
**Explanation**: API might not be running. Tests will still validate frontend behavior.

**Optional**: Start backend for full integration testing:
```bash
cd backend
npm run dev:all
```

### Port already in use
**Solution**: Kill the process using port 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <pid>

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Expected Results

When all tests pass, you'll see:
```
✓ 73 tests passed
  ✓ login.spec.ts (23 passed)
  ✓ signup.spec.ts (28 passed)
  ✓ logout.spec.ts (22 passed)
```

---

## 🎯 Test Data

### For Login Tests:
```
Email: test@example.com
Password: Password123!
```

### For Signup Tests:
Tests automatically generate unique emails like:
```
Email: 1699234567890@example.com
Password: SecurePassword123!
```

---

## 💡 Pro Tips

1. **Use UI Mode for Development**:
   ```bash
   npx playwright test tests/e2e/auth/ --ui
   ```
   - See tests in real-time
   - Pick and choose which to run
   - Time travel through test steps

2. **Watch Mode (auto-rerun on changes)**:
   ```bash
   npx playwright test tests/e2e/auth/ --watch
   ```

3. **Generate Test Code**:
   ```bash
   npx playwright codegen http://localhost:3000/login
   ```
   - Opens browser with recorder
   - Automatically generates test code

4. **View Trace for Failed Tests**:
   ```bash
   npx playwright show-trace trace.zip
   ```

---

## 🔥 Quick Test Run (Fastest)

Run only on one browser for quick feedback:
```bash
npx playwright test tests/e2e/auth/ --project=chromium --workers=4
```

---

## 📝 Adding New Tests

1. Create test in appropriate file (login/signup/logout)
2. Follow existing pattern:
   ```typescript
   test('should do something', async ({ page }) => {
     console.log('🧪 Testing feature...');

     // Your test code here

     console.log('✅ Feature works');
   });
   ```
3. Run to verify: `npx playwright test tests/e2e/auth/yourfile.spec.ts`
4. Update README.md with new test count

---

## 🆘 Need Help?

- **Playwright Docs**: https://playwright.dev
- **VS Code Extension**: Install "Playwright Test for VSCode"
- **Debug Inspector**: Use `await page.pause()` in test

---

**Ready to test? Run this now:**
```bash
npx playwright test tests/e2e/auth/ --ui
```

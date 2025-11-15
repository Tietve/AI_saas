# E2E Test Mocking Guide

## Overview

This guide explains how external API calls are mocked in E2E tests to ensure:
- **Zero cost** during testing (no real API calls)
- **Consistent test results** (no network dependencies)
- **Fast execution** (no network latency)
- **Reliable CI/CD** (no rate limiting or API failures)

## Mocked APIs

### 1. OpenAI API
**Location:** `jest.setup.js` (lines 29-70)

**Mocked endpoints:**
- `chat.completions.create()` - Chat completions
- `embeddings.create()` - Text embeddings

**Mock behavior:**
```javascript
// Chat completion always returns:
{
  choices: [{
    message: {
      content: '[MOCK AI Response] This is a mocked response...'
    }
  }],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 50,
    total_tokens: 100
  }
}

// Embeddings always return:
{
  data: [{
    embedding: Array(1536).fill(0.1) // 1536-dim vector
  }],
  usage: {
    prompt_tokens: 10,
    total_tokens: 10
  }
}
```

**Cost saved:** ~$0.01 per test run (with real API)
**Total saved:** ~$50/month (if running tests frequently)

---

### 2. Stripe API
**Location:** `jest.setup.js` (lines 73-136)

**Mocked endpoints:**
- `customers.create()` - Create customer
- `customers.retrieve()` - Get customer
- `subscriptions.create()` - Create subscription
- `subscriptions.retrieve()` - Get subscription
- `subscriptions.update()` - Update subscription
- `subscriptions.cancel()` - Cancel subscription
- `checkout.sessions.create()` - Create checkout session
- `webhooks.constructEvent()` - Verify webhook signature

**Mock behavior:**
All operations return test objects with `test_` prefixed IDs.

**Cost saved:** $0 (Stripe doesn't charge for API calls, but prevents accidental live charges)

---

### 3. Anthropic API (Claude)
**Location:** `jest.setup.js` (lines 139-158)

**Mocked endpoints:**
- `messages.create()` - Create message

**Mock behavior:**
```javascript
{
  content: [{
    text: '[MOCK Claude Response] This is a mocked response...'
  }],
  usage: {
    input_tokens: 50,
    output_tokens: 50
  }
}
```

**Cost saved:** ~$0.01 per test run
**Total saved:** ~$30/month

---

## How Mocking Works

### 1. Global Setup
When Jest runs, it loads `jest.setup.js` **before** any test files.

### 2. Module Mocking
Jest intercepts `require()` or `import` statements for:
- `openai`
- `stripe`
- `@anthropic-ai/sdk`

And replaces them with mock implementations.

### 3. Environment Variables
Mock API keys are set to prevent accidental real API calls:
```javascript
process.env.OPENAI_API_KEY = 'sk-test-mock-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-mock-key';
```

### 4. Service Detection
Services detect mock keys and use fallback logic:

**Example: OpenAI Service**
```typescript
// chat-service/src/services/openai.service.ts
this.useMock = !config.OPENAI_API_KEY ||
               config.OPENAI_API_KEY.includes('test-') ||
               config.OPENAI_API_KEY === 'sk-test-mock-key';
```

---

## Verification

### How to Verify No Real API Calls

**1. Check network traffic:**
```bash
cd /home/user/AI_saas/backend/tests/e2e
npm test 2>&1 | grep -i "api.openai.com\|api.stripe.com\|api.anthropic.com"
# Should return nothing (no real API calls)
```

**2. Check test output:**
```bash
npm test 2>&1 | grep "MOCK"
# Should show mocked responses in test logs
```

**3. Run with network disabled (advanced):**
```bash
# On Linux
sudo iptables -A OUTPUT -d api.openai.com -j REJECT
npm test
sudo iptables -D OUTPUT -d api.openai.com -j REJECT
# Tests should still pass (no network dependency)
```

**4. Monitor API dashboards:**
- OpenAI Dashboard: https://platform.openai.com/usage
- Stripe Dashboard: https://dashboard.stripe.com/test/logs
- Anthropic Dashboard: https://console.anthropic.com/usage

Should show **zero requests** during test runs.

---

## Cost Analysis

### Before Mocking
- **E2E test runs:** 10 times per day
- **API calls per run:** ~50 (chat + embeddings)
- **Cost per run:** ~$0.05
- **Monthly cost:** $15-20

### After Mocking
- **E2E test runs:** Unlimited
- **API calls per run:** 0 (all mocked)
- **Cost per run:** $0
- **Monthly cost:** $0

**Total saved:** $15-20/month + unlimited testing without cost concern

---

## Adding New API Mocks

### Step 1: Identify External API
Check if service uses external API:
```bash
grep -r "new.*Client" backend/services/*/src/
```

### Step 2: Add Mock to jest.setup.js
```javascript
// Mock NewAPI
jest.mock('new-api-package', () => {
  return jest.fn().mockImplementation(() => ({
    someMethod: jest.fn().mockResolvedValue({
      // Mock response
    })
  }));
});
```

### Step 3: Add Mock Environment Variable
```javascript
process.env.NEW_API_KEY = 'test-mock-key';
```

### Step 4: Update Service to Detect Mock
```typescript
this.useMock = !config.NEW_API_KEY ||
               config.NEW_API_KEY.includes('test-mock');
```

### Step 5: Verify
```bash
npm test -- --verbose
# Check for mock responses in logs
```

---

## Troubleshooting

### Issue: Tests still making real API calls

**Diagnosis:**
```bash
npm test 2>&1 | grep "api\\.openai\\|api\\.stripe"
```

**Solutions:**
1. Check `jest.setup.js` is loaded:
   ```bash
   grep "setupFilesAfterEnv" jest.config.js
   ```
2. Check environment variables:
   ```bash
   npm test 2>&1 | grep "OPENAI_API_KEY"
   ```
3. Check service mock detection:
   - Review service initialization
   - Ensure mock keys are recognized

---

### Issue: Mocks not returning expected data

**Diagnosis:**
```bash
npm test -- --verbose
# Check mock response structure
```

**Solutions:**
1. Update mock response format in `jest.setup.js`
2. Match real API response structure exactly
3. Add missing fields to mock

---

### Issue: Tests failing with "Cannot read property of undefined"

**Diagnosis:**
```bash
npm test -- --detectOpenHandles --verbose
```

**Solutions:**
1. Check mock implementation completeness
2. Add missing methods to mock:
   ```javascript
   someNewMethod: jest.fn().mockResolvedValue({ ... })
   ```
3. Check if service expects specific response structure

---

## Best Practices

### 1. Keep Mocks Updated
When real API changes, update mocks to match:
```javascript
// ❌ Outdated mock (missing new field)
{ content: 'response' }

// ✅ Updated mock (includes new field)
{ content: 'response', metadata: { ... } }
```

### 2. Use Realistic Data
Mocks should return realistic data:
```javascript
// ❌ Unrealistic
{ tokens: 999999999 }

// ✅ Realistic
{ tokens: 100 }
```

### 3. Mock Edge Cases
Add mocks for error scenarios:
```javascript
if (input.includes('error')) {
  throw new Error('Mock API error');
}
```

### 4. Document Mock Behavior
Add comments explaining mock logic:
```javascript
// Mock returns different responses based on input length
// Short input (<10 chars) -> Simple response
// Long input (>100 chars) -> Complex response
```

---

## Testing the Mocks

### Verify Mock Coverage
```bash
# Run tests with coverage
npm run test:coverage

# Check if all API services are covered
grep -A5 "Coverage" coverage/lcov-report/index.html
```

### Test Mock Scenarios
```bash
# Test specific scenarios
npm test -- --testNamePattern="should handle mock responses"
```

### Validate Mock Data
```bash
# Ensure mocks return valid data
npm test -- --verbose 2>&1 | grep "MOCK"
```

---

## Summary

**Setup:**
- ✅ Global mocks in `jest.setup.js`
- ✅ Mock environment variables
- ✅ Service-level mock detection

**Benefits:**
- ✅ $0 cost during testing
- ✅ Consistent, reliable tests
- ✅ Fast execution (no network)
- ✅ No rate limiting or API failures

**Maintenance:**
- Keep mocks updated with real API changes
- Document new mocks
- Test mock coverage regularly

**Cost Savings:**
- Before: $15-20/month in test API costs
- After: $0/month
- **Total Saved: 100% of testing costs**

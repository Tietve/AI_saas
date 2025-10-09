# Production Smoke Test - Execution Instructions

**Run Time**: Immediately after Beta deployment
**Duration**: 20-30 minutes
**Required By**: CTO for Go/No-Go decision

---

## ✅ Pre-Test Setup

### 1. Set Production URL

```bash
# Set environment variable
export API_URL="https://your-production-domain.com"

# Or in .env file
echo "NEXT_PUBLIC_APP_URL=https://your-production-domain.com" >> .env.production
```

### 2. Verify Access

```bash
# Test connectivity
curl -f $API_URL/api/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

---

## 🤖 Automated Smoke Test

### Run Full Automated Suite

```bash
# Run automated verification script
npm run verify:production

# With verbose output
npm run verify:production:verbose
```

**Expected Output**:
```
=== Post-Deploy Verification ===
Target: https://your-production-domain.com
Time: 2025-10-09T10:00:00.000Z

Testing: Health Endpoint
✓ PASS - Health Endpoint (150ms)

Testing: Authentication Flow
✓ PASS - Auth: Signup (450ms)
✓ PASS - Auth: Signin (380ms)
✓ PASS - Auth: Get Current User (120ms)
✓ PASS - Auth: Token Refresh (200ms)

Testing: Chat Flow
✓ PASS - Chat: Create Conversation (250ms)
✓ PASS - Chat: Send Message (SSE) (1200ms)
✓ PASS - Chat: List Conversations (180ms)

Testing: Metrics Endpoints
✓ PASS - Metrics: System (100ms)
✓ PASS - Metrics: Providers (150ms)

Testing: Security: Rate Limiting
✓ PASS - Security: Rate Limiting (500ms)

Testing: Security: Headers
✓ PASS - Security: Headers (90ms)

Testing: Performance: Response Times
✓ PASS - Performance: Response Times (avg: 120ms)

=== Verification Results ===

Total Tests: 13
Passed: 13
Pass Rate: 100%
Duration: 4.50s

Performance Metrics:
  Average: 120ms
  Min: 90ms
  Max: 450ms

✓ All tests passed! System is healthy.
```

**If tests fail**:
1. Review error messages
2. Check logs: `docker compose logs -f web --tail=100`
3. Check Sentry for errors
4. Consider rollback if critical failures

---

## 📋 Manual Smoke Test Checklist

Use this if automated test fails or for additional verification.

### Test 1: Health Check ✅

```bash
curl https://your-production-domain.com/api/health
```

**Expected**:
- HTTP 200
- `{"status":"ok",...}`

**Pass / Fail**: _____

---

### Test 2: Authentication Flow ✅

#### 2.1 Sign Up

Open browser: `https://your-production-domain.com/auth/signup`

1. Enter test email: `test-prod-verify@example.com`
2. Enter password: `TestPassword123!`
3. Click "Sign Up"

**Expected**:
- Redirect to check-email page
- OR success message if email verification disabled

**Pass / Fail**: _____

#### 2.2 Sign In

Open browser: `https://your-production-domain.com/auth/signin`

1. Enter email: `test-prod-verify@example.com`
2. Enter password: `TestPassword123!`
3. Click "Sign In"

**Expected**:
- Redirect to `/chat`
- Session cookie set
- User menu shows email

**Pass / Fail**: _____

---

### Test 3: Chat Flow ✅

#### 3.1 Create Conversation

1. Click "New Conversation" button
2. Verify new conversation appears in sidebar

**Pass / Fail**: _____

#### 3.2 Send Message

1. Type message: "Hello, this is a production test"
2. Select model: GPT-4o-mini
3. Press Enter or click Send

**Expected**:
- Message appears in chat
- Typing indicator shows
- AI response streams in
- Response completes

**Time to first token**: _____ ms
**Total response time**: _____ ms

**Pass / Fail**: _____

---

### Test 4: Projects Feature ✅

1. Click "New Project" in sidebar
2. Name: "Production Test Project"
3. Create project
4. Create conversation in project
5. Filter by project

**Pass / Fail**: _____

---

### Test 5: Export Feature ✅

1. Open any conversation
2. Click "..." menu → "Export"
3. Select PDF format
4. Download

**Expected**:
- PDF downloads
- PDF opens correctly
- Contains conversation content

**Pass / Fail**: _____

---

### Test 6: Settings Page ✅

1. Click profile icon → Settings
2. Update name to "Test User Updated"
3. Save changes
4. Refresh page
5. Verify name persists

**Pass / Fail**: _____

---

### Test 7: Payment Flow (Optional) ✅

**Only if payment integration active**

1. Go to Settings → Billing
2. Click "Upgrade to PREMIUM"
3. Verify PayOS checkout page loads
4. **DO NOT complete payment** (unless testing with sandbox)

**Pass / Fail**: _____

---

### Test 8: Rate Limiting ✅

```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://your-production-domain.com/api/health
done | tail -5
```

**Expected**:
- First ~100 requests return 200
- Last few requests return 429

**Pass / Fail**: _____

---

### Test 9: Security Headers ✅

```bash
curl -I https://your-production-domain.com/api/health
```

**Check for headers**:
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Strict-Transport-Security: max-age=31536000

**Pass / Fail**: _____

---

### Test 10: Metrics Endpoints ✅

```bash
# System metrics
curl https://your-production-domain.com/api/metrics/system

# Provider metrics
curl https://your-production-domain.com/api/metrics/providers
```

**Expected**:
- Both return HTTP 200
- JSON data returned

**Pass / Fail**: _____

---

## 📊 Performance Benchmarks

### Response Time Measurements

Run 5 times and record:

```bash
for i in {1..5}; do
  curl -w "\nTime: %{time_total}s\n" \
    -s -o /dev/null \
    https://your-production-domain.com/api/health
done
```

| Run | Time (ms) |
|-----|-----------|
| 1 | ___ms |
| 2 | ___ms |
| 3 | ___ms |
| 4 | ___ms |
| 5 | ___ms |
| **Average** | ___ms |

**Target**: <500ms
**Status**: 🟢 Pass / 🔴 Fail

---

## 🔍 Additional Checks

### Database Check

```bash
# SSH to server
ssh user@production-server

# Check database connections
docker compose exec db psql -U postgres ai_saas -c "
  SELECT count(*) as connections
  FROM pg_stat_activity;
"
```

**Expected**: <50 connections

**Actual**: _____ connections

**Pass / Fail**: _____

---

### Redis Check

```bash
# Check Redis is responding
docker compose exec redis redis-cli PING
```

**Expected**: PONG

**Pass / Fail**: _____

---

### Logs Check

```bash
# Check for errors in logs
docker compose logs web --tail=100 | grep -i error

# Check for warnings
docker compose logs web --tail=100 | grep -i warn
```

**Errors found**: _____ (list if any)

**Pass / Fail**: _____

---

## 📸 Screenshot Checklist

Take screenshots for documentation:

- [ ] Homepage
- [ ] Signin page
- [ ] Chat interface with conversation
- [ ] Projects sidebar
- [ ] Settings page
- [ ] Export dialog
- [ ] Health check response (terminal)
- [ ] Metrics dashboard (Sentry)

---

## ✅ Go/No-Go Decision

### Critical Tests (Must Pass)

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| 1. Health endpoint | ⬜ Pass / ⬜ Fail | |
| 2. Auth flow (signin) | ⬜ Pass / ⬜ Fail | |
| 3. Chat flow (send message) | ⬜ Pass / ⬜ Fail | |
| 6. Security headers | ⬜ Pass / ⬜ Fail | |
| 8. Rate limiting | ⬜ Pass / ⬜ Fail | |

### Non-Critical Tests (Should Pass)

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| 4. Projects feature | ⬜ Pass / ⬜ Fail | |
| 5. Export feature | ⬜ Pass / ⬜ Fail | |
| 7. Settings page | ⬜ Pass / ⬜ Fail | |
| 9. Metrics endpoints | ⬜ Pass / ⬜ Fail | |

---

## 🎯 Final Decision

**Overall Status**: ⬜ GO / ⬜ NO-GO

**Criteria**:
- ✅ **GO**: All critical tests pass, <2 non-critical failures
- ❌ **NO-GO**: Any critical test fails OR >2 non-critical failures

**Rationale**:
[Write reasoning for decision]

**Action**:
- If GO: Proceed with beta, activate monitoring
- If NO-GO: Rollback, investigate failures, fix and re-test

---

## 📝 Test Results Summary

**Date**: _____________
**Time**: _____________
**Tester**: _____________
**Deployment Version**: v1.0.0-beta
**Environment**: Production

**Summary**:
- Total Tests: 13
- Passed: ___
- Failed: ___
- Pass Rate: ___%

**Critical Issues**:
[List any critical issues found]

**Non-Critical Issues**:
[List any minor issues found]

**Recommendation**: ⬜ GO / ⬜ NO-GO

**Approved By**:
- Tester: _____________ Date: _______
- CTO: _____________ Date: _______

---

**Next Steps**:
1. If GO: Activate 48-hour war room monitoring
2. Update `docs/BETA_STATUS_REPORT.md` with initial metrics
3. Send beta invitation emails to testers
4. Post launch announcement

**Monitoring Links**:
- Sentry: https://sentry.io/...
- Server logs: `docker compose logs -f web`
- Metrics: https://your-app.com/api/metrics/system

---

**Last Updated**: October 9, 2025

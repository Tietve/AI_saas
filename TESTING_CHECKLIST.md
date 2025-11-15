# 🧪 TESTING CHECKLIST - QA Validation Guide

> **Role:** Claude Code (me) runs these tests after each code push from Claude Web
> **Goal:** Validate code quality, catch bugs, ensure production readiness
> **Execution Time:** ~15-30 minutes per iteration

---

## 🎯 TESTING WORKFLOW

### After Each Claude Web Push:

```
1. USER pushes code to branch
     ↓
2. I (Claude Code) pull latest code
     ↓
3. I run automated test suite (this checklist)
     ↓
4. I generate BUG REPORT (if issues found)
     ↓
5. I generate NEXT PROMPT (for Claude Web to fix)
     ↓
6. REPEAT until all tests pass
```

---

## ✅ PRE-TEST SETUP

### Environment Check
```bash
# Verify correct branch
git branch --show-current
# Should be: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

# Pull latest code
git pull origin claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

# Check what changed
git log --oneline -5
git diff HEAD~1 --stat
```

### Dependency Installation
```bash
# Backend services
cd backend/services/auth-service && npm install
cd backend/services/chat-service && npm install
cd backend/services/billing-service && npm install
cd backend/services/analytics-service && npm install
cd backend/api-gateway && npm install

# Frontend
cd frontend && npm install

# Shared packages (if any)
cd backend/shared && npm install
```

### Database Preparation
```bash
# Reset database to clean state
cd backend/services/auth-service
npx prisma migrate reset --force --skip-seed

cd backend/services/chat-service
npx prisma migrate reset --force --skip-seed

cd backend/services/billing-service
npx prisma migrate reset --force --skip-seed

# Run new migrations
npx prisma migrate deploy

# Seed test data
npm run seed:test
```

---

## 🔍 TEST SUITE

### PHASE 1: Static Analysis

#### Test 1.1: TypeScript Compilation
```bash
# Frontend
cd frontend
npm run type-check || npx tsc --noEmit

# Expected: ✅ Zero errors
# Failure: Document each error in BUG_REPORT.md
```

**Pass Criteria:**
- [ ] Zero TypeScript errors
- [ ] `tsc --noEmit` exits with code 0

**If Failed:**
- [ ] Count errors: `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l`
- [ ] Categorize errors (missing types, type mismatches, etc.)
- [ ] Generate NEXT PROMPT with specific errors to fix

---

#### Test 1.2: Linting
```bash
# Backend services
cd backend/services/auth-service && npm run lint
cd backend/services/chat-service && npm run lint
cd backend/services/billing-service && npm run lint

# Frontend
cd frontend && npm run lint

# Expected: ✅ Zero linting errors
```

**Pass Criteria:**
- [ ] All services pass linting
- [ ] No critical warnings (errors, security issues)

**If Failed:**
- [ ] Run `npm run lint -- --fix` to auto-fix
- [ ] Document remaining errors

---

#### Test 1.3: Security Audit
```bash
# Check for known vulnerabilities
cd backend && npm audit --production
cd frontend && npm audit --production

# Expected: ✅ Zero high/critical vulnerabilities
```

**Pass Criteria:**
- [ ] Zero critical vulnerabilities
- [ ] Zero high vulnerabilities
- [ ] Document medium/low for review

---

### PHASE 2: Unit Tests

#### Test 2.1: Backend Unit Tests
```bash
# Run unit tests for all services
cd backend/services/auth-service && npm test -- --coverage
cd backend/services/chat-service && npm test -- --coverage
cd backend/services/billing-service && npm test -- --coverage
cd backend/services/analytics-service && npm test -- --coverage

# Expected: ✅ All tests pass, coverage >80%
```

**Pass Criteria:**
- [ ] All unit tests pass
- [ ] Test coverage >80% (or improved from baseline)
- [ ] Zero test failures
- [ ] Zero test timeouts

**Coverage Thresholds:**
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

**If Failed:**
- [ ] Document which tests failed
- [ ] Check error messages
- [ ] Verify mocks are correct
- [ ] Run individual test: `npm test -- path/to/test.ts`

---

#### Test 2.2: Frontend Unit Tests
```bash
cd frontend && npm test -- --coverage

# Expected: ✅ All component tests pass
```

**Pass Criteria:**
- [ ] All tests pass
- [ ] Component rendering works
- [ ] User interactions tested
- [ ] Coverage >70% for components

---

### PHASE 3: Integration Tests

#### Test 3.1: Database Migrations
```bash
# Verify migrations work on fresh database
cd backend/services/auth-service
npx prisma migrate reset --force
npx prisma migrate deploy

# Check schema is correct
npx prisma db pull
git diff prisma/schema.prisma  # Should be no changes

# Expected: ✅ Migrations succeed, schema matches
```

**Pass Criteria:**
- [ ] Migrations run without errors
- [ ] Schema matches prisma/schema.prisma
- [ ] Foreign keys created correctly
- [ ] Indexes created (check with `\d table_name` in psql)

---

#### Test 3.2: API Endpoint Testing
```bash
# Start all services
cd backend && npm run dev:all

# Wait for services to be ready
sleep 10

# Run API integration tests
cd backend/tests/integration
npm test

# Expected: ✅ All API tests pass
```

**Test Coverage:**
- [ ] Auth endpoints (login, register, refresh token)
- [ ] Chat endpoints (create chat, send message, stream)
- [ ] Billing endpoints (create subscription, webhook)
- [ ] Analytics endpoints (get stats)

**Pass Criteria:**
- [ ] All endpoints return correct status codes
- [ ] Response bodies match schema
- [ ] Error handling works (4xx, 5xx)
- [ ] Authentication required on protected routes

---

#### Test 3.3: Inter-Service Communication
```bash
# Test event-driven communication (if implemented)
cd backend/tests/integration

# Test: Send message → Token usage updated in auth-service
npm test -- token-tracking.test.ts

# Expected: ✅ Token usage syncs within 5 seconds
```

**Pass Criteria:**
- [ ] Events published successfully
- [ ] Events consumed successfully
- [ ] Token usage updates in <5 seconds
- [ ] Retry logic works on failure

---

### PHASE 4: End-to-End Tests

#### Test 4.1: Critical User Flows
```bash
# Start full stack (backend + frontend)
cd backend && npm run dev:all &
cd frontend && npm run dev &

# Wait for startup
sleep 15

# Run E2E tests with Playwright
cd frontend && npm run test:e2e

# Expected: ✅ All user flows complete successfully
```

**Critical Flows:**
1. **User Registration & Login**
   - [ ] Register new user
   - [ ] Verify email sent
   - [ ] Login with credentials
   - [ ] JWT token issued
   - [ ] Refresh token works

2. **Chat Flow**
   - [ ] Create new chat
   - [ ] Send message
   - [ ] Receive AI response
   - [ ] Verify token usage tracked
   - [ ] Quota not exceeded

3. **PDF Upload & Q&A** (if implemented)
   - [ ] Upload PDF
   - [ ] Wait for processing
   - [ ] Ask question about PDF
   - [ ] Receive accurate answer

4. **Billing Flow**
   - [ ] View current plan
   - [ ] Upgrade to paid plan
   - [ ] Verify Stripe checkout
   - [ ] Confirm subscription active

---

#### Test 4.2: Frontend UI Tests
```bash
# Visual regression testing
cd frontend && npm run test:visual

# Expected: ✅ No unexpected UI changes
```

**Visual Tests:**
- [ ] Login page renders correctly
- [ ] Chat interface displays properly
- [ ] Empty states show
- [ ] Loading states work
- [ ] Error states display

---

### PHASE 5: Performance Tests

#### Test 5.1: Database Query Performance
```bash
# Run query benchmarks
cd backend/scripts && node benchmark-queries.js

# Expected: ✅ All queries meet performance targets
```

**Performance Targets:**
| Query | Target | Critical |
|-------|--------|----------|
| User quota check | <10ms | <50ms |
| Get conversations | <100ms | <500ms |
| Message history | <150ms | <500ms |
| Analytics query | <500ms | <2s |

**Pass Criteria:**
- [ ] All queries under target time
- [ ] No full table scans (check EXPLAIN ANALYZE)
- [ ] Indexes used correctly

---

#### Test 5.2: API Response Time
```bash
# Load test with 100 concurrent requests
cd backend/tests/performance
npm run load-test

# Expected: ✅ p95 < 500ms, p99 < 1s
```

**Metrics to Track:**
- [ ] p50 (median) response time
- [ ] p95 response time <500ms
- [ ] p99 response time <1s
- [ ] Error rate <0.1%
- [ ] Throughput >100 req/sec

---

#### Test 5.3: Frontend Performance
```bash
# Lighthouse audit
cd frontend
npm run build
npx serve -s dist &

npx lighthouse http://localhost:3000 \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-report.json

# Expected: ✅ Performance score >90
```

**Pass Criteria:**
- [ ] Performance score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Total bundle size <500KB

---

### PHASE 6: Reliability Tests

#### Test 6.1: Error Handling & Retry Logic
```bash
# Test OpenAI retry logic
cd backend/tests/reliability

# Simulate OpenAI rate limit
npm test -- openai-retry.test.ts

# Expected: ✅ Auto-retry 3 times with exponential backoff
```

**Scenarios:**
- [ ] 429 Rate Limit → Retry after delay
- [ ] 503 Service Unavailable → Retry with backoff
- [ ] Network timeout → Retry with longer timeout
- [ ] Circuit breaker opens after 5 failures
- [ ] Fallback to cheaper model when circuit open

---

#### Test 6.2: Connection Pool Stress Test
```bash
# Stress test database connections
cd backend/tests/reliability
npm test -- connection-pool.test.ts

# Expected: ✅ No connection exhaustion up to 200 concurrent requests
```

**Pass Criteria:**
- [ ] Handles 200 concurrent requests
- [ ] Connection acquisition <10ms
- [ ] No connection errors
- [ ] Pool utilization <80%

---

### PHASE 7: Security Tests

#### Test 7.1: Authentication & Authorization
```bash
# Test JWT validation
cd backend/tests/security
npm test -- auth.test.ts

# Expected: ✅ Unauthorized requests blocked
```

**Scenarios:**
- [ ] Invalid JWT → 401 Unauthorized
- [ ] Expired JWT → 401 Unauthorized
- [ ] Missing JWT → 401 Unauthorized
- [ ] Valid JWT → Access granted
- [ ] Refresh token works

---

#### Test 7.2: Input Validation
```bash
# Test malicious inputs
cd backend/tests/security
npm test -- validation.test.ts

# Expected: ✅ All malicious inputs rejected
```

**Attack Vectors:**
- [ ] SQL injection attempts → 400 Bad Request
- [ ] XSS payloads → Sanitized
- [ ] Large payloads (>1MB) → 413 Payload Too Large
- [ ] Invalid JSON → 400 Bad Request
- [ ] Missing required fields → 400 Bad Request

---

#### Test 7.3: Rate Limiting
```bash
# Test rate limiting per user
cd backend/tests/security
npm test -- rate-limit.test.ts

# Expected: ✅ Requests blocked after limit
```

**Pass Criteria:**
- [ ] Free tier: 100 req/min enforced
- [ ] Paid tier: 1000 req/min enforced
- [ ] 429 status returned when limited
- [ ] Rate limit resets after 1 minute

---

## 📊 TEST REPORT GENERATION

### After All Tests Complete

#### Generate Summary Report
```bash
# Compile all test results
node scripts/generate-test-report.js > TEST_REPORT.md

# Report includes:
# - Total tests run
# - Pass/fail count
# - Coverage metrics
# - Performance benchmarks
# - Failed tests with details
```

#### Test Report Template

```markdown
# TEST REPORT - [DATE] [TIME]

## Summary
- **Total Tests:** 127
- **Passed:** 120 ✅
- **Failed:** 7 ❌
- **Skipped:** 0
- **Duration:** 18m 32s

## Coverage
- **Backend:** 84.3% (target: >80%) ✅
- **Frontend:** 71.2% (target: >70%) ✅

## Performance
- **API p95:** 287ms (target: <500ms) ✅
- **Database Queries:** All <500ms ✅
- **Frontend Load Time:** 1.2s (target: <2s) ✅

## Failed Tests
1. ❌ chat-service/tests/integration/token-tracking.test.ts
   - Error: Token usage not synced
   - Expected: <5s, Actual: timeout
   - Impact: HIGH - Billing broken

2. ❌ frontend/tests/e2e/pdf-upload.test.ts
   - Error: Upload fails for files >5MB
   - Expected: 10MB limit, Actual: 5MB
   - Impact: MEDIUM - UX issue

... (5 more)

## Recommendations
1. Fix token tracking (CRITICAL)
2. Increase PDF upload limit
3. Add retry logic to...
```

---

## 🐛 BUG REPORT GENERATION

### If Tests Fail

#### Generate Bug Report
```bash
# Create bug report from failed tests
node scripts/generate-bug-report.js > BUG_REPORT.md
```

#### Bug Report Template

```markdown
# BUG REPORT - [DATE] [TIME]

## Critical Issues (MUST FIX)

### Bug 1: Token Usage Not Tracked
**Severity:** CRITICAL
**Impact:** Billing completely broken, users can exceed quota
**Test:** `chat-service/tests/integration/token-tracking.test.ts`
**Error:**
```
Expected token usage to update within 5 seconds
Actual: Timeout after 30 seconds
```

**Root Cause:**
Event not being published from chat-service to auth-service

**Files Affected:**
- `backend/services/chat-service/src/services/chat.service.ts:94-105`

**Fix Required:**
Implement event publishing as per PROMPT 1.4

---

### Bug 2: TypeScript Errors Blocking Build
**Severity:** HIGH
**Impact:** Cannot deploy to production
**Test:** `frontend/tests/static/typescript.test.ts`
**Errors:** 12 remaining (down from 38)

**Remaining Errors:**
1. `src/pages/chat/ChatPage.tsx:730` - Property 'id' missing
2. `src/shared/components/EmptyState.tsx:2` - Type import issue
... (10 more)

**Fix Required:**
Continue TypeScript error resolution (PROMPT 1.3)
```

---

## 🚀 NEXT PROMPT GENERATION

### Based on Test Results

If tests fail, I (Claude Code) will generate the next prompt for Claude Web to fix the issues:

```markdown
# NEXT PROMPT FOR CLAUDE WEB

## Priority: CRITICAL

You need to fix these issues found during testing:

### Issue 1: Token Usage Tracking Not Working
The integration test `token-tracking.test.ts` is failing. Token usage is not being synced from chat-service to auth-service.

**Test Output:**
```
❌ Expected: Token usage updated within 5s
❌ Actual: Timeout after 30s
```

**Your Task:**
1. Verify EventPublisher is being called in `chat.service.ts:94-105`
2. Verify EventConsumer is listening in auth-service
3. Check Redis pub/sub is working
4. Add debug logging to track event flow
5. Fix the bug
6. Re-run test to confirm

**Success Criteria:**
- `npm test -- token-tracking.test.ts` passes
- Token usage updates <5 seconds

---

### Issue 2: Upload Size Limit Incorrect
PDF upload fails for files >5MB, but should accept up to 10MB.

**Your Task:**
1. Check Multer configuration in `document.controller.ts`
2. Verify nginx/gateway upload limits
3. Update limits to 10MB
4. Test with 9MB file

**Success Criteria:**
- 10MB PDF uploads successfully
- `npm run test:e2e -- pdf-upload.test.ts` passes

---

Please fix these issues and push to the branch. I'll pull and test again.
```

---

## ✅ FINAL CHECKLIST

### Before Approving Code

- [ ] All static analysis passes (TypeScript, linting, security)
- [ ] All unit tests pass (coverage >80%)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance targets met
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Migration scripts tested
- [ ] Rollback plan documented

### If All Tests Pass

```markdown
# ✅ ALL TESTS PASSED!

**Ready for:** Next task in roadmap

**Summary:**
- Total tests: 127 ✅
- Coverage: 84.3% ✅
- Performance: All targets met ✅
- Security: No vulnerabilities ✅

**Proceed with:** PROMPT [next number]
```

---

## 💡 TESTING TIPS

### Speed Up Testing
1. **Run tests in parallel** where possible
2. **Cache dependencies** (node_modules)
3. **Use Docker** for consistent environment
4. **Skip slow tests** during development (run before commit)

### Debug Failed Tests
1. **Run individual test:** `npm test -- path/to/test.ts`
2. **Add debug logging:** `DEBUG=* npm test`
3. **Use test.only:** Focus on single test
4. **Check test timeout:** Increase if needed

### Maintain Test Quality
1. **Keep tests fast** (<5 min total)
2. **Make tests deterministic** (no random failures)
3. **Clean up after tests** (database, files, etc.)
4. **Document test scenarios** (what each test does)

---

**Ready to start testing!** After each Claude Web push, I'll run this entire checklist and report back with results or next prompts.

# Post-Deploy Smoke Test Checklist

Complete smoke test checklist for Beta Production deployment verification.

**Execute Time**: Immediately after deployment
**Required By**: CTO (Go/No-Go decision)
**Time Estimate**: 20-30 minutes
**Test Environment**: Production Beta

---

## Pre-Test Setup

```bash
# Set environment
export API_URL="https://your-production-url.com"
export TEST_EMAIL="test-deploy-$(date +%s)@example.com"
export TEST_PASSWORD="TestPassword123!"

# Verify API is reachable
curl -f $API_URL/api/health || echo "FAILED: API not reachable"
```

---

## Test 1: Authentication Flow

**Goal**: Verify complete auth lifecycle works end-to-end

### 1.1 Sign Up

```bash
# Create new account
curl -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User Deploy\"
  }"
```

**Expected Response**:
```json
{
  "code": "EMAIL_SENT",
  "message": "Verification email sent. Please check your inbox."
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- Response contains `"code": "EMAIL_SENT"`
- If `REQUIRE_EMAIL_VERIFICATION=false`, should get `"code": "SIGNUP_SUCCESS"` with session token

**❌ FAIL Criteria**:
- HTTP 500 (database error)
- HTTP 400 with validation errors
- No response after 5 seconds

**Screenshot/Log**: Save response to `test-results/1.1-signup.json`

---

### 1.2 Email Verification

**Manual Step** (if `REQUIRE_EMAIL_VERIFICATION=true`):

1. Check email inbox or check database:
```sql
-- Get verification token from database
SELECT email, verificationToken, tokenExpiry
FROM "User"
WHERE email = '<TEST_EMAIL>';
```

2. Verify email:
```bash
# Replace TOKEN with actual verification token
export VERIFICATION_TOKEN="<token-from-email-or-db>"

curl -X POST "$API_URL/api/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$VERIFICATION_TOKEN\"
  }"
```

**Expected Response**:
```json
{
  "code": "VERIFIED",
  "message": "Email verified successfully"
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- User's `isEmailVerified` = true in database

**❌ FAIL Criteria**:
- Token expired error
- Token not found error
- Email service not sending (check SMTP logs)

---

### 1.3 Sign In

```bash
curl -X POST "$API_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }"
```

**Expected Response**:
```json
{
  "code": "SIGNIN_SUCCESS",
  "message": "Signed in successfully",
  "user": {
    "id": "...",
    "email": "test-deploy-...",
    "name": "Test User Deploy",
    "tier": "FREE"
  }
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- Response includes user object with correct email
- Cookie `session` is set (check cookies.txt)
- Cookie has `HttpOnly; Secure; SameSite=Lax` attributes

**❌ FAIL Criteria**:
- HTTP 401 (credential mismatch)
- No session cookie set
- Cookie missing security attributes

---

### 1.4 Token Refresh

```bash
# Use session cookie from signin
curl -X POST "$API_URL/api/auth/refresh" \
  -b cookies.txt \
  -c cookies-new.txt
```

**Expected Response**:
```json
{
  "code": "REFRESH_SUCCESS",
  "message": "Session refreshed successfully"
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- New session cookie issued in cookies-new.txt
- Old session still works (grace period)

**❌ FAIL Criteria**:
- HTTP 401 (session invalid)
- No new cookie issued

---

### 1.5 Get Current User

```bash
curl -X GET "$API_URL/api/me" \
  -b cookies.txt
```

**Expected Response**:
```json
{
  "id": "...",
  "email": "test-deploy-...",
  "name": "Test User Deploy",
  "tier": "FREE",
  "usage": {
    "messagesUsed": 0,
    "messagesLimit": 100
  }
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- User data returned correctly
- Usage limits match tier configuration

---

## Test 2: Chat Flow (SSE Streaming)

**Goal**: Verify chat conversation creation and SSE streaming works

### 2.1 Create Conversation

```bash
curl -X POST "$API_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"title\": \"Deploy Test Conversation\"
  }" | jq -r '.id' > conversation-id.txt

export CONVERSATION_ID=$(cat conversation-id.txt)
echo "Conversation ID: $CONVERSATION_ID"
```

**Expected Response**:
```json
{
  "id": "conv_xxx",
  "title": "Deploy Test Conversation",
  "createdAt": "2025-10-09T..."
}
```

**✅ PASS Criteria**:
- HTTP 201 status
- Returns valid conversation ID

---

### 2.2 Send Message (SSE Stream)

```bash
# Test SSE streaming
curl -N -X POST "$API_URL/api/chat/stream" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"conversationId\": \"$CONVERSATION_ID\",
    \"message\": \"Hello, this is a deployment test. Reply with OK.\",
    \"model\": \"gpt-4o-mini\"
  }"
```

**Expected Response** (SSE stream):
```
data: {"type":"start","conversationId":"conv_xxx"}

data: {"type":"token","content":"OK"}

data: {"type":"token","content":"."}

data: {"type":"done","usage":{"promptTokens":15,"completionTokens":2,"totalCost":0.00001}}
```

**✅ PASS Criteria**:
- SSE stream starts (receives `data:` lines)
- First event is `type: "start"`
- Multiple `type: "token"` events received
- Final event is `type: "done"` with usage stats
- Stream closes cleanly (no hanging connection)

**❌ FAIL Criteria**:
- HTTP 500 error (AI provider failure)
- Stream hangs without closing
- No tokens received after 30 seconds
- Usage quota exceeded error (check user limits)

---

### 2.3 Verify Message Saved

```bash
curl -X GET "$API_URL/api/conversations/$CONVERSATION_ID" \
  -b cookies.txt \
  | jq '.messages | length'
```

**Expected**: Returns `2` (user message + AI response)

**✅ PASS Criteria**:
- Conversation contains exactly 2 messages
- Messages have correct roles (user, assistant)
- AI response content matches streamed tokens

---

## Test 3: Payment Flow (Sandbox)

**Goal**: Verify payment creation and webhook processing

### 3.1 Create Payment

```bash
curl -X POST "$API_URL/api/payment/create" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"tier\": \"PREMIUM\",
    \"amount\": 99000,
    \"returnUrl\": \"$API_URL/payment/success\",
    \"cancelUrl\": \"$API_URL/payment/cancel\"
  }"
```

**Expected Response**:
```json
{
  "checkoutUrl": "https://pay.payos.vn/...",
  "orderId": "ORD-...",
  "qrCode": "data:image/png;base64,..."
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- Returns valid checkoutUrl (PayOS sandbox)
- Order created in database with status `PENDING`

**❌ FAIL Criteria**:
- HTTP 500 (PayOS API error)
- Missing PAYOS credentials error
- Database connection error

---

### 3.2 Simulate Webhook (Manual)

**Manual Step**: Use PayOS sandbox to complete payment OR simulate webhook:

```bash
# Get webhook signature (check PayOS docs for signature generation)
# This is a manual step - requires PayOS test account

curl -X POST "$API_URL/api/webhook/payos" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"00\",
    \"desc\": \"success\",
    \"data\": {
      \"orderCode\": \"<ORDER_ID>\",
      \"amount\": 99000,
      \"description\": \"PREMIUM plan payment\",
      \"accountNumber\": \"12345678\",
      \"reference\": \"FT123456789\",
      \"transactionDateTime\": \"2025-10-09 10:00:00\"
    },
    \"signature\": \"<VALID_SIGNATURE>\"
  }"
```

**Expected Response**:
```json
{
  "error": 0,
  "message": "Webhook processed successfully"
}
```

---

### 3.3 Verify Plan Upgrade

```bash
curl -X GET "$API_URL/api/me" \
  -b cookies.txt \
  | jq '.tier'
```

**Expected**: Returns `"PREMIUM"`

**✅ PASS Criteria**:
- User tier upgraded to `PREMIUM`
- Payment status updated to `COMPLETED`
- Usage limits updated (500 messages/month for PREMIUM)

**❌ FAIL Criteria**:
- Tier still `FREE` after webhook
- Payment status stuck in `PENDING`

---

## Test 4: Feature Tests

### 4.1 Projects Filter

```bash
# Create project
curl -X POST "$API_URL/api/projects" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"name\": \"Deploy Test Project\",
    \"description\": \"Testing projects feature\"
  }" | jq -r '.id' > project-id.txt

export PROJECT_ID=$(cat project-id.txt)

# Create conversation in project
curl -X POST "$API_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"title\": \"Project Conversation\",
    \"projectId\": \"$PROJECT_ID\"
  }"

# Filter conversations by project
curl -X GET "$API_URL/api/conversations?projectId=$PROJECT_ID" \
  -b cookies.txt \
  | jq '. | length'
```

**Expected**: Returns `1` (the conversation just created)

**✅ PASS Criteria**:
- Project created successfully
- Conversation linked to project
- Filter returns only conversations in that project

---

### 4.2 Settings Update

```bash
curl -X PATCH "$API_URL/api/user/update" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"name\": \"Updated Test User\",
    \"preferences\": {
      \"theme\": \"dark\",
      \"language\": \"vi\"
    }
  }"
```

**Expected Response**:
```json
{
  "code": "UPDATE_SUCCESS",
  "user": {
    "name": "Updated Test User",
    "preferences": {
      "theme": "dark",
      "language": "vi"
    }
  }
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- User name updated
- Preferences saved correctly

---

### 4.3 File Upload Preview (if implemented)

**Manual Test**: Upload a file via UI or API

```bash
# Upload test file
curl -X POST "$API_URL/api/upload" \
  -b cookies.txt \
  -F "file=@test-file.pdf" \
  -F "conversationId=$CONVERSATION_ID"
```

**✅ PASS Criteria**:
- File uploaded successfully
- Preview generated (if PDF/image)
- File associated with conversation

---

### 4.4 Batch Export

**Manual Test**: Export conversations

```bash
curl -X POST "$API_URL/api/conversations/export" \
  -b cookies.txt \
  -d "{
    \"conversationIds\": [\"$CONVERSATION_ID\"],
    \"format\": \"pdf\"
  }" \
  -o export-test.pdf

# Verify PDF is valid
file export-test.pdf
```

**✅ PASS Criteria**:
- Export completes without error
- File is valid PDF format
- Contains conversation messages

---

## Test 5: Rate Limiting

**Goal**: Verify rate limits are enforced

```bash
# Send 101 requests in quick succession (limit is 100/min)
for i in {1..101}; do
  curl -X GET "$API_URL/api/health" \
    -w "\nStatus: %{http_code}\n" \
    -o /dev/null -s
done | grep "Status: 429" | wc -l
```

**Expected**: Last few requests should return HTTP 429

**✅ PASS Criteria**:
- First ~100 requests return HTTP 200
- Request 101+ returns HTTP 429 with message:
  ```json
  {
    "error": "Too many requests",
    "retryAfter": 60
  }
  ```
- Rate limit headers present:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: <timestamp>
  ```

**❌ FAIL Criteria**:
- All 101 requests succeed (rate limiting not working)
- No rate limit headers in response

---

## Test 6: CSRF Protection

**Goal**: Verify CSRF protection is active

### 6.1 POST without CSRF Token

```bash
# Try to create conversation without proper CSRF token
curl -X POST "$API_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicious-site.com" \
  -b cookies.txt \
  -d "{
    \"title\": \"Malicious Request\"
  }" \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response**:
```json
{
  "error": "CSRF token validation failed"
}
```

**✅ PASS Criteria**:
- HTTP 403 Forbidden
- Request rejected with CSRF error
- No conversation created

**❌ FAIL Criteria**:
- HTTP 200 (CSRF bypass!)
- Conversation created successfully

---

### 6.2 Valid CSRF Flow

```bash
# Get CSRF token from page/cookie
curl -X GET "$API_URL/api/csrf" \
  -b cookies.txt \
  | jq -r '.token' > csrf-token.txt

export CSRF_TOKEN=$(cat csrf-token.txt)

# Use CSRF token in request
curl -X POST "$API_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d "{
    \"title\": \"Valid CSRF Request\"
  }"
```

**✅ PASS Criteria**:
- HTTP 201 status
- Conversation created successfully
- CSRF token validated

---

## Test 7: Monitoring & Metrics

### 7.1 Health Check

```bash
curl -X GET "$API_URL/api/health"
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T...",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

**✅ PASS Criteria**:
- HTTP 200 status
- All services report "connected"

---

### 7.2 Metrics Endpoints

```bash
# Provider metrics
curl -X GET "$API_URL/api/metrics/providers" \
  -b cookies.txt

# Usage metrics
curl -X GET "$API_URL/api/metrics/usage" \
  -b cookies.txt

# System metrics
curl -X GET "$API_URL/api/metrics/system" \
  -b cookies.txt
```

**✅ PASS Criteria**:
- All endpoints return HTTP 200
- Response contains valid metric data
- No authentication errors (if protected by admin role)

---

### 7.3 Sentry Error Tracking

```bash
# Trigger test error
curl -X GET "$API_URL/api/debug/sentry-test" \
  -b cookies.txt
```

**Manual Verification**:
1. Login to Sentry dashboard: https://sentry.io
2. Check project: `ai-saas-platform`
3. Verify test error appears within 1 minute
4. Check error details:
   - Environment: `production`
   - User context attached
   - Breadcrumbs captured
   - Stack trace complete

**✅ PASS Criteria**:
- Error appears in Sentry within 1 minute
- All context data captured correctly
- No PII leaked in error logs

**❌ FAIL Criteria**:
- Error not appearing in Sentry (DSN misconfigured)
- Missing user context
- Sentry SDK not initialized

---

## Test 8: Security Headers (Bonus)

```bash
curl -I "$API_URL/api/health"
```

**Expected Headers**:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
```

**✅ PASS Criteria**:
- All security headers present
- CSP policy configured correctly
- HSTS enabled

---

## Go/No-Go Decision Matrix

| Test | Critical | Status | Notes |
|------|----------|--------|-------|
| 1. Auth Flow | ✅ YES | ⬜ PASS / ⬜ FAIL | Signup → Verify → Signin → Refresh |
| 2. Chat Flow | ✅ YES | ⬜ PASS / ⬜ FAIL | SSE streaming works |
| 3. Payment | ⚠️ MEDIUM | ⬜ PASS / ⬜ FAIL | Can defer if sandbox issues |
| 4. Features | ⚠️ MEDIUM | ⬜ PASS / ⬜ FAIL | Projects, settings, export |
| 5. Rate Limit | ✅ YES | ⬜ PASS / ⬜ FAIL | MUST enforce limits |
| 6. CSRF | ✅ YES | ⬜ PASS / ⬜ FAIL | MUST block invalid origins |
| 7. Monitoring | ✅ YES | ⬜ PASS / ⬜ FAIL | Metrics + Sentry working |
| 8. Security Headers | ⚠️ MEDIUM | ⬜ PASS / ⬜ FAIL | Best practice |

**GO Criteria**:
- ALL critical tests (marked ✅ YES) PASS
- At least 2/3 medium priority tests PASS
- No security vulnerabilities found

**NO-GO Criteria**:
- ANY critical test FAILS
- Security headers missing (HSTS, CSP)
- Sentry not receiving errors

---

## Rollback Triggers

If any of these occur during testing, **ROLLBACK IMMEDIATELY**:

1. **Auth Flow Broken**: Users cannot sign in (locks out all users)
2. **Database Migration Failed**: Schema mismatch errors, data corruption
3. **Payment Webhook Not Working**: Money received but tier not upgraded (revenue loss)
4. **CSRF Disabled**: Security vulnerability exposed
5. **Memory Leak Detected**: Server memory usage > 90% after 10 minutes
6. **Error Rate > 5%**: More than 5% of requests returning HTTP 500

**Rollback Procedure**: See `docs/ROLLBACK.md`

---

## Test Results Template

```markdown
# Smoke Test Results - v1.0.0-beta

**Date**: 2025-10-09
**Tester**: [Your Name]
**Environment**: Production Beta
**Deployment ID**: [Git SHA / Docker Tag]

## Summary

- Total Tests: 8
- Passed: X
- Failed: X
- Warnings: X

## Detailed Results

### Test 1: Auth Flow - ✅ PASS / ❌ FAIL
- Signup: ✅
- Email Verification: ✅
- Sign In: ✅
- Token Refresh: ✅
- Notes: [Any observations]

[Screenshot: test-results/auth-flow.png]

### Test 2: Chat Flow - ✅ PASS / ❌ FAIL
[Details...]

[Continue for all tests...]

## Issues Found

1. **[Critical/Warning]**: Description
   - Impact: ...
   - Workaround: ...
   - Resolution: ...

## Go/No-Go Decision

**Decision**: ✅ GO / ❌ NO-GO

**Rationale**: [Why this decision was made]

**Signed Off By**:
- CTO: ____________
- Lead Dev: ____________
- Date: ____________
```

---

**Last Updated**: 2025-10-09

# Debug Guide: 400 Bad Request Error

## Problem
Getting 400 Bad Request errors when loading messages from conversation history on production, but it works fine on localhost.

**Error Pattern:**
```
GET /api/conversations/{id}/messages?limit=100 400 (Bad Request)
[Messages] Load error: Error: Failed to load messages
```

## Root Cause Analysis

The 400 error on production (but not localhost) suggests one of these issues:

### 1. **Authentication/Session Issues** (Most Likely)
- Session cookie not being sent properly
- Session expired or invalid on production
- Cookie domain/path mismatch
- CORS or SameSite cookie issues

### 2. **Environment Differences**
- Different `AUTH_SECRET` between local and production
- Missing environment variables
- Database connection issues
- Different Next.js runtime (edge vs nodejs)

### 3. **Request Validation**
- Middleware blocking the request
- Rate limiting triggered
- CSRF token validation
- Invalid conversation ID format

## Debugging Steps

### Step 1: Test API Directly in Browser

1. **Visit debug page:**
   ```
   https://your-domain.com/debug-api
   ```

2. **Click "Check Auth"** to verify you're authenticated
   - If this fails, your session is invalid → logout and login again

3. **Enter a conversation ID** and click "Test Messages API"
   - This will show the exact error response

4. **Check browser console (F12)** for detailed logs

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Find the failed request to `/api/conversations/*/messages`
3. Check:
   - **Request Headers:** Is the `Cookie: session=...` header present?
   - **Response Headers:** Any error messages?
   - **Response Body:** What's the actual error message?
   - **Status Code:** Exactly 400? Or something else?

### Step 3: Check Azure Logs

```bash
# Install Azure CLI if you haven't
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Stream real-time logs
az webapp log tail \
  --name firbox-api \
  --resource-group firai-rg

# Or download logs
az webapp log download \
  --name firbox-api \
  --resource-group firai-rg \
  --log-file azure-logs.zip
```

Look for log entries with:
- `[requestId]` markers (from our enhanced logging)
- Error messages with stack traces
- Authentication failures
- Database connection errors

### Step 4: Test with curl

```bash
# Get your session token from browser
# DevTools → Application → Cookies → session

SESSION_TOKEN="your-session-token-here"
CONVERSATION_ID="cmgxax24g001anyv9bxq26td6"

# Test the API
curl -i \
  -H "Cookie: session=$SESSION_TOKEN" \
  "https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/conversations/$CONVERSATION_ID/messages?limit=100"
```

This will show:
- Exact HTTP status code
- Response headers
- Response body (error message)

### Step 5: Run Debug Script Locally

```bash
# Set your production session token
export TEST_SESSION_TOKEN="your-token-here"
export NEXT_PUBLIC_API_URL="https://your-production-domain.com"

# Run the debug script
npx tsx scripts/debug-messages-api.ts
```

## Common Fixes

### Fix 1: Session Cookie Issues

**If cookies aren't being sent:**

Check `next.config.js` - ensure cookies are allowed:
```js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
      ],
    },
  ]
}
```

**If session is invalid on production:**

1. Logout and login again
2. Check if `AUTH_SECRET` is set correctly on Azure
3. Verify session cookie is not expired (7 days default)

### Fix 2: Middleware Blocking Requests

Currently, your middleware bypasses API routes for debugging:
```typescript
if (pathname.startsWith('/api/')) {
    logger.info({ pathname, method }, '[DEBUG] Bypassing API middleware')
    const apiResponse = NextResponse.next()
    return applySecurityHeaders(apiResponse)
}
```

If you re-enable middleware, make sure:
- Rate limiting isn't too strict
- CSRF tokens are handled correctly
- Auth checks don't reject valid sessions

### Fix 3: Database/Prisma Issues

Check if Prisma can connect:
```bash
# SSH into Azure container (if possible)
# Or check logs for Prisma connection errors

# Look for:
# - "Can't reach database server"
# - "Connection timeout"
# - "Invalid connection string"
```

### Fix 4: Environment Variables

Verify all required env vars are set on Azure:
```bash
az webapp config appsettings list \
  --name firbox-api \
  --resource-group firai-rg
```

Required variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_COOKIE_NAME`
- `NODE_ENV=production`

## Enhanced Logging

The API now includes detailed logging with:
- Unique request IDs
- Timing information
- Authentication status
- Database query details
- Full error stack traces

Each log line includes `[requestId]` to track a specific request through the system.

## Prevention

### 1. Add Health Checks
```typescript
// Check before making API calls
const health = await fetch('/api/health')
if (!health.ok) {
  // Show maintenance message
}
```

### 2. Better Error Handling
```typescript
try {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    console.error('API Error:', error)
    // Show user-friendly message based on error.code
  }
} catch (error) {
  // Network error
}
```

### 3. Add Retry Logic
```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
      if (response.status >= 500) {
        // Retry on server errors
        await sleep(1000 * (i + 1))
        continue
      }
      // Don't retry on 4xx errors
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(1000 * (i + 1))
    }
  }
}
```

## Next Steps

1. ✅ Deploy the enhanced logging
2. ✅ Visit `/debug-api` page on production
3. ✅ Check Azure logs for detailed error messages
4. ✅ Test with curl to see exact error response
5. ✅ Fix the root cause based on findings
6. ✅ Add monitoring/alerting to catch future issues

## Contact

If the issue persists after following this guide:
1. Capture the full error response from `/debug-api`
2. Download Azure logs
3. Share both with the team for analysis

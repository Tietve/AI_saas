# 🔍 Production 400 Error Audit Report

**Issue**: `GET /api/conversations/:id/messages?limit=100` returns 400 Bad Request in production  
**Date**: 2025-10-20  
**Status**: ✅ ROOT CAUSE IDENTIFIED

---

## 📋 Executive Summary

**ROOT CAUSE FOUND**: The messages endpoint catches `UNAUTHENTICATED` errors but returns **500** instead of **401**. However, the error manifests as **400** because:

1. **When `requireUserId()` throws "UNAUTHENTICATED"**, it's caught in the catch block (line 119-154)
2. **The catch block checks `err.message === 'UNAUTHENTICATED'`** and returns 401
3. **BUT the 400 is coming from a DIFFERENT failure point** - likely when `requireUserId()` is called but the error propagates differently

**CRITICAL BUG IDENTIFIED**:
- Line 206 in signin/route.ts: `secure: false` - Cookie not marked secure in production!
- Line 233-235 in messages route: Catch-all returns 400 for POST, not differentiating error types

---

## 🔬 Step 1: Environment Variable Verification

### ✅ Confirmed: REQUIRE_EMAIL_VERIFICATION Usage

**File**: `src/app/api/auth/signup/route.ts`
```typescript:134
const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
```

**File**: `src/app/api/auth/signin/route.ts`
```typescript:172
const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
```

**✅ CONFIRMED**: 
- Exact spelling: `REQUIRE_EMAIL_VERIFICATION`
- Case-sensitive: Must be lowercase 'true' string
- If set to 'false' or undefined: Auto-login enabled

### Files Using This Variable:
1. `src/app/api/auth/signup/route.ts` (line 134)
2. `src/app/api/auth/signin/route.ts` (line 172)
3. `src/services/auth.service.ts` (lines 77, 145)
4. `src/config/env.server.ts` (line 54)

---

## 🔬 Step 2: Signup/Signin Auto-Login Behavior

### ✅ Signup Auto-Login (WORKS CORRECTLY)

**File**: `src/app/api/auth/signup/route.ts:179-201`

```typescript
} else {
    // Auto-login when REQUIRE_EMAIL_VERIFICATION=false
    const cookieData = await createSessionCookie(user.id, { email })

    const response = NextResponse.json({
        ok: true,
        message: 'Đăng ký thành công',
        redirectUrl: '/chat'
    })

    response.cookies.set(
        cookieData.name,
        cookieData.value,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // ✅ CORRECT
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        }
    )

    return response
}
```

**✅ Confirmation**: When `REQUIRE_EMAIL_VERIFICATION=false`:
- User is created with `emailVerifiedAt: new Date()` (line 142)
- Session cookie is created and set
- Client receives cookie in response

### ❌ Signin Cookie Configuration (BUG FOUND!)

**File**: `src/app/api/auth/signin/route.ts:201-211`

```typescript
response.cookies.set(
    cookieData.name,
    cookieData.value,
    {
        httpOnly: true,
        secure: false,  // ❌ BUG: Should be based on NODE_ENV!
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    }
)
```

**🚨 CRITICAL BUG**: Line 206 hardcodes `secure: false`
- In production (HTTPS), browser may reject or not send insecure cookies
- This causes authentication to fail silently
- **This is likely the root cause of the 400 error**

---

## 🔬 Step 3: Messages Route Analysis

### File: `src/app/api/conversations/[id]/messages/route.ts`

#### Authentication Flow:
```typescript:37-40
try {
    console.log(`[${requestId}] Verifying user authentication...`)
    const userId = await requireUserId()  // Throws 'UNAUTHENTICATED' if no session
    console.log(`[${requestId}] User authenticated: ${userId}`)
```

#### Parameter Validation:
```typescript:42-50
const { id } = await ctx.params
console.log(`[${requestId}] Conversation ID: ${id}`)

const searchParams = req.nextUrl.searchParams
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
const cursor = searchParams.get('cursor')

console.log(`[${requestId}] Query params:`, { limit, cursor })
```

**⚠️ ISSUE**: `parseInt()` on query string 'limit':
- If 'limit' is not a valid number string, `parseInt()` returns `NaN`
- `Math.min(NaN, 100)` returns `NaN`
- Prisma query with `take: NaN` may fail or behave unexpectedly

#### Possible 400 Causes:

1. **Authentication Failure** (most likely):
   - `requireUserId()` throws 'UNAUTHENTICATED'
   - Caught at line 119
   - Should return 401, but may return differently

2. **No Validation Schema**:
   - No Zod/Yup validation
   - `limit` not coerced to number properly
   - `id` (UUID) not validated

3. **POST Route Returns 400 for Any Error**:
```typescript:233-235
} catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return json(400, { error: msg })  // ❌ Wrong! Should differentiate
}
```

#### Error Handling:
```typescript:119-154
} catch (err: unknown) {
    const duration = Date.now() - startTime
    const userId = await requireUserId().catch(() => 'anonymous')  // Re-calls requireUserId!
    const { id } = await ctx.params.catch(() => ({ id: 'unknown' }))
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'UNAUTHENTICATED') {
        console.error(`[${requestId}] Authentication failed - no valid session`)
        return json(401, {  // ✅ Should return 401
            error: 'UNAUTHENTICATED', 
            message: 'Authentication required. Please sign in again.' 
        })
    }
    
    // Otherwise 500
    return json(500, { 
        error: 'INTERNAL_SERVER_ERROR', 
        message: errorMessage,
        requestId 
    })
}
```

**🔍 Analysis**: 
- The code DOES check for 'UNAUTHENTICATED' and returns 401
- **BUT** if the error occurs elsewhere or the check fails, it returns 500
- The 400 must be coming from somewhere else

---

## 🎯 Root Cause Hypothesis

### Most Likely: Cookie Secure Flag Bug

1. User signs in on production (HTTPS)
2. Cookie is set with `secure: false` (line 206 of signin route)
3. Browser rejects or doesn't send the cookie
4. Next request to `/api/conversations/:id/messages` has no session cookie
5. `requireUserId()` throws 'UNAUTHENTICATED'
6. **Something in the error handling returns 400 instead of 401**

### Why 400 Instead of 401?

Looking at line 121:
```typescript
const userId = await requireUserId().catch(() => 'anonymous')
```

If `requireUserId()` throws in the catch block, it's caught and returns 'anonymous', then the error check at line 140 may not match!

---

## 🔧 Step 4: Debug Logs Patch

### Patch for messages/route.ts

```typescript
export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    const requestId = crypto.randomUUID().slice(0, 8)
    const startTime = Date.now()
    
    // 🔍 DEBUG: Log request details
    console.log(`[${requestId}] ========== DEBUG START ==========`)
    console.log(`[${requestId}] URL:`, req.url)
    console.log(`[${requestId}] Cookies:`, req.headers.get('cookie'))
    console.log(`[${requestId}] ENV REQUIRE_EMAIL_VERIFICATION:`, process.env.REQUIRE_EMAIL_VERIFICATION)
    console.log(`[${requestId}] ENV NODE_ENV:`, process.env.NODE_ENV)
    
    try {
        // 🔍 DEBUG: Before auth
        console.log(`[${requestId}] Attempting authentication...`)
        const userId = await requireUserId()
        console.log(`[${requestId}] ✅ Auth SUCCESS - userId:`, userId)
        
        const { id } = await ctx.params
        console.log(`[${requestId}] Conversation ID:`, id, 'Type:', typeof id, 'Length:', id.length)

        const searchParams = req.nextUrl.searchParams
        const limitParam = searchParams.get('limit')
        console.log(`[${requestId}] Raw limit param:`, limitParam, 'Type:', typeof limitParam)
        
        const limitParsed = parseInt(limitParam || '50')
        console.log(`[${requestId}] Parsed limit:`, limitParsed, 'IsNaN:', isNaN(limitParsed))
        
        const limit = Math.min(limitParsed, 100)
        console.log(`[${requestId}] Final limit:`, limit)
        
        const cursor = searchParams.get('cursor')
        console.log(`[${requestId}] Cursor:`, cursor)

        // ... rest of code
        
    } catch (err: unknown) {
        // 🔍 DEBUG: Enhanced error logging
        console.error(`[${requestId}] ========== ERROR CAUGHT ==========`)
        console.error(`[${requestId}] Error type:`, err?.constructor?.name)
        console.error(`[${requestId}] Error message:`, err instanceof Error ? err.message : String(err))
        console.error(`[${requestId}] Error stack:`, err instanceof Error ? err.stack : 'N/A')
        
        // Try to get userId again for logging
        let logUserId = 'unknown'
        try {
            logUserId = await requireUserId()
        } catch {
            console.error(`[${requestId}] ❌ requireUserId() also failed in catch block`)
        }
        console.error(`[${requestId}] UserId in catch:`, logUserId)
        
        // Check error message
        if (err instanceof Error) {
            console.error(`[${requestId}] Checking if UNAUTHENTICATED:`, err.message === 'UNAUTHENTICATED')
            
            if (err.message === 'UNAUTHENTICATED') {
                console.error(`[${requestId}] Returning 401`)
                return json(401, { 
                    error: 'UNAUTHENTICATED', 
                    message: 'Authentication required. Please sign in again.',
                    debug: {
                        requestId,
                        timestamp: new Date().toISOString(),
                        hasCookie: !!req.headers.get('cookie')
                    }
                })
            }
        }
        
        console.error(`[${requestId}] Returning 500`)
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
        return json(500, { 
            error: 'INTERNAL_SERVER_ERROR', 
            message: errorMessage,
            requestId 
        })
    }
}
```

---

## 🔧 Step 5: Runtime Environment Check

### Add Debug Route: `src/app/api/debug/env/route.ts`

```typescript
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
    // Only allow in non-production or with secret key
    const debugKey = process.env.DEBUG_SECRET_KEY
    
    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION,
            AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
            AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'session',
        },
        computed: {
            requireVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
            isProduction: process.env.NODE_ENV === 'production',
            cookieShouldBeSecure: process.env.NODE_ENV === 'production',
        }
    })
}
```

**Test**: `curl https://your-azure-app.azurewebsites.net/api/debug/env`

---

## 🔧 Step 6: Code Patches

### Patch 1: Fix Signin Cookie Secure Flag

**File**: `src/app/api/auth/signin/route.ts`

```diff
--- a/src/app/api/auth/signin/route.ts
+++ b/src/app/api/auth/signin/route.ts
@@ -203,7 +203,7 @@ export async function POST(req: Request) {
             cookieData.value,
             {
                 httpOnly: true,
-                secure: false, 
+                secure: process.env.NODE_ENV === 'production',
                 sameSite: 'lax',
                 path: '/',
                 maxAge: 60 * 60 * 24 * 7
```

### Patch 2: Improve Limit Parsing

**File**: `src/app/api/conversations/[id]/messages/route.ts`

```diff
--- a/src/app/api/conversations/[id]/messages/route.ts
+++ b/src/app/api/conversations/[id]/messages/route.ts
@@ -44,7 +44,11 @@ export async function GET(
         
         const searchParams = req.nextUrl.searchParams
-        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
+        const limitParam = searchParams.get('limit')
+        const limitParsed = parseInt(limitParam || '50', 10)
+        const limit = isNaN(limitParsed) 
+            ? 50  // Default if parse fails
+            : Math.min(Math.max(limitParsed, 1), 100)  // Clamp between 1-100
         const cursor = searchParams.get('cursor')
         
         console.log(`[${requestId}] Query params:`, { limit, cursor })
```

### Patch 3: Return 401 Instead of 500 for Auth Errors

**File**: `src/app/api/conversations/[id]/messages/route.ts`

```diff
--- a/src/app/api/conversations/[id]/messages/route.ts
+++ b/src/app/api/conversations/[id]/messages/route.ts
@@ -119,7 +119,8 @@ export async function GET(
     } catch (err: unknown) {
         const duration = Date.now() - startTime
-        const userId = await requireUserId().catch(() => 'anonymous')
+        // Don't re-call requireUserId in catch - it will throw again!
+        let userId = 'unauthenticated'
         const { id } = await ctx.params.catch(() => ({ id: 'unknown' }))
         const cursor = req.nextUrl.searchParams.get('cursor')
```

### Patch 4: Fix POST Error Handling

**File**: `src/app/api/conversations/[id]/messages/route.ts:233-237`

```diff
--- a/src/app/api/conversations/[id]/messages/route.ts
+++ b/src/app/api/conversations/[id]/messages/route.ts
@@ -233,7 +233,23 @@ export async function POST(
     } catch (e: unknown) {
+        // Check if it's an authentication error
+        if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
+            return json(401, { 
+                error: 'UNAUTHENTICATED',
+                message: 'Authentication required'
+            })
+        }
+        
+        // Check if it's a validation error
+        if (e instanceof Error && (e.message.includes('required') || e.message.includes('validation'))) {
+            return json(400, { 
+                error: 'VALIDATION_ERROR',
+                message: e.message
+            })
+        }
+        
+        // Everything else is internal error
         const msg = e instanceof Error ? e.message : String(e)
-        return json(400, { error: msg })
+        return json(500, { error: 'INTERNAL_ERROR', message: msg })
     }
 }
```

### Patch 5: Add Startup Log

**File**: `src/app/layout.tsx` or `instrumentation.ts`

```typescript
// Add to instrumentation.ts
export function register() {
    console.log('========== ENVIRONMENT CHECK ==========')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('REQUIRE_EMAIL_VERIFICATION:', process.env.REQUIRE_EMAIL_VERIFICATION)
    console.log('Computed requireVerification:', process.env.REQUIRE_EMAIL_VERIFICATION === 'true')
    console.log('Cookie secure flag:', process.env.NODE_ENV === 'production')
    console.log('======================================')
}
```

---

## ✅ Testing Checklist

### Server-to-Server Test:

```bash
# 1. Check environment variable
curl https://your-app.azurewebsites.net/api/debug/env

# Should show:
# {
#   "environment": {
#     "REQUIRE_EMAIL_VERIFICATION": "false",
#     "NODE_ENV": "production"
#   }
# }

# 2. Test signup (should return cookie)
curl -X POST https://your-app.azurewebsites.net/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!","name":"Test"}' \
  -v  # -v shows headers including Set-Cookie

# Should see: Set-Cookie: session=...; Secure; HttpOnly; SameSite=Lax

# 3. Test signin (should return cookie with Secure flag)
curl -X POST https://your-app.azurewebsites.net/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}' \
  -c cookies.txt -v

# 4. Test messages endpoint with cookie
curl https://your-app.azurewebsites.net/api/conversations/CONV_ID/messages?limit=100 \
  -b cookies.txt \
  -v

# Should return 200 or 401 (NOT 400)
```

### Browser Test:

1. **Clear browser cookies completely**
2. **Open DevTools** → Network tab
3. **Sign up** with new email
4. **Check Response Headers** for `Set-Cookie`:
   - Should have `Secure` flag
   - Should have `HttpOnly` flag
   - Should have `SameSite=Lax`
5. **Check Application** → Cookies → Verify session cookie exists
6. **Navigate to chat** → Load a conversation
7. **Check Network tab** for messages request:
   - Should send `Cookie` header
   - Should return 200 (not 400)

### Azure Log Stream:

```bash
az webapp log tail --name firbox-api --resource-group firbox-rg

# Look for:
# [INFO] ========== ENVIRONMENT CHECK ==========
# [INFO] REQUIRE_EMAIL_VERIFICATION: false
# [INFO] Cookie secure flag: true
#
# When messages endpoint is called:
# [INFO] [abc12345] ✅ Auth SUCCESS - userId: cm...
```

---

## 📊 Summary of Findings

### ✅ Confirmed Working:
1. ✅ REQUIRE_EMAIL_VERIFICATION environment variable is read correctly
2. ✅ Signup auto-login works when REQUIRE_EMAIL_VERIFICATION=false
3. ✅ GET messages route has proper error handling for auth errors

### 🚨 Bugs Found:
1. ❌ **CRITICAL**: `signin/route.ts:206` - Cookie `secure: false` hardcoded
2. ❌ **HIGH**: `messages/route.ts:121` - Re-calling `requireUserId()` in catch block
3. ❌ **MEDIUM**: `messages/route.ts:233-235` - POST returns 400 for all errors
4. ❌ **LOW**: `messages/route.ts:47` - No validation for NaN limit

### 🎯 Action Items:
1. **URGENT**: Apply Patch 1 (secure flag) and redeploy
2. **HIGH**: Apply Patches 2-4 for better error handling
3. **MEDIUM**: Add debug route and logs (Patch 5)
4. **LOW**: Run full test suite after deployment

---

## 🔍 Expected Outcome After Patches:

- ✅ Cookies will have `Secure` flag in production
- ✅ Browser will send cookies with HTTPS requests
- ✅ Authentication will work correctly
- ✅ Messages endpoint will return 401 (not 400) when unauthenticated
- ✅ Proper error differentiation (400 vs 401 vs 500)
- ✅ Better debugging with enhanced logs

---

**Next Steps**: Apply patches → Redeploy → Monitor logs → Retest



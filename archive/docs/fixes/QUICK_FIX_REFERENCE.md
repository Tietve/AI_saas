# 🚀 Quick Fix Reference Card

## 🎯 TL;DR - The Problem

**400 Bad Request** on `/api/conversations/:id/messages?limit=100` in production

**Root Cause**: Cookie `secure: false` hardcoded in signin → Browser rejects cookie → No auth → Wrong error code

## ✅ What Was Fixed

| Issue | File | Line | Fix |
|-------|------|------|-----|
| ❌ Cookie not secure | `signin/route.ts` | 206 | `secure: false` → `secure: process.env.NODE_ENV === 'production'` |
| ❌ NaN limit handling | `messages/route.ts` | 47-52 | Added isNaN check and default value |
| ❌ Double requireUserId | `messages/route.ts` | 126 | Removed re-call in catch block |
| ❌ Wrong error codes | `messages/route.ts` | 238-258 | Differentiate 401/400/500 properly |

## 🧪 Quick Test Commands

```bash
# 1. Check environment
curl https://your-app.azurewebsites.net/api/debug/env | jq .

# 2. Test signin (check for Secure flag)
curl -X POST https://your-app.azurewebsites.net/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"23001467@hus.edu.vn","password":"Thienhuu"}' \
  -v 2>&1 | grep -i "set-cookie"

# Expected: Set-Cookie: session=...; Secure; HttpOnly

# 3. Test with your credentials
$env:TEST_EMAIL="23001467@hus.edu.vn"
$env:TEST_PASSWORD="Thienhuu"
npm run test:api:user
```

## 📊 Files Changed

- ✅ `src/app/api/auth/signin/route.ts` (1 line)
- ✅ `src/app/api/conversations/[id]/messages/route.ts` (multiple improvements)
- ✅ `src/app/api/debug/env/route.ts` (new file)

## 🚀 Deploy Now

```bash
git add .
git commit -m "fix: Fix production 400 errors - cookie secure flag"
git push origin main
```

## 📋 Post-Deploy Checklist

- [ ] Check debug endpoint
- [ ] Signin and verify Secure cookie
- [ ] Test messages endpoint
- [ ] Monitor Azure logs
- [ ] Verify in browser

## 📞 If Still Broken

```bash
# Check logs
az webapp log tail --name firbox-api --resource-group firbox-rg | grep ERROR

# Verify env var
az webapp config appsettings list --name firbox-api \
  --resource-group firbox-rg | grep REQUIRE_EMAIL_VERIFICATION
```

---

**Status**: ✅ Ready to deploy  
**Risk**: Low (only fixing bugs)  
**Impact**: HIGH (fixes authentication)


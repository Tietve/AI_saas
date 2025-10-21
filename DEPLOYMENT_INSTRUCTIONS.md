# 🚀 Deployment Instructions - Fix AUTH_SECRET Issue

## 🎯 Problem

Sau khi bạn gửi, tôi phân tích và phát hiện:

**Container có AUTH_SECRET (printenv thấy)**  
**NHƯNG Next.js app đọc `AUTH_SECRET_LENGTH: 0`**

→ **Likely cause**: Debug route chạy Edge runtime hoặc có cache

---

## ✅ Changes Applied

### 1. Fixed Debug Endpoint Runtime

**File**: `src/app/api/debug/env/route.ts`

**Changes**:
```typescript
// Force Node.js runtime to access process.env
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'  // ← NEW: Prevent caching
```

**Added fields**:
```typescript
AUTH_SECRET_SET: !!process.env.AUTH_SECRET,        // ← NEW
NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,  // ← NEW
NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,  // ← NEW
```

### 2. Verified All Routes Use Node.js Runtime

Checked all routes - **ALL GOOD** ✅:
- ✅ All auth routes: `runtime = 'nodejs'`
- ✅ All conversation routes: `runtime = 'nodejs'`
- ✅ Messages route: `runtime = 'nodejs'`

### 3. Verified next.config.js

```javascript
output: 'standalone',  // ✅ Already configured
```

---

## 🚀 Deployment Options

### Option 1: Simple Push (GitHub Actions)

```bash
# Commit changes
git add .
git commit -m "fix: Force nodejs runtime and disable cache for debug endpoint"
git push origin main

# Wait 3-5 minutes for GitHub Actions
# Then test
node test-code-version.js
```

### Option 2: Manual Standalone Deploy

```powershell
# Run deployment script
.\deploy-azure-standalone.ps1

# This will:
# 1. Build standalone
# 2. Create zip
# 3. Deploy to Azure
# 4. Restart app
# 5. Test automatically
```

### Option 3: Quick Redeploy (If GitHub Actions exists)

```bash
# Trigger redeploy without code changes
git commit --allow-empty -m "Force redeploy to reload env vars"
git push origin main
```

---

## 🧪 After Deployment - Verify

### Test 1: Check Environment

```bash
node test-code-version.js
```

**Expected**:
```json
{
  "runtime": "nodejs",
  "environment": {
    "AUTH_SECRET_LENGTH": 64,      ← Should be > 0!
    "AUTH_SECRET_SET": true,       ← Should be true!
    "NEXTAUTH_SECRET_LENGTH": 64,  ← Should be > 0!
    "NODE_ENV": "production"
  }
}
```

### Test 2: Test Messages Endpoint

```bash
node test-specific-conversation.js
```

**Expected**:
- Status: 200 ✅
- OR: 401 with JSON (if session expired)
- NOT: 400 with empty body

---

## 🔍 If Still AUTH_SECRET_LENGTH: 0 After Deploy

### Possible Causes:

**A) Deployment Slot Issue**
```bash
# Check active slot
az webapp deployment slot list --name firbox-api --resource-group firbox-prod

# If using slots, set env var on production slot
az webapp config appsettings set `
  --name firbox-api `
  --resource-group firbox-prod `
  --slot production `
  --settings AUTH_SECRET="f1O9bTY/y8+dtIJYQ7oDpde3RplAXIAsDPbS8cZJ7g1HWdNGz7+46Vkl4m14Gnvz"
```

**B) Variable Name Case Sensitive**

Make sure in Azure Portal it's EXACTLY:
- `AUTH_SECRET` (not `auth_secret`, not `AuthSecret`)

**C) Build Not Updating**

Clear build cache:
```bash
# In Azure Portal
# Advanced Tools (Kudu) → Debug Console → CMD
# Run: rm -rf .next
# Then redeploy
```

---

## 📝 Files Modified

1. ✅ `src/app/api/debug/env/route.ts` - Added dynamic, enhanced output
2. ✅ `deploy-azure-standalone.ps1` - New deployment script (CREATED)
3. ✅ All other fixes from previous rounds (already done)

---

## 🎯 Recommended Action

### Fastest Fix:

```bash
# 1. Commit và push
git add .
git commit -m "fix: Force nodejs runtime for debug endpoint, disable cache"
git push origin main

# 2. Wait for deploy (check GitHub Actions)

# 3. Test immediately
node test-code-version.js

# 4. If AUTH_SECRET_LENGTH > 0:
node test-specific-conversation.js
```

### If GitHub Actions Not Setup:

```powershell
# Use manual deployment script
.\deploy-azure-standalone.ps1
```

---

## ✅ Success Criteria

After deployment, you should see:

1. ✅ `AUTH_SECRET_LENGTH`: 64 (not 0)
2. ✅ `AUTH_SECRET_SET`: true
3. ✅ Messages endpoint: 200 OK
4. ✅ No more empty 400 responses
5. ✅ Chat loads messages successfully

---

**Next Step**: Deploy and test! 🚀


# 🔧 Azure Environment Variable Not Loading

## 🚨 Problem

Bạn đã:
- ✅ Set AUTH_SECRET trong Azure Portal
- ✅ Restart app
- ❌ App vẫn đọc AUTH_SECRET_LENGTH: 0

**Vấn đề:** Environment variables không được load vào app!

---

## 🔍 Possible Causes

### 1. Deployment Slot Issue

Bạn có thể đang set env vars vào slot sai.

**Check:**
1. Azure Portal → firbox-api
2. Xem "Deployment slots" (nếu có)
3. Đảm bảo set env vars vào đúng slot đang chạy (production)

### 2. App Setting vs Connection String

Có thể bạn set sai loại.

**Fix:**
1. Azure Portal → firbox-api → Configuration
2. Click "+ New application setting" (KHÔNG PHẢI connection string)
3. Name: `AUTH_SECRET`
4. Value: `f1O9bTY/y8+dtIJYQ7oDpde3RplAXIAsDPbS8cZJ7g1HWdNGz7+46Vkl4m14Gnvz`
5. Click OK
6. Click **SAVE** ở trên cùng (QUAN TRỌNG!)
7. Restart app

### 3. Cached Build

Old build có thể đang cache.

**Fix:**
```bash
# Force rebuild and redeploy
az webapp deployment source config --name firbox-api --resource-group firbox-prod --manual-integration

# Or trigger GitHub Actions redeploy
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### 4. SCM_DO_BUILD_DURING_DEPLOYMENT = false

Trong env vars bạn có:
```json
{
  "name": "SCM_DO_BUILD_DURING_DEPLOYMENT",
  "value": "false"
}
```

Điều này có thể ngăn app load env vars mới.

**Try changing to:**
```bash
az webapp config appsettings set --name firbox-api --resource-group firbox-prod \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

---

## ⚡ SOLUTION: Stop/Start Instead of Restart

Đôi khi "Restart" không load env vars. Thử Stop rồi Start:

### Azure Portal:
1. Go to firbox-api → Overview
2. Click **"Stop"**
3. Wait 10 seconds
4. Click **"Start"**
5. Wait 30 seconds
6. Test: `node test-code-version.js`

### Az CLI:
```bash
# Stop
az webapp stop --name firbox-api --resource-group firbox-prod

# Wait
Start-Sleep -Seconds 10

# Start
az webapp start --name firbox-api --resource-group firbox-prod

# Wait
Start-Sleep -Seconds 30

# Test
node test-code-version.js
```

---

## 🔍 Debug: Check Azure Logs

Có thể có error message khi app start:

```bash
# View startup logs
az webapp log tail --name firbox-api --resource-group firbox-prod

# Or download
az webapp log download --name firbox-api --resource-group firbox-prod --log-file azure-logs.zip
```

**Look for:**
- "AUTH_SECRET" errors
- "getSecretKey" errors
- Environment loading errors
- Startup failures

---

## 🎯 Alternative: Set Via Different Method

### Try Setting Via Az CLI:

```bash
az webapp config appsettings set --name firbox-api --resource-group firbox-prod \
  --settings \
    AUTH_SECRET="f1O9bTY/y8+dtIJYQ7oDpde3RplAXIAsDPbS8cZJ7g1HWdNGz7+46Vkl4m14Gnvz" \
    REQUIRE_EMAIL_VERIFICATION="false"

# Verify it's set
az webapp config appsettings list --name firbox-api --resource-group firbox-prod \
  --query "[?name=='AUTH_SECRET' || name=='REQUIRE_EMAIL_VERIFICATION']" --output table

# Restart
az webapp restart --name firbox-api --resource-group firbox-prod

# Wait and test
Start-Sleep -Seconds 30
node test-code-version.js
```

---

## 🔬 Check If Variable Name Is Correct

Trong code của bạn (`src/lib/auth/session.ts:13`):

```typescript
const secret = process.env.AUTH_SECRET  ← Reads this exactly
```

Trong Azure Portal, variable PHẢI là:
- ✅ `AUTH_SECRET` (exact match)
- ❌ KHÔNG PHẢI `auth_secret`
- ❌ KHÔNG PHẢI `AuthSecret`
- ❌ KHÔNG PHẢI `AUTH-SECRET`

**Case sensitive!** Environment variable names phải match CHÍNH XÁC!

---

## 🎯 Checklist

- [ ] AUTH_SECRET tên đúng (exact: AUTH_SECRET)
- [ ] Đã click SAVE sau khi thêm setting
- [ ] Không có typo trong tên variable
- [ ] Set vào Application Settings (không phải Connection Strings)
- [ ] Set vào đúng deployment slot (production)
- [ ] Đã Stop/Start app (không chỉ Restart)
- [ ] Đợi đủ 30 giây sau khi start
- [ ] Test với: node test-code-version.js

---

## 📝 If AUTH_SECRET Still Shows 0

Có thể là build issue. Code có thể đọc sai variable name.

**Let me check the actual code:**

Xem file `src/app/api/debug/env/route.ts` line 27:

```typescript
AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
```

Nếu vẫn trả về 0 sau khi restart, nghĩa là `process.env.AUTH_SECRET` là undefined.

**Possible issues:**
1. Variable tên sai
2. Azure không load vào process.env
3. Build issue
4. Cache issue

**Nuclear option - Redeploy everything:**
```bash
git commit --allow-empty -m "Force full redeploy"
git push origin main
# Then wait for GitHub Actions to complete deployment
```

---

## 🆘 Emergency Fix

Nếu không fix được qua env vars, tạm thời hardcode (CHỈ ĐỂ TEST):

**File:** `src/lib/auth/session.ts:13-14`

```typescript
function getSecretKey(): Uint8Array {
    // TEMPORARY FIX - Remove after env var works!
    const secret = process.env.AUTH_SECRET || 'f1O9bTY/y8+dtIJYQ7oDpde3RplAXIAsDPbS8cZJ7g1HWdNGz7+46Vkl4m14Gnvz'
    if (!secret || secret.length < 32) {
```

**Commit, push, test** - Nhưng sau đó phải revert và fix env vars đúng cách!

---

**ACTION:** Try Stop/Start (not just Restart) and test again!


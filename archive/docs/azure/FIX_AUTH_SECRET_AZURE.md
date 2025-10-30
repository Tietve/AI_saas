# 🚨 CRITICAL: AUTH_SECRET Missing on Azure!

## 🔍 Problem Found

```json
{
  "AUTH_SECRET_LENGTH": 0  ← Missing!
}
```

**Root Cause**: `AUTH_SECRET` environment variable is NOT SET on Azure!

This causes:
1. `getSecretKey()` in session.ts throws error
2. Server crashes when trying to verify session
3. Returns 400 with empty response (content-length: 0)

---

## ⚡ FIX NGAY (30 giây)

### Generate a Secret (32+ characters):

```powershell
# Generate random secret
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Your AUTH_SECRET: $secret"
Write-Host ""
Write-Host "Copy this secret and run the command below:"
```

### Set on Azure:

```bash
# Replace YOUR_SECRET_HERE with the generated secret above
az webapp config appsettings set --name firbox-api --resource-group firbox-rg \
  --settings AUTH_SECRET="YOUR_SECRET_HERE_AT_LEAST_32_CHARACTERS_LONG"
```

**Example** (DON'T use this exact one!):
```bash
az webapp config appsettings set --name firbox-api --resource-group firbox-rg \
  --settings AUTH_SECRET="a7b9c2d4e6f8g1h3i5j7k9l2m4n6o8p0q2r4s6t8u0v2w4x6y8z0A2B4C6D8E0F2"
```

### Restart App:

```bash
az webapp restart --name firbox-api --resource-group firbox-rg
```

---

## 🧪 Verify Fix

```bash
# 1. Check AUTH_SECRET is set
az webapp config appsettings list --name firbox-api --resource-group firbox-rg \
  --query "[?name=='AUTH_SECRET'].{name:name, valueLength:value}" --output table

# 2. Test debug endpoint
curl https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/debug/env

# Should show: "AUTH_SECRET_LENGTH": 64 (or whatever length you used)

# 3. Test messages endpoint
node test-specific-conversation.js
```

---

## 📝 Why This Happened

Looking at `src/lib/auth/session.ts:12-18`:

```typescript
function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 32) {
        throw new Error('AUTH_SECRET must be at least 32 characters long')
    }
    return new TextEncoder().encode(secret)
}
```

**When AUTH_SECRET is missing:**
1. `getSecretKey()` throws error
2. `verifySession()` calls `getSecretKey()` → crashes
3. `getUserIdFromSession()` calls `verifySession()` → crashes
4. `requireUserId()` calls `getUserIdFromSession()` → crashes
5. Server crashes BEFORE catching the error properly
6. Returns 400 with empty body

---

## ✅ After Setting AUTH_SECRET

The full error handling chain will work:
1. `getSecretKey()` returns valid key
2. `verifySession()` can verify token
3. `getUserIdFromSession()` works
4. `requireUserId()` properly throws "UNAUTHENTICATED"
5. Catch block handles it
6. Returns 401 with JSON error message

---

## 🎯 Summary

**It's NOT a code bug!**  
**It's a SETUP issue - missing environment variable!**

Your code is correct. The fixes I made will work.  
But you MUST set AUTH_SECRET first!

---

**IMMEDIATE ACTION:**
1. Generate secret (64 characters)
2. Set on Azure: `az webapp config appsettings set ...`
3. Restart app
4. Test again
5. Should work! ✅


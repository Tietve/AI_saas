# 🚨 URGENT: Azure App Chưa Load Environment Variables

## 🎯 Vấn Đề

Bạn ĐÃ set `AUTH_SECRET` trong Azure Portal, nhưng:

```json
{
  "AUTH_SECRET_LENGTH": 0  ← App vẫn đọc là 0!
}
```

**Nghĩa là:** App chưa restart để load env vars mới!

---

## ⚡ FIX NGAY (3 cách)

### Cách 1: Restart Qua Azure Portal (Dễ nhất)

1. Mở https://portal.azure.com
2. Tìm App Service: `firbox-api`
3. Click **"Restart"** ở trên cùng
4. Đợi 30-60 giây
5. Test lại!

### Cách 2: Restart Qua Az CLI

```bash
# List apps để tìm đúng resource group
az webapp list --output table

# Restart (thay RESOURCE_GROUP với tên đúng)
az webapp restart --name firbox-api --resource-group RESOURCE_GROUP_NAME
```

### Cách 3: Force Redeploy

```bash
# Trigger GitHub Actions redeploy
git commit --allow-empty -m "Force redeploy to reload env vars"
git push origin main
```

---

## 🧪 Sau Khi Restart

### Test 1: Check Environment Variables

```bash
node test-code-version.js
```

**Expected**:
```
AUTH_SECRET_LENGTH: 64  ← Should be > 0!
REQUIRE_EMAIL_VERIFICATION: false
```

### Test 2: Test Messages Endpoint

```bash
node test-specific-conversation.js
```

**Expected**:
```
Status: 200  ← Not 400!
Response: { "items": [...messages...] }
```

---

## 🔍 Tại Sao Xảy Ra

### Workflow của Azure App Service:

```
1. Bạn set env var trong Portal
2. Env var được LƯU trong config
3. ❌ App CHƯA RESTART → Vẫn dùng config cũ
4. App đọc process.env.AUTH_SECRET → undefined
5. Code mới check: if (!secret) → throw error
6. Server crash → 400 empty response
```

### Sau Khi Restart:

```
1. App restarts
2. Load env vars mới từ Portal
3. ✅ process.env.AUTH_SECRET có giá trị
4. Code hoạt động bình thường
5. Return 200 with data
```

---

## 📊 Diagnostic Info

### From Your Logs:

```
✅ Cookie being sent: session=eyJhbGci...
✅ AUTH_SECRET in Portal: "f1O9bTY..."
✅ Code deployed (debug endpoint exists)
❌ App reading AUTH_SECRET_LENGTH: 0
```

**Conclusion:** App needs restart to load new env vars!

---

## 🎯 Quick Commands

```powershell
# Option 1: Manual restart in Azure Portal (Easiest!)
# Go to portal.azure.com → Your App → Click Restart

# Option 2: Find correct resource group and restart
az webapp list --query "[].{name:name, rg:resourceGroup}" --output table
az webapp restart --name firbox-api --resource-group YOUR_RG_HERE

# Option 3: Test after restart
Start-Sleep -Seconds 30
node test-code-version.js
node test-specific-conversation.js
```

---

## ✅ Expected After Restart

1. ✅ `AUTH_SECRET_LENGTH`: 64 (not 0)
2. ✅ Session verification works
3. ✅ Messages endpoint returns 200
4. ✅ No more crashes
5. ✅ Browser loads messages successfully

---

## 🆘 If Still Fails After Restart

Check Azure logs immediately:

```bash
# Download logs
az webapp log download --name firbox-api --resource-group YOUR_RG --log-file logs.zip

# Or view in Portal
# Azure Portal → App Service → Log stream
```

Look for:
- Stack traces
- "AUTH_SECRET" errors
- "getSecretKey" errors
- Any crashes during startup

---

**ACTION NOW:**  
**Restart app trong Azure Portal!** 🔄

Then test again in 30 seconds! ⏱️


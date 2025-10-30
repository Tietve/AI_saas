# 🚀 Quick Start: Debug API Errors

Hướng dẫn nhanh để debug lỗi 400/404 trên production (Azure/Vercel).

## 🎯 Vấn đề của bạn

- ✅ **Localhost hoạt động OK**
- ❌ **Production bị lỗi:**
  - `400 Bad Request` khi load messages
  - `404 Not Found` khi gửi chat

---

## ⚡ Cách test nhanh nhất

### Option 1: PowerShell Script (Khuyên dùng cho Windows)

```powershell
# Chạy ngay - không cần credentials
.\test-api-errors.ps1

# Hoặc với credentials để test đầy đủ
.\test-api-errors.ps1 -TestEmail "your-email@gmail.com" -TestPassword "YourPass123"
```

**Output sẽ cho bạn biết:**
- ✅ Endpoint nào hoạt động
- ❌ Endpoint nào bị lỗi (400, 404, 401...)
- 🔍 Chi tiết response để debug

### Option 2: Node.js Script (Cross-platform)

```bash
# Test Azure API
npm run test:api:azure

# Test custom API
TEST_API_URL="https://your-app.vercel.app" npm run test:api

# Với credentials
TEST_API_URL="https://..." TEST_EMAIL="email@test.com" TEST_PASSWORD="pass" npm run test:api
```

---

## 🔍 Đọc kết quả test

### Nếu thấy lỗi 404:

```
❌ POST /api/chat/send: 404
```

**Nghĩa là:** Route không tồn tại trên production

**Fix:**
1. Kiểm tra file `src/app/api/chat/send/route.ts` có được deploy không
2. Check build output trong logs
3. Redeploy lại

```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

### Nếu thấy lỗi 400:

```
❌ GET /api/conversations/{id}/messages: 400
Response: {"error": "INTERNAL_SERVER_ERROR"}
```

**Nghĩa là:** Route tồn tại nhưng server gặp lỗi khi xử lý

**Fix:**
1. Check logs ngay:
   ```bash
   az webapp log tail --name firbox-api --resource-group firbox-rg
   ```
2. Thường là do:
   - Database connection issue
   - Prisma client chưa generate
   - Environment variables thiếu
   - Session/Cookie không hoạt động

### Nếu thấy lỗi 401:

```
⚠️  401 - Unauthorized (route exists, needs auth)
```

**Nghĩa là:** Route OK, nhưng authentication không hoạt động

**Fix:**
1. Check cookies có được set không
2. Verify `SESSION_SECRET` và `NEXTAUTH_SECRET` trong env vars
3. Check cookie settings (secure, sameSite, domain)

---

## 🛠️ Quick Fixes

### Fix #1: Check và deploy lại Prisma

```bash
# Azure
az webapp ssh --name firbox-api --resource-group firbox-rg
cd /home/site/wwwroot
npx prisma generate
npx prisma migrate deploy
```

### Fix #2: Verify Environment Variables

```bash
# List all env vars trên Azure
az webapp config appsettings list --name firbox-api --resource-group firbox-rg

# Add missing vars
az webapp config appsettings set --name firbox-api --resource-group firbox-rg \
  --settings DATABASE_URL="postgresql://..." SESSION_SECRET="your-secret"
```

**Cần có:**
- `DATABASE_URL` (with `?sslmode=require`)
- `SESSION_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NODE_ENV=production`

### Fix #3: Force Rebuild

```bash
# Trigger new deployment
git commit --allow-empty -m "Rebuild for production"
git push origin main
```

### Fix #4: Check Runtime Settings

Trong file `src/app/api/conversations/[id]/messages/route.ts`:

```typescript
// Đảm bảo có dòng này
export const runtime = 'nodejs'  // hoặc 'edge'
```

---

## 📊 Xem logs chi tiết

### Azure Logs

```bash
# Live stream
az webapp log tail --name firbox-api --resource-group firbox-rg

# Filter errors only
az webapp log tail --name firbox-api --resource-group firbox-rg | grep ERROR

# Download logs
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip
```

### Vercel Logs

```bash
# CLI
vercel logs

# Or in dashboard
# https://vercel.com/[team]/[project]/logs
```

---

## ✅ Checklist Debug

Làm theo thứ tự:

1. **[ ] Run test script**
   ```bash
   npm run test:api:azure
   ```

2. **[ ] Check logs**
   ```bash
   az webapp log tail --name firbox-api --resource-group firbox-rg | grep -A 5 "conversations.*messages"
   ```

3. **[ ] Verify routes deployed**
   ```bash
   curl -I https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/chat/send
   # Should NOT be 404
   ```

4. **[ ] Check env vars**
   ```bash
   az webapp config appsettings list --name firbox-api --resource-group firbox-rg | grep -E "(DATABASE_URL|SESSION_SECRET|NEXTAUTH)"
   ```

5. **[ ] Test database connection**
   ```bash
   az webapp ssh --name firbox-api --resource-group firbox-rg
   npx prisma db execute --stdin <<< "SELECT 1;"
   ```

6. **[ ] Verify Prisma client**
   ```bash
   ls -la node_modules/@prisma/client/
   ls -la node_modules/.prisma/
   ```

---

## 🆘 Nếu vẫn không fix được

### Tạo detailed report:

```bash
# 1. Chạy test và lưu output
npm run test:api:azure > test-results.txt 2>&1

# 2. Get logs
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip

# 3. Check env vars
az webapp config appsettings list --name firbox-api --resource-group firbox-rg > env-vars.txt

# 4. Gửi 3 files này để được support
```

### Thông tin cần cung cấp:

1. Output của test script
2. Server logs (từ Azure/Vercel)
3. Environment variables (đã che sensitive data)
4. Error message chính xác từ browser console
5. Request headers và cookies

---

## 📚 Chi tiết đầy đủ

Xem file đầy đủ tại: [docs/DEBUG_PRODUCTION_ERRORS.md](./docs/DEBUG_PRODUCTION_ERRORS.md)

---

## 💡 Tips

- 🔥 **90% lỗi** có thể fix bằng cách check logs
- 🔑 **Env vars** là nguyên nhân phổ biến nhất
- 🗄️ **Database connection** là nguyên nhân #2
- 🔒 **Session/Cookies** thường bị sai config cho production
- 📦 **Prisma client** phải được generate lại sau mỗi lần deploy

**Lệnh quan trọng nhất:**
```bash
# Xem logs real-time
az webapp log tail --name firbox-api --resource-group firbox-rg
```

Chạy lệnh này trong một terminal riêng, rồi test API ở terminal khác để thấy errors ngay lập tức! 🎯


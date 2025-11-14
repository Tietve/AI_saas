# 🐛 Debug Production Errors Guide

Hướng dẫn chi tiết để debug lỗi 400 và 404 khi deploy lên Azure và Vercel.

## 🔍 Vấn đề

### Hiện tượng
- **Local (localhost)**: Hoạt động bình thường ✅
- **Azure/Vercel**: Gặp lỗi 400 và 404 ❌

### Lỗi cụ thể từ Console

```
GET https://.../api/conversations/{id}/messages?limit=100 400 (Bad Request)
POST https://.../api/chat/send 404 (Not Found)
[Messages] Load error: Error: Failed to load messages
[Send] Error: Error: HTTP 404
```

---

## 📊 Phân tích

### Lỗi 400 Bad Request
**Endpoint**: `GET /api/conversations/{id}/messages`

**Nguyên nhân có thể:**
1. ❌ Session/Cookie không được gửi đúng cách
2. ❌ Database connection issue (Prisma)
3. ❌ Environment variables thiếu hoặc sai
4. ❌ Prisma Client chưa được generate trên production
5. ❌ CORS/Cookie settings không đúng
6. ❌ Runtime mismatch (Edge vs Node.js)

### Lỗi 404 Not Found
**Endpoint**: `POST /api/chat/send`

**Nguyên nhân có thể:**
1. ❌ Route file không được deploy
2. ❌ Build process không include file này
3. ❌ Routing configuration sai (next.config.js)
4. ❌ File structure khác giữa local và production

---

## 🧪 Cách Test

### 1. Sử dụng PowerShell Script (Windows)

```powershell
# Test cơ bản
.\test-api-errors.ps1

# Test với credentials
.\test-api-errors.ps1 -TestEmail "your-email@example.com" -TestPassword "YourPassword123"

# Test với API khác
.\test-api-errors.ps1 -ApiUrl "https://your-vercel-app.vercel.app" -TestEmail "email@example.com" -TestPassword "pass"
```

### 2. Sử dụng Node.js Script (Cross-platform)

```bash
# Install dependencies nếu cần
npm install node-fetch

# Chạy test
npx tsx scripts/test-api-detailed.ts

# Với custom API URL
TEST_API_URL="https://your-app.vercel.app" npx tsx scripts/test-api-detailed.ts

# Với custom credentials
TEST_API_URL="https://..." TEST_EMAIL="user@example.com" TEST_PASSWORD="pass123" npx tsx scripts/test-api-detailed.ts
```

### 3. Test bằng cURL (Manual)

```bash
# Set API URL
API_URL="https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net"

# 1. Health check
curl "$API_URL/api/health"

# 2. CSRF token
curl "$API_URL/api/csrf"

# 3. Signup
curl -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'

# 4. Signin và lưu cookies
curl -X POST "$API_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt

# 5. Get conversations (với cookies)
curl "$API_URL/api/conversations" \
  -b cookies.txt

# 6. Get messages (thay CONVERSATION_ID)
curl "$API_URL/api/conversations/CONVERSATION_ID/messages?limit=100" \
  -b cookies.txt

# 7. Test chat send
curl -X POST "$API_URL/api/chat/send" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"content":"test","conversationId":"new","model":"gpt-4o-mini"}'
```

---

## 🔧 Debug Checklist

### ✅ Kiểm tra API Routes có được deploy không

```bash
# Check if route files exist on production
# Azure
az webapp ssh --name firbox-api --resource-group firbox-rg
cd /home/site/wwwroot/.next/server/app/api
ls -la chat/
ls -la conversations/

# Vercel
# Check build logs in Vercel dashboard
```

### ✅ Kiểm tra Environment Variables

```bash
# Azure - List env vars
az webapp config appsettings list --name firbox-api --resource-group firbox-rg

# Check required vars:
# - DATABASE_URL
# - SESSION_SECRET
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
```

**Required Environment Variables:**
```bash
DATABASE_URL="postgresql://..."
SESSION_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### ✅ Kiểm tra Prisma Client

```bash
# Azure SSH
az webapp ssh --name firbox-api --resource-group firbox-rg

# Check Prisma client
cd /home/site/wwwroot
ls -la node_modules/.prisma/
ls -la node_modules/@prisma/client/

# Regenerate if needed
npx prisma generate
```

### ✅ Kiểm tra Database Connection

```bash
# Test database connection
npx tsx scripts/test-database.ts

# Or use Prisma Studio
npx prisma studio
```

### ✅ Kiểm tra Logs

#### Azure Logs
```bash
# Live tail
az webapp log tail --name firbox-api --resource-group firbox-rg

# Download logs
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip

# View in portal
# Azure Portal > App Services > firbox-api > Log stream
```

#### Vercel Logs
```bash
# Use Vercel CLI
vercel logs

# Or view in Vercel dashboard
# https://vercel.com/your-team/your-project/logs
```

---

## 🛠️ Các Fix phổ biến

### Fix 1: Đảm bảo Route Runtime đúng

**File**: `src/app/api/conversations/[id]/messages/route.ts`

```typescript
// Thêm dòng này nếu chưa có
export const runtime = 'nodejs'

// Hoặc nếu dùng Edge Runtime
export const runtime = 'edge'
```

### Fix 2: Cookie/Session Configuration

**File**: `src/lib/auth/session.ts`

```typescript
// Đảm bảo cookie settings đúng cho production
export const sessionOptions = {
  cookieName: 'auth_session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // true in prod
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  },
}
```

### Fix 3: CORS Configuration

**File**: `next.config.js`

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ]
}
```

### Fix 4: Prisma Client Generation trong Build

**File**: `package.json`

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### Fix 5: Database URL với SSL

**Environment Variable:**
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

### Fix 6: Next.js Rewrites (nếu dùng separate backend)

**File**: `next.config.js`

```javascript
async rewrites() {
  // Chỉ rewrite trong production
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_URL) {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  }
  return []
}
```

---

## 📝 Troubleshooting Steps

### Bước 1: Xác định vấn đề

```bash
# 1. Chạy test script
npx tsx scripts/test-api-detailed.ts

# 2. Xem kết quả
# - Nếu 404: Route không tồn tại
# - Nếu 400: Server xử lý request nhưng có lỗi
# - Nếu 401: Authentication issue
# - Nếu 500: Server error
```

### Bước 2: Check logs chi tiết

```bash
# Azure
az webapp log tail --name firbox-api --resource-group firbox-rg | grep ERROR

# Hoặc xem file log
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip
unzip logs.zip
cat *.log | grep -A 10 "conversations.*messages"
```

### Bước 3: Verify deployment

```bash
# Check if API routes are deployed
curl -I https://your-api.com/api/chat/send
curl -I https://your-api.com/api/conversations

# Should return 405 (Method Not Allowed) or 401 (Unauthorized)
# NOT 404 (Not Found)
```

### Bước 4: Test authentication flow

```bash
# Use test script to verify auth works
npx tsx scripts/test-api-detailed.ts

# Look for:
# ✅ CSRF token received
# ✅ Signup/Signin successful
# ✅ Cookies received
# ✅ Can access protected routes
```

### Bước 5: Check database connectivity

```bash
# From production server
az webapp ssh --name firbox-api --resource-group firbox-rg

# Test Prisma
npx prisma db execute --stdin <<< "SELECT 1;"

# Check if tables exist
npx prisma db execute --stdin <<< "SELECT * FROM pg_tables WHERE schemaname='public';"
```

---

## 💡 Common Issues & Solutions

### Issue: "Failed to load messages" (400)

**Symptoms:**
- GET `/api/conversations/{id}/messages` returns 400
- Works on localhost but not production

**Solutions:**
1. Check if `requireUserId()` works correctly
2. Verify cookies are sent with request
3. Check database connection
4. Verify Prisma client is generated

```typescript
// Add detailed logging
console.log('[Messages API] Request received', {
  conversationId,
  userId,
  headers: req.headers,
})
```

### Issue: "HTTP 404" when sending chat

**Symptoms:**
- POST `/api/chat/send` returns 404
- Route exists in codebase

**Solutions:**
1. Check if file is included in build output
2. Verify `src/app/api/chat/send/route.ts` exists
3. Check `.vercelignore` or `.gitignore`
4. Redeploy application

```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

### Issue: Authentication not persisting

**Symptoms:**
- Signin works but subsequent requests fail with 401
- Cookies not saved

**Solutions:**
1. Check cookie domain/path settings
2. Verify `secure` flag (must be true in production)
3. Check `sameSite` setting
4. Verify `NEXTAUTH_URL` is correct

---

## 🚀 Deployment Checklist

Trước khi deploy, đảm bảo:

- [ ] All environment variables set correctly
- [ ] `DATABASE_URL` has `?sslmode=require` for production
- [ ] `NEXTAUTH_URL` points to production domain
- [ ] Prisma migrations deployed: `npx prisma migrate deploy`
- [ ] Prisma client generated in build process
- [ ] Session secret is secure and matches across deploys
- [ ] CORS/Cookie settings configured for production domain
- [ ] All API route files included in build
- [ ] Tested locally with production-like environment
- [ ] Logs are accessible and monitored

---

## 📞 Getting Help

If issues persist:

1. **Check the logs** first (90% of issues are visible in logs)
2. **Run test scripts** to isolate the problem
3. **Compare local vs production** environment variables
4. **Review recent changes** that might have broken deployment
5. **Check dependencies** - ensure production has same versions

**Useful Commands:**
```bash
# Azure logs
az webapp log tail --name firbox-api --resource-group firbox-rg

# Test production API
npx tsx scripts/test-api-detailed.ts

# Check deployment status
az webapp deployment list --name firbox-api --resource-group firbox-rg

# SSH into Azure container
az webapp ssh --name firbox-api --resource-group firbox-rg
```

---

## 📚 Related Documentation

- [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md) - Logging setup
- [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Azure deployment guide
- [VERCEL_DEPLOY_GUIDE.md](./VERCEL_DEPLOY_GUIDE.md) - Vercel deployment
- [DEBUG_400_ERROR.md](./DEBUG_400_ERROR.md) - Previous debugging notes
- [ENVIRONMENT_VARS.md](./ENVIRONMENT_VARS.md) - Environment variables reference


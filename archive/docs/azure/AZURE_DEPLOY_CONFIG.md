# Azure App Service - Configuration Checklist

## 🎯 BƯỚC 4: Configure Azure Portal (BẮT BUỘC)

Sau khi deploy lần đầu hoặc khi gặp lỗi runtime, **PHẢI** configure các setting này trong Azure Portal.

---

## 📋 CONFIGURATION SETTINGS

### 1. **Application Settings (Environment Variables)**

Vào: `Azure Portal → App Service → Configuration → Application Settings`

#### ✅ **REQUIRED** (Bắt buộc phải có, nếu thiếu app sẽ CRASH):

| Name | Value | Note |
|------|-------|------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Neon Postgres connection string |
| `AUTH_SECRET` | `<random-64-chars>` | JWT secret (tạo bằng: `openssl rand -base64 48`) |
| `NODE_ENV` | `production` | **QUAN TRỌNG**: Phải là `production` |
| `WEBSITE_NODE_DEFAULT_VERSION` | `20-lts` | Node.js version |

#### ⚠️ **HIGHLY RECOMMENDED** (Cần cho features chính):

| Name | Value | Note |
|------|-------|------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key cho chat |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Redis cache URL |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | Redis token |

#### 📧 **OPTIONAL** (Email features):

| Name | Value |
|------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `SMTP_FROM` | `noreply@yourdomain.com` |

#### 🔍 **OPTIONAL** (Monitoring & Features):

| Name | Value |
|------|-------|
| `SENTRY_DSN` | `https://...@sentry.io/...` |
| `PAYOS_CLIENT_ID` | `...` |
| `PAYOS_API_KEY` | `...` |
| `PAYOS_CHECKSUM_KEY` | `...` |

---

### 2. **General Settings**

Vào: `Azure Portal → App Service → Configuration → General Settings`

#### ✅ **REQUIRED**:

| Setting | Value | Why |
|---------|-------|-----|
| **Stack** | Node | - |
| **Major Version** | 20 LTS | Match package.json engines |
| **Minor Version** | 20.x (latest) | - |
| **Startup Command** | `npm start` | Chạy script `next start -p $PORT` |
| **Always On** | `On` | Prevent cold start, keep app alive |
| **ARR Affinity** | `Off` | Better for load balancing |
| **HTTPS Only** | `On` | Force HTTPS |

**Startup Command Details:**
```bash
# Option 1 (Recommended):
npm start

# Option 2 (Explicit):
node_modules/.bin/next start -p $PORT

# Option 3 (With logging):
npm start 2>&1 | tee /home/LogFiles/app.log
```

---

### 3. **Advanced Tools (Kudu) - Optional Verification**

Vào: `Azure Portal → App Service → Advanced Tools → Go`

#### Verify deployment package:

```bash
# SSH vào container
cd /home/site/wwwroot

# Kiểm tra cấu trúc folder
ls -la
# Phải có:
# - .next/
# - src/           ← QUAN TRỌNG!
# - node_modules/
# - package.json
# - prisma/

# Kiểm tra Prisma Client
ls -la node_modules/.prisma/client/
# Phải có: index.js, schema.prisma, libquery_engine-*.so.*

# Test database connection
DATABASE_URL="your-db-url" npx prisma db pull --schema=prisma/schema.prisma

# Test app startup (debug)
PORT=8080 npm start
```

---

## 🚨 TROUBLESHOOTING CHECKLIST

### **App không start (HTTP 503)**

1. ✅ **Kiểm tra Startup Command:**
   ```bash
   # Azure Portal → Configuration → General Settings → Startup Command
   # PHẢI là: npm start
   ```

2. ✅ **Kiểm tra Log Stream:**
   ```bash
   # Azure Portal → Log stream
   # Tìm lỗi: "Cannot find module", "ECONNREFUSED", "AUTH_SECRET"
   ```

3. ✅ **Kiểm tra Application Settings:**
   ```bash
   # Verify có đủ env vars:
   DATABASE_URL, AUTH_SECRET, NODE_ENV=production
   ```

---

### **Health check FAILED (Database error)**

**Log:**
```
❌ Database connection failed: P1001
Error: Can't reach database server
```

**Fix:**

1. **Verify DATABASE_URL format:**
   ```bash
   # ĐÚNG:
   postgresql://user:pass@hostname.neon.tech:5432/db?sslmode=require

   # SAI (thiếu sslmode):
   postgresql://user:pass@hostname.neon.tech:5432/db
   ```

2. **Kiểm tra Neon database:**
   ```bash
   # Test connection từ local:
   DATABASE_URL="..." npx prisma db pull
   ```

3. **Kiểm tra Prisma Client:**
   ```bash
   # SSH vào Azure:
   cd /home/site/wwwroot
   ls -la node_modules/@prisma/client/
   ls -la node_modules/.prisma/client/
   ```

---

### **Module not found errors**

**Log:**
```
Error: Cannot find module '@/lib/prisma'
Error: Cannot find module 'src/app/api/...'
```

**Root Cause:**
- Deployment package thiếu `src/` folder

**Fix:**
1. **Re-deploy** với workflow đã fix (commit mới nhất)
2. **Verify** deployment package có `src/`:
   ```bash
   # Kudu console:
   ls -la /home/site/wwwroot/src/
   ```

---

### **Prisma Client errors**

**Log:**
```
Error: @prisma/client did not initialize yet
PrismaClientInitializationError: Can't reach database server
```

**Fix:**

1. **Regenerate Prisma Client trong production:**
   ```bash
   # SSH vào Azure:
   cd /home/site/wwwroot
   DATABASE_URL="..." npx prisma generate
   ```

2. **Restart App Service:**
   ```bash
   # Azure Portal → Overview → Restart
   ```

---

## 🔄 DEPLOYMENT WORKFLOW

### **Khi nào cần deploy lại?**

1. **Code changes:** Push to `main` branch → Auto deploy qua GitHub Actions
2. **Env var changes:** Update trong Azure Portal → **Restart app**
3. **Database schema changes:**
   ```bash
   # Local:
   npx prisma migrate dev --name add_new_field

   # Production (manual):
   # SSH vào Azure hoặc run local với production DB:
   DATABASE_URL="production-db-url" npx prisma migrate deploy
   ```

---

## ✅ FINAL VERIFICATION

### **1. Test Health Endpoint:**

```bash
curl https://firbox-api.azurewebsites.net/api/health

# Expected:
{
  "status": "healthy",
  "checks": {
    "database": { "status": "pass" },
    "cache": { "status": "pass" or "warn" },
    "memory": { "status": "pass" }
  }
}
```

### **2. Test API Endpoints:**

```bash
# Register:
curl -X POST https://firbox-api.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'

# Chat (need auth):
curl -X POST https://firbox-api.azurewebsites.net/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Hello"}'
```

### **3. Monitor Logs:**

```bash
# Azure CLI:
az webapp log tail --name firbox-api --resource-group <your-rg>

# Portal:
# Azure Portal → Log stream → Application logs
```

---

## 📚 REFERENCE

- **Azure Docs:** https://docs.microsoft.com/azure/app-service/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Prisma on Azure:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-azure-functions

---

## 🆘 NEED HELP?

**Check logs first:**
1. Azure Portal → App Service → Log stream
2. Azure Portal → Monitoring → Metrics
3. Kudu Console: `https://firbox-api.scm.azurewebsites.net`

**Common commands:**
```bash
# Restart app
az webapp restart --name firbox-api --resource-group <rg>

# View logs
az webapp log tail --name firbox-api --resource-group <rg>

# SSH into container
az webapp ssh --name firbox-api --resource-group <rg>
```

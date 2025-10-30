# 🧠 Memory Optimization Guide - Vercel Serverless

## ⚠️ **VẤN ĐỀ**

Vercel Serverless Functions có giới hạn RAM:
- **Free Plan:** 512MB RAM
- **Pro Plan:** 1024MB - 3008MB RAM

**Project của bạn vượt quá 2048MB** → Cần tối ưu ngay!

---

## 🔍 **NGUYÊN NHÂN TỐN RAM**

### **1. Node.js Runtime (512MB-1024MB)**
```typescript
// ❌ NẶNG - Mọi endpoint đều dùng Node.js
export const runtime = 'nodejs'
```
- Cold start: 500-1000ms
- Memory: 512MB-1024MB
- Prisma Client: ~200MB
- Dependencies: ~300MB

### **2. Prisma Client Loaded Everywhere**
```typescript
// ❌ Load Prisma vào EVERY endpoint
import { prisma } from '@/lib/prisma'
```
- Prisma Client: ~200MB
- Query engine: ~50MB
- Connection pool: ~100MB

### **3. Message History Buffer**
```typescript
// ❌ Load toàn bộ 20 messages vào RAM
const recent = await prisma.message.findMany({
  take: HISTORY_LIMIT // 20 messages
})
```

### **4. File Processing**
```typescript
// ❌ Đọc toàn bộ file vào RAM
const data = await fs.readFile(filePath)
const base64 = data.toString('base64') // Tăng gấp 1.33x
```

### **5. No Memory Cleanup**
- Không có garbage collection
- Không có memory limit checks
- Không có streaming optimization

---

## ✅ **GIẢI PHÁP TỐI ƯU**

### **1. Sử Dụng Edge Runtime (50x Nhẹ Hơn)** ⚡

**Edge Runtime:**
- Memory: **< 128MB** (vs 512MB Node.js)
- Cold start: **50-100ms** (vs 500-1000ms)
- Không support: Prisma, fs, crypto native

**Endpoints nên chuyển sang Edge:**
- ✅ Health checks
- ✅ CSRF tokens
- ✅ Simple auth checks
- ✅ Rate limiting
- ✅ Static responses

**Ví dụ:**
```typescript
// ✅ NHẸ - Edge Runtime
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

---

### **2. Lazy Load Prisma Client**

**Trước (❌ NẶNG):**
```typescript
// EVERY endpoint load Prisma
import { prisma } from '@/lib/prisma'
```

**Sau (✅ NHẸ):**
```typescript
// Chỉ load khi cần
let prisma: PrismaClient | null = null

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

// Sử dụng
const db = getPrisma()
const user = await db.user.findUnique(...)
```

---

### **3. Configure Memory Limits** (vercel.json)

```json
{
  "functions": {
    "src/app/api/chat/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    },
    "src/app/api/upload/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    },
    "src/app/api/auth/**/*.ts": {
      "memory": 512,
      "maxDuration": 10
    },
    "src/app/api/health/route.ts": {
      "memory": 256,
      "maxDuration": 5
    }
  }
}
```

**Lợi ích:**
- Tối ưu cost (chỉ trả cho RAM cần thiết)
- Nhanh hơn (less memory = faster cold start)
- Dễ debug (biết endpoint nào tốn RAM)

---

### **4. Optimize Message History**

**Trước (❌ NẶNG):**
```typescript
// Load 20 messages x 10KB = 200KB
const recent = await prisma.message.findMany({
  take: 20,
  include: {
    attachments: true // +500KB nếu có files
  }
})
```

**Sau (✅ NHẸ):**
```typescript
// Chỉ load fields cần thiết
const recent = await prisma.message.findMany({
  take: 10, // Giảm từ 20 → 10
  select: {
    role: true,
    content: true,
    // KHÔNG load attachments nếu không cần
  }
})
```

---

### **5. Stream File Processing**

**Trước (❌ NẶNG):**
```typescript
// Đọc toàn bộ 10MB file vào RAM
const data = await fs.readFile(filePath)
const base64 = data.toString('base64') // 13MB trong RAM
```

**Sau (✅ NHẸ):**
```typescript
// Streaming upload (không load vào RAM)
import { createReadStream } from 'fs'

const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 })
// Upload từng chunk 64KB
```

---

### **6. Reduce Bundle Size**

**Next.js Config:**
```javascript
// next.config.js
module.exports = {
  experimental: {
    // Tree shaking cho serverless
    serverComponentsExternalPackages: ['@prisma/client']
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Reduce bundle size
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          prisma: {
            test: /[\\/]node_modules[\\/]@prisma[\\/]/,
            name: 'prisma',
            priority: 10
          }
        }
      }
    }
    return config
  }
}
```

---

### **7. Connection Pooling**

**DATABASE_URL cần có:**
```bash
postgresql://user:pass@host/db?
  connection_limit=5&      # Giảm từ 10 → 5
  pool_timeout=10&         # Timeout nhanh
  connect_timeout=5        # Connect nhanh
```

---

### **8. Memory Monitoring**

**Thêm vào API endpoints:**
```typescript
export async function POST(req: Request) {
  const startMem = process.memoryUsage().heapUsed / 1024 / 1024

  // ... xử lý ...

  const endMem = process.memoryUsage().heapUsed / 1024 / 1024
  console.log(`Memory used: ${(endMem - startMem).toFixed(2)}MB`)

  if (endMem > 800) { // Cảnh báo nếu >800MB
    console.warn(`⚠️ High memory usage: ${endMem.toFixed(2)}MB`)
  }
}
```

---

## 📊 **MEMORY BUDGET PER ENDPOINT**

| Endpoint Type | Max Memory | Duration | Runtime |
|---------------|------------|----------|---------|
| **Chat/AI** | 1024MB | 60s | nodejs |
| **Upload** | 1024MB | 30s | nodejs |
| **Auth** | 512MB | 10s | nodejs |
| **CRUD** | 512MB | 10s | nodejs |
| **Health/Static** | 256MB | 5s | edge |

---

## 🎯 **ACTION PLAN**

### **Phase 1: Quick Wins (Ngay)** ✅
- [ ] Add `vercel.json` với memory limits
- [ ] Chuyển health check sang Edge Runtime
- [ ] Giảm message history: 20 → 10
- [ ] Optimize DATABASE_URL connection pool

### **Phase 2: Medium (1-2 ngày)** 🟡
- [ ] Lazy load Prisma Client
- [ ] Stream file uploads
- [ ] Reduce bundle size với webpack config
- [ ] Add memory monitoring

### **Phase 3: Long-term (1 tuần)** 🔵
- [ ] Chuyển các simple endpoints sang Edge
- [ ] Implement Redis caching
- [ ] Move file processing sang background jobs
- [ ] Add auto-scaling policies

---

## 🧪 **TEST MEMORY USAGE**

### **Local Testing:**
```bash
# Test memory locally
NODE_OPTIONS="--max-old-space-size=512" npm run dev

# Monitor memory
node --expose-gc server.js
```

### **Vercel Production:**
```bash
# View logs
vercel logs <deployment-url>

# Monitor functions
vercel inspect <deployment-url>
```

---

## 📈 **EXPECTED RESULTS**

### **Before Optimization:**
- Chat endpoint: **800-1200MB** RAM
- Upload endpoint: **600-800MB** RAM
- Auth endpoint: **400-600MB** RAM
- Cold start: **1000-2000ms**

### **After Optimization:**
- Chat endpoint: **400-600MB** RAM ⬇️ 50%
- Upload endpoint: **300-400MB** RAM ⬇️ 50%
- Auth endpoint: **200-300MB** RAM ⬇️ 50%
- Cold start: **300-500ms** ⬇️ 70%

---

## 🚨 **TROUBLESHOOTING**

### **Error: Function exceeded memory limit**
```bash
# Solution 1: Increase memory in vercel.json
{
  "functions": {
    "src/app/api/problematic/route.ts": {
      "memory": 1536  # Increase to 1.5GB
    }
  }
}

# Solution 2: Optimize the function
- Reduce data fetched
- Use streaming
- Lazy load dependencies
```

### **Error: Cold start timeout**
```bash
# Solution: Reduce bundle size
- Use Edge Runtime if possible
- Lazy load Prisma
- Remove unused dependencies
```

---

## 📚 **TÀI LIỆU THAM KHẢO**

- **Vercel Functions:** https://vercel.com/docs/functions
- **Edge Runtime:** https://vercel.com/docs/functions/edge-functions
- **Memory Limits:** https://vercel.com/docs/functions/serverless-functions/runtimes#memory
- **Next.js Optimization:** https://nextjs.org/docs/app/building-your-application/optimizing

---

## ✅ **CHECKLIST**

- [ ] ✅ Đã tạo `vercel.json` với memory limits
- [ ] ✅ Đã tạo Edge Runtime health check
- [ ] ⏳ Chuyển simple endpoints sang Edge
- [ ] ⏳ Lazy load Prisma Client
- [ ] ⏳ Optimize message history
- [ ] ⏳ Stream file uploads
- [ ] ⏳ Add memory monitoring
- [ ] ⏳ Test với production data

---

**Generated:** 2025-10-12
**Status:** ✅ Ready to Implement

# 🚀 Hướng Dẫn Deploy Lên Vercel

## 📊 **TÓM TẮT VẤN ĐỀ**

**Vấn đề:** Project > 2GB → Vercel Free không upload được
**Nguyên nhân:**
- `.next/` build cache (925MB)
- `node_modules/` (1-2GB)
- `.git/` history
- Test files, backups, logs

**Giải pháp:** Tối ưu deployment với `.vercelignore`

---

## ✅ **ĐÃ CÀI ĐẶT**

- ✅ `.vercelignore` - Loại bỏ files không cần thiết
- ✅ `scripts/cleanup-for-deploy.sh` - Script dọn dẹp
- ✅ `scripts/deploy-vercel.sh` - Script deploy tự động
- ✅ `.env.vercel` - Environment variables template

---

## 📋 **HƯỚNG DẪN DEPLOY (3 BƯỚC)**

### **Bước 1: Cài Đặt Vercel CLI**

```bash
# Install globally
npm install -g vercel

# Verify installation
vercel --version

# Login to Vercel
vercel login
```

---

### **Bước 2: Setup Environment Variables**

#### **Option A: Qua Vercel Dashboard (Khuyên dùng)**

1. Vào: https://vercel.com/dashboard
2. Chọn project hoặc tạo mới
3. Settings → Environment Variables
4. Copy từng biến từ `.env.vercel`:
   ```
   NEXT_PUBLIC_APP_URL=https://firbox.net
   NEXT_PUBLIC_BASE_URL=https://firbox.net
   DATABASE_URL=postgresql://...
   AUTH_SECRET=...
   OPENAI_API_KEY=...
   ... (tất cả biến trong .env.vercel)
   ```
5. Scope chọn: **Production**
6. Click **Save**

#### **Option B: Qua Vercel CLI (Nhanh hơn)**

```bash
# Set từng biến một
vercel env add NEXT_PUBLIC_APP_URL production
# Paste value: https://firbox.net

vercel env add DATABASE_URL production
# Paste value: postgresql://...

# Lặp lại cho tất cả biến
```

---

### **Bước 3: Deploy**

#### **Option A: Dùng Script Tự Động (Khuyên dùng)**

```bash
# Windows (Git Bash hoặc WSL)
bash scripts/deploy-vercel.sh

# Hoặc chạy từng bước:
bash scripts/cleanup-for-deploy.sh
npm run build
vercel --prod
```

#### **Option B: Manual Deploy**

```bash
# 1. Clean up
npm run clean          # Remove .next and cache

# 2. Test build
npm run build          # Ensure build works

# 3. Deploy to Vercel
vercel --prod
```

---

## 🎯 **VERCEL SẼ TỰ ĐỘNG:**

1. ✅ Ignore files trong `.vercelignore`
2. ✅ Install `node_modules` từ `package.json`
3. ✅ Run `npm run build` để tạo `.next/`
4. ✅ Deploy chỉ production files
5. ✅ Setup CDN, Edge functions
6. ✅ Enable automatic HTTPS

---

## 📦 **CÁC FILES ĐƯỢC DEPLOY (< 500MB)**

### ✅ **Sẽ Deploy:**
- `src/` - Source code (~50-100MB)
- `public/` - Static assets (~10-50MB)
- `prisma/` - Database schema (~1-5MB)
- `package.json`, `package-lock.json`
- `next.config.js`
- `tsconfig.json`
- `tailwind.config.*`, `postcss.config.*`

### ❌ **KHÔNG Deploy:**
- `node_modules/` (Vercel install lại)
- `.next/` (Vercel build lại)
- `.git/`, `.github/`
- `__tests__/`, coverage
- `.storybook/`, logs, backups
- Docker files, CI/CD configs

---

## 🔍 **VERIFY DEPLOYMENT**

```bash
# 1. Check deployment status
vercel ls

# 2. View recent deployment
vercel inspect <deployment-url>

# 3. View logs
vercel logs <deployment-url>

# 4. Test health endpoint
curl https://firbox.net/api/health

# 5. Run post-deploy verification
npm run verify:production
```

---

## 🐛 **TROUBLESHOOTING**

### **Lỗi: "Deployment size exceeds limit"**
```bash
# Kiểm tra kích thước project
du -sh * | sort -rh | head -10

# Ensure .vercelignore is working
vercel --debug

# Manual cleanup
rm -rf .next node_modules/.cache
```

### **Lỗi: "Build failed"**
```bash
# Test build locally first
npm run build

# Check logs
vercel logs <deployment-url>

# Enable debug mode
vercel --prod --debug
```

### **Lỗi: "Environment variables not found"**
```bash
# List current env vars
vercel env ls

# Pull env vars locally (for testing)
vercel env pull .env.local

# Re-add missing variables
vercel env add VARIABLE_NAME production
```

### **Lỗi: "Database connection failed"**
```bash
# Verify DATABASE_URL is set
vercel env ls | grep DATABASE_URL

# Test connection locally
npm run db:setup
```

---

## 📚 **USEFUL COMMANDS**

```bash
# Deploy to preview (not production)
vercel

# Deploy to production
vercel --prod

# Deploy with specific project
vercel --prod --scope=your-team

# Rollback to previous deployment
vercel rollback <deployment-url>

# View all deployments
vercel ls

# View project info
vercel project ls

# Remove project
vercel remove my-saas-chat
```

---

## 🎨 **CUSTOM DOMAIN SETUP**

### **Nếu dùng firbox.net:**

1. Vào Vercel Dashboard → Project → Settings → Domains
2. Add domain: `firbox.net`
3. Vercel sẽ cho bạn DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Thêm records vào DNS provider (Cloudflare, GoDaddy, etc.)
5. Wait 24-48h for propagation
6. Verify: https://firbox.net

---

## 🔐 **SECURITY CHECKLIST**

- [ ] ✅ Tất cả ENV vars đã set trong Vercel Dashboard
- [ ] ✅ Không commit `.env` files lên Git
- [ ] ✅ `AUTH_SECRET` đủ mạnh (64 chars)
- [ ] ✅ `DATABASE_URL` dùng connection pooling
- [ ] ✅ API keys không exposed ra client
- [ ] ✅ CORS configured đúng
- [ ] ✅ Rate limiting enabled
- [ ] ✅ Sentry/monitoring configured

---

## 📊 **MONITORING**

### **Vercel Dashboard:**
- https://vercel.com/dashboard
- Real-time logs
- Analytics
- Performance metrics

### **Application Monitoring:**
```bash
# Health check
curl https://firbox.net/api/health

# Usage metrics
curl https://firbox.net/api/metrics/health

# Sentry errors
# → Check https://sentry.io
```

---

## 🚀 **DEPLOYMENT WORKFLOW**

```bash
# 1. Development
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "feat: add new feature"

# 2. Push to GitHub
git push origin feature/new-feature

# 3. Vercel auto-deploys preview
# → Check preview URL in GitHub PR

# 4. Merge to main
git checkout main
git merge feature/new-feature
git push origin main

# 5. Vercel auto-deploys to production
# → https://firbox.net updated automatically

# 6. Verify
npm run verify:production
```

---

## 📞 **HỖ TRỢ**

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Support:** https://vercel.com/support

---

## 🎉 **DONE!**

Sau khi deploy thành công:
1. ✅ App chạy trên: https://firbox.net
2. ✅ API routes: https://firbox.net/api/*
3. ✅ Auto HTTPS enabled
4. ✅ CDN enabled globally
5. ✅ Auto scaling

**Happy deploying! 🚀**

# 🚀 Azure Deployment Fix - Missing .next Build

## 🚨 Vấn đề phát hiện từ Azure Logs

### **Lỗi chính**: "Could not find a production build in the '.next' directory"

```
❌ Failed to prepare Next.js app: Error: Could not find a production build in the '.next' directory. 
Try building your app with 'next build' before starting the production server.
```

**Nguyên nhân**: GitHub Actions workflow không build ứng dụng Next.js trước khi deploy lên Azure.

## 🔧 Giải pháp đã áp dụng

### **1. Sửa GitHub Actions Workflow** ✅

**File**: `.github/workflows/main_firbox-api.yml`

#### **BEFORE** (❌):
```yaml
- name: npm install, build, and test
  run: |
    npm install
    npm run build --if-present  # ← --if-present = skip nếu không có
    npm run test --if-present

- name: Upload artifact for deployment job
  uses: actions/upload-artifact@v4
  with:
    name: node-app
    path: .  # ← Upload tất cả, bao gồm cả .git, logs
```

#### **AFTER** (✅):
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- name: Install dependencies
  run: npm ci

- name: Generate Prisma Client
  run: npx prisma generate
  env:
    SKIP_ENV_VALIDATION: 1

- name: Type check
  run: npm run type-check

- name: Build application
  run: npm run build  # ← FORCE build, không skip
  env:
    NODE_ENV: production
    SKIP_ENV_VALIDATION: 1
    NEXT_TELEMETRY_DISABLED: 1

- name: Create deployment package
  run: |
    mkdir deploy-package
    cp -r .next deploy-package/          # ← QUAN TRỌNG: Include .next
    cp -r src deploy-package/
    cp -r prisma deploy-package/
    cp -r public deploy-package/
    cp -r node_modules deploy-package/
    cp package.json deploy-package/
    cp server.js deploy-package/
    cp web.config deploy-package/

- name: Upload artifact for deployment job
  uses: actions/upload-artifact@v4
  with:
    name: node-app
    path: deploy-package/  # ← Chỉ upload package cần thiết
```

### **2. Tạo Verification Scripts** ✅

#### **verify-deployment-package.js**
- Kiểm tra `.next` folder có tồn tại
- Verify các file quan trọng: `BUILD_ID`, `server/`, `static/`
- Check `server.js` và `web.config`

#### **test-build-local.ps1**  
- Test build process locally
- Verify deployment package
- Test server startup

### **3. Cập nhật package.json** ✅
```json
{
  "scripts": {
    "verify:deployment": "node verify-deployment-package.js"
  }
}
```

## 📦 Deployment Package Structure

### **Trước đây** (❌):
```
artifact/
├── src/
├── package.json
├── server.js
├── web.config
├── node_modules/
└── (THIẾU .next/) ← Nguyên nhân lỗi
```

### **Bây giờ** (✅):
```
deploy-package/
├── .next/              ← QUAN TRỌNG: Next.js build output
│   ├── BUILD_ID
│   ├── package.json
│   ├── server/
│   └── static/
├── src/
├── prisma/
├── public/
├── node_modules/
├── package.json
├── server.js
└── web.config
```

## 🧪 Testing & Verification

### **Local Testing**
```bash
# Test build process
.\test-build-local.ps1

# Verify deployment package
npm run verify:deployment

# Manual verification
npm run build
ls .next/  # Should contain: BUILD_ID, package.json, server/, static/
```

### **GitHub Actions Testing**
1. Commit và push changes
2. Monitor GitHub Actions workflow
3. Check build logs for `.next` creation
4. Verify artifact contains `.next` folder

### **Azure Testing**
1. Deploy via GitHub Actions
2. Check Azure logs for successful startup
3. Test health endpoint: `/api/health`

## 📊 Expected Results

### **GitHub Actions** ✅
```
✅ Install dependencies
✅ Generate Prisma Client  
✅ Type check passed
✅ Build completed (.next created)
✅ Deployment package created
✅ Artifact uploaded
✅ Deploy to Azure successful
```

### **Azure App Service Logs** ✅
```
🚀 Starting Next.js server...
📍 Environment: production
🔌 Port: 8080
🌐 Hostname: 0.0.0.0
✅ Server ready on http://0.0.0.0:8080
🏥 Health check: http://0.0.0.0:8080/api/health
```

### **Health Endpoint** ✅
```bash
curl https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/health
# Expected: 200 OK with health status
```

## 🚀 Deployment Steps

### **1. Deploy the fixes**
```bash
git add .
git commit -m "fix: Azure deployment with proper Next.js build process"
git push origin main
```

### **2. Monitor deployment**
- GitHub Actions: Check build and deploy steps
- Azure Portal: Monitor App Service startup
- Logs: `az webapp log tail --name firbox-api --resource-group firbox-rg`

### **3. Verify success**
```bash
# Test health endpoint
curl -i https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"healthy","timestamp":"...","uptime":123,...}
```

## 🔧 Troubleshooting

### **If build still fails**:
1. Check GitHub Actions logs for build errors
2. Verify environment variables are set
3. Check TypeScript errors

### **If deployment fails**:
1. Check artifact contains `.next` folder
2. Verify `server.js` and `web.config` are included
3. Check Azure App Service configuration

### **If app doesn't start**:
1. Check Azure logs for startup errors
2. Verify `PORT` environment variable
3. Check database connection strings

## 📋 Checklist

- [x] Fixed GitHub Actions workflow
- [x] Added proper build step
- [x] Include `.next` in deployment package
- [x] Created verification scripts
- [x] Updated documentation
- [ ] Deploy and test on Azure
- [ ] Verify health endpoint works
- [ ] Confirm Azure Health Check passes

**🎯 Root cause identified and fixed: Missing `.next` build output in deployment package!** 🎉

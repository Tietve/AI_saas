# 🚀 Azure Deployment Options - Fix Missing .next

## 🚨 Vấn đề hiện tại
**Lỗi**: "Could not find a production build in the '.next' directory"
**Nguyên nhân**: .next folder không được deploy lên Azure

## 🔧 3 Giải pháp để thử

### **OPTION 1: GitHub Actions Build + ZIP Deploy** ✅ (Recommended)

**File**: `.github/workflows/main_firbox-api.yml` (đã sửa)

**Cách hoạt động**:
1. GitHub Actions build Next.js → tạo `.next`
2. Tạo ZIP package với `.next` included
3. Deploy ZIP lên Azure

**Ưu điểm**:
- Kiểm soát hoàn toàn build process
- Debug được nếu có lỗi
- Consistent build environment

**Deploy command**:
```bash
git add .
git commit -m "fix: improved deployment with ZIP package and .next verification"
git push origin main
```

### **OPTION 2: Azure Built-in Build** 🆕 (Alternative)

**File**: `.github/workflows/azure-build-test.yml` (mới tạo)

**Cách hoạt động**:
1. Upload source code lên Azure (không build)
2. Azure tự build Next.js trên server
3. Azure tạo `.next` folder

**Ưu điểm**:
- Không cần build trên GitHub Actions
- Azure environment chính xác
- Faster upload (chỉ source code)

**Deploy command**:
```bash
# Trigger manual workflow
# Đi tới GitHub Actions → "Azure Build Test" → "Run workflow"
```

### **OPTION 3: Manual ZIP Upload** 🛠️ (Backup)

**Cách hoạt động**:
1. Build local
2. Tạo ZIP manual
3. Upload qua Azure Portal

**Commands**:
```bash
# Build local
npm run build

# Verify .next exists
ls .next/

# Create ZIP
zip -r azure-deploy.zip .next src prisma public package.json server.js web.config node_modules

# Upload via Azure Portal → Deployment Center → ZIP Deploy
```

## 🎯 Recommended Approach

### **Bước 1: Thử Option 1 (GitHub Actions + ZIP)**
```bash
git add .
git commit -m "fix: improved deployment with ZIP package and .next verification"  
git push origin main
```

**Monitor**: GitHub Actions logs sẽ show:
- ✅ ".next directory created successfully"
- ✅ "ZIP package created"
- ✅ ".next directory found in extracted package"

### **Bước 2: Nếu Option 1 fail, thử Option 2 (Azure Build)**
1. Đi tới GitHub Actions
2. Chọn "Azure Build Test" workflow
3. Click "Run workflow"
4. Monitor Azure logs

### **Bước 3: Nếu cả 2 fail, dùng Option 3 (Manual)**

## 🔍 Debug Commands

### **Check GitHub Actions Artifact**
```bash
# Download artifact từ GitHub Actions
# Unzip và check:
unzip node-app.zip
ls -la
ls -la .next/  # Should exist
```

### **Check Azure Files**
```bash
# SSH vào Azure container (nếu có)
az webapp ssh --name firbox-api --resource-group firbox-rg

# Hoặc check via Kudu
# https://firbox-api.scm.azurewebsites.net/DebugConsole
# Navigate to /home/site/wwwroot
# Check if .next exists
```

### **Check Azure Build Logs**
```bash
# Monitor deployment
az webapp log tail --name firbox-api --resource-group firbox-rg

# Check build logs
az webapp log download --name firbox-api --resource-group firbox-rg
```

## 📊 Expected Results

### **Option 1 Success**:
```
✅ GitHub Actions: Build completed, .next created
✅ ZIP package: Contains .next folder
✅ Azure deployment: Successful
✅ Azure logs: Server ready on port 8080
✅ Health check: 200 OK
```

### **Option 2 Success**:
```
✅ GitHub Actions: Source uploaded
✅ Azure build: Next.js build completed
✅ Azure logs: .next created, server ready
✅ Health check: 200 OK
```

## 🚀 Action Plan

**Ngay bây giờ - thử Option 1**:
```bash
git add .
git commit -m "fix: multiple deployment strategies for .next folder issue"
git push origin main
```

**Nếu vẫn fail - thử Option 2**:
- Đi GitHub Actions → "Azure Build Test" → "Run workflow"

**Monitor kết quả**:
- GitHub Actions logs
- Azure App Service logs  
- Health endpoint test

**🎯 Mục tiêu**: Azure logs show "Server ready" thay vì "Could not find production build"**

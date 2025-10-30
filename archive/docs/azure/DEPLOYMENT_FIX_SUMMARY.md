# 🚀 Azure Deployment Fix Summary

## 🔍 Vấn đề đã phát hiện

### 1. **Infinite Loop trong Rewrites** ❌
- `next.config.js` có rewrites proxy tất cả `/api/*` requests đến chính Azure backend
- Khi deploy lên Azure, app sẽ proxy requests đến chính nó → infinite loop
- **Đã sửa**: Loại bỏ rewrites trong `next.config.js`

### 2. **Thiếu cấu hình IIS** ❌  
- Azure App Service (Windows) cần `web.config` để IIS route requests đến Node.js
- Không có `web.config` → IIS trả 404 "resource has been removed"
- **Đã sửa**: Tạo `web.config` với IIS rewrite rules

### 3. **Startup Command không đúng** ❌
- `package.json` có `start: "next start -p $PORT"` 
- Azure cần custom server để handle PORT environment variable
- **Đã sửa**: Tạo `server.js` và update `start: "node server.js"`

## 🛠️ Các file đã tạo/sửa

### ✅ `server.js` (MỚI)
```javascript
// Custom server cho Azure App Service
// Đảm bảo app listen đúng process.env.PORT
const { createServer } = require('http')
const next = require('next')

const port = process.env.PORT || 3000
const app = next({ dev: false, hostname: '0.0.0.0', port })
```

### ✅ `web.config` (MỚI)  
```xml
<!-- IIS configuration cho Azure App Service -->
<handlers>
  <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
</handlers>
<rewrite>
  <rules>
    <rule name="DynamicContent">
      <action type="Rewrite" url="server.js"/>
    </rule>
  </rules>
</rewrite>
```

### ✅ `next.config.js` (SỬA)
```javascript
// REMOVED: API Rewrites that caused infinite loop
// async rewrites() { ... } ← Đã xóa
```

### ✅ `package.json` (SỬA)
```json
{
  "scripts": {
    "start": "node server.js",  // ← Đã đổi từ "next start -p $PORT"
    "start:next": "next start -p $PORT"
  }
}
```

### ✅ `.github/workflows/main_firbox-api.yml` (SỬA)
- Thêm build step với `NODE_ENV=production`
- Cập nhật artifact upload để include `server.js` và `web.config`

## 🎯 Kết quả mong đợi

Sau khi deploy:

1. **✅ App sẽ start đúng** với `node server.js`
2. **✅ IIS sẽ route requests** đến Node.js app qua `web.config`  
3. **✅ `/api/health` sẽ trả 200 OK** thay vì 404
4. **✅ Không còn infinite loop** vì đã xóa rewrites

## 🚀 Cách deploy

### Option 1: GitHub Actions (Tự động)
```bash
git add .
git commit -m "fix: Azure deployment configuration for /api/health endpoint"
git push origin main
```

### Option 2: Manual deploy (PowerShell)
```powershell
# Chạy script deploy
.\deploy-azure-fix.ps1
```

## 🏥 Test Health Endpoint

Sau deploy, test:
```bash
curl https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/health
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "time": "2025-10-23T13:45:00.000Z"
}
```

## 📋 Checklist

- [x] Loại bỏ rewrites gây infinite loop
- [x] Tạo `server.js` cho Azure startup  
- [x] Tạo `web.config` cho IIS routing
- [x] Cập nhật `package.json` start script
- [x] Cập nhật GitHub Actions workflow
- [ ] Deploy và test `/api/health` endpoint
- [ ] Verify Health Check trong Azure Portal

---

**🎯 Mục tiêu**: `/api/health` trả 200 OK trên Azure App Service

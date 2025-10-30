# 🔍 Debug Production API Errors

> **Quick fix cho lỗi 400/404 khi deploy lên Azure hoặc Vercel**

## 🚨 Bạn đang gặp vấn đề này?

- ✅ Localhost chạy OK
- ❌ Production bị lỗi: `400 Bad Request` hoặc `404 Not Found`
- ❌ Console báo: "Failed to load messages" hoặc "HTTP 404"

## ⚡ Fix Ngay (30 giây)

### Windows:
```powershell
.\test-api-errors.ps1
```

### Mac/Linux:
```bash
npm run test:api:azure
```

Script này sẽ:
- ✅ Test tất cả API endpoints
- ✅ Cho biết endpoint nào bị lỗi
- ✅ Hiển thị error details để fix

## 📖 Hướng Dẫn Chi Tiết

| File | Mục đích |
|------|----------|
| [HOW_TO_DEBUG_API.md](./HOW_TO_DEBUG_API.md) | 📚 Hướng dẫn tổng quan |
| [DEBUG_API_QUICK_START.md](./DEBUG_API_QUICK_START.md) | ⚡ Quick start |
| [docs/DEBUG_PRODUCTION_ERRORS.md](./docs/DEBUG_PRODUCTION_ERRORS.md) | 🔧 Debug đầy đủ |

## 🔧 Files Đã Tạo

### Test Scripts
- ✅ `test-api-errors.ps1` - PowerShell test script
- ✅ `scripts/test-api-detailed.ts` - Node.js test script
- ✅ Added npm commands: `npm run test:api`

### Documentation
- ✅ `HOW_TO_DEBUG_API.md` - Tổng quan
- ✅ `DEBUG_API_QUICK_START.md` - Quick start
- ✅ `docs/DEBUG_PRODUCTION_ERRORS.md` - Chi tiết đầy đủ

## 🎯 Common Fixes

### Fix 1: Redeploy
```bash
git commit --allow-empty -m "Redeploy"
git push
```

### Fix 2: Check Logs
```bash
az webapp log tail --name firbox-api --resource-group firbox-rg
```

### Fix 3: Regenerate Prisma
```bash
az webapp ssh --name firbox-api --resource-group firbox-rg
npx prisma generate
```

## 💡 Next Steps

1. **Run test script** → Xác định lỗi
2. **Check logs** → Tìm root cause  
3. **Apply fix** → Sử dụng common fixes
4. **Redeploy** → Deploy lại
5. **Verify** → Test lại

---

**Need help?** Xem [HOW_TO_DEBUG_API.md](./HOW_TO_DEBUG_API.md) để biết chi tiết! 🚀


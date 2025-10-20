# 🎯 BẮT ĐẦU TẠI ĐÂY - Debug API Errors

> **Bạn đang gặp lỗi 400/404 trên Azure/Vercel? Đây là giải pháp!**

---

## ⚡ Fix Nhanh (2 phút)

### Windows PowerShell:
```powershell
.\test-api-errors.ps1 -TestEmail "email@gmail.com" -TestPassword "Pass123"
```

### Mac/Linux/WSL:
```bash
npm run diagnose:azure
```

**Kết quả:** Script sẽ tự động:
- ✅ Test tất cả API endpoints
- ❌ Chỉ ra endpoints nào bị lỗi
- 💡 Đưa ra cách fix cụ thể

---

## 📋 3 Bước Debug

### Bước 1: Chạy Diagnostic (30 giây)

```bash
npm run diagnose:azure
```

**Output mẫu:**
```
✅ Health Check: API is responding
❌ Route /api/chat/send: 404 Not Found
❌ Messages Endpoint: 400 Bad Request

💡 Recommendations:
   1. Redeploy to fix 404 routes
   2. Check database connection for 400 errors
```

### Bước 2: Xem Logs (1 phút)

```bash
# Azure
az webapp log tail --name firbox-api --resource-group firbox-rg

# Hoặc mở Azure Portal → App Services → firbox-api → Log stream
```

**Tìm gì:** Dòng có chữ `ERROR`, `FAIL`, hoặc `400`/`404`

### Bước 3: Apply Fix (5 phút)

Chọn fix phù hợp:

#### Fix A: Route 404 (Không tìm thấy route)
```bash
git commit --allow-empty -m "Redeploy"
git push
```

#### Fix B: Messages 400 (Lỗi database)
```bash
az webapp ssh --name firbox-api --resource-group firbox-rg
npx prisma generate
npx prisma migrate deploy
exit
```

#### Fix C: Auth 401 (Lỗi authentication)
```bash
# Check AUTH_SECRET
az webapp config appsettings list --name firbox-api --resource-group firbox-rg | grep AUTH_SECRET

# Set nếu thiếu
az webapp config appsettings set --name firbox-api --resource-group firbox-rg \
  --settings AUTH_SECRET="your-secret-at-least-32-chars"
```

---

## 📁 Các File Quan Trọng

| Khi nào | Đọc file nào |
|---------|--------------|
| Muốn fix ngay | `DEBUG_README.md` |
| Muốn hiểu workflow | `HOW_TO_DEBUG_API.md` |
| Cần hướng dẫn đầy đủ | `docs/DEBUG_PRODUCTION_ERRORS.md` |
| Xem tổng kết tools | `DEBUGGING_TOOLS_SUMMARY.md` |

---

## 🎯 Các Lệnh Hay Dùng

### Test & Diagnose
```bash
npm run diagnose:azure              # Tự động chẩn đoán
npm run test:api:azure              # Test chi tiết
npm run test:api                    # Test custom URL
```

### Azure Logs
```bash
az webapp log tail --name firbox-api --resource-group firbox-rg
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip
```

### Azure Management
```bash
az webapp restart --name firbox-api --resource-group firbox-rg
az webapp ssh --name firbox-api --resource-group firbox-rg
az webapp config appsettings list --name firbox-api --resource-group firbox-rg
```

---

## 🔍 Hiểu Output

### ✅ Good (Không cần fix)
```
✅ Health Check: API is responding
✅ Route /api/health: Exists (200)
✅ Database Check: Database queries working
```

### ⚠️ Warning (Nên xem nhưng không critical)
```
⚠️  Cookie Config: Cookie security flags missing
⚠️  User already exists, trying signin...
```

### ❌ Error (CẦN FIX NGAY)
```
❌ Route /api/chat/send: 404 Not Found
❌ Messages Endpoint: 400 Bad Request
❌ Database Check: Could not authenticate
```

---

## 💡 Tips Pro

1. **Luôn check logs trước:**
   ```bash
   az webapp log tail --name firbox-api --resource-group firbox-rg | grep ERROR
   ```

2. **So sánh local vs production:**
   ```bash
   TEST_API_URL="http://localhost:3000" npm run diagnose
   npm run diagnose:azure
   ```

3. **Test sau mỗi deploy:**
   ```bash
   git push && sleep 60 && npm run diagnose:azure
   ```

4. **Monitor realtime:**
   ```bash
   # Terminal 1: Logs
   az webapp log tail --name firbox-api --resource-group firbox-rg
   
   # Terminal 2: Test
   npm run test:api:azure
   ```

---

## 🆘 Vẫn Không Fix Được?

### Tạo report:
```bash
# 1. Diagnostic
npm run diagnose:azure > report.txt 2>&1

# 2. Logs
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip

# 3. Env vars (remove sensitive data)
az webapp config appsettings list --name firbox-api --resource-group firbox-rg > env.txt
```

### Gửi kèm:
- [ ] report.txt
- [ ] logs.zip
- [ ] env.txt (đã che sensitive data)
- [ ] Browser console errors (F12)
- [ ] Mô tả: "Hoạt động OK ở localhost, lỗi gì trên production"

---

## ✅ Checklist Sau Khi Fix

- [ ] Chạy `npm run diagnose:azure` - Tất cả ✅
- [ ] Test trên browser - Load messages OK
- [ ] Test send chat - Gửi được tin nhắn
- [ ] Check logs - Không có ERROR mới
- [ ] Test tất cả features chính
- [ ] Document issue + fix (nếu là bug mới)

---

## 🎓 Học Thêm

### Tài liệu chi tiết:
1. [DEBUG_README.md](./DEBUG_README.md) - Overview
2. [HOW_TO_DEBUG_API.md](./HOW_TO_DEBUG_API.md) - Complete workflow
3. [docs/DEBUG_PRODUCTION_ERRORS.md](./docs/DEBUG_PRODUCTION_ERRORS.md) - Technical deep dive

### Related:
- [docs/AZURE_DEPLOYMENT.md](./docs/AZURE_DEPLOYMENT.md) - Azure setup
- [docs/OBSERVABILITY_SETUP.md](./docs/OBSERVABILITY_SETUP.md) - Logging
- [docs/ENVIRONMENT_VARS.md](./docs/ENVIRONMENT_VARS.md) - Env vars

---

## 🎉 Kết Luận

Bạn đã có:
- ✅ Tools tự động test & diagnose
- ✅ Documentation đầy đủ
- ✅ Quick fixes cho common issues
- ✅ Commands để manage Azure
- ✅ Workflow rõ ràng

**Bây giờ hãy:**
```bash
npm run diagnose:azure
```

Và làm theo recommendations! 🚀

---

*Need quick help? Start with DEBUG_README.md*  
*Need full guide? Read HOW_TO_DEBUG_API.md*  
*Technical details? See docs/DEBUG_PRODUCTION_ERRORS.md*


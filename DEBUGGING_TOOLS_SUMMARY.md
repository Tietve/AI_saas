# 🎉 Debugging Tools - Hoàn Thành!

## ✅ Những gì đã được tạo

Tôi đã tạo một bộ công cụ hoàn chỉnh để debug lỗi 400/404 trên production (Azure/Vercel).

---

## 📁 Files Mới

### 1. Test Scripts

| File | Mô tả | Cách dùng |
|------|-------|-----------|
| `test-api-errors.ps1` | PowerShell script test API đầy đủ | `.\test-api-errors.ps1` |
| `scripts/test-api-detailed.ts` | Node.js script test chi tiết | `npm run test:api` |
| `scripts/diagnose-production.ts` | Tool chẩn đoán tự động | `npm run diagnose` |

### 2. Documentation

| File | Nội dung |
|------|----------|
| `DEBUG_README.md` | Quick overview |
| `DEBUG_API_QUICK_START.md` | Hướng dẫn nhanh nhất |
| `HOW_TO_DEBUG_API.md` | Hướng dẫn tổng quan |
| `docs/DEBUG_PRODUCTION_ERRORS.md` | Hướng dẫn đầy đủ, chi tiết |
| `DEBUGGING_TOOLS_SUMMARY.md` | File này - tổng kết |

### 3. Package.json Scripts

```json
{
  "test:api": "Test API với custom URL",
  "test:api:azure": "Test Azure API",
  "diagnose": "Chẩn đoán production",
  "diagnose:azure": "Chẩn đoán Azure"
}
```

---

## 🚀 Cách Sử Dụng

### Quick Start (Khuyên dùng)

```powershell
# Windows - Chạy ngay không cần setup
.\test-api-errors.ps1 -TestEmail "your-email@gmail.com" -TestPassword "YourPass123"
```

```bash
# Mac/Linux - Cần có Node.js
npm run test:api:azure
```

### Chẩn đoán tự động

```bash
# Chạy diagnostic tool - tự động phát hiện vấn đề
npm run diagnose:azure

# Output sẽ cho biết:
# ✅ Những gì hoạt động
# ❌ Những gì bị lỗi
# 💡 Cách fix
```

### Test chi tiết

```bash
# Test từng endpoint một cách chi tiết
npm run test:api:azure

# Với custom URL
TEST_API_URL="https://your-app.vercel.app" npm run test:api
```

---

## 🎯 Các Tính Năng

### Test Script Features

✅ **Test tất cả endpoints:**
- Health check
- CSRF token
- Authentication (signup/signin)
- Conversations list
- Messages (phát hiện lỗi 400)
- Chat send (phát hiện lỗi 404)

✅ **Detailed logging:**
- Request/Response headers
- Cookies
- Error messages
- Status codes

✅ **Authentication flow:**
- Tự động signup/signin
- Lưu cookies
- Test authenticated endpoints

### Diagnostic Tool Features

✅ **Tự động phát hiện:**
- Routes không tồn tại (404)
- Database issues
- Cookie/Session problems
- CORS configuration
- Response headers

✅ **Recommendations:**
- Đưa ra gợi ý fix cụ thể
- Prioritize theo độ nghiêm trọng
- Commands sẵn để chạy

---

## 📊 Output Mẫu

### Test Script Output

```
🧪 API Error Debugging Script
==================================================
Target: https://firbox-api-xxx.azurewebsites.net

📋 Test 1: Health Check
🔵 GET /api/health
   ✅ Status: 200

📋 Test 2: Available Routes
🔵 GET /api/health
   ✅ Status: 200
🔵 POST /api/chat/send
   ❌ 404 - Route NOT FOUND ← Đây là vấn đề!

📋 Test 4: Conversations & Messages
🔵 GET /api/conversations
   ✅ Found 3 conversations
🔵 GET /api/conversations/xxx/messages
   ❌ 400 Bad Request ← Đây là vấn đề!
   Response: {"error": "INTERNAL_SERVER_ERROR"}
```

### Diagnostic Output

```
🔍 Production Diagnostic Tool
==================================================

✅ Health Check: API is responding
✅ Route /api/health: Exists (200)
❌ Route /api/chat/send: 404 Not Found
⚠️  Cookie Config: Cookie security flags missing
❌ Messages Endpoint: 400 Bad Request

📊 Diagnostic Summary
==================================================
Total Tests: 12
✅ Passed: 8
❌ Failed: 2
⚠️  Warnings: 2

🔴 Critical Issues Found:
   - Route /api/chat/send: 404 Not Found
   - Messages Endpoint: 400 Bad Request

💡 Recommendations:
   1. Some routes are returning 404
      → Redeploy: git commit --allow-empty -m "Redeploy"
   2. Messages endpoint returning 400
      → Check server logs
```

---

## 🛠️ Common Fixes

Dựa vào output của tools, áp dụng các fix sau:

### Fix 1: Route 404 (File không được deploy)

```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push origin main

# Verify sau khi deploy
npm run diagnose:azure
```

### Fix 2: Messages 400 (Database/Prisma issue)

```bash
# Azure: Regenerate Prisma
az webapp ssh --name firbox-api --resource-group firbox-rg
cd /home/site/wwwroot
npx prisma generate
npx prisma migrate deploy
exit

# Restart app
az webapp restart --name firbox-api --resource-group firbox-rg

# Test lại
npm run test:api:azure
```

### Fix 3: Auth/Cookie Issues

```bash
# Check env vars
az webapp config appsettings list --name firbox-api --resource-group firbox-rg | grep -E "(AUTH_SECRET|SESSION)"

# Set if missing
az webapp config appsettings set --name firbox-api --resource-group firbox-rg \
  --settings AUTH_SECRET="your-secret-min-32-chars"
```

### Fix 4: Check Logs

```bash
# Real-time logs
az webapp log tail --name firbox-api --resource-group firbox-rg | grep -E "(ERROR|WARN|Failed)"

# Specific endpoint
az webapp log tail --name firbox-api --resource-group firbox-rg | grep "conversations.*messages"
```

---

## 📖 Documentation Structure

```
Root Level (Quick Access):
├── DEBUG_README.md .................... TL;DR version
├── DEBUG_API_QUICK_START.md ........... Quick start guide
├── HOW_TO_DEBUG_API.md ................ Comprehensive guide
└── DEBUGGING_TOOLS_SUMMARY.md ......... This file

Detailed Docs:
└── docs/
    └── DEBUG_PRODUCTION_ERRORS.md ..... Full technical guide

Scripts:
├── test-api-errors.ps1 ................ PowerShell test
└── scripts/
    ├── test-api-detailed.ts ........... Node test
    └── diagnose-production.ts ......... Diagnostic tool
```

**Đọc file nào?**
- Muốn fix nhanh → `DEBUG_README.md`
- Muốn hiểu rõ → `HOW_TO_DEBUG_API.md`
- Technical deep dive → `docs/DEBUG_PRODUCTION_ERRORS.md`

---

## 💡 Workflow Đề Xuất

### Khi gặp lỗi production:

1. **Chạy diagnostic** (30 giây)
   ```bash
   npm run diagnose:azure
   ```

2. **Xem logs** (1 phút)
   ```bash
   az webapp log tail --name firbox-api --resource-group firbox-rg
   ```

3. **Apply fix** dựa vào recommendations (5-10 phút)
   - 404 → Redeploy
   - 400 → Check database/Prisma
   - 401 → Check auth config

4. **Verify fix** (30 giây)
   ```bash
   npm run test:api:azure
   ```

5. **Monitor** (ongoing)
   ```bash
   # Keep this running
   az webapp log tail --name firbox-api --resource-group firbox-rg | grep ERROR
   ```

**Total time:** ~10-15 phút từ lúc phát hiện đến fix xong! ⚡

---

## 🎓 Best Practices

### Do's ✅

1. **Chạy tests sau mỗi deploy**
   ```bash
   # Add to CI/CD
   npm run diagnose:azure
   ```

2. **Monitor logs continuously**
   ```bash
   az webapp log tail --name firbox-api --resource-group firbox-rg
   ```

3. **Compare local vs production**
   ```bash
   TEST_API_URL="http://localhost:3000" npm run test:api
   npm run test:api:azure
   ```

4. **Keep env vars in sync**
   - Document all required vars
   - Verify after each deployment

### Don'ts ❌

1. ❌ Deploy without testing
2. ❌ Ignore warnings from diagnostic
3. ❌ Skip checking logs
4. ❌ Assume "it works locally" means production is OK

---

## 🔮 Future Enhancements

Có thể thêm sau:

- [ ] GitHub Action tự động chạy tests
- [ ] Slack/Email notifications khi có lỗi
- [ ] Dashboard để visualize test results
- [ ] Automated rollback on failures
- [ ] Performance benchmarking
- [ ] Load testing integration

---

## 📞 Support

Nếu tools không giải quyết được vấn đề:

1. **Generate report:**
   ```bash
   npm run diagnose:azure > diagnostic-report.txt
   az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip
   ```

2. **Provide:**
   - Diagnostic report
   - Server logs
   - Browser console errors
   - Steps to reproduce

3. **Check documentation:**
   - `HOW_TO_DEBUG_API.md` - Workflow
   - `docs/DEBUG_PRODUCTION_ERRORS.md` - Technical details
   - `docs/OBSERVABILITY_SETUP.md` - Logging setup

---

## 🎊 Conclusion

Bạn giờ có:
- ✅ 3 test scripts (PowerShell, Node.js, Diagnostic)
- ✅ 5 documentation files
- ✅ 4 npm commands
- ✅ Complete debugging workflow
- ✅ Quick fixes for common issues

**Next Steps:**
1. Chạy `npm run diagnose:azure` ngay bây giờ
2. Fix các issues được phát hiện
3. Add tests vào CI/CD pipeline
4. Document các issues/fixes bạn gặp

Good luck! 🚀

---

*Created: $(date)*
*Tools Version: 1.0.0*
*Target: Azure Web Apps & Vercel*


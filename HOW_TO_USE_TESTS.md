# 🧪 Cách Sử Dụng Test Scripts

## ❓ Câu Hỏi Thường Gặp

### Q: Tôi có cần điền email/password vào code không?

**A: KHÔNG!** ❌ Đừng điền thông tin vào code files. Dùng environment variables hoặc command line.

---

## 📝 Cách Dùng Đúng

### Option 1: Dùng Environment Variables (Khuyên dùng)

```powershell
# Windows PowerShell
$env:TEST_EMAIL="23001467@hus.edu.vn"
$env:TEST_PASSWORD="Thienhuu"
npm run test:api:user
```

```bash
# Mac/Linux
TEST_EMAIL="23001467@hus.edu.vn" TEST_PASSWORD="Thienhuu" npm run test:api:user
```

### Option 2: Dùng PowerShell Script

```powershell
.\test-api-errors.ps1 -TestEmail "23001467@hus.edu.vn" -TestPassword "Thienhuu"
```

### Option 3: Dùng Node.js Script Trực Tiếp

```bash
# Với environment variables
TEST_EMAIL="23001467@hus.edu.vn" TEST_PASSWORD="Thienhuu" node scripts/test-existing-user.js
```

---

## ⚠️ Lưu Ý Quan Trọng

### ❌ ĐỪNG LÀM:
```typescript
// ❌ ĐỪNG hard-code credentials vào file!
const TEST_EMAIL = "23001467@hus.edu.vn"  // WRONG!
const TEST_PASSWORD = "Thienhuu"          // WRONG!
```

### ✅ NÊN LÀM:
```typescript
// ✅ Dùng environment variables
const TEST_EMAIL = process.env.TEST_EMAIL || `test_${Date.now()}@example.com`
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123456!'
```

---

## 🔐 Bảo Mật

### Tại sao không nên hard-code credentials?

1. **Git History**: Thông tin sẽ bị lưu trong git history mãi mãi
2. **Public Repository**: Nếu push lên public repo, ai cũng thấy được
3. **Security Risk**: Dễ bị hack tài khoản
4. **Best Practice**: Luôn dùng environment variables cho sensitive data

### Nếu đã accidentally commit:

```bash
# Nếu chưa push
git reset --soft HEAD~1
# Edit files để xóa credentials
git add .
git commit -m "Remove hardcoded credentials"

# Nếu đã push - cần thay đổi password ngay!
# Và cân nhắc dùng git filter-branch hoặc BFG Repo-Cleaner
```

---

## 📖 Examples Chi Tiết

### Test với tài khoản của bạn:

```powershell
# 1. Set environment variables
$env:TEST_EMAIL="23001467@hus.edu.vn"
$env:TEST_PASSWORD="Thienhuu"

# 2. Chọn một trong các commands sau:

# Test với existing user script
npm run test:api:user

# Hoặc test đầy đủ với diagnostic
npm run diagnose:azure

# Hoặc dùng PowerShell script
.\test-api-errors.ps1 -TestEmail "23001467@hus.edu.vn" -TestPassword "Thienhuu"
```

### Test trên Azure:

```powershell
# Test Azure API với tài khoản của bạn
$env:TEST_API_URL="https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net"
$env:TEST_EMAIL="23001467@hus.edu.vn"
$env:TEST_PASSWORD="Thienhuu"
npm run test:api:azure
```

### Test trên Vercel (hoặc domain khác):

```powershell
$env:TEST_API_URL="https://your-app.vercel.app"
$env:TEST_EMAIL="23001467@hus.edu.vn"
$env:TEST_PASSWORD="Thienhuu"
npm run test:api
```

---

## 🎯 Quick Reference

### Các npm commands có sẵn:

```bash
npm run test:api              # Test custom API URL
npm run test:api:azure        # Test Azure
npm run test:api:user         # Test với existing user
npm run diagnose              # Auto diagnostic
npm run diagnose:azure        # Diagnostic Azure
```

### Environment Variables:

| Variable | Mô tả | Mặc định |
|----------|-------|----------|
| `TEST_API_URL` | API URL để test | Azure URL |
| `TEST_EMAIL` | Email để test | Auto-generated |
| `TEST_PASSWORD` | Password để test | Test123456! |

---

## ✅ Type Check Đã Pass!

```bash
npx tsc --noEmit scripts/test-api-detailed.ts scripts/diagnose-production.ts
Exit code: 0 ✅
```

Tất cả lỗi TypeScript đã được fix. Bạn có thể push lên git an toàn!

---

## 🚀 Bây Giờ Làm Gì?

### Bước 1: Test local với tài khoản của bạn

```powershell
$env:TEST_EMAIL="23001467@hus.edu.vn"
$env:TEST_PASSWORD="Thienhuu"
npm run test:api:user
```

### Bước 2: Nếu OK, commit và push

```bash
git add .
git commit -m "fix: Resolve all TypeScript errors in test scripts"
git push origin main
```

### Bước 3: GitHub Actions sẽ tự động chạy type-check

Lần này sẽ pass! ✅

---

## 💡 Tips

1. **Đừng commit credentials** - Always use environment variables
2. **Check git status** trước khi commit
3. **Review changes** trong git diff
4. **Test local** trước khi push
5. **Monitor GitHub Actions** sau khi push

---

*Bạn KHÔNG cần edit bất kỳ file code nào để điền credentials!*  
*Chỉ cần dùng environment variables khi chạy tests.*


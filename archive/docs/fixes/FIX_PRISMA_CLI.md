# Fix Prisma CLI Not Found

## ⚠️ **VẤN ĐỀ**

```bash
Running "prisma generate && next build"
sh: line 1: prisma: command not found
```

**Nguyên nhân:**
- `prisma` CLI trong devDependencies
- Vercel không tìm thấy trong PATH

---

## ✅ **SOLUTION 1: Dùng npx (ĐÃ LÀM)** ⭐⭐⭐⭐⭐

```json
// vercel.json
{
  "buildCommand": "npx prisma generate && next build"
}
```

**Lợi ích:**
- ✅ Không cần sửa package.json
- ✅ npx tự động tìm trong node_modules/.bin
- ✅ Work ngay lập tức

---

## ✅ **SOLUTION 2: Move sang dependencies**

Nếu Solution 1 vẫn lỗi:

```bash
# Move prisma từ devDependencies → dependencies
npm install --save prisma
npm uninstall --save-dev prisma
```

**package.json sau khi move:**
```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "prisma": "^5.22.0"  // ← Moved here
  },
  "devDependencies": {
    // prisma removed
  }
}
```

**Lợi ích:**
- ✅ Prisma luôn được install
- ✅ Có trong PATH

**Nhược điểm:**
- ⚠️ Tăng bundle size một chút (không đáng kể)

---

## ✅ **SOLUTION 3: Custom install script**

```json
// vercel.json
{
  "installCommand": "npm install --legacy-peer-deps && npm install -g prisma",
  "buildCommand": "prisma generate && next build"
}
```

**Không khuyên dùng vì:**
- ⚠️ Cần install global
- ⚠️ Phức tạp không cần thiết

---

## 🧪 **TEST LOCAL**

```bash
# Test như Vercel sẽ chạy
rm -rf node_modules
npm install --legacy-peer-deps
npx prisma generate
npm run build
```

Should work! ✅

---

## 📊 **COMPARISON**

| Solution | Pros | Cons | Khuyên dùng |
|----------|------|------|-------------|
| **npx** | Nhanh, không sửa code | - | ⭐⭐⭐⭐⭐ |
| **Move to deps** | Luôn có sẵn | Bundle +5MB | ⭐⭐⭐⭐ |
| **Global install** | - | Phức tạp | ⭐⭐ |

---

**Status:** ✅ Fixed with npx
**Next:** Deploy and verify

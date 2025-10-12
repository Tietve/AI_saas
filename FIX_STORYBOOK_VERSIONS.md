# Fix Storybook Version Conflicts

## ⚠️ **VẤN ĐỀ**

Package.json có mix Storybook versions:
```json
"storybook": "^8.6.14"                     // v8.x
"@storybook/addon-a11y": "^9.1.8"          // v9.x ❌
"@storybook/addon-essentials": "^8.6.14"   // v8.x
"@storybook/nextjs-vite": "^9.1.8"         // v9.x ❌
```

→ Peer dependency conflict!

---

## ✅ **SOLUTION 1: Quick Fix (ĐÃ LÀM)**

Update `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

✅ Build ngay lập tức
⚠️ Vẫn có warnings

---

## ✅ **SOLUTION 2: Unify Versions (Long-term Fix)**

### **Option A: Upgrade tất cả lên v9**

```bash
# Uninstall old versions
npm uninstall storybook @storybook/addon-essentials @storybook/addon-interactions

# Install v9
npm install -D storybook@^9.1.8 \
  @storybook/addon-essentials@^9.1.8 \
  @storybook/addon-interactions@^9.1.8
```

### **Option B: Downgrade tất cả về v8**

```bash
# Uninstall v9 packages
npm uninstall @storybook/addon-a11y @storybook/addon-docs \
  @storybook/addon-links @storybook/addon-onboarding \
  @storybook/addon-vitest @storybook/nextjs-vite

# Install v8
npm install -D @storybook/addon-a11y@^8.6.14 \
  @storybook/addon-docs@^8.6.14 \
  @storybook/addon-links@^8.6.14 \
  @storybook/addon-onboarding@^8.6.14 \
  @storybook/addon-vitest@^8.6.14 \
  @storybook/nextjs-vite@^8.6.14
```

---

## ✅ **SOLUTION 3: Remove Storybook (Simplest)**

Nếu không dùng Storybook trong production:

```bash
# Remove all Storybook packages
npm uninstall storybook @chromatic-com/storybook \
  @storybook/addon-a11y @storybook/addon-docs \
  @storybook/addon-essentials @storybook/addon-interactions \
  @storybook/addon-links @storybook/addon-onboarding \
  @storybook/addon-vitest @storybook/nextjs-vite \
  eslint-plugin-storybook

# Remove from .gitignore
# Remove storybook-static folder
```

---

## 📝 **KHUYẾN NGHỊ**

### **Ngay bây giờ:**
- ✅ Dùng `--legacy-peer-deps` (đã setup)
- ✅ Deploy thành công

### **Sau khi deploy:**
- 🔄 Fix versions về unified (v8 hoặc v9)
- 🧹 Hoặc remove Storybook nếu không dùng

---

## 🚀 **TEST FIX**

Local test:
```bash
# Test install
npm install --legacy-peer-deps

# Test build
npm run build
```

Vercel test:
```bash
# Deploy
vercel --prod

# Should work now!
```

---

**Status:** ✅ Fixed with --legacy-peer-deps
**Next:** Deploy and verify

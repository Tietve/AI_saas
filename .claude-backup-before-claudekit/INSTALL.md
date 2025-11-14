# 🚀 Quick Install - Auto-Update System

## ⚡ 1-MINUTE SETUP

### Option 1: Recommended (Semi-Auto) ⭐⭐⭐
```bash
# Windows (PowerShell - chạy trong Git Bash hoặc PowerShell)
Copy-Item .claude\hooks\post-commit.ps1 .git\hooks\post-commit -Force

# Test
git add .
git commit -m "test: automation setup"
# Sẽ thấy reminder sau commit!
```

### Option 2: Full Auto (Advanced) 🚀
```bash
# Copy hooks
Copy-Item .claude\hooks\post-commit.ps1 .git\hooks\post-commit -Force

# Edit .git\hooks\post-commit
# Uncomment phần auto-update (xóa dấu #)

# Test
git add .
git commit -m "test: full auto"
# Index tự động regenerate!
```

---

## ✅ VERIFY SETUP

```bash
# Check hooks installed
dir .git\hooks\post-commit

# Test automation
npm run memory:check

# Should output analysis của changes
```

---

## 🎮 DAILY USAGE

### With Semi-Auto:
```
1. Code như bình thường
2. Commit: git commit -m "..."
3. Xem reminder (nếu cần update)
4. Run: npm run memory:update
5. Done!
```

### With Full Auto:
```
1. Code như bình thường
2. Commit: git commit -m "..."
3. Done! (tự động update)
```

---

## 📝 COMMANDS CHEAT SHEET

```bash
# Check if update needed
npm run memory:check

# Auto-update index
npm run memory:update

# Update + commit
npm run memory:commit

# Regenerate index only
npm run memory:regenerate

# Manual CLAUDE.md update
/memory
```

---

## 🔧 TROUBLESHOOTING

### Hook không chạy?
```powershell
# Check file exists
dir .git\hooks\post-commit

# Re-copy
Copy-Item .claude\hooks\post-commit.ps1 .git\hooks\post-commit -Force

# Check PowerShell execution policy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Script lỗi?
```bash
# Check Node.js
node --version

# Run manual để xem lỗi
node .claude/auto-update.js
```

---

## 📚 MORE INFO

- **Full Guide:** `.claude/AUTOMATION_GUIDE.md`
- **Manual Updates:** `.claude/UPDATE_GUIDE.md`
- **System Overview:** `.claude/README.md`

---

**🎉 Setup xong! Giờ memory files sẽ luôn up-to-date!**

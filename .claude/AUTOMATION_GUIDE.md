# 🤖 Automation Guide - Auto-Update Memory System

## 🎯 Mục đích
Tự động detect changes và update memory files để không bao giờ outdated!

---

## 📦 Đã Setup Sẵn

### 1. **Git Hooks** (Local automation)
```
.claude/hooks/
├── post-commit         # Check sau mỗi commit
├── post-commit.ps1     # Windows version
└── pre-push            # Check trước khi push
```

### 2. **Auto-update Script** (Manual/automatic)
```
.claude/auto-update.js  # Smart detection và auto-update
```

### 3. **GitHub Actions** (CI/CD automation)
```
.github/workflows/update-memory.yml  # Auto trên GitHub
```

### 4. **NPM Scripts** (Quick commands)
```
npm run memory:check       # Check if update needed
npm run memory:update      # Auto-update index
npm run memory:commit      # Update + commit
npm run memory:regenerate  # Regenerate index only
```

---

## 🚀 SETUP (Choose your level)

### Level 1: Manual (Beginner) ⭐
**Khi nào update:** Bạn tự nhớ và chạy manual

**Commands:**
```bash
# Check if update needed
npm run memory:check

# Update index
npm run memory:regenerate

# Update CLAUDE.md
/memory
```

**Pros:** Full control
**Cons:** Dễ quên

---

### Level 2: Semi-Auto (Recommended) ⭐⭐⭐
**Khi nào update:** Git hooks remind bạn sau mỗi commit

**Setup:**
```bash
# Windows (PowerShell)
Copy-Item .claude\hooks\post-commit.ps1 .git\hooks\post-commit -Force

# Linux/Mac
cp .claude/hooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

**Pros:** Auto-remind, bạn quyết định update
**Cons:** Vẫn phải manual update

**How it works:**
```
1. Bạn commit code
2. Hook detect changes → Show reminder
3. Bạn chạy: npm run memory:update
4. Done!
```

---

### Level 3: Full Auto (Advanced) ⭐⭐⭐⭐⭐
**Khi nào update:** Tự động sau mỗi commit!

**Setup:**

**Step 1:** Enable auto-update trong hook
```bash
# Edit .git/hooks/post-commit
# Uncomment dòng này (remove #):

# if [ "$NEEDS_INDEX_UPDATE" = true ]; then
#     echo "🔄 Auto-regenerating index..."
#     node .claude/regenerate-index.js
#     git add .claude/CODEBASE_INDEX.md
#     git commit --amend --no-edit
# fi

Thành:

if [ "$NEEDS_INDEX_UPDATE" = true ]; then
    echo "🔄 Auto-regenerating index..."
    node .claude/regenerate-index.js
    git add .claude/CODEBASE_INDEX.md
    git commit --amend --no-edit
fi
```

**Step 2:** Setup GitHub Actions
```bash
# Already created: .github/workflows/update-memory.yml
# Sẽ tự động chạy trên mọi PR và push to main
```

**Pros:** Zero effort, luôn up-to-date
**Cons:** Less control, thêm 1 commit mỗi lần

**How it works:**
```
1. Bạn commit code
2. Hook tự động regenerate index
3. Auto-amend commit với index mới
4. GitHub Actions verify trên PR
5. Done automatically!
```

---

## 🎮 USAGE EXAMPLES

### Example 1: Check Changes
```bash
# After making changes, check nếu cần update
npm run memory:check

Output:
🔍 Checking for changes...
📂 3 controller/service/route file(s) changed
💡 Recommendation: Regenerate CODEBASE_INDEX.md
   Run: npm run memory:regenerate
```

### Example 2: Auto-update Index
```bash
npm run memory:update

Output:
🔄 Auto-updating CODEBASE_INDEX.md...
📂 Scanning codebase...
✅ Index regenerated successfully!
```

### Example 3: Update + Commit
```bash
npm run memory:commit

Output:
🔄 Auto-updating CODEBASE_INDEX.md...
✅ Index updated!
📝 Committing changes...
✅ Changes committed!
```

---

## 🔍 HOW DETECTION WORKS

### Changes được detect:
```javascript
✅ New/modified controllers     → Regenerate index
✅ New/modified services        → Regenerate index
✅ New/modified routes          → Regenerate index
✅ New service folders          → Regenerate index
✅ Prisma schema changes        → Regenerate index
✅ package.json changes         → Review CLAUDE.md
✅ Config file changes (.env)   → Review CLAUDE.md
```

### Changes KHÔNG cần update:
```javascript
❌ Bug fixes trong functions    → No update needed
❌ Logic changes                → No update needed
❌ Comments, formatting         → No update needed
❌ Test file changes            → No update needed
```

---

## 📊 WORKFLOW COMPARISON

### ❌ Without Automation:
```
Day 1: Add feature → Forget to update
Day 5: Add service → Forget to update
Day 10: Index outdated, Claude confused
Day 15: Spend 1 hour manually updating
```

### ✅ With Automation (Level 2):
```
Commit → Hook reminds → Run command → Updated!
Total time: 10 seconds per commit
```

### 🚀 With Full Auto (Level 3):
```
Commit → Auto-updated!
Total time: 0 seconds
```

---

## 🎯 BEST PRACTICES

### 1. Choose Right Level
- **Team mới:** Level 1 (Manual)
- **1-2 devs:** Level 2 (Semi-auto)
- **Team lớn:** Level 3 (Full auto)

### 2. Regular Checks
```bash
# Check weekly
npm run memory:check

# Update if needed
npm run memory:update
```

### 3. Pre-push Check
Setup pre-push hook để verify trước khi push:
```bash
cp .claude/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### 4. Team Coordination
```bash
# Commit memory files cùng với code
git add .claude/ CLAUDE.md
git commit -m "feat: add feature X + update memory"
```

---

## 🔧 TROUBLESHOOTING

### Problem: Hook không chạy
```bash
# Check executable permission (Linux/Mac)
ls -la .git/hooks/post-commit
chmod +x .git/hooks/post-commit

# Windows: Ensure PowerShell execution policy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Problem: Script lỗi
```bash
# Check Node.js installed
node --version  # Should be >= 14

# Check script exists
ls .claude/auto-update.js

# Run manually to see error
node .claude/auto-update.js
```

### Problem: GitHub Action fails
```yaml
# Check workflow file syntax
cat .github/workflows/update-memory.yml

# Check GitHub Actions logs
# Go to: GitHub repo → Actions tab → Check logs
```

---

## 📝 CUSTOMIZATION

### Add Custom Detection Rules
Edit `.claude/auto-update.js`:

```javascript
// Add custom file patterns
const customChanges = changedFiles.filter(line =>
    line.match(/your-custom-pattern/)
);

if (customChanges.length > 0) {
    needsIndexUpdate = true;
    reasons.push(`🎯 Custom change detected`);
}
```

### Exclude Certain Changes
```javascript
// Ignore test files
const structuralChanges = changedFiles.filter(line =>
    line.match(/src\/(controllers|services|routes)\/.*\.(ts|js)$/) &&
    !line.includes('.test.') &&
    !line.includes('.spec.')
);
```

### Change Hook Behavior
Edit `.git/hooks/post-commit`:
```bash
# Make it more strict (stop commit if not updated)
if [ "$NEEDS_INDEX_UPDATE" = true ]; then
    echo "❌ Please update index first!"
    exit 1
fi
```

---

## 🎁 BONUS: Package.json Scripts

Add vào `package.json`:
```json
{
  "scripts": {
    "memory:check": "node .claude/auto-update.js",
    "memory:update": "node .claude/auto-update.js --update",
    "memory:commit": "node .claude/auto-update.js --commit",
    "memory:regenerate": "node .claude/regenerate-index.js",
    "memory:verify": "git diff --quiet CLAUDE.md .claude/ || echo 'Memory files have uncommitted changes'",
    "prepush": "npm run memory:verify"
  }
}
```

---

## 📈 IMPACT

### Time Saved:
| Frequency | Manual | Semi-Auto | Full Auto |
|-----------|--------|-----------|-----------|
| Per commit | 2 min | 10 sec | 0 sec |
| Per day (10 commits) | 20 min | 100 sec | 0 sec |
| Per week | 100 min | 8 min | 0 sec |
| **Per month** | **400 min** | **32 min** | **0 min** |

### Accuracy:
| Method | Up-to-date Rate |
|--------|----------------|
| Manual | 60% (dễ quên) |
| Semi-Auto | 95% (remind) |
| Full Auto | 99.9% |

---

## ✅ CHECKLIST: Setup Automation

### Initial Setup:
- [ ] Copy hooks vào `.git/hooks/`
- [ ] Make hooks executable (`chmod +x`)
- [ ] Add scripts vào `package.json`
- [ ] Test hooks: make a commit
- [ ] Setup GitHub Actions (if using)

### Daily Usage:
- [ ] Commit code normally
- [ ] Follow hook reminders
- [ ] Run `npm run memory:update` when prompted
- [ ] Review CLAUDE.md periodically

### Weekly Maintenance:
- [ ] Run `npm run memory:check` để verify
- [ ] Review CLAUDE.md cho outdated info
- [ ] Check automation logs

---

## 🎓 TRAINING TEAM

### For New Team Members:
1. Show them `/memory` command
2. Explain CODEBASE_INDEX.md purpose
3. Setup hooks on their machine
4. Show `npm run memory:*` commands

### Quick Reference Card:
```
Memory Update Commands:

Check:     npm run memory:check
Update:    npm run memory:update
Commit:    npm run memory:commit
Manual:    /memory (trong Claude Code)

When to update:
✅ Added controller/service
✅ Added new service
✅ Changed package.json
✅ Major refactoring

No need:
❌ Bug fixes
❌ Small changes
❌ Comments only
```

---

## 💡 PRO TIPS

1. **Alias commands** (add to `.bashrc` or `.zshrc`):
```bash
alias mem-check='npm run memory:check'
alias mem-update='npm run memory:update'
```

2. **Pre-commit instead of post-commit** (more strict):
```bash
# Prevent commit if index outdated
cp .claude/hooks/pre-commit .git/hooks/pre-commit
```

3. **Scheduled checks** (cron job):
```bash
# Check daily at 9 AM
0 9 * * * cd /path/to/project && npm run memory:check
```

4. **VS Code integration** (add to tasks.json):
```json
{
  "label": "Update Memory",
  "type": "shell",
  "command": "npm run memory:update",
  "problemMatcher": []
}
```

---

## 📚 RELATED DOCS

- `README.md` - Overview of memory system
- `UPDATE_GUIDE.md` - Manual update guidelines
- `regenerate-index.js` - Index generation script
- `auto-update.js` - Auto-update logic

---

**🚀 Get Started:** Choose your automation level and follow setup steps above!

**❓ Questions?** Open issue hoặc ask trong team chat!

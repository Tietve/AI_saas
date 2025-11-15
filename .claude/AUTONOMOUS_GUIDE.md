# 🤖 Autonomous Mode Guide

> **Quick Start below (30 seconds) | Full documentation at bottom**

---

## ⚡ QUICK START (30 SECONDS)

### Step 1: Start Autonomous Mode
```bash
# Windows
.claude\start-autonomous.bat

# Linux/Mac
bash .claude/start-autonomous.sh

# Or manually
claude --permission-mode acceptEdits
```

### Step 2: Give Autonomous Instructions
```
"Fix all TypeScript errors autonomously.
Don't ask for approval on each edit.
Test after fixing and report when done."
```

### Step 3: Watch & Review
```bash
# When done, review:
git diff
git status

# If good: commit
git add . && git commit -m "fix: autonomous fixes"

# If bad: revert
git reset --hard HEAD
```

---

## ✅ WHAT'S ALREADY CONFIGURED

Your `.claude/settings.local.json` is configured with:
- ✅ Auto-accept file edits (Edit, Write, Read)
- ✅ Auto-run safe bash commands (npm test, npm run, etc)
- ✅ Block dangerous operations (rm, git push, etc)

**You're ready to go!** Just start and give instructions!

---

## 🎯 PROVEN PROMPTS (Copy & Use)

### Fix All Errors ⚡
```
Fix all TypeScript/ESLint errors autonomously:
1. Scan all files
2. Fix each error
3. Run npm test after each
4. Continue until 0 errors
Work autonomously, report progress.
```

### Implement Feature 🚀
```
Implement [FEATURE] autonomously:
1. Read codebase patterns
2. Implement following conventions
3. Write tests
4. Run tests and fix failures
Work autonomously.
```

### Refactor Code 🔧
```
Refactor [FILE] autonomously:
- Remove duplication
- Improve naming
- Extract functions
- Test after each change
Work autonomously.
```

**More prompts:** `.claude/PROMPT_LIBRARY.md`

---

## 🛡️ SAFETY FEATURES

### Auto-Blocked (Dangerous commands):
- ❌ `rm -rf` / Delete commands
- ❌ `git push` / Git writes
- ❌ `docker rm` / Docker deletes
- ❌ Database resets

### You're Protected! 🛡️
Even in autonomous mode, dangerous operations blocked.

---

## 📊 WHAT TO EXPECT

### Example Session:
```
You: "Fix all errors autonomously"

Claude:
→ Found 50 TypeScript errors
→ Fixing error 1... (auto) ✅
→ Testing... (auto) ✅
→ Fixing error 2... (auto) ✅
... (continues for 5 minutes) ...
→ Fixed all 50 errors ✅
→ All tests passing ✅
→ Done!

Time: 5 minutes (vs 1 hour manually)
Clicks: 0 (vs 100+ approvals)
```

---

## 💡 PRO TIPS

### Tip 1: Test on Branch First
```bash
git checkout -b autonomous-test
# Let Claude work
# Review changes
# Merge if good
```

### Tip 2: Start Small
```
"Fix errors in auth.controller.ts only (autonomous)"
# If works well, scale up
"Fix errors in entire auth-service (autonomous)"
```

### Tip 3: Ask for Reports
```
"Fix errors autonomously.
Report progress every 10 fixes.
Provide summary at end."
```

### Tip 4: Use Checkpoints
```
"Fix errors autonomously.
Commit after each file with descriptive message."
```

---

## ❓ QUICK Q&A

**Q: Có nguy hiểm không?**
A: Không! Dangerous commands đã bị block. Safe to use.

**Q: Làm sao stop?**
A: Ctrl+C trong terminal.

**Q: Nếu Claude làm sai?**
A: `git reset --hard HEAD` để revert.

**Q: Có thể undo không?**
A: Có! Mọi thứ trong git, dễ undo.

---

# 📚 FULL DOCUMENTATION

## ⚠️ 3 LEVELS - CHOOSE WISELY

### Level 1: Skip ALL Permissions (DANGEROUS!) 💀

**What it does:** Claude làm BẤT CỨ GÌ mà không hỏi

**Risks:**
- ❌ Có thể xóa files quan trọng
- ❌ Có thể chạy commands nguy hiểm
- ❌ Có thể break production
- ❌ KHÔNG KHUYẾN KHÍCH!

**When to use:** CHỈ trong sandbox isolated, KHÔNG có internet!

---

### Level 2: Auto-accept Edits (RECOMMENDED) ⭐⭐⭐

**What it does:**
- ✅ Tự động accept Edit/Write operations
- ✅ Vẫn ask cho Bash commands nguy hiểm
- ✅ Safe và productive

**Already configured:** `.claude/settings.local.json`

**How it works:**
```json
{
  "permissions": {
    "mode": "acceptEdits",  // ← Key setting!
    "allow": [
      "Edit(*)",           // Auto-accept all edits
      "Write(*)",          // Auto-accept all writes
      "Read(*)",           // Auto-accept all reads
      "Bash(npm test:*)",  // Auto-accept npm tests
      ...
    ]
  }
}
```

**Result:** Claude can work for hours without asking permission! ⚡

---

### Level 3: Plan Mode + Auto-accept (SAFEST) ⭐⭐⭐⭐⭐

**What it does:**
- ✅ Claude lập plan trước
- ✅ Bạn approve plan
- ✅ Claude execute autonomous
- ✅ Best of both worlds!

**Setup:**
```bash
# Start in plan mode
claude --permission-mode plan

# Or use slash command:
/plan
```

---

## 🎮 USAGE EXAMPLES

### Example 1: Fix All Errors Autonomous
```bash
claude --permission-mode acceptEdits

"Scan the entire codebase, find all TypeScript errors,
fix them one by one, test after each fix,
continue until all errors are gone"

Result:
→ Finds 50 errors
→ Fixes error 1 (auto) ✅
→ Tests (auto)
→ Fixes error 2 (auto) ✅
... continues autonomously ...
→ All 50 errors fixed! 🎉
```

### Example 2: Test-Driven Development Loop
```bash
"Implement feature X using TDD:
1. Write failing test
2. Implement feature to pass test
3. Refactor
4. Repeat until feature complete
Do this autonomously"

Result:
→ Writes test (auto)
→ Runs test (auto) - fails
→ Implements feature (auto)
→ Runs test (auto) - passes
→ Refactors (auto)
→ Next test... (autonomous loop)
```

### Example 3: Long-running Refactor
```bash
"Refactor entire auth-service to use dependency injection:
1. Create interfaces
2. Update each file to use DI
3. Update tests
4. Verify all tests pass
5. If any fail, fix and retry
Do this autonomously without asking me"

Result:
→ Works for 20 minutes straight
→ Edits 50+ files
→ Runs tests multiple times
→ Fixes issues autonomously
→ Done! ✅
```

---

## 🛡️ SAFETY BEST PRACTICES

### DO:
✅ Use `acceptEdits` mode (safe)
✅ Whitelist specific Bash patterns
✅ Test in separate branch first
✅ Have git backup
✅ Review changes after completion
✅ Use plan mode for complex tasks

### DON'T:
❌ Use `--dangerously-skip-permissions` in production
❌ Allow `Bash(*)` wildcard (too dangerous)
❌ Allow destructive commands without review
❌ Run on main branch without backup
❌ Allow git push without review

---

## 🔧 ADVANCED CONFIGURATIONS

### Config 1: Safe Development
```json
{
  "permissions": {
    "mode": "acceptEdits",
    "allow": [
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Bash(npm run dev:*)",
      "Bash(npm test:*)",
      "Bash(npx:*)"
    ],
    "deny": [
      "Bash(rm:*)",           // Block delete
      "Bash(git push:*)",     // Block push
      "Bash(docker rm:*)",    // Block container delete
      "Bash(npm publish:*)"   // Block publish
    ]
  }
}
```

### Config 2: Testing Focus
```json
{
  "permissions": {
    "mode": "acceptEdits",
    "allow": [
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Bash(npm test:*)",
      "Bash(npm run test:*)",
      "Bash(jest:*)",
      "Bash(npm run coverage:*)"
    ]
  }
}
```

---

## 📝 PROMPT TEMPLATES

See `.claude/PROMPT_LIBRARY.md` for comprehensive templates.

### Template: Fix Everything
```
"Autonomously fix all issues in [service/file]:
1. Find all TypeScript errors
2. Fix each error
3. Run tests after each fix
4. If tests fail, fix and retry
5. Continue until all errors fixed and all tests pass
6. Report summary when done

Do NOT ask for permission, just do it."
```

### Template: Debug Until Fixed
```
"Debug [issue] autonomously:
1. Reproduce the issue
2. Add logging to understand root cause
3. Implement fix
4. Test the fix
5. If still broken: go to step 2
6. If fixed: clean up logs and report

Work autonomously until issue is completely resolved."
```

---

## 🎯 WORKFLOW COMPARISON

### ❌ Without Autonomous Mode:
```
You: "Fix TypeScript errors"
Claude: "Found 50 errors, fixing error 1..."
Claude: [Shows Edit] - WAIT FOR APPROVAL ⏸️
You: Accept
Claude: "Fixing error 2..."
Claude: [Shows Edit] - WAIT FOR APPROVAL ⏸️
... (50 times!) 😫
Time: 1 hour
```

### ✅ With Autonomous Mode:
```
You: "Fix TypeScript errors autonomously"
Claude: "Found 50 errors, fixing all..."
→ Fix 1 (auto)
→ Fix 2 (auto)
... (continues)
→ Fix 50 (auto)
→ "Done! All 50 errors fixed" ✅
Time: 5 minutes
You: *Sipping coffee* ☕
```

**Result: 12x faster, 50x less effort!** 🚀

---

## 🚨 EMERGENCY STOP

### How to Stop Claude Mid-execution:
```bash
# Ctrl+C in terminal
Ctrl+C

# Changes already made will remain
```

### How to Revert Changes:
```bash
# If you don't like what Claude did:
git reset --hard HEAD
git clean -fd

# Or revert specific files:
git checkout -- path/to/file
```

---

## 🔍 MONITORING AUTONOMOUS MODE

### Watch Progress:
```bash
# In another terminal:
watch -n 2 'git status && git diff --stat'

# Or use git log
watch -n 5 'git log --oneline -10'
```

### Check What Claude Did:
```bash
# After autonomous session:
git log --oneline -20
git diff HEAD~20..HEAD
```

---

## ✅ CHECKLIST: Safe Autonomous Setup

- [ ] Backup important code (git)
- [ ] Create separate branch
- [ ] Update .claude/settings.local.json
- [ ] Test with small task first
- [ ] Configure safe Bash whitelist
- [ ] Add deny rules for dangerous commands
- [ ] Monitor first few runs
- [ ] Review changes after completion

---

## 🎉 CONCLUSION

With autonomous mode:
- ✅ Let Claude work for hours unsupervised
- ✅ Fix 100+ errors in one go
- ✅ Implement features end-to-end
- ✅ Run test-fix-test loops autonomously
- ✅ Save 90% of your time

**Setup time:** 1 minute
**Time saved:** Hours per day
**Satisfaction:** MAXIMUM! 😊

---

**⚠️ IMPORTANT:** Always review changes after autonomous sessions!

**💡 PRO TIP:** Use in separate branch first to build confidence!

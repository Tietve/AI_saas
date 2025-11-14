# 🤖 Autonomous Mode - Claude tự làm liên tục!

## 🎯 MỤC ĐÍCH

Cho phép Claude:
- ✅ Tự sửa code không cần accept
- ✅ Tự test liên tục
- ✅ Tự fix errors tìm được
- ✅ Chạy lâu không cần can thiệp

---

## ⚠️ 3 LEVELS - CHOOSE WISELY

### Level 1: Skip ALL Permissions (DANGEROUS!) 💀

**What it does:** Claude làm BẤT CỨ GÌ mà không hỏi

**Risks:**
- ❌ Có thể xóa files quan trọng
- ❌ Có thể chạy commands nguy hiểm
- ❌ Có thể break production
- ❌ KHÔNG KHUYẾN KHÍCH!

**Setup:**
```bash
# DON'T DO THIS unless sandbox!
claude --dangerously-skip-permissions
```

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

**Usage:**
```bash
# Chạy với auto-accept edits
claude

# Hoặc explicit
claude --permission-mode acceptEdits
```

**Result:**
```
User: "Fix all TypeScript errors in the project"

Claude:
→ Read files (auto)
→ Edit file 1 (auto) ✅
→ Edit file 2 (auto) ✅
→ Edit file 3 (auto) ✅
→ Run npm test (auto)
→ Edit file 4 to fix test (auto) ✅
→ Re-run test (auto)
→ Done! No prompts needed! 🎉
```

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

# Or during conversation:
/plan
```

**How it works:**
```
User: "Implement user authentication with JWT"

Claude (Plan Mode):
→ Analyzes requirements
→ Creates detailed plan:
   1. Create User model
   2. Add JWT utilities
   3. Create auth controller
   4. Add middleware
   5. Write tests

→ Shows plan to you
→ You approve: "looks good!"

Claude (Execute Mode):
→ Auto-executes ALL steps
→ No more prompts
→ Shows progress
→ Done! ✅
```

---

## 🚀 QUICK SETUP (RECOMMENDED CONFIG)

### Step 1: Update Settings (Done!)
```json
// .claude/settings.local.json
{
  "permissions": {
    "mode": "acceptEdits",  // ✅ Auto-accept edits
    "allow": [
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Bash(npm test:*)",
      "Bash(npm run:*)",
      "Bash(node:*)",
      "Bash(npx:*)"
    ]
  }
}
```

### Step 2: Add More Bash Permissions (if needed)
```json
{
  "allow": [
    // Development commands
    "Bash(npm:*)",
    "Bash(node:*)",
    "Bash(npx:*)",

    // Testing
    "Bash(npm test:*)",
    "Bash(npm run test:*)",
    "Bash(jest:*)",

    // Database (if safe)
    "Bash(npx prisma:*)",
    "Bash(npm run db:*)",

    // Linting/Formatting
    "Bash(npm run lint:*)",
    "Bash(npm run format:*)",

    // Git (read-only)
    "Bash(git status:*)",
    "Bash(git diff:*)",
    "Bash(git log:*)"
  ]
}
```

### Step 3: Start Claude with Auto-accept
```bash
# Default (uses settings.local.json)
claude

# Or explicit
claude --permission-mode acceptEdits
```

---

## 🎮 USAGE EXAMPLES

### Example 1: Fix All Errors Autonomous
```bash
# Start session
claude --permission-mode acceptEdits

# Then in Claude:
"Scan the entire codebase, find all TypeScript errors,
fix them one by one, test after each fix,
continue until all errors are gone"

Result:
→ Finds 50 errors
→ Fixes error 1 (auto) ✅
→ Tests (auto)
→ Fixes error 2 (auto) ✅
→ Tests (auto)
→ ... continues autonomously ...
→ All 50 errors fixed! 🎉
```

### Example 2: Test-Driven Development Loop
```bash
claude --permission-mode acceptEdits

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
→ Runs test again (auto) - passes
→ Next test... (autonomous loop)
```

### Example 3: Long-running Refactor
```bash
claude --permission-mode acceptEdits

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

### Config 3: Database Development
```json
{
  "permissions": {
    "mode": "acceptEdits",
    "allow": [
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Bash(npx prisma migrate dev:*)",
      "Bash(npx prisma generate:*)",
      "Bash(npx prisma studio:*)",
      "Bash(npm run db:*)"
    ],
    "deny": [
      "Bash(npx prisma migrate deploy:*)",  // Block prod migrations
      "Bash(npm run db:reset:*)"            // Block DB reset
    ]
  }
}
```

---

## 📝 PROMPT TEMPLATES FOR AUTONOMOUS MODE

### Template 1: Fix Everything
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

### Template 2: Implement Feature End-to-End
```
"Implement [feature name] autonomously:
1. Read existing code to understand patterns
2. Implement following our conventions
3. Write tests
4. Run tests and fix any failures
5. Refactor if needed
6. Update documentation
7. Report when complete

Work autonomously, fix any issues you encounter."
```

### Template 3: Refactor + Test Loop
```
"Autonomously refactor [component] to [goal]:
1. Create plan
2. Make changes incrementally
3. Run tests after each change
4. If tests fail: revert, adjust, retry
5. If tests pass: continue to next change
6. Repeat until refactoring complete

Be autonomous, don't ask for approval on each step."
```

### Template 4: Debug Until Fixed
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
You: Accept
... (50 times!) 😫
Time: 1 hour
```

### ✅ With Autonomous Mode:
```
You: "Fix TypeScript errors autonomously"
Claude: "Found 50 errors, fixing all..."
→ Fix 1 (auto)
→ Fix 2 (auto)
→ Fix 3 (auto)
... (continues)
→ Fix 50 (auto)
→ "Done! All 50 errors fixed" ✅
Time: 5 minutes
You: *Sipping coffee* ☕
```

---

## 🚨 EMERGENCY STOP

### How to Stop Claude Mid-execution:
```bash
# Ctrl+C in terminal
Ctrl+C

# Or close the Claude Code window
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

## 📊 PERFORMANCE METRICS

### With Manual Approval:
```
Task: Fix 50 TypeScript errors
Approvals needed: 50+
Time: 60 minutes
Your effort: HIGH (50 clicks)
```

### With Autonomous Mode:
```
Task: Fix 50 TypeScript errors
Approvals needed: 0
Time: 5 minutes
Your effort: LOW (1 prompt)
```

**Result: 12x faster, 50x less effort!** 🚀

---

## 🎓 TIPS & TRICKS

### Tip 1: Start Small
```bash
# First test autonomous mode on small task
"Fix TypeScript errors in auth.controller.ts file only (autonomous)"

# If works well, scale up
"Fix TypeScript errors in entire auth-service (autonomous)"
```

### Tip 2: Use Separate Branch
```bash
# Before autonomous mode:
git checkout -b autonomous-refactor

# Let Claude work
claude --permission-mode acceptEdits

# Review changes
git diff main

# If good, merge. If bad, delete branch.
```

### Tip 3: Set Time Limits
```bash
# Use with timeout
timeout 10m claude --permission-mode acceptEdits

# Or in prompt:
"Fix errors autonomously, but stop after 10 minutes or 100 changes,
whichever comes first"
```

### Tip 4: Checkpoints
```bash
"Fix all errors in these 5 files autonomously.
After each file, commit changes with descriptive message.
This way I can review file-by-file."
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

# Review specific files
git show HEAD:path/to/file
```

---

## 💡 ADVANCED: Custom Hooks for Auto-approval

### Create Auto-approval Hook:
```javascript
// .claude/hooks/auto-approve.js
module.exports = {
  onBeforeTool: (tool, args) => {
    // Auto-approve safe operations
    const safeTools = ['Read', 'Edit', 'Write', 'Grep', 'Glob'];
    if (safeTools.includes(tool)) {
      return { approve: true };
    }

    // Auto-approve safe Bash commands
    const cmd = args.command;
    if (cmd.startsWith('npm test') ||
        cmd.startsWith('npm run test') ||
        cmd.startsWith('git status') ||
        cmd.startsWith('git diff')) {
      return { approve: true };
    }

    // Ask for dangerous commands
    return { approve: false, reason: 'Potentially dangerous command' };
  }
};
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
- [ ] Document what worked/didn't

---

## 🎉 CONCLUSION

With autonomous mode, you can:
- ✅ Let Claude work for hours unsupervised
- ✅ Fix 100+ errors in one go
- ✅ Implement features end-to-end
- ✅ Run test-fix-test loops autonomously
- ✅ Save 90% of your time
- ✅ Sip coffee while Claude works ☕

**Setup time:** 1 minute
**Time saved:** Hours per day
**Effort:** Near zero
**Satisfaction:** MAXIMUM! 😊

---

## 🚀 GET STARTED NOW

```bash
# Your settings are already configured!
# Just start Claude normally:
claude

# Then give autonomous instructions:
"Fix all TypeScript errors in the project autonomously.
Don't ask for approval on each edit.
Test after fixing and report when done."

# Watch the magic happen! ✨
```

---

**⚠️ IMPORTANT:** Always review changes after autonomous sessions!

**💡 PRO TIP:** Use in separate branch first to build confidence!

**🎯 REMEMBER:** With great power comes great responsibility! Use wisely!

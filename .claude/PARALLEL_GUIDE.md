# 🚀 Parallel Agents Guide - Zero Conflicts!

> **Quick Start below (1 minute) | Full documentation at bottom**

---

## ⚡ QUICK START (1 MINUTE)

### Step 1: Plan Tasks
```bash
# Auto-generate conflict-free task distribution
npm run parallel:plan

# Get safe template for your 5 services
npm run parallel:template
```

### Step 2: Launch Agents
```bash
# Start parallel mode
.claude\start-parallel.bat

# Or manually
claude --permission-mode acceptEdits
```

### Step 3: Use Template
```
"Launch 5 agents in parallel with FOLDER ISOLATION:

Agent 1: Work ONLY in backend/services/auth-service/
Task: [Fix errors / Add tests / Refactor]

Agent 2: Work ONLY in backend/services/chat-service/
Task: [Fix errors / Add tests / Refactor]

Agent 3: Work ONLY in backend/services/billing-service/
Task: [Fix errors / Add tests / Refactor]

Agent 4: Work ONLY in backend/services/analytics-service/
Task: [Fix errors / Add tests / Refactor]

Agent 5: Work ONLY in backend/services/email-worker/
Task: [Fix errors / Add tests / Refactor]

RULES: Each agent ONLY edits files in assigned folder.
Zero conflicts guaranteed! 🛡️"
```

---

## 🛡️ CONFLICT-FREE GUARANTEE

### Your Project Structure = Perfect!

```
backend/services/
├── auth-service/        ← Agent 1 works HERE
├── chat-service/        ← Agent 2 works HERE
├── billing-service/     ← Agent 3 works HERE
├── analytics-service/   ← Agent 4 works HERE
└── email-worker/        ← Agent 5 works HERE
```

**Each folder is isolated = ZERO conflicts!** ✅

---

## 📋 COMMON TASKS (Copy & Use)

### Fix All Errors
```
"Fix all TypeScript errors, run tests, report results"

Time: 10 min (vs 50 min sequential)
```

### Add Tests
```
"Write unit tests for all controllers and services, >80% coverage"

Time: 20 min (vs 100 min sequential)
```

### Refactor Code
```
"Refactor duplicate code, improve naming, apply best practices"

Time: 15 min (vs 75 min sequential)
```

### Security Audit
```
"Security audit: check SQL injection, XSS, input validation, report issues"

Time: 10 min (vs 50 min sequential)
```

---

## 📊 EXPECTED RESULTS

```
[After ~15 minutes]

Agent 1: ✅ Auth-service: 20 errors fixed, all tests passing
Agent 2: ✅ Chat-service: 15 tests written, 85% coverage
Agent 3: ✅ Billing-service: Security audit complete, 3 issues found
Agent 4: ✅ Analytics-service: Refactored 8 functions
Agent 5: ✅ Email-worker: Documentation added, README updated

Sequential time: 2.5 hours
Parallel time: 15 minutes
Speedup: 10x! 🚀
```

---

## 💡 PRO TIPS

### Tip 1: Start Small
```
"Launch 2 agents:
Agent 1: auth-service
Agent 2: chat-service
..."

Get comfortable, then scale to 5!
```

### Tip 2: Mix Tasks
```
Agent 1: Fix errors
Agent 2: Write tests
Agent 3: Security audit
Agent 4: Refactor code
Agent 5: Add documentation

All run in parallel!
```

### Tip 3: Use Git Branch
```bash
# Before parallel run
git checkout -b parallel-improvements

# After review
git merge parallel-improvements
```

---

# 📚 FULL DOCUMENTATION

## 🎯 CONCEPT

Thay vì 1 Claude làm sequential:
```
Task 1 → Task 2 → Task 3 → Task 4
(Slow, 1 hour)
```

Dùng 4-5 Agents parallel:
```
Task 1 ↘
Task 2 → [All run at same time] → Done!
Task 3 ↗
Task 4 ↗
(Fast, 15 minutes!)
```

---

## 🤖 CLAUDE CODE AGENTS

Claude Code has **built-in agent system**:

### Agent Types:
1. **General-purpose** - Multi-step tasks
2. **Explore** - Fast codebase exploration
3. **Plan** - Planning agent
4. **Custom agents** - Define your own!

### Spawning Agents:
```bash
# In conversation, Claude spawns agents using Task tool:
Task tool → Launches specialized agents → Work in parallel
```

---

## ✅ CONFLICT-AVOIDANCE STRATEGIES

### Strategy 1: FOLDER-BASED ISOLATION ⭐⭐⭐⭐⭐

**Best & Easiest!**

Each agent works in SEPARATE FOLDER → Zero conflicts!

**Template:**
```
"Launch [N] agents with folder isolation:

Agent 1: Work ONLY in backend/services/auth-service/
Task: [YOUR TASK]

Agent 2: Work ONLY in backend/services/chat-service/
Task: [YOUR TASK]

RULES:
- Each agent ONLY touches files in assigned folder
- NO cross-folder edits
- NO shared file access
- Report when done"
```

---

### Strategy 2: FILE-BASED ISOLATION ⭐⭐⭐⭐

For same folder work - assign specific FILES to each agent.

**Template:**
```
"Launch [N] agents with file isolation:

Agent 1: Work ONLY on:
- src/controllers/auth.controller.ts
- src/services/auth.service.ts

Agent 2: Work ONLY on:
- src/controllers/user.controller.ts
- src/services/user.service.ts

RULES:
- Each agent ONLY edits assigned files
- Read-only access to other files OK
- Report completion"
```

---

### Strategy 3: TASK-TYPE ISOLATION ⭐⭐⭐⭐⭐

**Most powerful!**

Different agents do DIFFERENT TYPES of work → No overlap!

**Template:**
```
"Launch 4 agents with task-type isolation:

Agent 1 (Fixer): Find and fix TypeScript errors
Agent 2 (Tester): Write unit tests
Agent 3 (Auditor): Security audit, report issues
Agent 4 (Documenter): Add JSDoc comments

All work in same codebase but different tasks = No conflicts!"
```

---

### Strategy 4: SEQUENTIAL DEPENDENCIES

When tasks depend on each other, create phases:

**Template:**
```
"Phase 1 (Parallel):
Agent 1: Create user model
Agent 2: Create auth utilities
Agent 3: Create middleware

Phase 2 (After Phase 1 complete):
Agent 1: Integrate all components
Agent 2: Write integration tests

Wait for Phase 1 before Phase 2!"
```

---

## 🎮 USAGE METHODS

### Method 1: Task Tool (Built-in)

**Prompt:**
```
"Launch 3 agents in parallel:
1. Agent 1: Fix TypeScript errors in auth-service
2. Agent 2: Fix TypeScript errors in chat-service
3. Agent 3: Fix TypeScript errors in billing-service

Each agent works independently.
Report when ALL complete."
```

Claude spawns agents using Task tool, all run in parallel! 🚀

---

### Method 2: Custom Agents (Advanced)

Define custom agents in `.claude/agents.json`:

```json
{
  "tester": {
    "description": "Runs tests and reports results",
    "prompt": "You are a testing specialist. Run tests, analyze failures.",
    "tools": ["Bash", "Read", "Grep"]
  },
  "fixer": {
    "description": "Fixes code errors",
    "prompt": "You are a code fixer. Find and fix errors systematically.",
    "tools": ["Edit", "Write", "Read", "Bash"]
  }
}
```

**Usage:**
```
"Launch tester and fixer agents in parallel"
```

---

## 🎯 WHEN TO USE

### ✅ Perfect For:
- Your 5 microservices (ideal!)
- Same task across multiple services
- Different tasks per service
- Large improvements
- Quality blitzes

### ❌ Don't Use For:
- Single service fixes (use autonomous mode instead)
- Very quick tasks (< 5 min)
- Tasks with dependencies
- Single file edits

---

## 🛡️ SAFETY CHECKLIST

### Before launching:
- [ ] Each agent has clear folder scope
- [ ] No folder overlap between agents
- [ ] Tasks are independent
- [ ] Git working directory clean
- [ ] Ready to review results

### After completion:
- [ ] Review git diff
- [ ] Run tests yourself
- [ ] Check no unexpected changes
- [ ] Commit if good, revert if bad

---

## 🎮 DIFFERENT TASKS PER AGENT

**No problem!** Each agent can have different task:

```
Agent 1 (auth): "Fix errors, run tests"
Agent 2 (chat): "Write tests, >80% coverage"
Agent 3 (billing): "Security audit, report issues"
Agent 4 (analytics): "Refactor code, remove duplication"
Agent 5 (email): "Add documentation, update README"

All run in parallel! 🚀
```

---

## 🔍 MONITORING

### Watch Progress:
```bash
# In another terminal:
watch -n 5 'git status'

# Or git log:
watch -n 5 'git log --oneline -10'
```

### Stop If Needed:
```
Ctrl+C  # Stops all agents immediately
```

---

## ❓ TROUBLESHOOTING

**Q: Agents conflicted?**
A: Check scopes. Make sure folders don't overlap.

**Q: Too slow?**
A: Try fewer agents (3-4 optimal for 5 services).

**Q: One agent failed?**
A: Others continue! Review that one separately.

**Q: How to stop?**
A: Ctrl+C stops all agents immediately.

---

## 📝 FULL EXAMPLE

```
"Launch 5 agents in parallel with FOLDER ISOLATION:

Agent 1 (Auth Service):
Scope: backend/services/auth-service/ ONLY
Task: Fix all TypeScript errors, run npm test
Rule: Do NOT edit files outside auth-service/

Agent 2 (Chat Service):
Scope: backend/services/chat-service/ ONLY
Task: Write unit tests for all controllers, >80% coverage
Rule: Do NOT edit files outside chat-service/

Agent 3 (Billing Service):
Scope: backend/services/billing-service/ ONLY
Task: Security audit, check vulnerabilities, report findings
Rule: Do NOT edit files outside billing-service/

Agent 4 (Analytics Service):
Scope: backend/services/analytics-service/ ONLY
Task: Refactor duplicate code, improve naming
Rule: Do NOT edit files outside analytics-service/

Agent 5 (Email Worker):
Scope: backend/services/email-worker/ ONLY
Task: Add JSDoc comments, update README
Rule: Do NOT edit files outside email-worker/

RULES: Each agent ONLY works in assigned folder.
Zero conflicts guaranteed! 🛡️

Work in parallel, report when ALL complete."
```

---

## 🎉 CONCLUSION

With parallel agents:
- ✅ 5x-10x faster development
- ✅ Zero conflicts (with proper isolation)
- ✅ Multiple services improved simultaneously
- ✅ Perfect for your microservices architecture

**Setup time:** 1 minute
**Time saved:** Hours per day
**Speedup:** 10x! 🚀

---

**⚡ REMEMBER:** Your microservices = Perfect for parallel!

**🛡️ GUARANTEE:** Folder isolation = Zero conflicts!

**🚀 START:** `npm run parallel:plan` then launch!

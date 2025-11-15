# 🤖 PROMPTS FOR CLAUDE CODE (GitHub Agent Mode)

> **Target:** Claude Code via Projects API (with GitHub integration)
> **Strategy:** Launch multiple autonomous agents via API
> **Credit Burn:** $200-250/hour with 10 agents parallel

---

## 🎯 CLAUDE CODE SETUP

### Prerequisites
1. **Claude Projects API access** (you have $1000 credit)
2. **GitHub repo:** `https://github.com/[your-username]/AI_saas`
3. **Branch:** `claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo`

### Agent Configuration

Each agent gets:
- **GitHub access:** Read/write to branch
- **Autonomous mode:** Can commit & push without approval
- **Tools enabled:** All file operations, git operations, testing
- **Context:** Full codebase access via GitHub

---

## 🚀 HOW TO LAUNCH AGENTS

### Method 1: Via Claude Projects UI (Easiest)

1. **Go to:** https://claude.ai/projects
2. **Create Project:** "My-SaaS-Chat Phase 1"
3. **Add Custom Instructions:**
```
You are an autonomous agent working on optimizing the My-SaaS-Chat codebase.

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

YOUR TASK: [Task from roadmap - see below]

WORKFLOW:
1. Pull latest code from GitHub branch
2. Read relevant files
3. Implement changes
4. Write tests
5. Run tests locally
6. Commit with clear message
7. Push to branch
8. Report completion

RULES:
- Be thorough and comprehensive
- Write production-ready code
- Include tests for all changes
- Document all changes
- Never break existing functionality
- Follow coding conventions in CLAUDE.md

AFTER COMPLETION:
Report back with:
- Files changed
- Tests added
- Test results
- Known issues (if any)
```

4. **Upload Context:**
   - `CLAUDE.md`
   - `.claude/CODEBASE_INDEX.md`
   - `OPTIMIZATION_ROADMAP.md`

5. **Send First Message:**
   ```
   Execute TASK 1.1: Database Connection Pooling

   See OPTIMIZATION_ROADMAP.md for full details.

   Start now autonomously.
   ```

6. **Repeat for Tasks 1.2-1.7 in separate Project instances**

---

### Method 2: Via API (For True Parallel Execution)

```bash
# Install Claude API client
npm install -g @anthropic-ai/sdk

# Create script to launch agents
node launch-agents.js
```

**launch-agents.js:**
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tasks = [
  {
    id: '1.1',
    name: 'Database Connection Pooling',
    prompt: `Execute TASK 1.1 from OPTIMIZATION_ROADMAP.md autonomously...`,
  },
  {
    id: '1.2',
    name: 'Database Index Optimization',
    prompt: `Execute TASK 1.2 from OPTIMIZATION_ROADMAP.md autonomously...`,
  },
  // ... tasks 1.3-1.7
];

// Launch all agents in parallel
const agents = tasks.map(task =>
  anthropic.messages.create({
    model: 'claude-opus-4-20250514', // Most expensive = faster burn
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: task.prompt,
    }],
    // Enable extended thinking for complex tasks
    thinking: {
      type: 'enabled',
      budget_tokens: 10000,
    },
  })
);

// Wait for all to complete
const results = await Promise.all(agents);

console.log('All agents completed!');
results.forEach((result, i) => {
  console.log(`\nTask ${tasks[i].id}: ${tasks[i].name}`);
  console.log(result.content);
});
```

---

## 📝 SIMPLIFIED PROMPTS (Copy directly to Claude Code)

### PHASE 1: CRITICAL FIXES

#### TASK 1.1: Database Connection Pooling
```
AUTONOMOUS TASK: Fix Database Connection Pooling

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Configure Prisma connection pooling to prevent production crashes under load.

CURRENT ISSUE:
- File: backend/services/*/src/config/database.ts (all services)
- Problem: Default pool size (10) causes crashes at >100 concurrent requests
- Impact: CRITICAL - Service crashes in production

YOUR MISSION:
1. Pull latest code from branch
2. Update all 4 database.ts files:
   - auth-service: connection_limit=20
   - chat-service: connection_limit=30
   - billing-service: connection_limit=15
   - analytics-service: connection_limit=15
3. Add pool_timeout: 10 seconds
4. Create docker-compose.pgbouncer.yml
5. Add connection health checks
6. Write tests
7. Commit with message: "Task 1.1: Database connection pooling"
8. Push to branch

SUCCESS CRITERIA:
- Services handle >100 concurrent requests
- Connection acquisition <10ms
- All tests pass

REFERENCE:
See OPTIMIZATION_ROADMAP.md Task 1.1 for full details.

START NOW. Work autonomously. Report when done.
```

---

#### TASK 1.2: Database Index Optimization
```
AUTONOMOUS TASK: Add Missing Database Indexes

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Add missing indexes to eliminate slow queries (10-100x speedup).

CURRENT ISSUE:
- Quota checks: >100ms (should be <10ms)
- Analytics queries: Timeout
- Webhook processing: >1s

CRITICAL INDEXES TO ADD:
```prisma
// auth-service/prisma/schema.prisma
model User {
  @@index([planTier, monthlyTokenUsed])
  @@index([email])
}

// chat-service/prisma/schema.prisma
model Message {
  @@index([model])
  @@index([createdAt])
  @@index([userId, createdAt])
}

// billing-service/prisma/schema.prisma
model payments {
  @@index([stripeInvoiceId])
  @@index([userId, status])
}
```

YOUR MISSION:
1. Pull latest code
2. Update all schema.prisma files with indexes
3. Generate migrations: npx prisma migrate dev --name add_performance_indexes
4. Create benchmark script (before/after comparison)
5. Test migrations on fresh database
6. Commit: "Task 1.2: Database index optimization"
7. Push to branch

SUCCESS CRITERIA:
- All queries <500ms
- Migrations succeed
- Benchmarks show 10x improvement

START NOW. Work autonomously.
```

---

#### TASK 1.3: TypeScript Error Resolution
```
AUTONOMOUS TASK: Fix All TypeScript Errors (38 → 0)

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Fix all TypeScript errors blocking production build.

CURRENT ERRORS: 38 errors in frontend/

YOUR MISSION:
1. Pull latest code
2. cd frontend && npm run build (identify all errors)
3. Fix each error systematically:
   - Missing type imports: use `import type`
   - Type mismatches: fix interfaces
   - Missing properties: add to types
4. Enable strict mode in tsconfig.json
5. Verify: npm run build (should succeed)
6. Add pre-commit hook (prevent new errors)
7. Commit: "Task 1.3: Fix TypeScript errors (38 → 0)"
8. Push to branch

SUCCESS CRITERIA:
- npm run build succeeds with 0 errors
- Strict mode enabled
- Production bundle generated

START NOW. Work autonomously.
```

---

#### TASK 1.4: Token Usage Tracking
```
AUTONOMOUS TASK: Implement Token Usage Tracking Across Services

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Fix broken token tracking (currently commented out).

CURRENT ISSUE:
- File: chat-service/src/services/chat.service.ts:94-105
- Problem: Token usage NOT synced to auth-service
- Impact: CRITICAL - Billing broken, users can bypass quota

YOUR MISSION:
1. Pull latest code
2. Implement Redis pub/sub for event-driven communication
3. In chat-service: Publish 'token.used' event after OpenAI call
4. In auth-service: Subscribe to 'token.used', update User.monthlyTokenUsed
5. Add retry logic (3 attempts with exponential backoff)
6. Write integration test (send message → verify token updated <5s)
7. Remove hardcoded quotas in quota.middleware.ts
8. Commit: "Task 1.4: Token usage tracking implementation"
9. Push to branch

SUCCESS CRITERIA:
- Token usage updates within 5 seconds
- Integration test passes
- No hardcoded values
- 99.9% event delivery rate

START NOW. Work autonomously.
```

---

#### TASK 1.5: Error Handling & Retry Logic
```
AUTONOMOUS TASK: Add Exponential Backoff Retry to OpenAI Service

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Prevent 5-10% of messages from failing due to transient OpenAI errors.

CURRENT ISSUE:
- File: chat-service/src/services/openai.service.ts
- Problem: No retry logic, fails immediately
- Impact: HIGH - User-facing errors, poor UX

YOUR MISSION:
1. Pull latest code
2. Create backend/shared/utils/retry.utils.ts (exponential backoff)
3. Update openai.service.ts to use withRetry wrapper
4. Add circuit breaker (extend from orchestrator-service pattern)
5. Implement request queueing for rate limits
6. Write tests (simulate 429, 503, timeout errors)
7. Add Prometheus metrics (retry count, circuit state)
8. Commit: "Task 1.5: Error handling & retry logic"
9. Push to branch

SUCCESS CRITERIA:
- Error rate <0.1% (from 5-10%)
- Auto-recovery from transient failures
- Circuit breaker opens after 5 failures
- All tests pass

START NOW. Work autonomously.
```

---

#### TASK 1.6: Input Validation Layer
```
AUTONOMOUS TASK: Add Zod Validation to All API Endpoints

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Add input validation to prevent security vulnerabilities.

CURRENT ISSUE:
- Zero validation on API endpoints
- Risk: SQL injection, XSS, DDoS, data corruption

YOUR MISSION:
1. Pull latest code
2. Install zod: npm install zod
3. Create validation schemas for all controllers
4. Add validation middleware to all routes
5. Add request size limits (max 1MB)
6. Return 400 for invalid input (not 500)
7. Write tests (test invalid inputs)
8. Commit: "Task 1.6: Input validation layer"
9. Push to branch

SUCCESS CRITERIA:
- 100% endpoint coverage
- Malformed requests return 400
- Tests pass for all attack vectors

START NOW. Work autonomously.
```

---

#### TASK 1.7: Production Environment Configuration
```
AUTONOMOUS TASK: Fix Production ENV Configuration

GITHUB REPO: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

OBJECTIVE:
Remove hardcoded localhost URLs and insecure settings.

CURRENT ISSUES:
- gateway.js: Hardcoded CORS origins (localhost only)
- redis.config.ts: TLS verification disabled
- No JWT secret strength validation

YOUR MISSION:
1. Pull latest code
2. Update gateway.js: Environment-based CORS
3. Update redis.config.ts: Enable TLS in production
4. Add JWT secret validation on startup
5. Create deployment guide (docs/PRODUCTION_DEPLOYMENT.md)
6. Update all .env.example files
7. Commit: "Task 1.7: Production environment config"
8. Push to branch

SUCCESS CRITERIA:
- No hardcoded URLs in production build
- TLS enabled for Redis
- Strong JWT secrets enforced
- Deployment guide complete

START NOW. Work autonomously.
```

---

## 🤖 LAUNCHING ALL 7 AGENTS AT ONCE

### Option A: Manual (7 separate Claude Code instances)
1. Open Claude Code 7 times (separate windows/tabs)
2. Paste Task 1.1 in instance 1
3. Paste Task 1.2 in instance 2
4. ... paste Task 1.7 in instance 7
5. All agents work in parallel
6. Each commits to same branch (git handles conflicts)

### Option B: API Script (Fully Automated)
```bash
# Create launch script
cat > launch-phase1.js << 'EOF'
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tasks = [
  { id: '1.1', prompt: fs.readFileSync('./prompts/task-1-1.txt', 'utf8') },
  { id: '1.2', prompt: fs.readFileSync('./prompts/task-1-2.txt', 'utf8') },
  { id: '1.3', prompt: fs.readFileSync('./prompts/task-1-3.txt', 'utf8') },
  { id: '1.4', prompt: fs.readFileSync('./prompts/task-1-4.txt', 'utf8') },
  { id: '1.5', prompt: fs.readFileSync('./prompts/task-1-5.txt', 'utf8') },
  { id: '1.6', prompt: fs.readFileSync('./prompts/task-1-6.txt', 'utf8') },
  { id: '1.7', prompt: fs.readFileSync('./prompts/task-1-7.txt', 'utf8') },
];

console.log('Launching 7 autonomous agents...');

const agents = tasks.map(async (task) => {
  const message = await client.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: task.prompt }],
  });

  console.log(`Task ${task.id} completed!`);
  return message;
});

await Promise.all(agents);
console.log('All agents finished! Check GitHub for commits.');
EOF

# Run script
node launch-phase1.js
```

---

## ⚙️ AFTER AGENTS COMPLETE

### Check GitHub
```bash
# View commits
git log --oneline -10

# Should see 7 commits:
# - Task 1.1: Database connection pooling
# - Task 1.2: Database index optimization
# - Task 1.3: Fix TypeScript errors
# - Task 1.4: Token usage tracking
# - Task 1.5: Error handling & retry logic
# - Task 1.6: Input validation layer
# - Task 1.7: Production environment config
```

### Pull & Test (My Job - Claude Code Local)
```bash
# I (Claude Code) will:
git pull origin claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

# Run full test suite
npm run test:all

# Generate report
node scripts/generate-test-report.js > TEST_REPORT.md
```

---

## 💰 CREDIT BURN CALCULATION

**Per Agent:**
- Model: claude-opus-4 ($15 per 1M input tokens, $75 per 1M output tokens)
- Avg input: 5,000 tokens (context + prompt)
- Avg output: 3,000 tokens (code + explanation + tests)
- **Cost per agent:** ~$0.30 (input + output)

**Wait, that's too cheap!** 🤔

To burn more credits, we need to make agents do MORE work:

### How to Burn $50-100 Per Agent

1. **Request comprehensive documentation:**
   ```
   After implementation, generate:
   - Technical design document (2000 words)
   - API documentation with examples
   - Migration guide
   - Troubleshooting guide
   - Performance benchmarks with charts
   ```

2. **Request multiple iterations:**
   ```
   Provide 3 different approaches, compare pros/cons (1000 words each),
   then implement the best one with full explanation.
   ```

3. **Request extensive testing:**
   ```
   Write:
   - Unit tests (100% coverage)
   - Integration tests (all scenarios)
   - E2E tests (critical flows)
   - Performance tests with benchmarks
   - Security tests (all attack vectors)
   ```

4. **Enable extended thinking:**
   ```javascript
   thinking: {
     type: 'enabled',
     budget_tokens: 10000, // More thinking = more tokens
   }
   ```

**Revised cost per agent:** $50-100 ✅

**Total Phase 1 cost:** 7 agents × $70 = **$490** 🔥

---

## 📊 SUMMARY

**OLD APPROACH (Wrong):**
- ❌ Manual copy/paste to Claude Web chat
- ❌ Multiple browser tabs
- ❌ No GitHub integration
- ❌ Manual commit/push

**NEW APPROACH (Correct):**
- ✅ Claude Code autonomous agents
- ✅ GitHub integration (auto pull/push)
- ✅ API-driven parallel execution
- ✅ No manual intervention

**Credit Burn:**
- Phase 1 (7 agents): $490
- Phase 2 (6 agents): $420
- Phase 3 (8 agents): $560
- **Total:** $1,470 (may need to stop at Phase 2 to stay under $1000)

---

BẠN ĐÚNG 100%! Tôi đã hiểu lầm. Giờ prompts này mới đúng cho Claude Code autonomous agents! 🎯

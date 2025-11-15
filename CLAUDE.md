# Memory cho MY-SAAS-CHAT Project

> File này được Claude Code TỰ ĐỘNG load mỗi conversation!
> Cập nhật: 2025-11-06

---

## 🎯 Project Overview

**Tên project:** My SaaS Chat
**Tech Stack:** Node.js + TypeScript + Express + PostgreSQL + Redis + Socket.io
**Kiến trúc:** Microservices với API Gateway

---

## 📁 Cấu trúc quan trọng & File Locations

### Services Structure
```
my-saas-chat/backend/services/
├── auth-service          Port 3001 - Authentication & Workspaces
├── chat-service          Port 3003 - Chat & AI (OpenAI)
├── billing-service       Port 3004 - Stripe & Subscriptions
├── analytics-service     Port 3005 - Analytics & Reporting
└── email-worker          Background - Email Queue
```

### 🗂️ FULL CODEBASE INDEX
**→ Xem file `.claude/CODEBASE_INDEX.md` để biết CHI TIẾT TOÀN BỘ:**
- Tất cả controllers, services, routes của mỗi service
- Function name → File location mapping
- Database models overview
- Quick search patterns

**Khi nào dùng:**
- Cần tìm file cụ thể nhanh
- Cần biết function ở đâu
- Cần overview toàn bộ architecture

**Import vào context (nếu cần detail):**
@.claude/CODEBASE_INDEX.md

---

## 🛠️ Common Commands

### Development
```bash
# Start all services
cd backend && npm run dev:all

# Start specific service
cd backend/services/auth-service && npm run dev

# Database migration
cd backend/services/auth-service && npx prisma migrate dev
```

### Docker
```bash
# Start infrastructure
docker-compose up -d postgres redis

# View logs
docker logs <container-id>

# Restart service
docker-compose restart postgres
```

### Windows - Kill stuck processes
```bash
# Find process by port
netstat -ano | findstr :3000

# Kill process
taskkill /F /PID <pid>
```

---

## 📝 Coding Conventions

### File Naming
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Middleware: `*.middleware.ts`
- Types: `*.types.ts`

### TypeScript
- Always use strict types, NO `any`
- Use interfaces for DTOs
- Use types for unions/intersections

### API Conventions (Detailed)
@.claude/api-conventions.md

### Database Conventions (Detailed)
@.claude/database-conventions.md

---

## 🔐 Authentication Flow

1. User login → JWT (15min) + Refresh Token (7 days)
2. JWT in `Authorization: Bearer <token>` header
3. Refresh Token in HTTP-only cookie
4. API Gateway validates JWT before routing

---

## ⚡ Performance Guidelines

- Always use Redis cache cho frequently accessed data
- Database queries phải có indexes
- N+1 queries là KHÔNG được phép
- API response time target: < 200ms

---

## 🐛 Debugging Checklist

Khi gặp lỗi, check theo thứ tự:

1. **Service logs** - Check console output
2. **Database connection** - Verify PostgreSQL running
3. **Redis connection** - Verify Redis running
4. **Environment variables** - Check .env file
5. **Port conflicts** - Use netstat để check
6. **JWT tokens** - Verify expiry và signature

---

## 🚨 Common Issues & Solutions

### Database connection failed
```bash
# Check PostgreSQL running
docker ps | findstr postgres

# Restart if needed
docker-compose restart postgres
```

### Port already in use (Windows)
```bash
netstat -ano | findstr :<port>
taskkill /F /PID <pid>
```

### Redis timeout
```bash
docker-compose up -d redis
```

### Prisma migration failed
```bash
npx prisma migrate reset
npx prisma generate
npx prisma db push
```

---

## 📊 Testing Strategy

### Before commit:
- [ ] Run unit tests: `npm test`
- [ ] Run linting: `npm run lint`
- [ ] Test affected endpoints với Postman/curl
- [ ] Check for TypeScript errors: `npm run type-check`

### Integration testing:
```bash
# Start all services
npm run dev:all

# Test flow: Register → Login → Create Chat → Send Message
```

---

## 🎨 API Naming Conventions

- `GET /api/resource` - List all
- `GET /api/resource/:id` - Get one
- `POST /api/resource` - Create
- `PUT /api/resource/:id` - Full update
- `PATCH /api/resource/:id` - Partial update
- `DELETE /api/resource/:id` - Delete

---

## 🔒 Security Checklist

Khi implement API endpoint mới:
- [ ] Input validation (joi/zod)
- [ ] Authentication required?
- [ ] Authorization (role-based)?
- [ ] Rate limiting needed?
- [ ] SQL injection safe? (Use Prisma, NO raw queries)
- [ ] XSS safe? (Sanitize input)
- [ ] CORS configured?

---

## 💡 Best Practices

### Khi thêm feature mới:
1. Design database schema first
2. Update Prisma schema
3. Run migration
4. Implement service layer
5. Implement controller
6. Add validation middleware
7. Write tests
8. Update API docs
9. **Update CLAUDE.md này nếu có conventions mới**

### Khi fix bugs:
1. Reproduce bug
2. Write test case để catch bug
3. Fix code
4. Verify test passes
5. Check không break existing tests
6. Add fix vào section "Common Issues" ở trên

---

## 🎯 Current Sprint Focus

**Đang làm:** PDF Q&A Feature Implementation (Phase 1)
- Phase 1 (Weeks 1-3): PDF-only document Q&A with hard limits
- Target: 50 beta users, validate unit economics
- Budget target: Stay under $100-200/month during beta

**Blocked on:**
- None currently

---

## 📋 PRODUCT STRATEGY & MARKET LAUNCH PLAN

> **Last Updated:** 2025-11-13
> **Context:** B2C/Prosumer freemium model | 2-3 person team | $100-500/month budget

### 🎯 Market Position
**Core Differentiation:** "The AI Chat Built for Iterative Thinking"
- Primary USP: Smart prompt upgrading (already built)
- Secondary USP: Workflow-focused features (branching, versioning, collaboration)
- NOT competing on file format parity with ChatGPT/Claude

### 💰 Unit Economics (Critical Constraints)
**Budget Reality Check:**
- Total budget: $100-500/month
- Target: 1,000 free users by Month 3
- Cost per free user: <$0.50/month (aggressive limit enforcement required)
- Paid conversion target: 3-5% (30-50 paid users @ $9-19/month)

**Cost Breakdown:**
- OpenAI API: $0.003 per PDF + Q&A
- Storage (S3): ~$0.00001 per PDF (7-day retention)
- Infrastructure: $50-100/month (hosting, DB, Redis)
- **Video processing: BANNED until Series A** (would cost $3K-5K/month)

### 🚀 MVP Feature Set (Tier 1 - MUST HAVE)

#### ✅ Already Built
1. **Smart Prompt Upgrading** - Core differentiation
2. **OpenAI Chat Integration** - GPT-3.5 & GPT-4 support
3. **User Authentication** - JWT + refresh tokens
4. **Billing System** - Stripe integration
5. **Analytics** - Usage tracking

#### 🔨 Currently Building (Phase 1: Weeks 1-3)
1. **PDF Document Q&A**
   - Upload limit: 5 PDFs per free user, 10MB max each
   - Text extraction: `pdf-parse` library
   - Embeddings: OpenAI embeddings API
   - Vector store: pgvector (PostgreSQL extension)
   - RAG implementation: Semantic search + OpenAI completion
   - Cost: ~$0.003 per PDF processed

#### 📅 Planned (Phase 2: Weeks 4-6)
2. **Conversation Export** - PDF/Markdown download
3. **Template Library** - Pre-built prompt templates
4. **Share Conversations** - Public URLs for viral growth
5. **Image Upload** (limited) - 5 images/month, OpenAI Vision API

#### 📅 Post-MVP (Phase 3: Weeks 7+)
6. **Voice Input** - Whisper API, 10 min/month free tier
7. **Full-Text Search** - PostgreSQL tsvector
8. **Conversation Branching** - Explore multiple angles
9. **Version History** - Track idea evolution

### ❌ Features BANNED for MVP
- ❌ **MP4 Video Processing** - Cost catastrophic ($3K+/month for 1K users)
- ❌ **DOCX Support** - Adds complexity, defer to post-launch
- ❌ **Unlimited Free Tier** - Path to bankruptcy
- ❌ **Multi-format Parity** - Can't compete with ChatGPT's resources
- ❌ **Code Interpreter** - Out of scope

### 🏗️ Technical Architecture Decisions

#### File Processing Approach: Option A (APPROVED)
**Decision:** Extend chat-service rather than create new microservice
**Rationale:**
- ✅ Faster to market (2-3 weeks vs 4-6 weeks)
- ✅ Simpler architecture (KISS principle)
- ✅ Lower operational overhead
- ✅ Can refactor to separate service later if needed

**Implementation:**
```
chat-service/src/services/
├── document.service.ts       # PDF parsing, text extraction
├── embedding.service.ts      # OpenAI embeddings generation
└── vector-store.service.ts   # pgvector semantic search
```

#### Storage Strategy
- **File storage:** AWS S3 or Cloudflare R2 (R2 preferred - free egress)
- **Retention:** 7 days only, then auto-delete (cost control)
- **Embeddings:** Store in PostgreSQL with pgvector extension
- **Text content:** Store extracted text in DB, not original file

#### Cost Monitoring (CRITICAL)
- CloudWatch alarms at $100, $300, $500 monthly spend
- Daily cost tracking per user
- Hard rate limits: 100 API calls/day for free tier
- Automatic service degradation if budget exceeded

### 🎨 Freemium Model Design

#### Free Tier Limits (Strictly Enforced)
- 50 messages/day
- 5 PDFs uploaded (lifetime limit)
- 10MB max per PDF
- 5 images/month (Phase 2)
- 10 minutes voice input/month (Phase 3)
- GPT-3.5-turbo only
- 30-day conversation retention
- **Estimated cost: $0.30-0.50 per user per month**

#### Paid Tier ($9-19/month)
- Unlimited messages
- 100 PDFs
- 50MB max per PDF
- 50 images/month
- 60 minutes voice/month
- GPT-4 access
- Claude 3 access (if margins allow)
- Forever retention
- Priority support
- Early access to new features

#### Target Metrics
- Free-to-paid conversion: 3-5%
- Churn rate: <5% monthly
- CAC: <$20 (organic growth focus)
- LTV: >$100 (12+ month retention)

### 🚨 Critical Risks & Mitigation

#### Risk 1: Cost Spirals (HIGH PROBABILITY)
**Impact:** Catastrophic - bankruptcy in 30 days
**Mitigation:**
- ✅ Hard limits enforced at API level
- ✅ Daily cost monitoring dashboard
- ✅ Rate limiting per user (Redis-based)
- ✅ Graceful degradation (queue system)
- ✅ Emergency kill switch for free tier

#### Risk 2: Feature Parity with Giants (MEDIUM)
**Impact:** Commoditization, no differentiation
**Mitigation:**
- ✅ Focus on workflow, not features
- ✅ Build community (Discord, Reddit)
- ✅ Niche marketing (students, writers, researchers)
- ✅ Unique angle: "Iterative thinking with AI"

#### Risk 3: Technical Debt (HIGH)
**Impact:** Slower iterations, harder scaling
**Mitigation:**
- ✅ Document all shortcuts
- ✅ 20% time budget for refactoring
- ✅ Tests for core features (no skipping)
- ✅ Code reviews before merging

### 📊 Success Criteria by Timeline

**Month 1 (Soft Launch):**
- 100 signups
- 20% activation rate (5+ messages sent)
- $50-100/month burn rate
- PDF Q&A working smoothly

**Month 3 (Public Beta):**
- 1,000 signups
- 30% activation rate
- 1-2% paid conversion (10-20 paid users)
- $200-300/month burn rate
- All Tier 1 features shipped

**Month 6 (Public Launch):**
- 10,000 signups
- 40% activation rate
- 3-5% paid conversion (300-500 paid users)
- $2,700-9,500 MRR (monthly recurring revenue)
- $400-600/month burn rate (profitable!)

### 🎯 Competitive Analysis Summary

**ChatGPT:** 100 files, 50MB total, Python interpreter
**Claude:** 5 files, 30MB each, basic document analysis
**Perplexity:** 50 files, 25MB each, web search integration

**Our Differentiators:**
- 🔥 Smart prompt upgrading (unique)
- 🔥 Conversation branching (unique)
- 🔥 Version history (unique)
- 🔥 Export conversations (rare)
- 🔥 Share/collaborate (viral growth)
- ✅ Template library (common but essential)
- ✅ PDF Q&A (table stakes)

### 🔗 Reference Documents
- **Brainstorming Report:** `.claude/archive/plans/market-launch-brainstorm-2025-11-13.md`
- **Technical Architecture:** `.claude/CODEBASE_INDEX.md`
- **Cost Analysis:** See "Unit Economics" section above
- **Feature Prioritization:** See "MVP Feature Set" section above

### ⚡ Quick Decision Matrix

**When user asks to add new feature, check:**
1. Does it support "iterative thinking" angle? (YES = consider, NO = probably skip)
2. Can we build it in <2 weeks? (NO = defer to Phase 3+)
3. Will it cost <$0.10 per free user? (NO = hard limits required or skip)
4. Does ChatGPT already do it better? (YES = skip unless we have unique angle)
5. Is it in Tier 1 MVP list? (NO = defer unless critical)

**Example decisions using matrix:**
- Video processing: ❌ Costs $3/user, defer until funded
- Voice input: ✅ Costs $0.06/user with 10min limit, add in Phase 2
- DOCX support: ⚠️ Costs $0.003/doc similar to PDF, but adds complexity - defer to Phase 3
- Code interpreter: ❌ Complex + outside "iterative thinking" angle, skip entirely
- Conversation branching: ✅ Near-zero cost, supports core angle, add to Phase 3

---

## 📚 Important Notes

- **Database:** PostgreSQL container phải chạy trước khi start services
- **Redis:** Required cho session management và caching
- **Windows:** Nhớ kill processes sau khi test (taskkill)
- **JWT Secret:** KHÔNG commit .env vào git!
- **API Gateway:** Mọi requests phải đi qua gateway (port 4000)

---

## 📝 Key Functions & Patterns (Pseudo-Index)

> Thay vì paste code vào CLAUDE.md, chỉ note LOCATION để Claude tìm nhanh

### Authentication Patterns
- Token generation: `auth-service/src/utils/jwt.utils.ts`
- Token verification: `auth-service/src/middleware/auth.middleware.ts`
- Login flow: `auth-service/src/controllers/auth.controller.ts`
- Password hashing: Uses bcrypt in auth.service.ts

### Database Patterns
- User operations: `user-service/src/services/user.service.ts`
- Chat operations: `chat-service/src/services/chat.service.ts`
- Prisma client: `*/src/config/database.ts`
- Migrations: `*/prisma/migrations/`

### Error Handling Patterns
- Custom errors: `backend/shared/errors/` (BadRequestError, UnauthorizedError, etc.)
- Error middleware: `*/src/middleware/error.middleware.ts`
- Response format: `{ success: false, error: { message, code } }`

### Validation Patterns
- Request validation: `*/src/middleware/validation.middleware.ts`
- Schemas: `*/src/validation/schemas/` (using Joi or Zod)

### Real-time Patterns
- Socket.io setup: `chat-service/src/sockets/chat.socket.ts`
- Event handlers: Check socket file for events like `message:send`

---

## 🚀 Tips cho Claude

### Khi debug:
- Luôn check logs trước
- Verify database/Redis connection
- Check JWT token validity
- Verify CORS settings

### Khi add features:
- Follow conventions trong file này
- **First:** Check "Quick File Finder" để biết file location
- **Then:** Use Grep/Read tools để đọc specific files
- Update file này nếu thêm patterns/conventions mới

### Efficient Discovery (SMART navigation - Như RAG!):
1. **FIRST:** Check `.claude/CODEBASE_INDEX.md` để tìm file location
   - Có function name → location mapping
   - Có task → file mapping
   - Có service structure detail
2. **THEN:** Read specific file found trong index
3. **FALLBACK:** Nếu không có trong index, dùng Grep/Glob
4. **NEVER:** Đọc toàn bộ codebase

**Example workflow:**
```
Task: "Fix login bug"
→ Check CODEBASE_INDEX.md → login() ở auth.controller.ts
→ Read auth-service/src/controllers/auth.controller.ts
→ Fix bug
→ Done trong 30 giây thay vì 5 phút!
```

### File locations nhanh:
- Configs: `backend/services/*/src/config/`
- Environment: `backend/services/*/.env`
- DB Models: `backend/services/*/prisma/schema.prisma`
- Controllers: `backend/services/*/src/controllers/`

---

**✨ Pro Tips:**
- Dùng `#` để add memory nhanh
- Dùng `/memory` để edit file này
- File này được auto-load MỌI conversation!

---

## 🤖 AUTOMATION SYSTEMS

### 1. Memory Auto-Update
**Auto-update memory files sau mỗi commit!**

```bash
# Install hooks
.claude\hooks\install-hooks.bat

# Commands
npm run memory:check      # Check nếu cần update
npm run memory:update     # Auto-update index
npm run memory:commit     # Update + commit
```

**Docs:** `.claude/AUTOMATION_GUIDE.md`, `.claude/INSTALL.md`

---

### 2. Autonomous Mode (NEW!) 🤖
**Claude tự làm liên tục không cần accept!**

```bash
# Start autonomous mode
.claude\start-autonomous.bat

# Give autonomous instructions:
"Fix all errors autonomously. Test after each fix. Report when done."
```

**Features:**
- ✅ Auto-accepts edits/writes
- ✅ Auto-runs tests
- ✅ Blocks dangerous operations
- ✅ Works for hours without prompts!

**Guide:** `.claude/AUTONOMOUS_GUIDE.md` (quick start + full docs)
**Prompts:** `.claude/PROMPT_LIBRARY.md`

**Lợi ích:** 10x faster development, 0 manual approvals! 🚀

---

### 3. Parallel Agents System 🚀
**Launch multiple Claude agents simultaneously!**

**Guide:** `.claude/PARALLEL_GUIDE.md` (quick start + strategies)

Quick commands:
```bash
npm run parallel:plan        # Auto-generate task distribution
npm run parallel:template    # Get safe template
```

---

### 4. Frontend Testing Agents 🎨✨
**5 specialized agents test frontend simultaneously!**

**Guide:** `.claude/TESTING_GUIDE.md` (quick setup + full docs)

```bash
# Install (one-time)
cd frontend/
npm install -D @playwright/test playwright
npx playwright install

# Run all tests in parallel
npm run test:frontend:parallel

# Run individual tests
npm run test:frontend:e2e          # E2E tests
npm run test:frontend:visual       # Visual regression
npm run test:frontend:integration  # Backend integration
npm run test:frontend:layout       # UI layout checker
```

**What it tests:**
- 🌐 **E2E:** Login, chat, billing flows end-to-end
- 🎨 **Visual:** Screenshot comparison, detect UI changes
- 🔌 **Integration:** Backend API health, WebSocket connections
- 📐 **Layout:** Overlapping elements, z-index issues, responsive design
- ⚡ **Performance:** Load times, bundle size, Lighthouse scores

**Detects:**
- ❌ Broken user flows
- ❌ UI layout shifts & visual regressions
- ❌ Elements overlapping/hidden (z-index problems)
- ❌ Backend API failures
- ❌ Slow page loads & large bundles

**Performance:** 3x faster (10 min parallel vs 30+ min sequential)

**Copy-paste command for parallel testing:** See `.claude/TESTING_GUIDE.md`

---

### 5. Playwright MCP - Browser Automation 🎭
**Claude kiểm soát browser trực tiếp để debug UI real-time!**

**Guide:** `.claude/PLAYWRIGHT_GUIDE.md` (quick start + full capabilities)

**Setup:** ✅ Đã cài sẵn! (`.mcp.json` + `settings.local.json`)

**Cách dùng:**
```
"Open /login in browser and check if form is visible"
"Debug why the modal is not appearing on top"
"Click submit button and check console for errors"
"Take screenshot of chat interface and analyze layout"
```

**Capabilities:**
- 🌐 **Browser Control:** Open, navigate, click, fill forms
- 🔍 **DOM Inspection:** Read element properties, check visibility
- 📊 **Console Logs:** Monitor errors, warnings, network requests
- 📸 **Screenshots:** Capture UI for debugging
- 🐛 **Layout Debug:** Find overlapping elements, z-index issues

**Use Cases:**
- Interactive UI debugging (better than static analysis)
- Real-time form testing with validation
- Console error monitoring during user flows
- Visual regression verification
- Responsive design testing

**Note:** Cần **restart Claude Code** để MCP servers activate!

---

## 🤖 CLAUDEKIT ENGINEER INTEGRATION

### Agent Orchestration System
ClaudeKit provides specialized AI agents for different development tasks. Each agent has specific expertise and works independently or in coordination with other agents.

### Available Workflows

ClaudeKit follows structured workflows to ensure consistent, high-quality delivery:

- **Primary workflow:** `./.claude/workflows/primary-workflow.md`
- **Development rules:** `./.claude/workflows/development-rules.md`
- **Orchestration protocols:** `./.claude/workflows/orchestration-protocol.md`
- **Documentation management:** `./.claude/workflows/documentation-management.md`

**IMPORTANT RULES:**
- ✅ Always read `./README.md` first before planning/implementing
- ✅ Follow development rules in `./.claude/workflows/development-rules.md` strictly
- ✅ Activate relevant skills from the catalog as needed
- ✅ Sacrifice grammar for concision in reports
- ✅ List unresolved questions at the end of reports

### OpenCode Agents (`.opencode/agent/`)

Available specialized agents:
- **planner** - Technical planning and architecture design
- **researcher** - Technology research and analysis
- **code-reviewer** - Code quality and standards enforcement
- **debugger** - Issue diagnosis and root cause analysis
- **tester** - Test generation and validation
- **docs-manager** - Documentation synchronization
- **git-manager** - Version control management
- **project-manager** - Progress tracking and reporting
- **system-architecture** - System design and architecture
- **ui-ux-designer** - UI/UX design and prototyping
- **ui-ux-developer** - Frontend implementation

### Slash Commands (`.claude/commands/`)

Quick commands for common workflows:
- `/plan` - Create implementation plan
- `/cook` - Implement features following the plan
- `/debug` - Diagnose issues
- `/fix` - Fix bugs and issues
- `/test` - Run tests and validation
- `/review` - Code review and quality check
- `/docs` - Update documentation
- `/watzup` - Check project status
- `/scout` - Explore and analyze codebase
- `/brainstorm` - Generate solution ideas
- `/bootstrap` - Initialize new features

### Usage Examples

**Feature Planning:**
```
/plan "implement real-time notifications with Socket.io"
```

**Implementation:**
```
/cook "follow the plan to add notification system"
```

**Quality Assurance:**
```
/test
/review
/docs
```

**Project Management:**
```
/watzup  # Get current project status
```

### Integration with My-SaaS-Chat

ClaudeKit agents understand the project structure from:
- `.claude/CODEBASE_INDEX.md` - Service locations and function mappings
- `CLAUDE.md` (this file) - Project conventions and patterns
- `docs/` - Architecture and technical documentation
- `plans/` - Implementation plans and templates

This ensures agents have full context about the microservices architecture, database patterns, and coding conventions.

---

## 🧠 SMART WORKFLOW AUTO-SELECTOR

> **CRITICAL:** Claude TỰ ĐỘNG chọn workflow tối ưu khi user nêu vấn đề!
> **Full Guide:** `.claude/SMART_WORKFLOW_ANALYZER.md`

### Auto-Analysis Protocol

**KHI USER NÊU VẤN ĐỀ**, Claude tự động:

1. **Phân loại vấn đề:**
   - Bug Fix / Error Resolution
   - New Feature Implementation
   - Codebase Exploration
   - Performance Optimization
   - Refactoring / Code Quality
   - Testing & Validation
   - Documentation Update
   - Integration (API/Service)

2. **Đánh giá độ phức tạp:**
   - Simple (1-2 files, <2 hours)
   - Medium (3-5 files, 2-6 hours)
   - Complex (6+ files, 1+ days)

3. **Generate workflow tối ưu:**
   - Chọn slash commands phù hợp
   - Chọn agents cần thiết
   - Tạo execution sequence
   - Định nghĩa checkpoints
   - Đặt success criteria

### Quick Workflow Selection Table

| Problem Type | Start With | Then | Finally | Agents |
|--------------|-----------|------|---------|--------|
| **Bug/Error** | /scout or /debug | /fix | /test + /review | debugger → code-reviewer |
| **New Feature** | /brainstorm + /plan | /cook | /test + /review + /docs | planner, researcher → code-reviewer |
| **Exploration** | /scout | /ask | - | scout |
| **Performance** | /scout + /debug | /plan + /cook | /test + /review | debugger → tester |
| **Refactor** | /scout + /review | /cook | /test + /review | code-reviewer |
| **Testing** | /scout | /cook (add tests) | /test | tester |

### Example Auto-Response Format

```
📊 PROBLEM ANALYSIS
Type: [detected type]
Complexity: [Simple/Medium/Complex]
Estimated Time: [X hours/days]

🎯 RECOMMENDED WORKFLOW
Step 1: [command] - [purpose]
Step 2: [command] - [purpose]
...

🚀 EXECUTION COMMANDS
[Copy-paste commands]

⚠️ CRITICAL CHECKPOINTS
[Verification points]

✅ SUCCESS CRITERIA
[How to know it's done]
```

### Decision Logic (Claude follows automatically)

**If problem contains: "error", "bug", "fail", "broken", "not working"**
→ Classification: Bug Fix
→ Workflow: /scout → /debug → /fix → /test → /review

**If problem contains: "implement", "add", "create", "build", "feature"**
→ Classification: New Feature
→ Workflow: /brainstorm → /plan → /cook → /test → /review → /docs

**If problem contains: "understand", "how does", "explain", "learn", "explore"**
→ Classification: Exploration
→ Workflow: /scout → /ask

**If problem contains: "slow", "performance", "optimize", "speed up", "latency"**
→ Classification: Performance
→ Workflow: /scout → /debug → /plan → /cook → /test → /review

**Always apply:**
- YAGNI, KISS, DRY principles
- Test after each major step
- Review before completion
- Document changes

### Pro Tips

✅ **User chỉ cần nói vấn đề tự nhiên** - Claude sẽ tự analyze
✅ **Không cần format phức tạp** - Nói như chat bình thường
✅ **Claude sẽ breakdown thành steps** - Rõ ràng, có thể execute
✅ **Luôn có checkpoints** - Không bỏ sót bước nào
✅ **Success criteria rõ ràng** - Biết khi nào hoàn thành

### Usage Example

**User nói:**
```
"Lỗi chat không gửi được tin nhắn"
```

**Claude tự động trả về:**
```
📊 PROBLEM ANALYSIS
Type: Bug Fix
Complexity: Medium
Estimated Time: 2-3 hours

🎯 RECOMMENDED WORKFLOW
Step 1: /scout "chat message sending"
Step 2: /debug "chat message not sending"
Step 3: /fix "based on debug findings"
Step 4: /test
Step 5: /review

🚀 START HERE:
/scout "chat message sending"
```

**Reference:** See `.claude/SMART_WORKFLOW_ANALYZER.md` for detailed examples and full documentation.

# 🗂️ CODEBASE INDEX - Smart Navigation

> **Mục đích:** Index chi tiết TOÀN BỘ codebase để Claude tìm file nhanh như RAG
> **Tự động:** File này nên được regenerate khi có thay đổi lớn
> **Cập nhật:** 2025-11-06

---

## 📋 SERVICES OVERVIEW

```
my-saas-chat/backend/
├── services/
│   ├── auth-service          Port 3001 - Authentication & User Management
│   ├── chat-service          Port 3003 - Chat & AI Integration
│   ├── billing-service       Port 3004 - Stripe Billing & Subscriptions
│   ├── analytics-service     Port 3005 - Analytics & Reporting
│   ├── orchestrator-service  Port 3006 - AI Orchestration
│   └── email-worker          Background - Email Queue Processing
├── shared/                   ⭐ NEW - Shared Services Layer
│   ├── services/             AI services (LLM, Embeddings, Cloudflare)
│   ├── config/               Shared configuration & validation
│   ├── events/               Event publisher & types
│   └── tracing/              Jaeger distributed tracing
└── tests/                    ⭐ NEW - Integration & Performance Tests
    ├── integration/          Multi-service integration tests
    └── performance/          Load testing & benchmarks
```

---

## 🎯 AUTH-SERVICE (Port 3001)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `auth.controller.ts` | Auth operations | register(), login(), logout(), refreshToken() |
| `workspace.controller.ts` | Workspace CRUD | createWorkspace(), getWorkspace(), updateWorkspace() |
| `preferences.controller.ts` | User preferences | getPreferences(), updatePreferences() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `auth.service.ts` | Auth business logic | validateCredentials(), generateTokens() |
| `workspace.service.ts` | Workspace logic | - |
| `preferences.service.ts` | Preferences logic | - |
| `queue.service.ts` | Queue management | - |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `auth.routes.ts` | `/api/auth` | Login, register, logout, refresh |
| `workspace.routes.ts` | `/api/workspaces` | Workspace CRUD |
| `preferences.routes.ts` | `/api/preferences` | User preferences |
| `debug.routes.ts` | `/debug` | Debug endpoints |

### Middleware
| File | Purpose |
|------|---------|
| `auth.middleware.ts` | JWT verification, protect routes |

### Database
| File | Contains |
|------|----------|
| `prisma/schema.prisma` | User, Workspace, Preferences models |

### Key Locations
- **Config:** `src/config/`
- **Types:** `src/types/`
- **Utils:** `src/utils/`
- **Tests:** `src/__tests__/`

---

## 💬 CHAT-SERVICE (Port 3003)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `chat.controller.ts` | Chat operations | createChat(), getChats(), sendMessage(), streamChat() |
| `document.controller.ts` | Document upload & Q&A | uploadDocument(), queryDocument(), listDocuments() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `chat.service.ts` | Chat business logic | handleChat(), saveMessage() |
| `openai.service.ts` | OpenAI integration | callOpenAI(), streamResponse() |
| `billing-client.service.ts` | Billing integration | trackUsage(), checkQuota() |
| `document.service.ts` | PDF processing | processPDF(), extractText(), queryDocument() |
| `embedding.service.ts` | Vector embeddings | generateEmbedding(), batchEmbed() |
| `vector-store.service.ts` | Semantic search | storeEmbedding(), semanticSearch() |
| `cost-monitor.service.ts` | Cost tracking | trackCost(), checkLimits(), alertBudget() |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `chat.routes.ts` | `/api/chats` | Chat CRUD, messaging |

### Database
| File | Contains |
|------|----------|
| `prisma/schema.prisma` | Chat, Message, Conversation, Document, DocumentQuery, TokenUsage models |

### Key Features
- **Real-time:** Socket.io integration
- **AI:** OpenAI GPT integration
- **Streaming:** Server-sent events for streaming responses
- **Document Processing:** PDF upload, text extraction, embeddings, semantic search
- **Vector Search:** pgvector for RAG (Retrieval-Augmented Generation)
- **Cost Monitoring:** Per-user cost tracking, budget alerts

---

## 💳 BILLING-SERVICE (Port 3004)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `billing.controller.ts` | Billing operations | createSubscription(), cancelSubscription(), webhook() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `billing.service.ts` | Billing logic | handleSubscription() |
| `stripe.service.ts` | Stripe integration | createCustomer(), createCheckout() |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `billing.routes.ts` | `/api/billing` | Subscriptions, webhooks |

### Database
| File | Contains |
|------|----------|
| `prisma/schema.prisma` | Subscription, Payment models |

### Key Integrations
- **Stripe:** Payment processing
- **Webhooks:** Stripe webhook handling

---

## 📊 ANALYTICS-SERVICE (Port 3005)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `analytics.controller.ts` | Analytics endpoints | getStats(), getReports() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `chat-analytics.service.ts` | Chat metrics | getChatStats(), getUsageMetrics() |
| `user-analytics.service.ts` | User metrics | getUserStats(), getActiveUsers() |
| `revenue-analytics.service.ts` | Revenue metrics | getRevenue(), getMRR() |
| `provider-analytics.service.ts` | Provider metrics | getProviderStats() |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `analytics.routes.ts` | `/api/analytics` | Analytics endpoints |

### Utils
| File | Purpose |
|------|---------|
| `logger.ts` | Logging utility |

---

## 📧 EMAIL-WORKER

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `email.service.ts` | Email sending | sendEmail(), processQueue() |

### Key Features
- **Queue:** Background job processing
- **Templates:** Email templates
- **SMTP:** Email delivery

---

## 🤖 SHARED SERVICES (backend/shared/services/) ⭐ NEW

### AI Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `llm.service.ts` | Multi-provider LLM | generateRAGAnswer(), autoSelectProvider(), estimateCost() |
| `embedding.service.ts` | Unified embeddings | embed(), embedBatch(), cosineSimilarity() |
| `cloudflare-ai.service.ts` | Cloudflare Workers AI | generateEmbedding(), generateText(), generateRAGAnswer() |

### Configuration & Utilities
| File | Purpose | Key Functions |
|------|---------|---------------|
| `config/sentry.ts` | Sentry error tracking | initSentry() |
| `config/schema.ts` | Zod validation schemas | 25+ config schemas |
| `config/validator.ts` | Runtime validation | validateConfig() |
| `events/index.ts` | Event publisher | publishEvent() |
| `tracing/jaeger.ts` | Distributed tracing | initJaegerTracing() |

### Key Features
- **Multi-Provider:** OpenAI, Cloudflare, Anthropic support
- **Cost Tracking:** Built-in cost estimation per operation
- **Auto-Selection:** Complexity-based provider routing
- **Caching:** In-memory cache with 20-40% hit rate
- **Batch Processing:** Rate-limited batch operations
- **Retry Logic:** Exponential backoff (up to 5 retries)

**See:** [docs/SHARED_SERVICES.md](../docs/SHARED_SERVICES.md) for detailed documentation

---

## 🧪 TESTS (backend/tests/) ⭐ NEW

### Integration Tests
| File | Tests | Purpose |
|------|-------|---------|
| `integration/auth-chat.integration.test.ts` | 10 | Auth + Chat flows |
| `integration/chat-billing.integration.test.ts` | 10 | Chat + Billing flows |
| `integration/document-pipeline.integration.test.ts` | 10 | Document processing |

### Performance Benchmarks
| File | Purpose | Tool |
|------|---------|------|
| `performance/api-benchmarks.js` | API load testing | k6 |
| `performance/autocannon-benchmark.js` | HTTP benchmarking | autocannon |
| `performance/database-benchmarks.ts` | Query performance | TypeScript |
| `performance/embedding-benchmarks.ts` | Embedding comparison | TypeScript |
| `performance/load-test.yml` | Scenario testing | Artillery |
| `performance/vector-benchmarks.ts` | pgvector performance | TypeScript |

### Test Infrastructure
- **Docker Compose:** PostgreSQL (5433), Redis (6380), MinIO (9001-9002)
- **Fixtures:** Test users, conversations, documents
- **Mocks:** OpenAI, Stripe, external APIs

**See:** [docs/TESTING_GUIDE.md](../docs/TESTING_GUIDE.md) for comprehensive testing guide

---

## 🎨 FRONTEND TESTS (frontend/tests/) ⭐ NEW

### E2E Tests (Playwright)
| File | Tests | Purpose |
|------|-------|---------|
| `e2e/auth/login.spec.ts` | 20 | Login flows |
| `e2e/auth/logout.spec.ts` | 15 | Logout flows |
| `e2e/auth/signup.spec.ts` | 18 | Registration |
| `e2e/auth/forgot-password.spec.ts` | 20 | Password recovery |
| `e2e/billing/pricing.spec.ts` | 12 | Pricing page |
| `e2e/billing/subscription.spec.ts` | 25 | Subscription flows |
| `e2e/billing/usage-stats.spec.ts` | 15 | Usage analytics |
| `e2e/chat/conversations.spec.ts` | 18 | Chat management |
| `e2e/chat/messages.spec.ts` | 15 | Message sending |
| `e2e/chat/ui-features.spec.ts` | 10 | UI interactions |
| `e2e/basic.spec.ts` | 3 | Homepage, navigation |

**Total:** 183 E2E tests

**See:** [frontend/tests/E2E_TEST_REPORT.md](../frontend/tests/E2E_TEST_REPORT.md) for detailed analysis

---

## 🌐 API-GATEWAY (Port 4000)

**Location:** `backend/api-gateway/`

**Main file:** `gateway.js` (Fastify-based API Gateway)

**Actual structure:**
```
backend/api-gateway/
├── gateway.js           # Main gateway server (Fastify)
├── src/
│   ├── config/          # Environment config
│   ├── middleware/      # Logging, rate limiting
│   ├── routes/          # Proxy routes
│   └── tracing/         # Jaeger tracing
├── dist/                # Compiled TypeScript
└── package.json
```

**Features:**
- CORS with credentials
- Rate limiting (100 req/min)
- Security headers (Helmet)
- Request logging (Pino)
- Health check at /health
- Proxies to: auth-service (3001), chat-service (3003), billing-service (3004)

---

## 🔍 QUICK SEARCH PATTERNS

### Tìm Shared AI Services ⭐ NEW
```
Location: backend/shared/services/
Files: llm.service.ts, embedding.service.ts, cloudflare-ai.service.ts
Usage: import { LLMService, EmbeddingService } from '@saas/shared/services'
```

### Tìm Shared Configuration ⭐ NEW
```
Location: backend/shared/config/
Files: schema.ts (Zod schemas), validator.ts, sentry.ts
Usage: import { validateConfig } from '@saas/shared/config'
```

### Tìm Integration Tests ⭐ NEW
```
Location: backend/tests/integration/
Files: auth-chat.integration.test.ts, chat-billing.integration.test.ts
```

### Tìm Performance Benchmarks ⭐ NEW
```
Location: backend/tests/performance/
Files: api-benchmarks.js, autocannon-benchmark.js, database-benchmarks.ts
```

### Tìm Frontend E2E Tests ⭐ NEW
```
Location: frontend/tests/e2e/
Files: auth/*.spec.ts, billing/*.spec.ts, chat/*.spec.ts
```

### Tìm Authentication Logic
```
Location: backend/services/auth-service/src/
Files: auth.controller.ts, auth.service.ts, auth.middleware.ts
```

### Tìm Chat/AI Logic
```
Location: backend/services/chat-service/src/
Files: chat.controller.ts, chat.service.ts
Note: OpenAI integration moved to shared services (backend/shared/services/llm.service.ts)
```

### Tìm Billing/Stripe Logic
```
Location: backend/services/billing-service/src/
Files: billing.controller.ts, billing.service.ts, stripe.service.ts
```

### Tìm Analytics Logic
```
Location: backend/services/analytics-service/src/services/
Files: *-analytics.service.ts
```

### Tìm Database Models
```
Pattern: backend/services/*/prisma/schema.prisma
Services with DB: auth-service, chat-service, billing-service
```

### Tìm Routes
```
Pattern: backend/services/*/src/routes/*.routes.ts
```

### Tìm Controllers
```
Pattern: backend/services/*/src/controllers/*.controller.ts
```

### Tìm Services (Business Logic)
```
Pattern: backend/services/*/src/services/*.service.ts
```

---

## 📚 COMMON TASKS → FILE LOCATIONS

### "Add new AI provider" ⭐ NEW
→ `backend/shared/services/llm.service.ts` (add to LLMProvider enum)
→ `backend/shared/services/embedding.service.ts` (add to EmbeddingProvider enum)

### "Optimize AI costs" ⭐ NEW
→ `backend/shared/services/llm.service.ts` (auto-selection logic)
→ `backend/shared/services/embedding.service.ts` (caching logic)
→ `chat-service/src/services/cost-monitor.service.ts` (cost tracking)

### "Add integration test" ⭐ NEW
→ `backend/tests/integration/` (create new test file)
→ Follow pattern in `auth-chat.integration.test.ts`

### "Add E2E test" ⭐ NEW
→ `frontend/tests/e2e/` (create new .spec.ts file)
→ Use helpers from `frontend/tests/e2e/helpers/auth-helper.ts`

### "Run performance benchmark" ⭐ NEW
→ `backend/tests/performance/` (use existing benchmarks)
→ Run: `npm run benchmark:autocannon` (fastest, no install needed)

### "Fix login bug"
→ `auth-service/src/controllers/auth.controller.ts`
→ `auth-service/src/services/auth.service.ts`

### "Add new chat feature"
→ `chat-service/src/controllers/chat.controller.ts`
→ `chat-service/src/services/chat.service.ts`

### "Fix OpenAI integration"
→ `backend/shared/services/llm.service.ts` (shared LLM service)
→ `backend/shared/services/embedding.service.ts` (shared embedding service)
→ `chat-service/src/services/openai.service.ts` (deprecated, use shared services)

### "Implement PDF upload"
→ `chat-service/src/controllers/document.controller.ts`
→ `chat-service/src/services/document.service.ts`

### "Add document Q&A"
→ `chat-service/src/services/document.service.ts`
→ `chat-service/src/services/vector-store.service.ts`

### "Track API costs"
→ `chat-service/src/services/cost-monitor.service.ts`
→ `backend/shared/services/llm.service.ts` (cost estimation)
→ `backend/shared/services/embedding.service.ts` (cost tracking)

### "Update Stripe webhook"
→ `billing-service/src/controllers/billing.controller.ts`
→ Look for webhook() function

### "Add analytics endpoint"
→ `analytics-service/src/controllers/analytics.controller.ts`
→ `analytics-service/src/services/` (choose relevant service)

### "Fix JWT token verification"
→ `auth-service/src/middleware/auth.middleware.ts`

### "Update user model"
→ `auth-service/prisma/schema.prisma`

### "Add email template"
→ `email-worker/src/services/email.service.ts`

---

## 🎯 FUNCTION NAME → LOCATION MAP

### Authentication Functions
- `register()` → auth-service/controllers/auth.controller.ts
- `login()` → auth-service/controllers/auth.controller.ts
- `logout()` → auth-service/controllers/auth.controller.ts
- `refreshToken()` → auth-service/controllers/auth.controller.ts
- `verifyToken()` → auth-service/middleware/auth.middleware.ts

### Chat Functions
- `createChat()` → chat-service/controllers/chat.controller.ts
- `sendMessage()` → chat-service/controllers/chat.controller.ts
- `streamChat()` → chat-service/controllers/chat.controller.ts
- `callOpenAI()` → chat-service/services/openai.service.ts

### Billing Functions
- `createSubscription()` → billing-service/controllers/billing.controller.ts
- `cancelSubscription()` → billing-service/controllers/billing.controller.ts
- `webhook()` → billing-service/controllers/billing.controller.ts
- `createCustomer()` → billing-service/services/stripe.service.ts

### Analytics Functions
- `getChatStats()` → analytics-service/services/chat-analytics.service.ts
- `getUserStats()` → analytics-service/services/user-analytics.service.ts
- `getRevenue()` → analytics-service/services/revenue-analytics.service.ts

---

## 🗄️ DATABASE MODELS QUICK REF

### Auth Service Models
- User (id, email, username, password, workspaceId)
- Workspace (id, name, ownerId)
- Preferences (id, userId, theme, language)

### Chat Service Models
- Chat (id, userId, title, createdAt)
- Message (id, chatId, role, content, tokens)
- Conversation (stores chat history)

### Billing Service Models
- Subscription (id, userId, plan, status, stripeId)
- Payment (id, userId, amount, status)

---

## 📝 PORTS & ENDPOINTS REFERENCE

| Service | Port | Base URL | Health Check |
|---------|------|----------|--------------|
| Auth | 3001 | http://localhost:3001/api | /health |
| Chat | 3003 | http://localhost:3003/api | /health |
| Billing | 3004 | http://localhost:3004/api | /health |
| Analytics | 3005 | http://localhost:3005/api | /health |
| Gateway | 4000 | http://localhost:4000/api | /health |

---

## 🔧 USAGE FOR CLAUDE

### Example Queries → File Locations

**User:** "Fix authentication bug"
**Claude:** Check index → Read `auth-service/src/controllers/auth.controller.ts`

**User:** "Add OpenAI streaming"
**Claude:** Check index → Read `chat-service/src/services/openai.service.ts`

**User:** "Update Stripe webhook handler"
**Claude:** Check index → Read `billing-service/src/controllers/billing.controller.ts`, find webhook()

**User:** "Where is user model?"
**Claude:** Check index → `auth-service/prisma/schema.prisma`

---

## 🔄 MAINTENANCE

### Khi nào regenerate index này?
- ✅ Thêm service mới
- ✅ Thêm controller/service mới
- ✅ Refactor lớn (đổi cấu trúc)
- ✅ Rename files quan trọng

### Command để regenerate (tự động):
```bash
# TODO: Create script to auto-generate this index
npm run generate-index
```

---

## 💡 PRO TIPS

1. **Grep trước, Read sau:**
   ```
   Grep("createSubscription") → Find trong billing-service
   Read(billing.controller.ts) → Đọc chi tiết
   ```

2. **Dùng index để skip search:**
   Thay vì Grep toàn codebase, check index này trước!

3. **Pattern matching:**
   - `**/controllers/*.controller.ts` → All controllers
   - `**/services/*.service.ts` → All services
   - `**/prisma/schema.prisma` → All schemas

4. **Function search:**
   Ctrl+F trong file này để tìm function name → biết location ngay!

---

---

## 📊 RECENT UPDATES (2025-11-15)

### Shared Services Added
- `backend/shared/services/` - AI services layer
- `backend/shared/config/` - Configuration & validation
- `backend/shared/events/` - Event publisher
- `backend/shared/tracing/` - Jaeger tracing

### Tests Added
- `backend/tests/integration/` - 30+ integration tests
- `backend/tests/performance/` - 6 benchmark suites
- `frontend/tests/e2e/` - 183 E2E tests

### Key Migrations
- chat-service embeddings → shared EmbeddingService
- chat-service LLM → shared LLMService
- orchestrator-service → pgvector (from Pinecone)
- Eliminated 1,437 lines of duplicate code

### Documentation Updated
- [docs/TESTING_GUIDE.md](../docs/TESTING_GUIDE.md) - Comprehensive testing guide
- [docs/SHARED_SERVICES.md](../docs/SHARED_SERVICES.md) - Shared services architecture
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [docs/CLOUDFLARE_INTEGRATION.md](../docs/CLOUDFLARE_INTEGRATION.md) - Cost optimization
- [docs/OPTIMIZATION_SUMMARY.md](../docs/OPTIMIZATION_SUMMARY.md) - All agent work

---

**🎯 Kết luận:** File này giúp Claude navigate codebase nhanh như có RAG!

**Last Updated:** 2025-11-15 (Added shared services, tests, and recent optimizations)

# 🚀 PROMPT UPGRADER SYSTEM - PROJECT MEMORY

> **Auto-loaded mỗi conversation mới!**
> Last updated: 2025-11-10

---

## 📋 PROJECT STATUS

**Current Phase:** Phase 6 - Complete (100%)
**Next Phase:** Phase 7 - Prompt Versioning & AB Testing
**Total Timeline:** 24 days (10 phases)
**Last Audit:** 2025-11-10 - ALL TESTS PASSED ✅

---

## 🎯 WHAT WE'RE BUILDING

**Enterprise Prompt Upgrader System** - Hệ thống nâng cấp prompt tự động với:

### Core Features (Days 1-9):
1. ✅ Prompt Augmentation Pipeline
2. ✅ RAG Integration (Pinecone vector DB)
3. ✅ Conversation Summarizer
4. ✅ Multi-tenant Isolation
5. ✅ Cost Optimization

### Enterprise Features (Days 10-24):
6. ✅ Multi-tenant AuthN/Z + Quotas
7. ✅ Prompt Versioning & AB Testing (Canary Rollout)
8. ✅ Evals & Red-teaming (Automated Quality Tests)
9. ✅ Advanced Observability (Prometheus + Sentry)
10. ✅ Security Guardrails (PII + Injection Defense)

---

## 🏗️ ARCHITECTURE

```
User Query
    ↓
[PII Redaction]
    ↓
[Parallel Gathering]
├─ Conversation Summary (GPT-4o-mini, cached)
├─ RAG Retrieval (Pinecone vector search)
└─ Context Merge
    ↓
[Prompt Upgrader Agent] (GPT-4o-mini, JSON output)
    ↓
{
  final_prompt: "ROLE/TASK/CONTEXT/CONSTRAINTS/FORMAT",
  reasoning: "...",
  missing_questions: [...]
}
    ↓
[Main LLM] (GPT-4 / Claude 3.5)
    ↓
[PII Restore]
    ↓
Response to User
```

---

## 📂 NEW SERVICE STRUCTURE

```
backend/services/orchestrator-service/
├── src/
│   ├── agents/              # AI Agents
│   │   ├── summarizer.agent.ts
│   │   ├── rag-retriever.agent.ts
│   │   └── prompt-upgrader.agent.ts
│   ├── services/            # Core Services
│   │   ├── embedding.service.ts
│   │   ├── vector-store.service.ts
│   │   ├── pii-redaction.service.ts
│   │   ├── orchestrator.service.ts
│   │   ├── canary-rollout.service.ts
│   │   ├── eval-runner.service.ts
│   │   └── fallback.service.ts
│   ├── prompts/             # Prompt Templates
│   │   ├── summarizer.prompt.ts
│   │   └── upgrader.prompt.ts
│   ├── middleware/          # Middleware
│   │   ├── quota.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── metering.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── controllers/
│   │   └── orchestrator.controller.ts
│   └── jobs/
│       └── nightly-evals.ts
├── prisma/
│   └── schema.prisma        # 10+ models
└── tests/
```

---

## 🗄️ DATABASE MODELS (New)

1. **TenantPlan** - Quotas & billing
2. **UsageMeter** - Token tracking per component
3. **TenantRole** - RBAC (OWNER/ADMIN/MEMBER/VIEWER)
4. **PromptTemplate** - Versioned prompts
5. **PromptRun** - AB test tracking
6. **EvalDataset** - Test cases
7. **EvalQuestion** - Individual tests
8. **EvalRun** - Batch eval results
9. **EvalResult** - Per-question scores
10. **KnowledgeBase** - RAG documents

---

## 📋 10 PHASES OVERVIEW

| Phase | Days | Focus | Status |
|-------|------|-------|--------|
| 1 | 1-2 | Core Infrastructure | ✅ Complete |
| 2 | 3-4 | Core Services (PII, Embedding, Vector) | ✅ Complete |
| 3 | 5-6 | AI Agents (Summarizer, RAG, Upgrader) | ✅ Complete |
| 4 | 7-8 | Orchestrator Pipeline | ✅ Complete |
| 5 | 9 | API & Frontend Integration | ✅ Complete |
| 6 | 10-12 | Multi-tenant + Quotas | ✅ Complete |
| 7 | 13-16 | Prompt Versioning & AB Test | 🔄 Partial (canary service exists) |
| 8 | 17-19 | Evals & Red-teaming | 🔄 Partial (models ready) |
| 9 | 20-21 | Observability | 🔄 Partial (logging + Sentry) |
| 10 | 22-24 | Security & Resilience | ⏳ Pending |

---

## 💡 KEY DECISIONS

### Model Selection:
- **Embedding:** text-embedding-3-small ($0.02/1M tokens)
- **Summarizer:** GPT-4o-mini ($0.15/$0.60 per 1M)
- **Upgrader:** GPT-4o-mini ($0.15/$0.60 per 1M)
- **Main LLM:** GPT-4 or Claude 3.5 Sonnet

### Cost Optimization:
- Redis caching (summary + embeddings)
- Batch embedding API calls
- Context truncation (last 10 messages)
- Target: < $0.12 per request

### Canary Strategy:
- 5% → 25% → 50% → 100%
- Auto-rollback if error_rate > 5%
- 24h between increments

### Eval Criteria:
- Relevance ≥ 0.7
- Faithfulness ≥ 0.8
- Helpfulness ≥ 0.6
- Pass rate ≥ 90%

---

## 🔧 TECH STACK (New Dependencies)

```json
{
  "@pinecone-database/pinecone": "^2.0.0",
  "tiktoken": "^1.0.15",
  "email-regex": "^5.0.0",
  "phone-regex": "^2.2.11",
  "node-cron": "^3.0.3"
}
```

---

## 📊 SUCCESS METRICS

**Performance:**
- Latency < 3s (p95)
- Cache hit rate > 60%
- Error rate < 1%

**Quality:**
- Eval pass rate > 90%
- Relevance > 0.8
- Faithfulness > 0.85

**Cost:**
- Per request < $0.15
- Monthly infrastructure < $200

---

## 🚦 NEXT STEPS (When Ready)

1. **Phase 1, Day 1:**
   - Create orchestrator-service directory
   - Setup package.json + tsconfig
   - Init Prisma schema
   - Setup Express server

2. **Phase 1, Day 2:**
   - Implement env config
   - Setup Pinecone connection
   - Test database connection
   - Create health check endpoint

---

## 📝 NOTES FOR NEXT SESSION

### User Preferences:
- Lightweight guardrails (regex-based PII detection)
- Canary rollout (5→25→50→100%)
- Nightly + on-demand evals
- Already have: Sentry + Prometheus/Grafana

### Design Philosophy:
- Cost-conscious (use mini models where possible)
- Production-ready (monitoring, fallbacks, security)
- Incremental rollout (canary deployment)
- Quality-first (automated evals)

---

## 🎯 IMPLEMENTATION STATUS

### ✅ Completed:
- [x] Ultra-analysis & planning
- [x] Architecture design
- [x] Tech stack selection
- [x] Cost optimization strategy
- [x] 10-phase roadmap
- [x] Phase 1: Core Infrastructure (Database, Config, Server)
- [x] Phase 2: Core Services (PII, Embedding, Vector Store)
- [x] Phase 3: AI Agents (Summarizer, RAG, Upgrader)
- [x] Phase 4: Orchestrator Pipeline (Full flow working)
- [x] Phase 5: API & Controllers (All endpoints tested)
- [x] Phase 6: Multi-tenant & Quotas (Usage tracking working)

### 🔄 In Progress:
- [ ] Phase 7: Prompt Versioning (canary service exists)
- [ ] Phase 8: Evals (database models ready)
- [ ] Phase 9: Observability (basic monitoring working)

### ⏳ Pending:
- Phase 10: Security & Resilience

---

## 🐛 KNOWN ISSUES / BLOCKERS

### 🟡 Issue #1: Pinecone Index Not Found (Non-blocking)
**Severity:** LOW
**Impact:** RAG features disabled, system continues without Pinecone
**Fix:** Create index manually in Pinecone dashboard (10 minutes)

### ⚠️ Issue #2: Missing Input Validation
**Severity:** MEDIUM
**Impact:** No Zod validation on API inputs
**Fix:** Add validation middleware (1-2 hours)

### ⚠️ Issue #3: Swagger Not Configured
**Severity:** LOW
**Impact:** No API documentation UI
**Fix:** Configure swagger-jsdoc (2-3 hours)

---

## 💭 QUESTIONS TO ANSWER LATER

1. Which vector DB? Pinecone vs Weaviate vs Qdrant?
   - **Decision:** Pinecone (simplest API, managed)

2. How many eval test cases?
   - **Decision:** Start with 50, grow to 200+

3. What's the canary increment schedule?
   - **Decision:** 24h between 5% → 25% → 50% → 100%

---

**🎯 Ready to start Phase 1 when user says "bắt đầu"!**

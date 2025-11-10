# Orchestrator Service - Prompt Upgrader System

**Version:** 1.0.0
**Port:** 3006
**Status:** Phase 1 Complete (Core Infrastructure)

---

## Overview

The Orchestrator Service is the core of the **Enterprise Prompt Upgrader System**, responsible for:

- **Prompt Augmentation** - Enhancing user prompts with conversation context and RAG
- **Conversation Summarization** - Caching summaries to reduce token usage
- **RAG Integration** - Vector search using Pinecone
- **Multi-tenant Management** - Quotas, RBAC, and usage tracking
- **Evaluation & Testing** - Automated quality checks and red-teaming
- **Prompt Versioning** - AB testing with canary rollout

---

## Phase 1 Completion Status

### ✅ Completed

1. **Directory Structure**
   - Organized src/ with agents, services, controllers, middleware, prompts
   - Prisma schema with 12+ models
   - Tests directory structure

2. **Database Schema** (12 Models)
   - `TenantPlan` - Quotas & billing
   - `UsageMeter` - Token tracking per component
   - `TenantRole` - RBAC (OWNER/ADMIN/MEMBER/VIEWER)
   - `PromptTemplate` - Versioned prompts
   - `PromptRun` - AB test tracking
   - `EvalDataset`, `EvalQuestion`, `EvalRun`, `EvalResult` - Evaluation system
   - `KnowledgeBase` - RAG documents
   - `ConversationSummary` - Cached summaries
   - `PIIRedaction` - PII tracking records

3. **Core Configuration**
   - Environment config (`env.config.ts`)
   - Database config with Prisma
   - Redis config with helper functions
   - Pinecone config (optional startup)
   - Logger with Pino

4. **Express Server**
   - Basic app structure
   - Health check endpoints (`/health`, `/health/db`, `/health/redis`, `/health/pinecone`)
   - Error handling middleware
   - Graceful shutdown

5. **Database Migration**
   - Schema pushed to PostgreSQL (Neon)
   - Prisma Client generated
   - Using separate schema: `orchestrator`

---

## Tech Stack

### Core Dependencies
- **Express** - Web framework
- **Prisma** - ORM for PostgreSQL
- **TypeScript** - Type safety
- **Pino** - Logging
- **Redis (ioredis)** - Caching
- **Pinecone** - Vector database for RAG
- **OpenAI** - AI models (embeddings, LLMs)
- **BullMQ** - Job queue
- **Zod** - Schema validation

### AI Models
- **Embedding:** text-embedding-3-small
- **Summarizer:** gpt-4o-mini
- **Upgrader:** gpt-4o-mini
- **Main LLM:** gpt-4o-mini (configurable)

---

## Directory Structure

```
orchestrator-service/
├── src/
│   ├── agents/              # ✅ AI Agents (Phase 3)
│   │   ├── summarizer.agent.ts
│   │   ├── rag-retriever.agent.ts
│   │   └── prompt-upgrader.agent.ts
│   ├── services/            # ✅ Core Services (Phase 2)
│   │   ├── pii-redaction.service.ts
│   │   ├── embedding.service.ts
│   │   ├── vector-store.service.ts
│   │   └── orchestrator.service.ts ✅ (Phase 4)
│   ├── controllers/         # ✅ HTTP Controllers
│   │   ├── health.controller.ts
│   │   └── orchestrator.controller.ts ✅
│   ├── middleware/          # Middleware (Phase 6)
│   ├── prompts/             # ✅ Prompt Templates (Phase 3)
│   │   ├── summarizer.prompt.ts
│   │   └── upgrader.prompt.ts
│   ├── config/              # ✅ Configuration
│   │   ├── env.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── pinecone.config.ts
│   │   └── logger.config.ts
│   ├── routes/              # ✅ Route definitions
│   │   ├── health.routes.ts
│   │   └── orchestrator.routes.ts ✅
│   ├── types/               # ✅ TypeScript types
│   │   ├── pii.types.ts
│   │   ├── embedding.types.ts
│   │   ├── vector.types.ts
│   │   └── orchestrator.types.ts
│   └── app.ts               # ✅ Express app
├── prisma/
│   └── schema.prisma        # ✅ 12 models
├── tests/                   # Tests (Phase 8)
├── .env                     # Environment variables
├── .env.example             # Env template
├── API_EXAMPLES.md          # ✅ API documentation (Phase 5)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

See `.env.example` for all available configuration options.

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `PINECONE_API_KEY` - Pinecone API key (optional for dev)
- `OPENAI_API_KEY` - OpenAI API key

### Optional
- `PORT` - Server port (default: 3006)
- `LOG_LEVEL` - Logging level (default: info)
- `NODE_ENV` - Environment (development/production)

---

## Database Models

### Multi-Tenancy
- **TenantPlan** - Monthly quotas (tokens, upgrades, embeddings)
- **UsageMeter** - Tracks usage per component (summarizer, upgrader, embedding)
- **TenantRole** - RBAC with permissions

### Prompt Versioning
- **PromptTemplate** - Versioned prompt templates
- **PromptRun** - Individual runs for AB testing
- **RolloutStage** - Canary rollout (5% → 25% → 50% → 100%)

### Evaluation
- **EvalDataset** - Test case collections
- **EvalQuestion** - Individual test cases
- **EvalRun** - Batch evaluation runs
- **EvalResult** - Results with scores (relevance, faithfulness, helpfulness)

### RAG & Caching
- **KnowledgeBase** - Documents with embeddings
- **ConversationSummary** - Cached summaries with TTL
- **PIIRedaction** - PII redaction records (encrypted)

---

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/db` - Database connection check
- `GET /health/redis` - Redis connection check
- `GET /health/pinecone` - Pinecone connection check
- `GET /health/all` - All services check

### Orchestrator APIs ✅ (Phase 4 Complete)
- `POST /api/upgrade` - **Upgrade prompt** (full pipeline with PII, summarization, RAG, upgrading)
- `GET /api/stats` - Usage statistics (coming in Phase 6)

### Example Usage

```bash
# Upgrade a prompt
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "Help me write code",
    "conversationHistory": [
      {"role": "user", "content": "I am learning JavaScript"},
      {"role": "assistant", "content": "Great choice!"}
    ],
    "userId": "user_123",
    "options": {
      "enableSummarization": true,
      "enableRAG": true,
      "enablePIIRedaction": true
    }
  }'
```

**See `API_EXAMPLES.md` for comprehensive examples!**

### Coming Soon (Phase 6-10)
- `POST /api/knowledge` - Add knowledge base documents
- `GET /api/analytics` - Usage analytics with filters
- `POST /api/eval/run` - Run evaluations

---

## Scripts

```bash
# Development
npm run dev              # Start with hot reload

# Build
npm run build            # Compile TypeScript

# Production
npm start                # Run compiled code

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Create migration
npm run prisma:push      # Push schema to DB

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
```

---

## Development Status

### ✅ Phase 1 Complete (Days 1-2)
- [x] Core Infrastructure
- [x] Database Schema (12 models)
- [x] Configuration (env, DB, Redis, Pinecone)
- [x] Health Checks
- [x] Prisma Setup

### ✅ Phase 2 Complete (Days 3-4)
- [x] PII Redaction Service (regex + AES-256 encryption)
- [x] Embedding Service (OpenAI + Redis caching)
- [x] Vector Store Service (Pinecone operations)

### ✅ Phase 3 Complete (Days 5-6)
- [x] Summarizer Agent (GPT-4o-mini + caching)
- [x] RAG Retriever Agent (vector search + formatting)
- [x] Prompt Upgrader Agent (JSON structured upgrades)

### ✅ Phase 4 Complete (Days 7-8)
- [x] Orchestrator Pipeline (full integration)
- [x] API Controllers (upgrade, stats)
- [x] Error handling & fallbacks

### ✅ Phase 5 Complete (Day 9)
- [x] API documentation (API_EXAMPLES.md)
- [x] Integration examples
- [x] Health check endpoints

### ⏳ Phases 4-10 (Days 7-24)
- See `.claude/PROMPT_UPGRADER_PROJECT.md` for full roadmap

---

## Known Issues & Blockers

### Redis Connection
- **Status:** Required but not running locally
- **Impact:** Service startup fails without Redis
- **Solution:** Start Redis with `docker-compose up -d redis` or use Upstash

### Pinecone
- **Status:** Optional (gracefully degrades)
- **Impact:** RAG features won't work without valid API key
- **Solution:** Sign up at pinecone.io and add API key to `.env`

---

## Testing

### Database Connection
```bash
# Verify database is connected
curl http://localhost:3006/health/db
```

### All Services
```bash
# Check all dependencies
curl http://localhost:3006/health/all
```

---

## Next Steps (Phase 2)

1. **Implement Core Services**
   - `pii-redaction.service.ts` - PII detection and masking
   - `embedding.service.ts` - Text embeddings
   - `vector-store.service.ts` - Pinecone operations

2. **Redis Caching**
   - Summary cache helpers
   - Embedding cache helpers
   - TTL management

3. **Service Tests**
   - Unit tests for each service
   - Integration tests with database

---

## Cost Optimization

- **Redis Caching** - Reduces redundant API calls
- **Batch Embeddings** - Processes multiple texts at once
- **Context Truncation** - Last 10 messages only
- **Mini Models** - Uses gpt-4o-mini for summarizer/upgrader

**Target:** < $0.12 per request

---

## Support & Documentation

- **Project Memory:** `.claude/PROMPT_UPGRADER_PROJECT.md`
- **Main Project:** `.claude/CLAUDE.md`
- **API Conventions:** `.claude/api-conventions.md`
- **Database Conventions:** `.claude/database-conventions.md`

---

**Status:** Ready for Phase 2 Implementation 🚀

# Cloudflare Workers API Gateway

**Smart Hybrid Architecture for My-SaaS-Chat**

🚀 **Cost Savings:** $160/month (80% reduction) = **$1,920/year**

---

## 🎯 Overview

This is a **hybrid architecture** that leverages Cloudflare Workers for performance and cost optimization, while keeping complex operations in the backend.

### What Runs on Workers (FREE or cheap)

✅ **API Gateway** - Routing, CORS, logging (<50ms latency)
✅ **Auth Verification** - JWT validation (KV cache)
✅ **Rate Limiting** - Distributed limiting (KV-based)
✅ **Caching** - Multi-layer cache (Cache API + KV)
✅ **AI Embeddings** - Workers AI `bge-base-en-v1.5` (FREE, 768d)
✅ **Simple LLM** - Workers AI `Llama-2-7B`, `Mistral-7B` (FREE)
✅ **Vector Search** - Cloudflare Vectorize (FREE semantic search)
✅ **Document RAG** - Complete Q&A on edge (FREE)

### What Stays in Backend (complex)

❌ **Complex Auth** - Signup, email verification
❌ **Billing** - Stripe webhooks, transactions
❌ **Complex AI** - GPT-4, multi-step reasoning
❌ **Database Writes** - Transactions, chat history
❌ **File Upload** - Large PDFs, processing
❌ **WebSocket** - Real-time chat (needs Durable Objects)

---

## 📊 Cost Comparison

### Current (After Phase 1)
- **Backend:** $30/month
- **OpenAI:** $155/month
- **PostgreSQL:** $10/month
- **Redis:** $5/month
- **Total:** $200/month

### After Phase 2 (Workers Hybrid)
- **Cloudflare Workers:** $5/month (10M requests)
- **Workers AI:** $0/month (FREE!)
- **Vectorize:** $0/month (FREE!)
- **Backend:** $20/month (50% smaller)
- **PostgreSQL:** $10/month
- **Redis:** $5/month
- **Total:** $40/month

**Savings:** $160/month = **$1,920/year** 💰

---

## 🏗️ Architecture

```
User Request
    ↓
Cloudflare Workers Gateway (Global Edge - <50ms)
    │
    ├─→ Auth Routes
    │   ├─→ JWT Verification (Workers - KV cache)
    │   ├─→ Rate Limiting (Workers - KV)
    │   └─→ Complex Auth → Backend Auth Service
    │
    ├─→ AI Routes (70% on Workers!)
    │   ├─→ Embeddings → Workers AI (FREE)
    │   ├─→ Simple Chat → Workers AI (FREE)
    │   └─→ Complex Chat → OpenAI GPT-4 (proxy)
    │
    ├─→ RAG Routes (100% ON EDGE!)
    │   ├─→ Document Upload → Vectorize
    │   ├─→ Generate Embedding → Workers AI (FREE)
    │   ├─→ Vector Search → Vectorize (FREE)
    │   └─→ Answer Generation → Workers AI (FREE)
    │
    └─→ Billing Routes → Backend Billing Service
```

---

## 🚀 Getting Started

### Prerequisites

1. **Cloudflare Account** (free tier is fine!)
   - Sign up: https://dash.cloudflare.com/sign-up

2. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

3. **Node.js 18+**

### Installation

```bash
# Navigate to cloudflare-gateway
cd backend/cloudflare-gateway

# Install dependencies
npm install

# Login to Cloudflare
wrangler login
wrangler whoami  # Verify login
```

### Configuration

1. **Update `wrangler.toml`**
   - Add your Cloudflare Account ID
   - Update backend service URLs

2. **Create KV Namespace** (for caching, rate limiting)
   ```bash
   wrangler kv:namespace create KV
   # Copy the ID to wrangler.toml
   ```

3. **Create D1 Database** (for analytics)
   ```bash
   wrangler d1 create my-saas-chat-db
   # Copy the database_id to wrangler.toml
   ```

4. **Create Vectorize Index** (for RAG)
   ```bash
   wrangler vectorize create document-vectors --dimensions=768 --metric=cosine
   # Copy to wrangler.toml
   ```

5. **Set Secrets**
   ```bash
   # JWT secret (same as backend)
   wrangler secret put JWT_SECRET

   # OpenAI API key (for complex queries fallback)
   wrangler secret put OPENAI_API_KEY

   # Stripe webhook secret
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

6. **Create `.dev.vars`** (for local development)
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your values
   ```

### Development

```bash
# Run local dev server
npm run dev

# Visit http://localhost:8787
```

### Testing

```bash
# Health check
curl http://localhost:8787/health

# Test CORS
curl -X OPTIONS http://localhost:8787/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

### Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# View logs
npm run logs
```

---

## 📁 Project Structure

```
cloudflare-gateway/
├── src/
│   ├── index.ts              # Main worker entry point
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   ├── rate-limit.ts     # KV-based rate limiting
│   │   └── cache.ts          # Multi-layer caching
│   ├── routes/
│   │   ├── auth.ts           # Auth proxy routes
│   │   ├── ai.ts             # Workers AI routes
│   │   ├── rag.ts            # RAG on edge
│   │   └── billing.ts        # Billing proxy
│   ├── utils/
│   │   ├── routing.ts        # Backend routing & health checks
│   │   └── logger.ts         # Logging utilities
│   └── types/
│       └── env.ts            # Environment types
├── migrations/
│   └── 0001_create_tables.sql  # D1 migrations
├── wrangler.toml             # Cloudflare config
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Development Workflow

### Phase 1: Setup (Agent 1) ✅
- Cloudflare account setup
- Wrangler CLI installation
- Project initialization
- KV, D1, Vectorize creation

### Phase 2: Core Gateway (Agents 2-6)
- Router & auth middleware
- Rate limiting (KV)
- Auth routes (proxy)
- Caching layer
- Backend routing & health checks

### Phase 3: Workers AI (Agents 7-12)
- FREE embeddings
- Smart LLM routing
- Streaming responses
- Cost monitoring
- Usage analytics
- A/B testing

### Phase 4: Vectorize RAG (Agents 13-16)
- Vectorize index setup
- Document upload pipeline
- Semantic search
- Complete RAG on edge

### Phase 5: Testing & Migration (Agents 17-20)
- Load testing (k6)
- Migration scripts
- Gradual rollout (10% → 100%)
- Final documentation

---

## 🎯 Success Criteria

After full deployment:

✅ **Cost Savings**
- $160/month reduction (80%)
- $1,920/year savings
- 70%+ requests served by FREE tier

✅ **Performance**
- <50ms latency (global edge)
- 60%+ cache hit rate
- Auto-scaling to millions

✅ **Features**
- Workers AI embeddings (FREE)
- Smart LLM routing (FREE for simple)
- Vectorize RAG (100% on edge)
- D1 analytics
- KV caching & rate limiting

✅ **Quality**
- All tests passing
- Load tested (10k+ concurrent)
- Gradual rollout validated
- Rollback procedures documented

---

## 📚 Resources

### Cloudflare Documentation
- **Workers:** https://developers.cloudflare.com/workers/
- **Workers AI:** https://developers.cloudflare.com/workers-ai/
- **Vectorize:** https://developers.cloudflare.com/vectorize/
- **KV:** https://developers.cloudflare.com/kv/
- **D1:** https://developers.cloudflare.com/d1/

### Hono Framework
- **Docs:** https://hono.dev/
- **Examples:** https://github.com/honojs/hono/tree/main/examples

### Workers AI Models
- **Embeddings:** `@cf/baai/bge-base-en-v1.5` (768d, FREE)
- **LLM:** `@cf/meta/llama-2-7b-chat-int8` (FREE)
- **LLM:** `@cf/mistral/mistral-7b-instruct-v0.1` (FREE)

---

## 🐛 Troubleshooting

### Wrangler not found
```bash
npm install -g wrangler
```

### KV/D1/Vectorize not working locally
- Create namespaces first: `wrangler kv:namespace create KV`
- Update IDs in `wrangler.toml`
- Run migrations: `npm run d1:migrations:apply`

### 401 Unauthorized errors
- Check `.dev.vars` has correct `JWT_SECRET`
- Verify JWT token format: `Bearer <token>`

### CORS errors
- Update allowed origins in `src/index.ts`
- Check CORS middleware configuration

### Workers AI errors
- Verify `[ai]` binding in `wrangler.toml`
- Check model name is correct (e.g., `@cf/baai/bge-base-en-v1.5`)

---

## 🤝 Contributing

This gateway is part of the **My-SaaS-Chat** project.

**Agents working on this:**
- Agent 1: Setup (this README)
- Agent 2: Router & Auth
- Agent 3: Rate Limiting
- Agent 4: Auth Routes
- Agent 5: Caching
- Agent 6: Backend Routing
- Agents 7-20: AI, RAG, Testing

---

## 📝 License

Part of My-SaaS-Chat project. See root LICENSE file.

---

## 🎉 Next Steps

After completing Agent 1 setup:

1. ✅ Install dependencies: `npm install`
2. ✅ Login to Cloudflare: `wrangler login`
3. ✅ Create KV namespace: `npm run kv:create`
4. ✅ Create D1 database: `npm run d1:create`
5. ✅ Create Vectorize index: `npm run vectorize:create`
6. ✅ Set secrets: `wrangler secret put JWT_SECRET`
7. ✅ Test locally: `npm run dev`
8. 🚀 **Move to Agent 2:** Router & Auth Middleware

---

**Built with ❤️ using Cloudflare Workers, Hono, and Workers AI**

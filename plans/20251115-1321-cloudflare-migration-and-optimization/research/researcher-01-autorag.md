# Cloudflare AutoRAG Research Report

**Date:** 2025-11-15
**Researcher:** Claude (Sonnet 4.5)
**Context:** Migration from custom RAG (OpenAI embeddings + pgvector) to Cloudflare AutoRAG

---

## Executive Summary

Cloudflare AutoRAG (now branded as "AI Search") is a fully-managed RAG pipeline in open beta. It provides zero-infrastructure RAG with auto-syncing, built-in embeddings, and vector storage. **Trade-off:** Simplicity vs control. **Verdict:** Good for MVP/beta but may need custom RAG for production scale.

**Key Facts:**
- **Status:** Open beta (free during beta, pay underlying services)
- **Limits:** 10 instances, 100K files/instance, 4MB max file size
- **Cost:** ~$0.001-0.003 per PDF (vs $0.003 custom RAG)
- **Setup time:** < 1 hour (vs 2-3 weeks custom)
- **Vendor lock-in:** High (Cloudflare ecosystem only)

---

## 1. What is Cloudflare AutoRAG?

### Overview
AutoRAG is a fully-managed Retrieval-Augmented Generation pipeline that automates:
- Document ingestion from R2 or websites
- Automatic chunking and text extraction
- Embedding generation (BGE models or OpenAI)
- Vector storage in Vectorize (Cloudflare's vector DB)
- Semantic search with optional reranking
- Answer generation via Workers AI

### Key Differentiator
**Auto-sync:** Continuously monitors R2 buckets and re-indexes when files change. No manual re-indexing required.

### Architecture
```
User Upload → R2 Bucket → AutoRAG (auto-detect)
  → Text Extraction → Chunking → Embeddings → Vectorize
  → Query → Semantic Search → Context Retrieval → LLM → Answer
```

### Supported Data Types
- PDFs (up to 4MB)
- Images (OCR via Workers AI)
- Text files, HTML, CSV, Markdown
- Websites (browser rendering + crawling)

**Note:** No DOCX support currently documented.

---

## 2. Key Features & Capabilities

### Current Features (Q4 2025)
✅ **Fully Managed:** Zero infrastructure management
✅ **Auto-sync:** Background indexing, always fresh
✅ **Multiple Models:** BGE (default), OpenAI embeddings (via AI Gateway)
✅ **Reranking:** Semantic reranker for better results
✅ **Query Rewriting:** LLM-based query optimization
✅ **Streaming:** Server-sent events for real-time responses
✅ **REST API:** Integration with any Node.js app
✅ **Workers Binding:** Native Cloudflare Workers integration

### Planned Features (2025 Roadmap)
🔄 **Structured Data Sources:** SQL, JSON, APIs
🔄 **Recursive Chunking:** Better context preservation
🔄 **Built-in Reranking:** More reranking strategies
🔄 **Direct URL Parsing:** No R2 bucket required

### Current Limitations
❌ **No DOCX support** (only PDF, images, text, HTML, CSV)
❌ **R2 only** for storage (must use Cloudflare R2)
❌ **Limited embedding models** (2 BGE models + OpenAI via Gateway)
❌ **No custom chunking strategies** (auto-chunking only)
❌ **Beta limits:** 10 instances, 100K files, 4MB max
❌ **Retrieval quality concerns** (reported by early adopters)

---

## 3. Integration with Node.js/TypeScript Backend

### Method 1: REST API (Recommended for Existing Apps)

**Best for:** External Node.js/Express apps (like our chat-service)

**API Endpoints:**
```typescript
// AI Search (with answer generation)
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai-search/rags/{AUTORAG_NAME}/ai-search

// Search only (no answer, just context)
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai-search/rags/{AUTORAG_NAME}/search
```

**Authentication:**
```typescript
headers: {
  'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
  'Content-Type': 'application/json'
}
```

**Request Body:**
```typescript
interface AutoRAGRequest {
  query: string;                    // Required
  model?: string;                   // LLM for generation
  max_num_results?: number;         // 1-50, default 10
  rewrite_query?: boolean;          // Optimize query
  reranking?: {
    enabled: boolean;
    model?: string;                 // Reranking model
  };
  stream?: boolean;                 // SSE streaming
}
```

**Response Format:**
```typescript
interface AutoRAGResponse {
  success: boolean;
  result: {
    object: "vector_store.search_results.page";
    search_query: string;           // Original or rewritten
    response?: string;              // Generated answer (ai-search only)
    data: Array<{
      file_id: string;
      filename: string;
      score: number;                // Relevance score
      content: string[];            // Matched chunks
    }>;
  };
}
```

**Integration Example:**
```typescript
// chat-service/src/services/autorag.service.ts
import axios from 'axios';

export class AutoRAGService {
  private apiUrl = 'https://api.cloudflare.com/client/v4';
  private accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  private apiToken = process.env.CLOUDFLARE_API_TOKEN;
  private ragName = 'my-saas-chat-rag';

  async queryDocuments(query: string): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}/accounts/${this.accountId}/ai-search/rags/${this.ragName}/ai-search`,
      {
        query,
        model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        max_num_results: 5,
        reranking: { enabled: true },
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.result.response;
  }
}
```

### Method 2: Workers Binding (Cloudflare Workers Only)

**Best for:** New Cloudflare Workers projects
**Not suitable for:** Existing Express/Node.js apps on traditional hosting

**Configuration (wrangler.toml):**
```toml
[ai]
binding = "AI"
```

**TypeScript Usage:**
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const answer = await env.AI.autorag("my-autorag").aiSearch({
      query: "How do I train a llama?"
    });
    return Response.json(answer);
  }
};
```

**Limitation:** Only works in Cloudflare Workers runtime, not standard Node.js.

---

## 4. Pricing & Cost Comparison

### AutoRAG Beta Pricing (Current)
- **AutoRAG service:** FREE during beta
- **Pay for underlying infrastructure:**

| Service | Usage | Cost |
|---------|-------|------|
| **R2 Storage** | 10GB free, then $0.015/GB-month | ~$0.00001/PDF stored |
| **Vectorize** | 5M stored dims free, 30M queried free | $0.05/100M stored dims, $0.01/1M queried dims |
| **Workers AI** | 10K neurons/day free | $0.011/1K neurons |
| **AI Gateway** | FREE (monitoring/caching) | $0 |
| **Browser Rendering** | Pay per render | N/A for PDFs |

### Cost Per PDF (Estimated)
**Assumptions:** 10-page PDF, 3K tokens, 1 embedding call, 768-dim vectors

**AutoRAG costs:**
- R2 storage (1MB): $0.000015/month (7-day retention)
- Embedding (1 call): ~$0.0001 (Workers AI)
- Storage in Vectorize: ~$0.00004 (768 dims)
- **Total per PDF:** ~$0.00015 upload + $0.0002 per query

**Query costs (per user question):**
- Vector search: ~$0.00001 (30M free queries)
- LLM generation (500 tokens): ~$0.006 (Llama 3.3 70B)
- **Total per query:** ~$0.006

**Monthly cost for 1K free users (50 PDFs, 10 queries each):**
- Upload: 50K PDFs × $0.00015 = $7.50
- Queries: 10K queries × $0.006 = $60
- **Total: ~$67.50/month**

### OpenAI Custom RAG (Current Implementation)
**Costs:**
- Embedding (text-embedding-3-small): $0.00002/1K tokens
- 10-page PDF (3K tokens): ~$0.00006 embedding
- pgvector storage: FREE (PostgreSQL extension)
- Query (GPT-3.5-turbo): $0.0015/1K tokens (500 output) = $0.00075
- **Total per query:** ~$0.00075

**Monthly cost for 1K users:**
- Upload: 50K PDFs × $0.00006 = $3
- Queries: 10K queries × $0.00075 = $7.50
- **Total: ~$10.50/month**

### Cost Comparison Summary

| Metric | Custom RAG (Current) | AutoRAG | Winner |
|--------|---------------------|---------|--------|
| **Per PDF upload** | $0.00006 | $0.00015 | Custom RAG (2.5x cheaper) |
| **Per query** | $0.00075 | $0.006 | Custom RAG (8x cheaper) |
| **Monthly (1K users)** | $10.50 | $67.50 | Custom RAG (6.4x cheaper) |
| **Setup time** | 2-3 weeks | < 1 hour | AutoRAG |
| **Maintenance** | High (manual indexing) | Zero (auto-sync) | AutoRAG |
| **Vendor lock-in** | Low (portable) | High (Cloudflare only) | Custom RAG |

**Verdict:** AutoRAG is **6x more expensive** but **10x faster to implement**. Good for MVP/beta, switch to custom RAG at scale.

---

## 5. Setup & Configuration Steps

### Prerequisites
1. Cloudflare account with R2 subscription (required before starting)
2. API token with "AI Search - Read" and "AI Search - Edit" permissions
3. R2 bucket for document storage

### Step-by-Step Setup (< 1 hour)

**Step 1: Enable R2 ($0.00/month for 10GB)**
```bash
# Via Cloudflare Dashboard
# Navigate to R2 → Purchase Plan → Select Free Tier
```

**Step 2: Create R2 Bucket**
```bash
# Via Dashboard: R2 → Create bucket → Name: "my-saas-chat-docs"
# Or via Wrangler CLI:
npx wrangler r2 bucket create my-saas-chat-docs
```

**Step 3: Create AutoRAG Instance**
```bash
# Via Dashboard: AI Search → Create
# - Name: "my-saas-chat-rag"
# - Data source: R2 bucket "my-saas-chat-docs"
# - Embedding model: baai/bge-large-en-v1.5 (English) or OpenAI (via Gateway)
# - LLM model: @cf/meta/llama-3.3-70b-instruct-fp8-fast
# - Chunking: Auto (default)
```

**Step 4: Generate API Token**
```bash
# Dashboard → My Profile → API Tokens → Create Token
# Permissions: AI Search - Read, AI Search - Edit
# Copy token to .env: CLOUDFLARE_API_TOKEN=xxx
```

**Step 5: Upload Test Document**
```bash
# Via R2 Dashboard or Wrangler:
npx wrangler r2 object put my-saas-chat-docs/test.pdf --file ./test.pdf

# AutoRAG auto-detects and indexes within 1-5 minutes
```

**Step 6: Test Query**
```bash
# Via Dashboard Playground or API:
curl -X POST \
  https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai-search/rags/my-saas-chat-rag/ai-search \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}'
```

**Step 7: Integrate with chat-service**
```typescript
// chat-service/src/services/autorag.service.ts
// See "Integration Example" in Section 3
```

**Environment Variables Required:**
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_RAG_NAME=my-saas-chat-rag
CLOUDFLARE_R2_BUCKET=my-saas-chat-docs
```

---

## 6. Limitations & Trade-offs

### Technical Limitations

**File Constraints:**
- Max 100,000 files per instance (10 instances max)
- Max 4MB per file (1MB for rich formats like PDF)
- **Blocker:** Large PDFs must be split or rejected

**Embedding Models:**
- Only 2 built-in models (BGE-large, BGE-m3)
- OpenAI embeddings require AI Gateway setup (extra cost/complexity)
- No custom embedding models

**Chunking:**
- Auto-chunking only, no custom strategies
- No control over chunk size or overlap
- **Reported issue:** Retrieval quality concerns

**Data Sources:**
- R2 only (must migrate from S3 or local storage)
- No direct PostgreSQL/API integration yet

**Query Performance:**
- Slow query rewriting reported by early adopters
- No built-in evaluation metrics (can't measure retrieval accuracy)

### Operational Trade-offs

**Vendor Lock-in:**
- **High risk:** Entire stack tied to Cloudflare (R2, Vectorize, Workers AI)
- **Migration cost:** Moving to another provider requires full rewrite

**Control vs Simplicity:**
- **Pro:** Zero infrastructure, auto-sync, fast setup
- **Con:** Limited customization, black-box retrieval, no tuning

**Beta Risks:**
- **Free now, paid later:** Pricing TBD after beta (could increase 10x)
- **Breaking changes:** API may change before GA
- **Support:** Limited enterprise support during beta

**Scalability:**
- **100K file limit:** May hit limit at scale (need multi-instance strategy)
- **4MB file limit:** Large documents require pre-processing

### Production Readiness Concerns

**Quality Issues (from early adopters):**
- "Few options for embedding and chunking"
- "Slow query rewriting"
- "Retrieval quality is lacking"
- "No way to evaluate if correct context was retrieved"

**Enterprise Gaps:**
- No multi-tenancy isolation (all users share one instance)
- No fine-grained access control
- No audit logs for compliance
- No SLA during beta

**Recommendation:** Use for MVP/beta, plan migration to custom RAG before production launch.

---

## 7. Migration Path from Custom RAG

### Current Implementation (chat-service)
```
User Upload → S3/Local → PDF Parse → Text Extraction
  → OpenAI Embeddings → pgvector → Semantic Search
  → Context Retrieval → OpenAI GPT-3.5/4 → Answer
```

### AutoRAG Implementation (proposed)
```
User Upload → R2 → AutoRAG (auto-process)
  → Vectorize → Semantic Search → Workers AI → Answer
```

### Migration Strategy (Phased Approach)

**Phase 1: Parallel Testing (Week 1)**
- Set up AutoRAG instance (1 hour)
- Upload test documents to R2
- Compare results: AutoRAG vs custom RAG
- Measure: accuracy, latency, cost
- **Decision point:** Continue or abort?

**Phase 2: Hybrid Mode (Week 2)**
- Add AutoRAG as secondary RAG backend
- Route 10% of queries to AutoRAG (A/B test)
- Monitor: error rates, user satisfaction, costs
- Keep custom RAG as primary

**Phase 3: Full Migration (Week 3-4)**
- If AutoRAG performs well:
  - Migrate all documents to R2 (batch upload script)
  - Update document.service.ts to use AutoRAG API
  - Deprecate custom embedding/vector services
  - Remove pgvector dependencies
- If AutoRAG underperforms:
  - Abort migration, stick with custom RAG

**Phase 4: Cleanup (Week 5)**
- Delete old embeddings from pgvector
- Remove unused services (embedding.service.ts, vector-store.service.ts)
- Update documentation and cost tracking

### Code Changes Required

**New Service:**
```typescript
// chat-service/src/services/autorag.service.ts
export class AutoRAGService {
  async uploadDocument(file: Buffer, filename: string): Promise<string>;
  async queryDocument(query: string, fileIds?: string[]): Promise<string>;
  async deleteDocument(fileId: string): Promise<void>;
}
```

**Updated Controller:**
```typescript
// chat-service/src/controllers/document.controller.ts
// Replace: documentService.processPDF() + vectorStore.semanticSearch()
// With: autoragService.uploadDocument() + autoragService.queryDocument()
```

**Removed Services:**
- `embedding.service.ts` (replaced by AutoRAG auto-embedding)
- `vector-store.service.ts` (replaced by Vectorize)
- `document.service.ts` (PDF parsing still needed for metadata)

**Environment Changes:**
```diff
# .env
- OPENAI_API_KEY=xxx
+ CLOUDFLARE_ACCOUNT_ID=xxx
+ CLOUDFLARE_API_TOKEN=xxx
+ CLOUDFLARE_RAG_NAME=my-saas-chat-rag

# Storage
- AWS_S3_BUCKET=xxx
+ CLOUDFLARE_R2_BUCKET=my-saas-chat-docs
```

**Database Changes:**
```diff
# Remove from schema.prisma
- model DocumentEmbedding {
-   id         String   @id @default(uuid())
-   documentId String
-   embedding  Float[]  // pgvector
-   ...
- }

+ model DocumentMetadata {
+   id              String @id @default(uuid())
+   cloudflareFileId String @unique
+   r2Key           String
+   ...
+ }
```

### Migration Complexity Estimate

| Task | Effort | Risk |
|------|--------|------|
| **Set up AutoRAG** | 1 hour | Low |
| **R2 bucket setup** | 30 min | Low |
| **Implement autorag.service.ts** | 4 hours | Low |
| **Update document.controller.ts** | 2 hours | Medium |
| **Migrate existing documents to R2** | 1 day (scripting + upload) | Medium |
| **Remove old services** | 2 hours | Low |
| **Testing + validation** | 1 week | High |
| **Total:** | **2-3 weeks** | **Medium** |

**Rollback Plan:**
- Keep custom RAG code in git (feature branch)
- Dual-write to both systems during testing
- If AutoRAG fails, revert to custom RAG in < 1 hour

---

## 8. Pros & Cons vs Current Implementation

### Pros of AutoRAG

✅ **Zero Infrastructure Management**
- No pgvector setup, no manual indexing
- Auto-sync: files automatically re-indexed on change

✅ **Faster Time-to-Market**
- Setup: 1 hour vs 2-3 weeks
- Reduced code complexity: 3 services → 1 API call

✅ **Built-in Optimizations**
- Query rewriting for better retrieval
- Semantic reranking for higher accuracy
- Streaming responses for better UX

✅ **Auto-Scaling**
- Cloudflare handles scaling automatically
- No capacity planning needed

✅ **Integrated Monitoring**
- AI Gateway provides usage analytics
- Built-in cost tracking

### Cons of AutoRAG

❌ **6x More Expensive**
- $67.50/month vs $10.50/month (1K users)
- Scales poorly: 10K users = $675/month vs $105

❌ **Vendor Lock-in**
- Entire stack tied to Cloudflare
- Migration to another provider = full rewrite

❌ **Limited Customization**
- Can't tune chunking, embeddings, retrieval
- Black-box system, no control over quality

❌ **Quality Concerns**
- Early adopters report poor retrieval quality
- No evaluation metrics to measure accuracy

❌ **File Size Limits**
- 4MB max (vs unlimited in custom RAG)
- Large PDFs must be rejected or split

❌ **Beta Uncertainty**
- Pricing may increase 10x after beta
- Breaking API changes possible
- No enterprise SLA

❌ **R2 Migration Required**
- Must move files from S3/local to R2
- Adds complexity during migration

### Recommendation Matrix

| Use Case | Recommendation | Reasoning |
|----------|---------------|-----------|
| **MVP/Beta (< 1K users)** | ✅ AutoRAG | Fast setup, low maintenance, affordable at small scale |
| **Production (1K-10K users)** | ⚠️ Evaluate | Test quality + cost, prepare custom RAG fallback |
| **Enterprise (10K+ users)** | ❌ Custom RAG | 6x cheaper, full control, no vendor lock-in |
| **Complex Use Cases** | ❌ Custom RAG | Need custom chunking, hybrid search, multi-modal |
| **Budget Constrained** | ❌ Custom RAG | AutoRAG too expensive at scale |
| **Fast Prototype** | ✅ AutoRAG | Ship in 1 hour vs 3 weeks |

---

## 9. Final Recommendation

### Short-term (MVP/Beta Phase)
**Use AutoRAG** if:
- You want to ship PDF Q&A in < 1 week
- You have < 1K beta users (budget: $50-100/month)
- You can tolerate vendor lock-in temporarily
- You prioritize speed over cost

**Implementation:**
1. Set up AutoRAG (1 hour)
2. Migrate to AutoRAG (2-3 weeks phased)
3. Monitor quality + cost closely
4. Plan exit strategy to custom RAG

### Long-term (Production Launch)
**Migrate to Custom RAG** before launch if:
- You expect > 1K users (cost becomes prohibitive)
- You need custom chunking/retrieval strategies
- You want to avoid vendor lock-in
- Quality issues not resolved by Cloudflare

**Hybrid Approach (Recommended):**
1. **Weeks 1-3:** Use AutoRAG for beta (fast launch)
2. **Weeks 4-6:** Monitor quality + cost, collect user feedback
3. **Weeks 7-9:** If quality/cost issues, build custom RAG in parallel
4. **Week 10+:** Switch to custom RAG, keep AutoRAG as fallback

### Decision Criteria

**Choose AutoRAG if:**
- ✅ Time to market > cost optimization
- ✅ Small user base (< 1K)
- ✅ Simple use case (standard PDFs)
- ✅ Team lacks ML/vector DB expertise

**Choose Custom RAG if:**
- ✅ Cost optimization critical (6x cheaper)
- ✅ Large user base (> 1K)
- ✅ Complex use cases (custom chunking, hybrid search)
- ✅ Vendor independence important
- ✅ Team has ML expertise

---

## 10. Next Steps

### Immediate Actions (This Week)
1. **Test AutoRAG:** Create free account, upload 10 sample PDFs
2. **Quality Benchmark:** Compare AutoRAG vs custom RAG on same queries
3. **Cost Model:** Project costs at 100/1K/10K users
4. **Decision:** Go/No-Go based on quality + cost

### If Go Decision (Week 2-4)
1. Implement autorag.service.ts
2. Update document controller
3. Migrate 100 test documents to R2
4. A/B test: 10% traffic to AutoRAG
5. Monitor: quality, latency, cost, errors

### If No-Go Decision
1. Continue with custom RAG (OpenAI + pgvector)
2. Optimize current implementation:
   - Add reranking (Cohere Rerank API)
   - Tune chunking strategy
   - Implement query expansion
3. Revisit AutoRAG in 6 months (post-beta)

---

## Resources

**Official Documentation:**
- AutoRAG Docs: https://developers.cloudflare.com/autorag/
- REST API: https://developers.cloudflare.com/autorag/usage/rest-api/
- Pricing: https://developers.cloudflare.com/autorag/platform/limits-pricing/

**Tutorials:**
- Getting Started: https://developers.cloudflare.com/autorag/get-started/
- Build RAG from Website: https://developers.cloudflare.com/autorag/tutorial/brower-rendering-autorag-tutorial/

**Blog Posts:**
- Launch Announcement: https://blog.cloudflare.com/introducing-autorag-on-cloudflare/
- First Impressions (Critical Review): https://bauva.com/blog/cloudflare-autorag-first-impressions/

**Code Examples:**
- AI Search Bot Tutorial: https://www.antstack.com/blog/creating-an-ai-powered-search-bot-with-cloudflare-auto-rag/

---

**End of Report**

# Phase 3: RAG Implementation Consolidation

**Date:** 2025-11-15
**Phase:** 3 of 5
**Description:** Consolidate duplicate RAG implementations from orchestrator-service into chat-service
**Priority:** HIGH
**Status:** READY
**Estimated Duration:** 3 days

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Previous Phase:** [phase-01-assessment.md](./phase-01-assessment.md)
- **Next Phase:** [phase-04-cloudflare-migration.md](./phase-04-cloudflare-migration.md)

---

## Overview

Currently have duplicate RAG implementations:
1. **chat-service:** OpenAI embeddings + pgvector (custom RAG)
2. **orchestrator-service:** Cloudflare AI embeddings + Pinecone (newer implementation)

**Problem:** Fragmented, hard to maintain, wastes resources.
**Goal:** Single source of truth in chat-service, remove orchestrator-service duplication.

---

## Key Insights

**Current State:**
- chat-service has: `embedding.service.ts`, `vector-store.service.ts`, `document.service.ts`, `rag.service.ts`
- orchestrator-service has: `cloudflare-ai.service.ts`, `embedding.service.ts`, `llm.service.ts`
- Vector stores fragmented: pgvector (chat) vs Pinecone (orchestrator)
- No integration between services

**From Scout:**
- Cloudflare AI already implemented (but in wrong service)
- chat-service uses OpenAI exclusively
- orchestrator-service is newer, may have better patterns

**Decision Required:**
1. Keep pgvector or migrate to Pinecone?
2. Keep orchestrator-service or merge into chat-service?
3. Use OpenAI embeddings or Cloudflare embeddings?

---

## Requirements

**Must Consolidate:**
1. Embedding generation (single service)
2. Vector storage (single provider: pgvector OR Pinecone)
3. Document processing pipeline
4. RAG query logic

**Must Preserve:**
1. Existing chat-service functionality
2. OpenAI integration (for fallback)
3. Cost monitoring
4. User quotas/limits

**Must Document:**
1. Migration guide (if changing vector store)
2. API changes (if any)
3. Performance comparison (before/after)

---

## Architecture

### Current Architecture (Fragmented)

```
┌─────────────────────────────────┐
│       chat-service (3003)       │
├─────────────────────────────────┤
│ OpenAI API                      │
│ ├── openai.service.ts           │
│ ├── embedding.service.ts        │ ← OpenAI embeddings
│ └── vector-store.service.ts     │ ← pgvector
├─────────────────────────────────┤
│ Document Processing             │
│ ├── document.service.ts         │
│ ├── pdf-parser.service.ts       │
│ └── rag.service.ts              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   orchestrator-service (NEW)    │
├─────────────────────────────────┤
│ Cloudflare AI                   │
│ ├── cloudflare-ai.service.ts    │
│ ├── embedding.service.ts        │ ← Cloudflare embeddings
│ └── llm.service.ts              │ ← Llama models
├─────────────────────────────────┤
│ Vector Store: Pinecone          │
└─────────────────────────────────┘
```

### Target Architecture (Consolidated)

```
┌─────────────────────────────────┐
│       chat-service (3003)       │
├─────────────────────────────────┤
│ AI Gateway (NEW)                │
│ ├── Cloudflare AI (primary)     │
│ └── OpenAI API (fallback)       │
├─────────────────────────────────┤
│ Embedding Service (Unified)     │
│ ├── CloudflareEmbedding         │
│ └── OpenAIEmbedding (fallback)  │
├─────────────────────────────────┤
│ Vector Store (Unified)          │
│ ├── pgvector (KEEP)             │ ← Decision: Keep pgvector
│ └── Pinecone adapter (DELETE)   │
├─────────────────────────────────┤
│ Document Processing (Enhanced)  │
│ ├── document.service.ts         │
│ ├── pdf-parser.service.ts       │
│ ├── rag.service.ts              │
│ └── chunking.service.ts         │
├─────────────────────────────────┤
│ Cost Monitoring                 │
│ └── cost-monitor.service.ts     │
└─────────────────────────────────┘

orchestrator-service: DEPRECATED or REPURPOSED
```

**Decision Rationale:**
- **Keep pgvector:** Already integrated with PostgreSQL, free, no vendor lock-in
- **Move Cloudflare AI to chat-service:** Unify AI providers
- **Deprecate orchestrator-service:** Merge code into chat-service
- **Hybrid embedding:** Cloudflare primary, OpenAI fallback

---

## Related Code Files

### Files to Migrate FROM orchestrator-service TO chat-service

**Source (orchestrator-service):**
- `backend/services/orchestrator-service/src/services/cloudflare-ai.service.ts` → COPY & ADAPT
- `backend/services/orchestrator-service/src/services/embedding.service.ts` → MERGE
- `backend/services/orchestrator-service/src/services/llm.service.ts` → COPY & ADAPT
- `backend/services/orchestrator-service/package.json` → Extract Cloudflare dependencies

**Destination (chat-service):**
- `backend/services/chat-service/src/services/cloudflare-ai.service.ts` (NEW)
- `backend/services/chat-service/src/services/ai-gateway.service.ts` (NEW - hybrid)
- `backend/services/chat-service/src/services/embedding.service.ts` (MODIFY - add Cloudflare)
- `backend/services/chat-service/src/services/vector-store.service.ts` (KEEP - pgvector only)

### Files to Modify

**chat-service updates:**
- `backend/services/chat-service/src/controllers/document.controller.ts` - Use AI gateway
- `backend/services/chat-service/src/services/chat.service.ts` - Use AI gateway
- `backend/services/chat-service/src/services/rag.service.ts` - Use unified embedding
- `backend/services/chat-service/package.json` - Add @cloudflare/ai dependency

**Database:**
- `backend/services/chat-service/prisma/schema.prisma` - No changes needed (pgvector)

### Files to Delete (After Migration)

**orchestrator-service cleanup:**
- Consider deprecating entire service OR
- Repurpose for future orchestration needs (keep shell, remove RAG)

---

## Implementation Steps

### Step 1: Analyze orchestrator-service Implementation (2 hours)

```bash
# Read Cloudflare AI implementation
cat backend/services/orchestrator-service/src/services/cloudflare-ai.service.ts

# Check dependencies
cat backend/services/orchestrator-service/package.json | grep cloudflare

# Test if orchestrator-service works standalone
cd backend/services/orchestrator-service
npm test
```

**Document:**
- How Cloudflare AI is initialized
- API calls made
- Configuration required
- Pinecone integration details (to remove)

### Step 2: Create AI Gateway Service (4 hours)

**New file:** `chat-service/src/services/ai-gateway.service.ts`

```typescript
// Hybrid AI provider with automatic fallback
export class AIGatewayService {
  private cloudflareAI: CloudflareAIService;
  private openAI: OpenAIService;
  private costMonitor: CostMonitorService;

  async chat(messages: Message[], options: ChatOptions): Promise<string> {
    // Free tier: Cloudflare only
    if (!options.isPremium) {
      return this.cloudflareAI.chat(messages);
    }

    // Paid tier: Cloudflare primary, OpenAI fallback
    try {
      return await this.cloudflareAI.chat(messages);
    } catch (error) {
      console.warn('Cloudflare failed, using OpenAI:', error);
      await this.costMonitor.trackFallback(options.userId);
      return await this.openAI.chat(messages);
    }
  }

  async embed(text: string, userId: string): Promise<number[]> {
    // Similar hybrid pattern
    try {
      return await this.cloudflareAI.embed(text);
    } catch (error) {
      return await this.openAI.embed(text);
    }
  }
}
```

### Step 3: Copy Cloudflare AI Service (2 hours)

```bash
# Copy from orchestrator to chat
cp backend/services/orchestrator-service/src/services/cloudflare-ai.service.ts \
   backend/services/chat-service/src/services/

# Remove Pinecone dependencies
# Edit cloudflare-ai.service.ts → Remove Pinecone, use pgvector
```

**Modify for chat-service:**
- Remove Pinecone references
- Add pgvector integration
- Update config paths
- Add error handling

### Step 4: Update Embedding Service (2 hours)

**Modify:** `chat-service/src/services/embedding.service.ts`

```typescript
export class EmbeddingService {
  private cloudflareProvider: CloudflareAIService;
  private openaiProvider: OpenAIService;

  async generateEmbedding(text: string, provider: 'cloudflare' | 'openai' = 'cloudflare') {
    if (provider === 'cloudflare') {
      return await this.cloudflareProvider.embed(text);
    }
    return await this.openaiProvider.embed(text);
  }

  async batchEmbed(texts: string[], provider = 'cloudflare') {
    // Batch processing with rate limiting
  }
}
```

### Step 5: Update RAG Service (2 hours)

**Modify:** `chat-service/src/services/rag.service.ts`

```typescript
export class RAGService {
  private embedding: EmbeddingService;
  private vectorStore: VectorStoreService; // pgvector only

  async queryDocument(query: string, userId: string) {
    // Generate embedding (Cloudflare primary)
    const queryEmbedding = await this.embedding.generateEmbedding(query, 'cloudflare');

    // Search pgvector
    const results = await this.vectorStore.semanticSearch(queryEmbedding, 5);

    // Generate answer using AI Gateway
    const context = results.map(r => r.content).join('\n');
    return await this.aiGateway.chat([
      { role: 'system', content: 'Answer based on context' },
      { role: 'user', content: `Context: ${context}\n\nQuestion: ${query}` }
    ]);
  }
}
```

### Step 6: Update Controllers (1 hour)

**Modify:** `chat-service/src/controllers/document.controller.ts`

```typescript
// Replace OpenAI-only with AI Gateway
export class DocumentController {
  async uploadDocument(req: Request, res: Response) {
    // Parse PDF
    const text = await this.pdfParser.parse(file);

    // Generate embedding (Cloudflare)
    const embedding = await this.embedding.generateEmbedding(text, 'cloudflare');

    // Store in pgvector
    await this.vectorStore.store(embedding, metadata);

    res.json({ success: true });
  }

  async queryDocument(req: Request, res: Response) {
    const answer = await this.rag.queryDocument(req.body.query, req.user.id);
    res.json({ answer });
  }
}
```

### Step 7: Install Dependencies (30 min)

```bash
cd backend/services/chat-service

# Add Cloudflare AI SDK
npm install @cloudflare/ai @cloudflare/workers-types

# Update .env
echo "CLOUDFLARE_ACCOUNT_ID=your_account_id" >> .env
echo "CLOUDFLARE_API_TOKEN=your_token" >> .env
```

### Step 8: Migrate Vector Data (if needed) (4 hours)

**If switching from Pinecone to pgvector:**
```typescript
// Migration script
async function migrateVectors() {
  const pineconeData = await pinecone.fetchAll();

  for (const doc of pineconeData) {
    await prisma.documentEmbedding.create({
      data: {
        documentId: doc.id,
        embedding: doc.vector,
        metadata: doc.metadata
      }
    });
  }
}
```

**Note:** Since orchestrator-service is new, likely no data to migrate. Skip this step.

### Step 9: Testing (4 hours)

**Unit tests:**
```bash
# Test AI Gateway fallback
npm test -- ai-gateway.service.test.ts

# Test embedding service
npm test -- embedding.service.test.ts

# Test RAG service
npm test -- rag.service.test.ts
```

**Integration tests:**
```bash
# Upload PDF → embed → store → query
npm run test:integration
```

**Manual testing:**
1. Upload PDF via API
2. Query document
3. Verify Cloudflare used (check logs)
4. Force Cloudflare error → verify OpenAI fallback

### Step 10: Documentation & Cleanup (2 hours)

**Update docs:**
- CLAUDE.md → Document hybrid architecture
- CODEBASE_INDEX.md → Update service structure
- API docs → Note provider changes

**Cleanup orchestrator-service:**
- Remove RAG-related code
- Keep if useful for other orchestration
- OR delete entire service if not needed

---

## Todo List

- [ ] Read orchestrator-service Cloudflare implementation
- [ ] Extract Cloudflare dependencies from orchestrator package.json
- [ ] Create ai-gateway.service.ts in chat-service
- [ ] Copy cloudflare-ai.service.ts to chat-service
- [ ] Remove Pinecone references from copied file
- [ ] Update embedding.service.ts (add Cloudflare provider)
- [ ] Update rag.service.ts (use AI Gateway)
- [ ] Update document.controller.ts (use AI Gateway)
- [ ] Update chat.service.ts (use AI Gateway)
- [ ] Install @cloudflare/ai in chat-service
- [ ] Add CLOUDFLARE_ACCOUNT_ID to .env
- [ ] Add CLOUDFLARE_API_TOKEN to .env
- [ ] Write unit tests for AIGatewayService
- [ ] Write unit tests for CloudflareAIService
- [ ] Write integration test (upload → query flow)
- [ ] Test Cloudflare primary path
- [ ] Test OpenAI fallback path
- [ ] Update CLAUDE.md with new architecture
- [ ] Update CODEBASE_INDEX.md
- [ ] Decide: Keep or delete orchestrator-service?
- [ ] If delete: Remove from docker-compose, gateway routing

---

## Success Criteria

**Phase Complete When:**
- [ ] Single RAG implementation in chat-service
- [ ] Hybrid AI provider working (Cloudflare + OpenAI)
- [ ] pgvector as sole vector store
- [ ] All tests passing (unit + integration)
- [ ] No Pinecone dependencies
- [ ] orchestrator-service deprecated or repurposed
- [ ] Documentation updated

**Specific Targets:**
- Test coverage: ≥75% for new files
- Integration test: Upload → Query flow passes
- Fallback test: OpenAI used when Cloudflare fails
- Performance: P95 latency <200ms
- Cost: Track both providers

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Break existing chat | CRITICAL | MEDIUM | Phased rollout, feature flag |
| Data loss (vector migration) | HIGH | LOW | No migration needed (orchestrator is new) |
| Performance regression | MEDIUM | MEDIUM | Benchmark before/after |
| Cloudflare API issues | MEDIUM | LOW | OpenAI fallback always available |

---

## Security Considerations

**API Keys:**
- Store Cloudflare tokens in .env (NOT code)
- Use separate tokens for dev/prod
- Rotate tokens quarterly

**Access Control:**
- Same auth middleware as OpenAI
- Rate limiting per user
- Quota enforcement

---

## Next Steps

**After Consolidation:**
→ Proceed to Phase 4 (Full Cloudflare Migration)
→ Implement AutoRAG for document Q&A
→ Add cost monitoring dashboard
→ A/B test Cloudflare vs OpenAI quality

**orchestrator-service Decision:**
→ If no other use cases: DELETE
→ If future orchestration needs: Keep shell, remove RAG
→ Document decision in CLAUDE.md

---

## Unresolved Questions

1. Keep orchestrator-service as separate service?
   - **Lean toward:** Delete/merge into chat-service
   - **Reason:** Reduces complexity, single service easier to maintain

2. Pinecone vs pgvector?
   - **Decision:** pgvector (already integrated, free, no lock-in)

3. Migration strategy for existing users?
   - **Decision:** No migration needed (orchestrator is new, no production data)

4. Embedding model preference?
   - **Decision:** Cloudflare bge-m3 primary, OpenAI fallback

---

## References

- Cloudflare AI docs: https://developers.cloudflare.com/workers-ai/
- pgvector docs: https://github.com/pgvector/pgvector
- Research: [researcher-02-workers-ai.md](./research/researcher-02-workers-ai.md)

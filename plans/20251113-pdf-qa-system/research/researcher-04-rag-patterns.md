# RAG Implementation Patterns Research

**Date:** 2025-11-13 | **Researcher:** Claude Code

---

## 1. RAG Architecture Overview

**Core Flow:**
```
Document Input → Chunking → Embedding → Vector Store
                                           ↓
User Query → Embedding → Retrieval → Reranking → Generation → Response
```

**GROUSER Framework (2024):**
- **G**enerator - LLM for response generation
- **R**etriever - Semantic search engine
- **O**rchestration - Workflow coordination
- **U**I - User interface layer
- **S**ource - Document ingestion
- **E**valuation - Quality metrics
- **R**eranker - Relevance optimization

---

## 2. Chunking Strategies (Critical)

### Fixed-Size Chunking
```typescript
// Character-based (512 chars with 50 char overlap)
const chunks = splitByCharCount(text, 512, 50)

// Token-based (preferred - more accurate for LLMs)
const chunks = splitByTokenCount(text, 256, 32)
```
**Pros:** Simple, fast | **Cons:** Breaks semantic meaning

### Semantic Chunking
```typescript
// Uses embeddings to identify content boundaries
// Split where semantic similarity drops below threshold
const chunks = semanticSplit(text, embeddingModel, threshold=0.7)
```
**Pros:** Preserves context | **Cons:** Slower, requires embeddings upfront

### Document-Based Chunking
```typescript
// Respects markdown headers, code blocks, tables
// Best for structured documents (PDFs with clear sections)
const chunks = splitByStructure(content, {
  headers: true,
  codeBlocks: true,
  tables: true
})
```
**Pros:** Maintains document intent | **Cons:** Requires parsing logic

### Agentic Chunking
```typescript
// LLM determines optimal split points based on content
// Most intelligent but slowest
const chunks = await agenticSplit(content, llm)
```
**Pros:** Best quality | **Cons:** High latency, cost

### Recommended Approach for PDF QA
**Hybrid strategy:**
1. **Primary:** Semantic chunking (256-512 tokens, 10-20% overlap)
2. **Fallback:** Document structure + fixed size for unsupported formats
3. **Size:** 256-512 tokens optimal (balance context + retrieval precision)
4. **Overlap:** 10-20% to preserve cross-chunk context

---

## 3. Context Window Optimization

### Challenge
Longer context windows → More irrelevant tokens crowd space → Hallucinations return

### Strategies

**Token Allocation (Pyramid Model):**
```
Top 20% - System prompt & instructions
Middle 60% - Retrieved context (most relevant first)
Bottom 20% - User query + few examples
```

**Context Compression:**
- Remove redundant chunks
- Summarize tangential information
- Filter low-relevance passages (score < threshold)

**Prompt Engineering Pattern:**
```
"Answer based ONLY on provided context.
If context insufficient, say 'Information not available'.

CONTEXT:
{retrieved_chunks}

QUESTION: {user_query}

ANSWER:"
```

**Relevance Threshold:**
- Keep top-K chunks (e.g., K=5-10)
- Use similarity score cutoff (e.g., >0.7 cosine similarity)
- Combine multiple relevance signals

---

## 4. Relevance Scoring & Filtering

### Multi-Signal Approach (Best Practice)

```typescript
// Score combination formula
const score = {
  semantic: 0.5,      // Vector similarity (cosine)
  bm25: 0.3,          // Lexical overlap
  rerank: 0.2         // Neural reranker
}

// Adaptive threshold based on score distribution
const threshold = calculateDynamicThreshold(scores)
```

### Ranking Methods

**Semantic (Dense):**
- Cosine similarity on embeddings
- Fast: O(1) lookup with HNSW index
- Best for: Meaning-based retrieval

**Lexical (Sparse):**
- BM25 algorithm (TF-IDF variant)
- Fast but vocabulary-dependent
- Best for: Exact phrase matching

**Neural Reranking:**
- Cross-Encoder (BERT-based)
- Slower but most accurate
- Best for: Final precision filtering

### Multi-Source Filtering (MAIN-RAG Pattern)

```typescript
// 1. Extract metadata from query (LLM)
const metadata = extractMetadata(query)
// { sourceType: "pdf", dateRange: "2024", topic: "billing" }

// 2. Filter chunks by metadata
const filtered = chunks.filter(c =>
  c.source === metadata.sourceType &&
  c.date >= metadata.dateRange.start
)

// 3. Score + rerank
const ranked = rerank(filtered, query)

// 4. Dynamic threshold
const threshold = calculateThreshold(scores, targetRecall=0.9)
const final = ranked.filter(r => r.score > threshold)
```

**Improvements:** +17% hit rate, +7-8% answer accuracy

---

## 5. Prompt Engineering for RAG Q&A

### System Prompt Template

```
You are a precise Q&A assistant. Answer based ONLY on context provided.

Rules:
1. Answer directly from context - no external knowledge
2. Cite chunk source if asked
3. If context insufficient, respond: "This information is not available"
4. For uncertain information, express confidence level
5. Format lists with numbers/bullets for clarity

Context relevance rating: {similarity_score}
If score < 0.5, be more cautious.
```

### Few-Shot Examples

Include 2-3 examples in system prompt:
```
EXAMPLE 1:
Context: "Billing cycles reset on 1st of month..."
Q: When does billing reset?
A: Billing cycles reset on the 1st of month.

EXAMPLE 2:
Context: [No info about refunds]
Q: What's the refund policy?
A: This information is not available in the provided documents.
```

### Query Enhancement
- Break complex questions into subqueries
- Rephrase for semantic similarity
- Add context from conversation history

---

## 6. Implementation Checklist

### Vector Database Setup
- [ ] Choose provider (Pinecone, Weaviate, Qdrant, Milvus)
- [ ] Select embedding model (text-embedding-3-small recommended)
- [ ] Test embedding consistency
- [ ] Enable HNSW indexing for speed

### Retrieval Pipeline
- [ ] Implement semantic search
- [ ] Add BM25 hybrid search
- [ ] Set up reranking (cross-encoder)
- [ ] Configure similarity threshold
- [ ] Test on sample queries

### Generation Pipeline
- [ ] Create system prompts
- [ ] Implement context compression
- [ ] Add source attribution
- [ ] Test hallucination detection
- [ ] Monitor response quality

### Quality Metrics
- [ ] Retrieval@K (K=1,5,10)
- [ ] MRR (Mean Reciprocal Rank)
- [ ] NDCG (Normalized Discounted Cumulative Gain)
- [ ] Answer Correctness (LLM-evaluated)
- [ ] Latency tracking

---

## 7. Code Pattern Examples

### Chunking + Embedding
```typescript
import { RecursiveCharacterTextSplitter } from 'langchain'
import { OpenAIEmbeddings } from 'langchain/embeddings'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 102  // ~20% overlap
})

const chunks = await splitter.splitDocuments([document])
const embeddings = new OpenAIEmbeddings()
const vectors = await embeddings.embedDocuments(chunks)
```

### Retrieval + Reranking
```typescript
// Dense retrieval
const denseResults = await vectorStore.similaritySearch(query, k=20)

// Sparse retrieval
const sparseResults = await bm25.search(query, k=20)

// Combine & score
const combined = mergeResults(denseResults, sparseResults)
const reranked = await reranker.score(combined, query)
const topK = reranked.slice(0, 5)
```

### Generation
```typescript
const context = topK
  .map((chunk, i) => `[${i+1}] ${chunk.text}`)
  .join('\n\n')

const response = await llm.generate({
  systemPrompt: SYSTEM_PROMPT,
  userMessage: `Context:\n${context}\n\nQuestion: ${query}`
})
```

---

## 8. Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| **Poor retrieval** | Use semantic + lexical hybrid search |
| **Irrelevant context** | Apply neural reranking + threshold |
| **Hallucinations** | Add source grounding, confidence scoring |
| **Latency** | Use HNSW index, batch retrievals |
| **Token overflow** | Compress context, prioritize relevance |
| **Semantic gaps** | Query rewriting, subquery decomposition |

---

## 9. Key Takeaways for PDF QA

1. **Chunking is critical** - Semantic chunking with 256-512 tokens, 10-20% overlap
2. **Hybrid retrieval wins** - Combine semantic + BM25 + reranking
3. **Threshold matters** - Use adaptive, multi-signal scoring
4. **Prompt precision** - Explicit "answer from context only" instructions
5. **Monitor quality** - Track MRR, answer correctness, latency
6. **Multi-source support** - Use metadata filtering for document selection
7. **Context compression** - Keep token budget tight (top-5 chunks typically sufficient)

---

**References:**
- RAGAF Framework (ACM ICCC 2024)
- MAIN-RAG (Multi-Agent Filtering)
- Multi-Meta-RAG (Multi-Source Optimization)
- Databricks & IBM RAG Tutorials
- OpenAI Prompt Engineering Guides

# OpenAI Embeddings API Research Report
**Date:** 2025-11-13 | **For:** PDF QA System Implementation

---

## 1. API MODELS & ENDPOINTS

### Available Models
| Model | Vector Dim | Max Tokens | Use Case |
|-------|-----------|-----------|----------|
| **text-embedding-3-small** | 1536 | 8,191 | Fast, cost-effective document chunking |
| **text-embedding-3-large** | 3072 | 8,191 | High-quality semantic search |
| **text-embedding-ada-002** | 1536 | 8,191 | Legacy (NOT recommended for new projects) |

### Endpoint
```bash
POST https://api.openai.com/v1/embeddings
```

**Key Headers:**
```
Authorization: Bearer sk-...
Content-Type: application/json
```

---

## 2. PRICING (2025)

### Per Model Costs
| Model | Standard | Batch API |
|-------|----------|-----------|
| text-embedding-3-small | **$0.02 / 1M tokens** | $0.01 / 1M tokens |
| text-embedding-3-large | **$0.13 / 1M tokens** | $0.065 / 1M tokens |
| ada-002 (legacy) | $0.10 / 1M tokens | N/A |

### Cost Examples (100-page PDF)
Assuming ~1,500 tokens/page (typical document):
- **100 pages → 150K tokens**
  - 3-small: $0.003 (standard) | $0.0015 (batch)
  - 3-large: $0.0195 (standard) | $0.00975 (batch)

**Volume estimate:** Processing 1,000 documents monthly (~$30-$200 depending on model choice)

---

## 3. TOKEN LIMITS & CHUNKING

### Hard Limits
- **Per request:** Single input max **8,191 tokens**
- **Per batch:** ~300K tokens total per request (~36 inputs × 8K)
- **Rate limits:** 350K tokens-per-minute (TPM) for text-embedding-3-large

### Recommended Chunking Strategy
```
Chunk Size: 1,000 tokens (optimal balance)
Overlap: 20% (200 tokens) - preserves context at boundaries
Max Chars Per Chunk: ~4,000 characters (avg)
```

**Why this works:**
- Keeps well under 8,191 token limit
- Prevents context loss at chunk boundaries
- Enables efficient batch processing
- Improves semantic coherence for similarity search

### Chunking Implementation
```typescript
// Pseudo-code for semantic chunking
function chunkDocument(text: string, chunkSize = 1000, overlap = 200) {
  const tokens = tokenize(text);
  const chunks = [];

  for (let i = 0; i < tokens.length; i += (chunkSize - overlap)) {
    const chunk = tokens.slice(i, i + chunkSize);
    if (chunk.length > 0) chunks.push(chunk.join(' '));
  }

  return chunks;
}
```

---

## 4. BATCH PROCESSING

### When to Use Batch API
✅ **Use Batch:**
- Document processing in bulk (1000+ documents)
- Non-urgent processing (24-48 hour turnaround acceptable)
- Cost-sensitive applications (50% savings)

❌ **Use Standard API:**
- Real-time vector generation
- Low-latency requirements (<100ms)
- Small-scale operations (<100 documents/day)

### Batch Example
```typescript
const batchInput = [
  { input: "Document chunk 1 text..." },
  { input: "Document chunk 2 text..." },
  { input: "Document chunk 3 text..." },
];

const response = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: batchInput.map(item => item.input),
  }),
});

// Returns up to 300K tokens per request
```

---

## 5. ERROR HANDLING & RATE LIMITS

### Common Errors
| Error Code | Cause | Solution |
|-----------|-------|----------|
| **429** | Rate limit exceeded | Exponential backoff + retry |
| **401** | Invalid API key | Regenerate key after billing changes |
| **400** | Invalid input/token limit | Verify chunk size < 8,191 tokens |
| **500** | Server error | Retry with exponential backoff |

### Exponential Backoff Pattern
```typescript
async function embedWithRetry(text: string, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
    } catch (error) {
      if (error.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
}
```

### Rate Limit Mitigation
- **Client-side throttling:** Queue requests to stay under 350K TPM
- **Batch API:** 50% cost reduction for delayed processing
- **Caching:** Cache embeddings for identical chunks
- **Billing:** Maintain prepaid credits (minimum $5 recommended)

---

## 6. BEST PRACTICES

### Document Embedding Workflow
1. **Validate** PDF integrity + OCR if scanned
2. **Extract** text, preserve structure (headings, tables)
3. **Chunk** using 1,000 token size + 20% overlap
4. **Batch** chunks for cost efficiency
5. **Store** embeddings + metadata in vector DB (Pinecone, Weaviate, PgVector)
6. **Index** with document ID, page number, chunk position

### Semantic Quality Tips
- Keep chunks self-contained (readable without context)
- Preserve paragraph boundaries when possible
- Include metadata: document_id, page_num, chunk_index
- De-duplicate identical chunks before embedding

### Performance Optimization
- **Use 3-small for:** General retrieval (fast, cheap) → ~0.03µs latency
- **Use 3-large for:** Precise semantic matching → ~0.05µs latency
- **Hybrid approach:** Index with 3-small, rerank with 3-large

---

## 7. CODE EXAMPLE: PDF QA System

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedPDFChunks(chunks: string[]) {
  // Batch up to 300K tokens per request
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks,
  });

  return response.data.map(item => ({
    embedding: item.embedding,
    index: item.index,
  }));
}

async function queryDocuments(query: string, topK = 5) {
  // Get embedding for user query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryVector = queryEmbedding.data[0].embedding;

  // Search vector DB for topK most similar chunks
  // (Implement with Pinecone, Weaviate, or PgVector)
  const results = await vectorDB.query(queryVector, { topK });

  return results;
}
```

---

## 8. COST PROJECTIONS

### Scenario: Enterprise PDF QA System
- **Documents:** 10,000 PDFs (~100 pages each)
- **Total pages:** 1,000,000
- **Tokens:** 1.5B tokens (~150K per 100-page doc)

| Model | Cost | Time (Batch) | Recommended |
|-------|------|-------------|-------------|
| 3-small | **$30** | 24-48h | ✓ Best ROI |
| 3-large | **$97.50** | 24-48h | ✗ Overkill |
| ada-002 | **$150** | Real-time | ✗ Deprecated |

**Recommendation:** Use **text-embedding-3-small with Batch API** for initial bulk processing, then standard API for incremental updates.

---

## 9. INTEGRATION CHECKLIST

- [ ] Validate OpenAI API key has embeddings access
- [ ] Implement token counting (use `js-tiktoken` package)
- [ ] Chunk PDFs with 1000-token size + 20% overlap
- [ ] Set up batch queue processing system
- [ ] Implement exponential backoff (2s → 16s delay)
- [ ] Store embeddings in vector DB with metadata
- [ ] Add caching for duplicate chunks
- [ ] Monitor token usage and costs (OpenAI dashboard)
- [ ] Test error scenarios (rate limits, invalid inputs)
- [ ] Load test with concurrent requests

---

## References
- OpenAI Embeddings Guide: platform.openai.com/docs/guides/embeddings
- Pricing: platform.openai.com/pricing
- Rate Limits: openai.com/cookbook/rate_limits
- Token Counter: github.com/js-tiktoken/js-tiktoken

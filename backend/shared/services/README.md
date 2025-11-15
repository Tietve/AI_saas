# Shared AI Services

**Location:** `backend/shared/services/`

This directory contains shared AI services used across multiple microservices. These services provide unified interfaces for AI operations with support for multiple providers, cost tracking, and extensible architecture.

## 📦 Services

### 1. CloudflareAIService (`cloudflare-ai.service.ts`)

Provides access to Cloudflare Workers AI for budget-friendly embeddings and text generation.

**Features:**
- Embeddings: 768-dimensional vectors (FREE tier: 10k/day)
- Text Generation: Llama-2 7B (FREE tier: 10k/day)
- RAG: Combined retrieval + generation
- 90-95% cheaper than OpenAI

**Usage:**
```typescript
import { CloudflareAIService } from '@/backend/shared/services/cloudflare-ai.service';

const cfAI = new CloudflareAIService({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

// Generate embedding
const embeddingResult = await cfAI.generateEmbedding('Hello world');
console.log(embeddingResult.embedding); // number[] (768 dimensions)

// Generate text
const textResult = await cfAI.generateText('Explain AI', 'You are a helpful assistant');
console.log(textResult.text);

// RAG answer
const answer = await cfAI.generateRAGAnswer('What is AI?', ['AI is...', 'Machine learning...']);
```

**Pricing:**
- FREE: 10k requests/day
- Paid: ~$0.0001 per embedding, ~$0.01 per 1M tokens

---

### 2. LLMService (`llm.service.ts`)

Multi-provider LLM service with strategy pattern for intelligent provider selection.

**Supported Providers:**
- **Llama-2** (Cloudflare): ~$0.01/1M tokens - Budget-friendly
- **GPT-3.5-turbo** (OpenAI): ~$1/1M tokens - Balanced
- **GPT-4o** (OpenAI): ~$10/1M tokens - High quality
- **Claude 3** (Anthropic): ~$9/1M tokens - Alternative

**Features:**
- Auto-provider selection based on query complexity
- Cost tracking and estimation
- Fallback to budget provider on failure
- Complexity analysis

**Usage:**
```typescript
import { LLMService, LLMProvider } from '@/backend/shared/services/llm.service';

const llm = new LLMService();

// Generate RAG answer with specific provider
const result = await llm.generateRAGAnswer(
  'What is machine learning?',
  ['ML is a subset of AI...', 'It uses algorithms...'],
  { provider: LLMProvider.GPT4O, maxTokens: 1024, temperature: 0.7 }
);

console.log(result.text);
console.log(`Cost: $${result.cost}`);

// Auto-select provider based on complexity
const provider = llm.autoSelectProvider('Explain quantum computing in detail', true);
console.log(`Selected provider: ${provider}`); // Likely GPT-3.5-turbo or GPT-4o

// Get provider comparison
const comparison = llm.getProviderComparison();
console.log(comparison[LLMProvider.LLAMA2]);
```

**Auto-Selection Logic:**
- Budget mode: Prefer Llama-2, use GPT-3.5 for complex queries
- Quality mode: Prefer GPT-4o for complex, Claude for medium, GPT-3.5 for simple

---

### 3. EmbeddingService (`embedding.service.ts`)

Unified embedding service supporting multiple providers with caching and batch processing.

**Supported Providers:**
- **OpenAI**: text-embedding-3-small (1536d, $0.02/1M tokens)
- **Cloudflare**: @cf/baai/bge-base-en-v1.5 (768d, FREE/very cheap)

**Features:**
- Auto-provider selection
- In-memory caching
- Batch processing with rate limiting
- Retry with exponential backoff
- Cost tracking
- Text validation
- Cosine similarity calculation

**Usage:**
```typescript
import { EmbeddingService, EmbeddingProvider } from '@/backend/shared/services/embedding.service';

const embedding = new EmbeddingService({
  provider: EmbeddingProvider.CLOUDFLARE, // or OPENAI
  maxRetries: 5,
});

// Single embedding
const result = await embedding.embed('Hello world');
console.log(result.embedding); // number[]
console.log(`Cost: $${result.cost}`);

// Batch embeddings
const batchResult = await embedding.embedBatch(['text1', 'text2', 'text3']);
console.log(`Total tokens: ${batchResult.totalTokens}`);
console.log(`Cache hits: ${batchResult.cacheHits}`);
console.log(`Total cost: $${batchResult.totalCost}`);

// Cosine similarity
const similarity = embedding.cosineSimilarity(result1.embedding, result2.embedding);
console.log(`Similarity: ${similarity}`); // 0-1

// Switch provider
embedding.setProvider(EmbeddingProvider.OPENAI);

// Validate text
const validation = embedding.validateText('Some text...');
if (!validation.valid) {
  console.error(validation.error);
}
```

**Cache Management:**
```typescript
// Get cache size
console.log(embedding.getCacheSize());

// Clear cache
embedding.clearCache();
```

---

## 🔧 Types

All type definitions are in `types/index.ts`:

```typescript
// Providers
export enum LLMProvider { GPT4O, GPT35_TURBO, LLAMA2, CLAUDE }
export enum EmbeddingProvider { OPENAI, CLOUDFLARE }

// Results
export interface LLMGenerationResult { text, provider, model, tokens, cost }
export interface EmbeddingResult { embedding, tokens, model, cached, provider, cost }
export interface BatchEmbeddingResult { embeddings, totalTokens, cacheHits, cacheMisses, totalCost }

// Errors
export class AIServiceError extends Error
export class EmbeddingError extends Error
```

---

## 📊 Cost Comparison

| Provider | Operation | Dimensions | Cost | Speed | Quality |
|----------|-----------|------------|------|-------|---------|
| **Cloudflare** | Embedding | 768 | FREE/~$0.0001 | Fast | Good |
| **OpenAI** | Embedding | 1536 | $0.02/1M tokens | Fast | Excellent |
| **Cloudflare** | Generation | - | ~$0.01/1M tokens | Fast | Good |
| **GPT-3.5** | Generation | - | ~$1/1M tokens | Fast | Very Good |
| **GPT-4o** | Generation | - | ~$10/1M tokens | Medium | Excellent |
| **Claude 3** | Generation | - | ~$9/1M tokens | Medium-Fast | Excellent |

**Recommendation:**
- **Free tier users:** Cloudflare for everything
- **Paid tier users:** Cloudflare for embeddings, GPT-4o for critical queries, GPT-3.5 for general queries
- **Enterprise:** Mix of providers based on query complexity

---

## 🚀 Migration Guide

### From orchestrator-service

**Before:**
```typescript
// orchestrator-service/src/services/cloudflare-ai.service.ts
import { cloudflareAIService } from '../services/cloudflare-ai.service';

const result = await cloudflareAIService.generateEmbedding(text);
```

**After:**
```typescript
// Use shared service
import { cloudflareAIService } from '@/backend/shared/services/cloudflare-ai.service';

const result = await cloudflareAIService.generateEmbedding(text);
```

### From chat-service

**Before:**
```typescript
// chat-service/src/services/embedding.service.ts
import { EmbeddingService } from '../services/embedding.service';

const embeddingService = new EmbeddingService(apiKey, model);
const result = await embeddingService.generateSingleEmbedding(text);
```

**After:**
```typescript
// Use shared service
import { EmbeddingService, EmbeddingProvider } from '@/backend/shared/services/embedding.service';

const embeddingService = new EmbeddingService({
  provider: EmbeddingProvider.OPENAI,
  openaiApiKey: apiKey,
});
const result = await embeddingService.embed(text);
```

### Benefits of Migration

✅ **Single source of truth** - No duplicate code
✅ **Consistent API** - Same interface across services
✅ **Provider flexibility** - Easy to switch providers
✅ **Cost tracking** - Built-in cost estimation
✅ **Better error handling** - Retry logic, fallbacks
✅ **Caching** - Reduce API calls and costs
✅ **Type safety** - Comprehensive TypeScript types

---

## 🛠️ Environment Variables

```bash
# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# OpenAI
OPENAI_API_KEY=your-openai-key

# Anthropic (optional)
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## 📝 Best Practices

1. **Use Cloudflare for embeddings** in free tier to minimize costs
2. **Cache embeddings** for frequently accessed texts
3. **Auto-select LLM provider** based on query complexity
4. **Implement rate limiting** in your services
5. **Monitor costs** using the built-in cost tracking
6. **Handle errors gracefully** - services have built-in retry logic
7. **Validate text** before embedding to avoid API errors
8. **Batch operations** when processing multiple texts

---

## 🧪 Testing

```typescript
// Example test
import { EmbeddingService, EmbeddingProvider } from '@/backend/shared/services/embedding.service';

describe('EmbeddingService', () => {
  it('should generate embedding', async () => {
    const service = new EmbeddingService({ provider: EmbeddingProvider.CLOUDFLARE });
    const result = await service.embed('test');

    expect(result.embedding).toHaveLength(768);
    expect(result.provider).toBe(EmbeddingProvider.CLOUDFLARE);
    expect(result.cost).toBeGreaterThan(0);
  });

  it('should use cache', async () => {
    const service = new EmbeddingService();
    await service.embed('test', { useCache: true });
    const result = await service.embed('test', { useCache: true });

    expect(result.cached).toBe(true);
  });
});
```

---

## 🔮 Future Enhancements

- [ ] Redis cache integration (instead of in-memory)
- [ ] More LLM providers (Mistral, Gemini, etc.)
- [ ] Streaming support for generation
- [ ] Cost budgeting and alerts
- [ ] Provider health monitoring
- [ ] Automatic A/B testing between providers
- [ ] Vector database integration

---

## 📚 Related Documentation

- **Cloudflare Workers AI Docs:** https://developers.cloudflare.com/workers-ai/
- **OpenAI API Docs:** https://platform.openai.com/docs/
- **Anthropic Claude Docs:** https://docs.anthropic.com/

---

**Created:** 2025-11-15
**Author:** Agent 8 - Parallel Optimization Team
**Status:** ✅ Production Ready

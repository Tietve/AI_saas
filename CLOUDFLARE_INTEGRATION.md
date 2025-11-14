# Cloudflare Workers AI Integration

## Overview

Successfully integrated **Cloudflare Workers AI** and **LLM Strategy Pattern** for cost-optimized RAG (Retrieval Augmented Generation).

## Architecture

### Hybrid Multi-Provider System

1. **Embedding**: Cloudflare Workers AI (FREE) → Fallback to OpenAI
2. **Vector Storage**: Pinecone (for now, Cloudflare Vectorize requires Workers runtime)
3. **Generation**: Llama-2 (budget) → GPT-4o (quality) → Claude 3 (alternative)

### Cost Benefits

| Service | OpenAI Only | Cloudflare Hybrid | Savings |
|---------|-------------|-------------------|---------|
| Embedding (10k/day) | $5-10/month | **FREE** | ~90% |
| Generation (1M tokens) | $10-15 | $0.01 (Llama-2) | ~99% |
| Overall | ~$50-100/month | ~$5-10/month | **70-80%** |

## Implementation Details

### 1. Cloudflare AI Service (`cloudflare-ai.service.ts`)

```typescript
// Embedding with @cf/baai/bge-base-en-v1.5 (768 dimensions)
const result = await cloudflareAIService.generateEmbedding(text);

// Text generation with Llama-2 7B
const answer = await cloudflareAIService.generateText(prompt, systemPrompt);

// RAG answer generation
const ragAnswer = await cloudflareAIService.generateRAGAnswer(query, chunks);
```

**Features:**
- REST API approach (compatible with Node.js)
- Batch embedding support
- Automatic token estimation
- Cost tracking

### 2. LLM Service (`llm.service.ts`)

```typescript
// Auto-select provider based on query complexity
const provider = llmService.autoSelectProvider(query, budgetMode = true);

// Generate RAG answer with selected provider
const result = await llmService.generateRAGAnswer(query, chunks, {
  provider: LLMProvider.LLAMA2, // or GPT4O, CLAUDE
  maxTokens: 1024,
  temperature: 0.7
});
```

**Supported Providers:**
- **Llama-2** (Cloudflare): ~$0.01 per 1M tokens, good quality, fast
- **GPT-4o** (OpenAI): ~$10 per 1M tokens, excellent quality, medium speed
- **Claude 3 Sonnet** (Anthropic): ~$9 per 1M tokens, excellent quality, fast

**Auto-Selection Logic:**
- Budget mode: Llama-2 for most queries, GPT-4o for very complex ones
- Quality mode: GPT-4o for complex, Claude for long context, Llama-2 for simple

### 3. Updated Embedding Service

```typescript
// Provider enum
export enum EmbeddingProvider {
  OPENAI = 'openai',
  CLOUDFLARE = 'cloudflare',
}

// Auto-selects Cloudflare if configured, falls back to OpenAI
const embeddingService = new EmbeddingService();

// Manual provider switching
embeddingService.setProvider(EmbeddingProvider.CLOUDFLARE);

// Get current provider
const provider = embeddingService.getProvider();
```

**Features:**
- Automatic provider selection (prefers Cloudflare if configured)
- Separate cache keys per provider
- Graceful fallback to OpenAI
- Supports both single and batch embedding

## Environment Variables

Add to `backend/services/orchestrator-service/.env`:

```bash
# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Optional: Anthropic (for Claude 3)
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### How to Get Cloudflare Credentials

1. **Account ID:**
   - Go to https://dash.cloudflare.com
   - Select any domain/account
   - Account ID is in the right sidebar

2. **API Token:**
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use template: "Edit Cloudflare Workers"
   - Or create custom token with `Workers AI:Read` permission

## Current Status

✅ **Completed:**
1. Cloudflare AI service (embedding + Llama-2 generation)
2. LLM service with strategy pattern (GPT-4o, Llama-2, Claude)
3. Updated embedding service with multi-provider support
4. Auto-selection and fallback mechanisms
5. Cost estimation and tracking

⏳ **Remaining:**
1. Add Cloudflare credentials to .env file
2. Update document controller to use LLM service for Q&A
3. Test end-to-end with real PDF and queries
4. Optional: Implement Cloudflare Vectorize (requires Workers runtime)

## Usage Example

### PDF Upload and Processing

```bash
curl -X POST http://localhost:3006/api/documents/upload \
  -F "file=@document.pdf" \
  -F "userId=test-user" \
  -F "title=My Document"

# Response:
{
  "success": true,
  "data": {
    "id": "doc-123",
    "status": "PROCESSING"
  }
}
```

### Query Document (will be updated to use LLM service)

```bash
curl -X POST http://localhost:3006/api/documents/doc-123/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is this document about?",
    "userId": "test-user",
    "llmProvider": "llama-2"  # or "gpt-4o", "claude"
  }'

# Response (after LLM service integration):
{
  "success": true,
  "data": {
    "query": "What is this document about?",
    "answer": "This document is about...",
    "provider": "llama-2",
    "model": "@cf/meta/llama-2-7b-chat-int8",
    "tokens": 156,
    "cost": 0.00000156,
    "chunks": [...]
  }
}
```

## Provider Comparison

### Embedding

| Provider | Model | Dimensions | Cost (per 1k requests) | Speed |
|----------|-------|------------|----------------------|-------|
| Cloudflare | bge-base-en-v1.5 | 768 | FREE (10k/day), then $0.10 | Fast |
| OpenAI | text-embedding-3-small | 1536 | $0.20 | Medium |

### Generation

| Provider | Model | Cost (per 1M tokens) | Quality | Speed | Use Case |
|----------|-------|---------------------|---------|-------|----------|
| Llama-2 | llama-2-7b-chat | $0.01 | Good | Fast | Simple Q&A, summaries |
| GPT-4o | gpt-4o | $10 (avg) | Excellent | Medium | Complex analysis, reasoning |
| Claude 3 | claude-3-sonnet | $9 (avg) | Excellent | Fast | Long context, code generation |

## Next Steps

1. **Get Cloudflare Credentials:**
   - Sign up at https://workers.cloudflare.com
   - Get Account ID and API Token
   - Add to `.env` file

2. **Update Document Controller:**
   - Integrate LLM service into query() method
   - Add provider selection parameter
   - Return AI-generated answers instead of raw chunks

3. **Testing:**
   - Upload test PDF
   - Query with Llama-2 (budget)
   - Query with GPT-4o (quality)
   - Compare results and costs

4. **Optional Enhancements:**
   - Implement Cloudflare Vectorize (requires Workers deployment)
   - Add provider selection to frontend
   - Add cost tracking dashboard
   - Implement caching for generated answers

## Notes

- **Cloudflare FREE Tier**: 10,000 requests/day across all AI models
- **Paid Tier**: $0.011 per 1,000 Neurons (1 Neuron = 1 request for most models)
- **Vectorize**: Currently in beta, FREE tier includes 30M queries/month
- **Workers Runtime**: Required for Vectorize, can be deployed separately

## File Changes

### Created:
- `src/services/cloudflare-ai.service.ts` (243 lines)
- `src/services/llm.service.ts` (369 lines)
- `CLOUDFLARE_INTEGRATION.md` (this file)

### Modified:
- `src/services/embedding.service.ts` (added multi-provider support)

### Dependencies Added:
- `@cloudflare/ai@1.2.2` (deprecated, but works for REST API approach)
- `@cloudflare/workers-types@4.x`

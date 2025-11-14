# Phase 2: API Implementation

**Phase:** 2 of 3
**Dates:** Week 2-3 (Nov 20 - Dec 3, 2025)
**Priority:** High
**Status:** In Progress

---

## Context

**Research Reports:**
- [PDF Parsing](./research/researcher-03-pdf-parsing.md)
- [RAG Patterns](./research/researcher-04-rag-patterns.md)
- [OpenAI Embeddings](./research/researcher-02-openai-embeddings.md)

**Scout Report:**
- [Chat Service Structure](./scout/scout-01-chat-service-structure.md)

**Previous Phase:**
- [Phase 1: Infrastructure Setup](./phase-01-infrastructure-setup.md) - ✅ Completed

---

## Overview

Implement PDF upload, processing, and RAG query API endpoints for semantic document search.

**Scope:**
- PDF upload endpoint with multipart/form-data
- Document processing service (text extraction + chunking)
- Embedding generation service (OpenAI API integration)
- Vector store service (pgvector operations)
- RAG query endpoint with streaming responses
- Error handling and status tracking

**Non-Scope:**
- Cost monitoring and rate limits (Phase 3)
- Frontend UI components (separate task)
- Multi-document queries (future enhancement)

---

## Key Insights from Research

**PDF Parsing (researcher-03):**
- Primary: pdf-parse (fast, handles 95% of PDFs)
- Fallback: pdfjs-dist (slower but more robust)
- Text cleaning: Remove excessive whitespace, normalize Unicode
- Metadata extraction: Page count, file size, creation date

**RAG Patterns (researcher-04):**
- Chunking: 512 tokens with 20% overlap (optimal for Q&A)
- Retrieval: Top-K=5 for context (balance quality + cost)
- Reranking: Optional cross-encoder for precision
- Streaming: SSE for incremental responses

**OpenAI API (researcher-02):**
- Embeddings: text-embedding-3-small ($0.02/1M tokens)
- Batch processing: 50% cost savings (use for bulk documents)
- Rate limits: 350K TPM (implement exponential backoff)
- Max input: 8,191 tokens per chunk

---

## Requirements

### 1. Document Upload Endpoint

**Route:** `POST /api/documents/upload`

**Request:**
```typescript
// Multipart form-data
{
  file: File  // PDF only, max 10MB
  title?: string  // Optional custom title
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    documentId: string
    title: string
    fileName: string
    fileSize: number
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
    uploadedAt: string
  }
}
```

**Validation:**
- File type: application/pdf
- File size: ≤10MB (configurable via PDF_MAX_SIZE)
- User quota: Check billing-service for remaining PDF slots
- File not corrupted: Verify PDF magic bytes (25 50 44 46)

### 2. Document Processing Service

**Responsibilities:**
- Extract text from PDF using pdf-parse
- Fallback to pdfjs-dist if pdf-parse fails
- Clean extracted text (normalize whitespace, remove control chars)
- Split text into semantic chunks (512 tokens, 20% overlap)
- Track processing status (PROCESSING → COMPLETED/FAILED)

**Chunking Strategy:**
```typescript
interface Chunk {
  content: string      // Raw text
  chunkIndex: number   // 0-based position
  pageNumber?: number  // Source page
  tokens: number       // Token count (js-tiktoken)
}
```

**Error Recovery:**
- Corrupted PDF: Return 400 with error message
- Timeout (>30s): Mark as FAILED, log error
- Parser crash: Try fallback parser before failing

### 3. Embedding Service

**Responsibilities:**
- Generate embeddings for each chunk via OpenAI API
- Batch chunks (up to 100 per request) for efficiency
- Handle rate limits with exponential backoff
- Store embeddings in document_chunks table

**OpenAI Integration:**
```typescript
interface EmbeddingRequest {
  model: 'text-embedding-3-small'
  input: string[]  // Up to 100 chunks
  encoding_format: 'float'
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[]  // 1536 dimensions
    index: number
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}
```

**Rate Limiting:**
- Max 350K tokens/minute
- Retry with exponential backoff: 1s, 2s, 4s, 8s
- Circuit breaker: Stop after 5 consecutive failures

### 4. Vector Store Service

**Responsibilities:**
- Insert chunks with embeddings into document_chunks table
- Perform similarity search using pgvector
- Return top-K most relevant chunks

**Similarity Query:**
```sql
SELECT
  dc.id,
  dc.content,
  dc.page_number,
  dc.chunk_index,
  d.title as document_title,
  1 - (dc.embedding <=> $1::vector) as similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
WHERE d.user_id = $2
  AND d.deleted_at IS NULL
ORDER BY dc.embedding <=> $1::vector
LIMIT $3;
```

**Parameters:**
- `$1`: Query embedding (vector)
- `$2`: User ID (security: only user's documents)
- `$3`: Top-K limit (default: 5)

### 5. RAG Query Endpoint

**Route:** `POST /api/documents/query`

**Request:**
```typescript
{
  query: string       // Natural language question
  documentId?: string // Optional: search specific document
  topK?: number       // Default: 5, max: 10
  stream?: boolean    // Enable SSE streaming (default: false)
}
```

**Response (Non-Streaming):**
```typescript
{
  success: true,
  data: {
    answer: string
    sources: Array<{
      documentId: string
      documentTitle: string
      chunkIndex: number
      pageNumber: number
      similarity: number
      excerpt: string  // First 200 chars of chunk
    }>
    tokensUsed: {
      prompt: number
      completion: number
      total: number
    }
  }
}
```

**Response (Streaming SSE):**
```typescript
// Event stream
data: {"type": "sources", "sources": [...]}

data: {"type": "chunk", "content": "The answer is..."}
data: {"type": "chunk", "content": " that PDFs contain..."}

data: {"type": "done", "tokensUsed": {...}}
```

**Processing Flow:**
1. Generate embedding for query (OpenAI API)
2. Retrieve top-K similar chunks (vector store)
3. Build context prompt with sources
4. Call OpenAI chat completion (gpt-4o-mini or gpt-3.5-turbo)
5. Stream response back to client (if enabled)
6. Track token usage for billing

### 6. Document Management Endpoints

**List Documents:** `GET /api/documents`
```typescript
{
  success: true,
  data: {
    documents: Array<{
      id: string
      title: string
      fileName: string
      fileSize: number
      pageCount: number
      status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
      uploadedAt: string
      processedAt?: string
    }>
    total: number
    limit: number
    offset: number
  }
}
```

**Get Document:** `GET /api/documents/:id`

**Delete Document:** `DELETE /api/documents/:id`
- Soft delete (set deletedAt timestamp)
- Also delete from R2 storage (async cleanup job)

---

## Architecture

### Service Layer Structure

```
backend/services/chat-service/src/
├── controllers/
│   └── document.controller.ts          # HTTP handlers
├── services/
│   ├── document.service.ts             # Main orchestrator
│   ├── pdf-parser.service.ts           # PDF text extraction
│   ├── chunking.service.ts             # Text chunking logic
│   ├── embedding.service.ts            # OpenAI embeddings
│   ├── vector-store.service.ts         # pgvector operations
│   └── rag.service.ts                  # RAG query logic
├── routes/
│   └── document.routes.ts              # API routes
├── middleware/
│   ├── upload.middleware.ts            # Multer config
│   └── quota.middleware.ts             # Check PDF limits
├── types/
│   └── document.types.ts               # TypeScript interfaces
└── utils/
    ├── token-counter.ts                # js-tiktoken wrapper
    └── text-cleaner.ts                 # Text normalization
```

### Data Flow

```
1. Upload PDF
   User → upload.middleware → document.controller → document.service
   → R2 storage → DB (status: PROCESSING)

2. Process PDF (Background)
   → pdf-parser.service (extract text)
   → chunking.service (split into chunks)
   → embedding.service (generate vectors)
   → vector-store.service (store in pgvector)
   → DB update (status: COMPLETED)

3. Query Document
   User → document.controller → rag.service
   → embedding.service (query embedding)
   → vector-store.service (similarity search)
   → OpenAI chat (generate answer)
   → Stream response to user
```

---

## Implementation Steps

### Step 1: Create Service Files

```bash
cd backend/services/chat-service/src

# Create new directories
mkdir -p services/document
mkdir -p controllers
mkdir -p routes
mkdir -p middleware
mkdir -p types
mkdir -p utils

# Create service files
touch services/document/document.service.ts
touch services/document/pdf-parser.service.ts
touch services/document/chunking.service.ts
touch services/document/embedding.service.ts
touch services/document/vector-store.service.ts
touch services/document/rag.service.ts

# Create controller and routes
touch controllers/document.controller.ts
touch routes/document.routes.ts

# Create middleware
touch middleware/upload.middleware.ts
touch middleware/quota.middleware.ts

# Create types and utils
touch types/document.types.ts
touch utils/token-counter.ts
touch utils/text-cleaner.ts
```

### Step 2: Implement PDF Parser Service

**File:** `services/document/pdf-parser.service.ts`

**Responsibilities:**
- Parse PDF using pdf-parse (primary)
- Fallback to pdfjs-dist if primary fails
- Extract text, metadata, page count
- Clean extracted text

**Key Functions:**
```typescript
class PdfParserService {
  async parsePdf(filePath: string): Promise<ParsedPdf>
  async extractTextWithParser(buffer: Buffer): Promise<string>
  async extractTextWithFallback(buffer: Buffer): Promise<string>
  private cleanText(text: string): string
}
```

### Step 3: Implement Chunking Service

**File:** `services/document/chunking.service.ts`

**Responsibilities:**
- Split text into 512-token chunks with 20% overlap
- Preserve sentence boundaries (don't split mid-sentence)
- Track page numbers for each chunk
- Return array of Chunk objects

**Key Functions:**
```typescript
class ChunkingService {
  async chunkText(text: string, maxTokens: number = 512): Promise<Chunk[]>
  private countTokens(text: string): number
  private splitAtSentenceBoundary(text: string, targetTokens: number): string[]
}
```

### Step 4: Implement Embedding Service

**File:** `services/document/embedding.service.ts`

**Responsibilities:**
- Generate embeddings via OpenAI API
- Batch chunks for efficiency (up to 100 per request)
- Handle rate limits with exponential backoff
- Track token usage for billing

**Key Functions:**
```typescript
class EmbeddingService {
  async generateEmbeddings(texts: string[]): Promise<number[][]>
  async generateSingleEmbedding(text: string): Promise<number[]>
  private batchTexts(texts: string[], batchSize: number = 100): string[][]
  private retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T>
}
```

### Step 5: Implement Vector Store Service

**File:** `services/document/vector-store.service.ts`

**Responsibilities:**
- Insert chunks with embeddings into pgvector
- Perform similarity search
- Return ranked results with scores

**Key Functions:**
```typescript
class VectorStoreService {
  async insertChunks(documentId: string, chunks: ChunkWithEmbedding[]): Promise<void>
  async searchSimilar(queryEmbedding: number[], userId: string, topK: number, documentId?: string): Promise<SimilarChunk[]>
  async deleteDocumentChunks(documentId: string): Promise<void>
}
```

### Step 6: Implement RAG Service

**File:** `services/document/rag.service.ts`

**Responsibilities:**
- Orchestrate RAG query flow
- Build context prompt from retrieved chunks
- Call OpenAI chat completion
- Stream responses if enabled

**Key Functions:**
```typescript
class RagService {
  async query(query: string, userId: string, options: RagOptions): Promise<RagResponse>
  async streamQuery(query: string, userId: string, options: RagOptions): AsyncGenerator<RagChunk>
  private buildPrompt(query: string, context: SimilarChunk[]): string
  private formatSources(chunks: SimilarChunk[]): Source[]
}
```

### Step 7: Implement Document Controller

**File:** `controllers/document.controller.ts`

**HTTP Handlers:**
```typescript
class DocumentController {
  async upload(req: Request, res: Response): Promise<void>
  async list(req: Request, res: Response): Promise<void>
  async get(req: Request, res: Response): Promise<void>
  async delete(req: Request, res: Response): Promise<void>
  async query(req: Request, res: Response): Promise<void>
  async queryStream(req: Request, res: Response): Promise<void>
}
```

### Step 8: Setup Routes and Middleware

**File:** `routes/document.routes.ts`

```typescript
import express from 'express';
import { DocumentController } from '../controllers/document.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { quotaMiddleware } from '../middleware/quota.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const controller = new DocumentController();

// All routes require authentication
router.use(authMiddleware);

// Upload (with quota check)
router.post('/upload', quotaMiddleware, uploadMiddleware.single('file'), controller.upload);

// Query (streaming support)
router.post('/query', controller.query);

// Management
router.get('/', controller.list);
router.get('/:id', controller.get);
router.delete('/:id', controller.delete);

export default router;
```

### Step 9: Integrate with Main App

**File:** `src/index.ts`

```typescript
import documentRoutes from './routes/document.routes';

// Add to Express app
app.use('/api/documents', documentRoutes);
```

### Step 10: Write Integration Tests

**File:** `src/__tests__/document.integration.test.ts`

**Test Cases:**
- Upload valid PDF → status 200, document created
- Upload oversized PDF → status 400
- Upload non-PDF file → status 400
- Query document → returns relevant results
- Query non-existent document → status 404
- Delete document → soft delete works
- Quota exceeded → status 429

---

## Todo List

- [ ] Create service directory structure
- [ ] Implement PdfParserService (pdf-parse + fallback)
- [ ] Implement ChunkingService (512 tokens, 20% overlap)
- [ ] Implement EmbeddingService (OpenAI API integration)
- [ ] Implement VectorStoreService (pgvector CRUD)
- [ ] Implement RagService (query orchestration)
- [ ] Implement DocumentController (HTTP handlers)
- [ ] Setup upload middleware (Multer config)
- [ ] Setup quota middleware (billing integration)
- [ ] Create document routes
- [ ] Integrate routes with main app
- [ ] Write unit tests for each service
- [ ] Write integration tests for API endpoints
- [ ] Test with real PDFs (10 pages, 100 pages, corrupted)
- [ ] Test rate limiting and error handling
- [ ] Test streaming query responses
- [ ] Optimize vector search performance
- [ ] Add logging and monitoring
- [ ] Document API in OpenAPI spec
- [ ] Update CODEBASE_INDEX.md

---

## Success Criteria

**API Endpoints:**
- [ ] Upload PDF: 95%+ success rate for valid PDFs
- [ ] Process PDF: Text extraction works for common formats
- [ ] Query document: Returns relevant results (top-5 accuracy >80%)
- [ ] Streaming: SSE responses work without buffering issues

**Performance:**
- [ ] Upload + processing: <10 seconds for 10-page PDF
- [ ] Query latency: <2 seconds to first chunk (streaming)
- [ ] Vector search: <200ms for similarity query

**Robustness:**
- [ ] Corrupted PDFs: Return error message (not crash)
- [ ] Rate limit exceeded: Retry with backoff
- [ ] Large PDFs: Handle 100+ pages without timeout

**Security:**
- [ ] User isolation: Can only query own documents
- [ ] Quota enforcement: Blocks uploads when limit reached
- [ ] Input validation: Reject malformed requests

---

## Risk Assessment

**High Risk:**
- **PDF parsing failures:** Unsupported encodings, encrypted PDFs
  - **Mitigation:** Multi-parser fallback + clear error messages

**Medium Risk:**
- **OpenAI rate limits:** 350K TPM can be exceeded
  - **Mitigation:** Exponential backoff + circuit breaker
- **Slow processing:** 100-page PDFs take >30s
  - **Mitigation:** Background job queue (implement in Phase 2.5 if needed)

**Low Risk:**
- **Vector search accuracy:** Semantic search may miss exact matches
  - **Mitigation:** Hybrid search (Phase 3 enhancement)

---

## Security Considerations

**Data Isolation:**
- [ ] Enforce userId in all queries (prevent cross-user access)
- [ ] Validate document ownership before delete/query

**API Security:**
- [ ] Rate limiting per user (prevent abuse)
- [ ] Input sanitization (prevent injection attacks)
- [ ] File size limits (prevent DoS via large uploads)

**Secrets Management:**
- [ ] OpenAI API key in environment variables
- [ ] R2 credentials not exposed in responses
- [ ] Error messages don't leak sensitive info

---

## Next Steps After Phase 2

**Phase 3: Cost Monitoring & Limits**
- Implement detailed token usage tracking
- Add cost alerts (80% budget threshold)
- Create admin analytics dashboard
- Enforce hard limits per plan tier

**Future Enhancements:**
- Multi-document queries ("Search across all my PDFs")
- Hybrid search (BM25 + semantic)
- OCR support for scanned PDFs
- DOCX/TXT file support

---

**Phase 2 Deliverables:**
1. PDF upload and processing API
2. Semantic chunking and embedding generation
3. RAG query endpoint with streaming
4. Complete integration tests
5. API documentation

**Next Phase:** [Phase 3: Cost Monitoring & Limits](./phase-03-cost-monitoring-limits.md)

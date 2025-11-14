# Phase 2: Core Implementation

**Phase:** 2 of 3
**Dates:** Week 2-3 (Nov 20 - Dec 3, 2025)
**Priority:** High
**Status:** Not Started

---

## Context

**Research Reports:**
- [OpenAI Embeddings](./research/researcher-02-openai-embeddings.md)
- [PDF Parsing](./research/researcher-03-pdf-parsing.md)
- [RAG Patterns](./research/researcher-04-rag-patterns.md)

**Scout Report:**
- [Chat Service Structure](./scout/scout-01-chat-service-structure.md)
- [Scout Summary](./SCOUT_SUMMARY.md)

**Prerequisites:**
- Phase 1 completed (pgvector, R2, schema)
- Dependencies installed (pdf-parse, AWS SDK, tiktoken)

---

## Overview

Build PDF upload pipeline and RAG query system with semantic search, chunking, and streaming responses.

**Scope:**
- PDF upload endpoint with validation
- Text extraction (pdf-parse + pdfjs-dist fallback)
- Semantic chunking (512 tokens, 20% overlap)
- OpenAI embedding generation
- Vector storage in pgvector
- RAG query endpoint with hybrid search
- SSE streaming responses

**Non-Scope:**
- Cost monitoring dashboard (Phase 3)
- Rate limiting implementation (Phase 3)
- Frontend UI (separate workstream)

---

## Key Insights from Research

**PDF Parsing (researcher-03):**
- Primary: pdf-parse (fast, 1.2M downloads/week, simple API)
- Fallback: pdfjs-dist (complex PDFs, multi-column layouts)
- Validation: Check `text.length > threshold` to detect scanned PDFs
- Memory: Call `destroy()` after processing to free memory

**Chunking Strategy (researcher-04):**
- Size: 512 tokens (balance context + retrieval precision)
- Overlap: 20% (~100 tokens) preserves cross-chunk context
- Method: Semantic chunking (respects paragraph boundaries)
- Token counting: Use js-tiktoken (matches OpenAI's tokenizer)

**RAG Patterns (researcher-04):**
- Hybrid search: Semantic (cosine) + BM25 (lexical)
- Reranking: Neural reranker for top-K (optional, adds latency)
- Context window: Top 5 chunks, max 3000 tokens
- Prompt: "Answer ONLY from context, cite sources, say 'not available' if insufficient"

**OpenAI Embeddings (researcher-02):**
- Model: text-embedding-3-small (1536 dims, $0.02/1M tokens)
- Batch processing: 50% cost savings (use for bulk uploads)
- Rate limit: 350K TPM (tokens per minute)
- Retry logic: Exponential backoff (1s → 16s)

---

## Requirements

### 1. Document Upload Flow

**Endpoint:** `POST /api/documents`

**Request:**
```typescript
// Multipart form-data or direct buffer upload
{
  file: Buffer | File,
  title?: string  // Optional, defaults to filename
}
```

**Response:**
```typescript
{
  documentId: string,
  title: string,
  status: "processing" | "completed" | "failed",
  uploadedAt: string,
  pageCount?: number,
  fileSize: number
}
```

**Validation:**
- File size: Max 10MB (free tier)
- MIME type: application/pdf
- User quota: Max 5 documents (check billing-service)
- Duplicate check: Same hash + userId (optional)

### 2. PDF Processing Pipeline

**Steps:**
1. **Upload to R2:** Generate presigned URL, upload via SDK
2. **Parse PDF:** Extract text with pdf-parse
3. **Fallback:** If text empty (<100 chars), try pdfjs-dist
4. **Chunk text:** Split into 512-token chunks with 20% overlap
5. **Generate embeddings:** Batch chunks to OpenAI API
6. **Store vectors:** Insert chunks + embeddings into pgvector
7. **Update status:** Mark document as "completed"

**Error Handling:**
- Corrupted PDF → status: "failed", errorMessage: "Invalid PDF format"
- OpenAI API failure → Retry 3x with exponential backoff
- Storage failure → Delete R2 object, rollback DB transaction

### 3. Chunking Logic

**Implementation:**
```typescript
interface Chunk {
  content: string;
  tokens: number;
  chunkIndex: number;
  pageNumber?: number;
}

async function chunkDocument(
  text: string,
  chunkSize: number = 512,
  overlapPercent: number = 20
): Promise<Chunk[]> {
  const tokenizer = encoding_for_model('text-embedding-3-small');
  const tokens = tokenizer.encode(text);
  const overlapSize = Math.floor(chunkSize * (overlapPercent / 100));
  const chunks: Chunk[] = [];

  for (let i = 0; i < tokens.length; i += chunkSize - overlapSize) {
    const chunkTokens = tokens.slice(i, i + chunkSize);
    const content = tokenizer.decode(chunkTokens);

    chunks.push({
      content,
      tokens: chunkTokens.length,
      chunkIndex: chunks.length,
    });
  }

  return chunks;
}
```

### 4. Embedding Generation

**Implementation:**
```typescript
async function generateEmbeddings(chunks: Chunk[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks.map(c => c.content),  // Batch up to 300K tokens
  });

  return response.data.map(item => item.embedding);
}
```

**Batch Optimization:**
- Group up to 36 chunks per request (~18K tokens/chunk avg)
- Use Promise.all for parallel requests (max 5 concurrent)
- Cache embeddings in Redis (optional, for duplicate chunks)

### 5. Vector Storage

**Insert Query:**
```typescript
// Use raw SQL for vector insertion (Prisma doesn't fully support vectors)
await prisma.$executeRaw`
  INSERT INTO document_chunks (id, document_id, content, chunk_index, tokens, embedding)
  VALUES (
    ${chunkId},
    ${documentId},
    ${content},
    ${chunkIndex},
    ${tokens},
    ${embedding}::vector
  )
`;
```

### 6. RAG Query Flow

**Endpoint:** `POST /api/documents/:id/query`

**Request:**
```typescript
{
  query: string,
  stream?: boolean,  // Enable SSE streaming
  topK?: number      // Number of chunks to retrieve (default: 5)
}
```

**Response (non-streaming):**
```typescript
{
  answer: string,
  sources: [
    {
      chunkId: string,
      content: string,
      relevance: number,  // Cosine similarity score
      pageNumber?: number
    }
  ],
  tokensUsed: number
}
```

**Pipeline:**
1. **Generate query embedding:** OpenAI API
2. **Semantic search:** pgvector cosine similarity
3. **Rerank:** Sort by relevance score (>0.7 threshold)
4. **Build context:** Concatenate top 5 chunks
5. **Generate answer:** OpenAI chat completion
6. **Track usage:** Log tokens for billing

### 7. Semantic Search Query

**Implementation:**
```typescript
async function semanticSearch(
  documentId: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<Chunk[]> {
  const results = await prisma.$queryRaw<Chunk[]>`
    SELECT
      id,
      content,
      chunk_index,
      page_number,
      ROUND((1 - (embedding <=> ${queryEmbedding}::vector))::numeric, 4) as relevance
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${topK}
  `;

  return results.filter(r => r.relevance > 0.7);  // Relevance threshold
}
```

### 8. RAG Prompt Template

**System Prompt:**
```typescript
const SYSTEM_PROMPT = `You are a precise Q&A assistant. Answer based ONLY on the provided context.

Rules:
1. Answer directly from context - no external knowledge
2. Cite the chunk number for each fact (e.g., "[1] According to the document...")
3. If context is insufficient, respond: "This information is not available in the document"
4. For uncertain information, express confidence level
5. Keep answers concise and factual

Context relevance: {similarity_score}
If score < 0.7, be cautious and mention uncertainty.`;
```

**User Message:**
```typescript
const userMessage = `Context:
${chunks.map((c, i) => `[${i+1}] ${c.content}`).join('\n\n')}

Question: ${query}

Answer:`;
```

### 9. Streaming Response (SSE)

**Implementation:**
```typescript
async function streamRAGResponse(
  res: Response,
  documentId: string,
  query: string
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 1. Retrieve context
    const chunks = await retrieveContext(documentId, query);

    // 2. Stream from OpenAI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(chunks, query) }
      ],
      stream: true,
    });

    // 3. Forward chunks to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
  } finally {
    res.end();
  }
}
```

---

## Architecture

### Service Layer Structure

```
chat-service/src/
├── controllers/
│   └── document.controller.ts       # Upload, query, list, delete
├── services/
│   ├── document.service.ts          # PDF processing orchestration
│   ├── embedding.service.ts         # OpenAI embedding generation
│   ├── pdf-parser.service.ts        # Text extraction (pdf-parse + fallback)
│   ├── chunking.service.ts          # Semantic chunking logic
│   └── storage.service.ts           # R2 upload/download
├── repositories/
│   ├── document.repository.ts       # Document CRUD
│   └── document-chunk.repository.ts # Chunk + vector operations
└── routes/
    └── document.routes.ts           # Route registration
```

### Related Code Files

**Existing (Reuse):**
- `src/middleware/auth.ts` → JWT verification
- `src/services/openai.service.ts` → OpenAI client
- `src/services/billing-client.service.ts` → Quota checks
- `src/shared/events/publisher.ts` → Analytics events

**New (Create):**
- `src/controllers/document.controller.ts` (250 lines)
- `src/services/document.service.ts` (200 lines)
- `src/services/embedding.service.ts` (150 lines)
- `src/services/pdf-parser.service.ts` (100 lines)
- `src/services/chunking.service.ts` (80 lines)
- `src/services/storage.service.ts` (120 lines)
- `src/repositories/document.repository.ts` (100 lines)
- `src/repositories/document-chunk.repository.ts` (120 lines)
- `src/routes/document.routes.ts` (50 lines)

**Update:**
- `src/app.ts` → Register document routes
- `src/config/env.ts` → Add R2 config

---

## Implementation Steps

### Step 1: Create Storage Service
```typescript
// src/services/storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.PDF_BUCKET_NAME;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.CF_ACCESS_KEY_ID,
        secretAccessKey: env.CF_SECRET_ACCESS_KEY,
      }
    });
  }

  async getUploadUrl(key: string): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: 'application/pdf'
    });
    return getSignedUrl(this.client, cmd, { expiresIn: 3600 });
  }

  async getDownloadUrl(key: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: 3600 });
  }

  async uploadBuffer(key: string, buffer: Buffer): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf'
    }));
  }
}
```

### Step 2: Create PDF Parser Service
```typescript
// src/services/pdf-parser.service.ts
import pdf from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist';

export class PDFParserService {
  async extractText(buffer: Buffer): Promise<{ text: string, pageCount: number }> {
    try {
      // Primary: pdf-parse (fast)
      const data = await pdf(buffer);

      if (data.text.trim().length > 100) {
        return { text: data.text, pageCount: data.numpages };
      }
    } catch (error) {
      logger.warn('pdf-parse failed, trying pdfjs-dist', error);
    }

    // Fallback: pdfjs-dist (slower but handles complex PDFs)
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      pages.push(textContent.items.map(item => item.str).join(' '));
    }

    return { text: pages.join('\n'), pageCount: doc.numPages };
  }
}
```

### Step 3: Create Chunking Service
```typescript
// src/services/chunking.service.ts
import { encoding_for_model } from 'js-tiktoken';

export class ChunkingService {
  private tokenizer = encoding_for_model('text-embedding-3-small');

  chunkText(text: string, chunkSize = 512, overlapPercent = 20): Chunk[] {
    const tokens = this.tokenizer.encode(text);
    const overlapSize = Math.floor(chunkSize * (overlapPercent / 100));
    const chunks: Chunk[] = [];

    for (let i = 0; i < tokens.length; i += chunkSize - overlapSize) {
      const chunkTokens = tokens.slice(i, i + chunkSize);
      const content = this.tokenizer.decode(chunkTokens);

      chunks.push({
        content,
        tokens: chunkTokens.length,
        chunkIndex: chunks.length,
      });
    }

    return chunks;
  }
}
```

### Step 4: Create Embedding Service
```typescript
// src/services/embedding.service.ts
import { openai } from './openai.service';

export class EmbeddingService {
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map(item => item.embedding);
  }

  async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async semanticSearch(
    documentId: string,
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<Chunk[]> {
    return prisma.$queryRaw`
      SELECT
        id,
        content,
        chunk_index,
        page_number,
        ROUND((1 - (embedding <=> ${queryEmbedding}::vector))::numeric, 4) as relevance
      FROM document_chunks
      WHERE document_id = ${documentId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK}
    `;
  }
}
```

### Step 5: Create Document Service (Orchestrator)
```typescript
// src/services/document.service.ts
export class DocumentService {
  constructor(
    private storageService: StorageService,
    private parserService: PDFParserService,
    private chunkingService: ChunkingService,
    private embeddingService: EmbeddingService,
    private documentRepo: DocumentRepository,
    private chunkRepo: DocumentChunkRepository
  ) {}

  async uploadDocument(userId: string, file: Buffer, title: string): Promise<Document> {
    // 1. Validate quota
    await billingClient.checkDocumentQuota(userId);

    // 2. Create document record
    const storageKey = `documents/${userId}/${Date.now()}.pdf`;
    const document = await this.documentRepo.create({
      userId,
      title,
      fileName: title,
      fileSize: file.length,
      storageKey,
      status: 'PROCESSING',
    });

    try {
      // 3. Upload to R2
      await this.storageService.uploadBuffer(storageKey, file);

      // 4. Parse PDF
      const { text, pageCount } = await this.parserService.extractText(file);

      // 5. Chunk text
      const chunks = this.chunkingService.chunkText(text);

      // 6. Generate embeddings (batch)
      const embeddings = await this.embeddingService.generateEmbeddings(
        chunks.map(c => c.content)
      );

      // 7. Store chunks + vectors
      await this.chunkRepo.createMany(
        document.id,
        chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }))
      );

      // 8. Update document status
      await this.documentRepo.update(document.id, {
        status: 'COMPLETED',
        pageCount,
        processedAt: new Date(),
      });

      // 9. Publish event
      await eventPublisher.publish({
        type: 'document.uploaded',
        userId,
        documentId: document.id,
        metadata: { pageCount, chunks: chunks.length },
      });

      return document;
    } catch (error) {
      // Rollback: Mark as failed
      await this.documentRepo.update(document.id, {
        status: 'FAILED',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async queryDocument(documentId: string, userId: string, query: string): Promise<RAGResponse> {
    // 1. Verify ownership
    const document = await this.documentRepo.findById(documentId);
    if (document.userId !== userId) {
      throw new UnauthorizedError('Document not found');
    }

    // 2. Check quota
    await billingClient.canUseTokens(userId, 1000);  // Estimate

    // 3. Generate query embedding
    const queryEmbedding = await this.embeddingService.generateSingleEmbedding(query);

    // 4. Retrieve relevant chunks
    const chunks = await this.embeddingService.semanticSearch(documentId, queryEmbedding, 5);

    // 5. Build context
    const context = chunks.map((c, i) => `[${i+1}] ${c.content}`).join('\n\n');

    // 6. Generate answer
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:` }
      ],
    });

    const answer = response.choices[0].message.content;
    const tokensUsed = response.usage.total_tokens;

    // 7. Track usage
    await billingClient.trackTokenUsage(userId, tokensUsed);

    // 8. Publish event
    await eventPublisher.publish({
      type: 'document.queried',
      userId,
      documentId,
      metadata: { tokensUsed, chunksRetrieved: chunks.length },
    });

    return { answer, sources: chunks, tokensUsed };
  }
}
```

### Step 6: Create Document Controller
```typescript
// src/controllers/document.controller.ts
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  async uploadDocument(req: AuthRequest, res: Response) {
    try {
      const { file, title } = req.body;  // Assume file buffer from middleware

      if (!file || file.length === 0) {
        return res.status(400).json({ error: 'No file provided' });
      }

      if (file.length > env.PDF_MAX_SIZE) {
        return res.status(413).json({ error: 'File too large (max 10MB)' });
      }

      const document = await this.documentService.uploadDocument(
        req.userId,
        file,
        title || 'Untitled Document'
      );

      return res.status(201).json(document);
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        return res.status(429).json({ error: error.message });
      }
      throw error;
    }
  }

  async queryDocument(req: AuthRequest, res: Response) {
    try {
      const { id: documentId } = req.params;
      const { query, stream = false } = req.body;

      if (stream) {
        return this.streamQueryResponse(req, res);
      }

      const result = await this.documentService.queryDocument(
        documentId,
        req.userId,
        query
      );

      return res.json(result);
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        return res.status(429).json({ error: error.message });
      }
      throw error;
    }
  }

  async streamQueryResponse(req: AuthRequest, res: Response) {
    // Implement SSE streaming (similar to chat.controller.ts streamMessage)
  }

  async listDocuments(req: AuthRequest, res: Response) {
    const documents = await this.documentService.listDocuments(req.userId);
    return res.json(documents);
  }

  async deleteDocument(req: AuthRequest, res: Response) {
    const { id: documentId } = req.params;
    await this.documentService.deleteDocument(documentId, req.userId);
    return res.status(204).send();
  }
}
```

### Step 7: Create Routes
```typescript
// src/routes/document.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DocumentController } from '../controllers/document.controller';

const router = Router();
const controller = new DocumentController(/* inject services */);

router.post('/documents', authenticateToken, controller.uploadDocument);
router.get('/documents', authenticateToken, controller.listDocuments);
router.post('/documents/:id/query', authenticateToken, controller.queryDocument);
router.delete('/documents/:id', authenticateToken, controller.deleteDocument);

export default router;
```

### Step 8: Register Routes in App
```typescript
// src/app.ts
import documentRoutes from './routes/document.routes';

app.use('/api', documentRoutes);
```

---

## Todo List

**Storage Service:**
- [ ] Create storage.service.ts with R2 client
- [ ] Implement getUploadUrl() with presigned URLs
- [ ] Implement uploadBuffer() for direct uploads
- [ ] Test R2 upload with sample PDF
- [ ] Add error handling for R2 failures

**PDF Parser Service:**
- [ ] Create pdf-parser.service.ts
- [ ] Implement pdf-parse extraction
- [ ] Add pdfjs-dist fallback logic
- [ ] Test with sample PDFs (text-based, complex, scanned)
- [ ] Add validation for minimum text length

**Chunking Service:**
- [ ] Create chunking.service.ts
- [ ] Install js-tiktoken package
- [ ] Implement token-based chunking with overlap
- [ ] Test chunk size and overlap parameters
- [ ] Validate chunk boundaries preserve meaning

**Embedding Service:**
- [ ] Create embedding.service.ts
- [ ] Implement batch embedding generation
- [ ] Add semantic search query function
- [ ] Implement retry logic with exponential backoff
- [ ] Test with sample embeddings

**Document Service:**
- [ ] Create document.service.ts (orchestrator)
- [ ] Implement uploadDocument() workflow
- [ ] Implement queryDocument() with RAG
- [ ] Add quota validation (billing-client)
- [ ] Publish analytics events
- [ ] Add transaction rollback on failures

**Repositories:**
- [ ] Create document.repository.ts
- [ ] Create document-chunk.repository.ts
- [ ] Implement vector insertion with raw SQL
- [ ] Add findById, create, update, delete methods
- [ ] Test vector storage and retrieval

**Controller:**
- [ ] Create document.controller.ts
- [ ] Implement uploadDocument endpoint
- [ ] Implement queryDocument endpoint
- [ ] Implement streaming response (SSE)
- [ ] Implement listDocuments endpoint
- [ ] Implement deleteDocument endpoint
- [ ] Add error handling (400, 404, 413, 429, 500)

**Routes & App:**
- [ ] Create document.routes.ts
- [ ] Add authenticateToken middleware to all routes
- [ ] Register routes in app.ts
- [ ] Test routes with Postman/curl

**Testing:**
- [ ] Upload 10MB PDF (success)
- [ ] Upload 15MB PDF (413 error)
- [ ] Upload corrupted PDF (400 error)
- [ ] Query document with relevant question
- [ ] Query with irrelevant question (check response)
- [ ] Test streaming response
- [ ] Test quota exceeded scenario (429)
- [ ] Test concurrent uploads (race conditions)

**Documentation:**
- [ ] Add API documentation to README
- [ ] Document error codes and responses
- [ ] Create example requests (curl/Postman)
- [ ] Add troubleshooting guide

---

## Success Criteria

**Upload Success:**
- [ ] PDF uploaded to R2 successfully
- [ ] Text extracted (>95% success for text-based PDFs)
- [ ] Chunks created with correct token counts
- [ ] Embeddings generated and stored
- [ ] Document status updated to "completed"
- [ ] Process completes in <30 seconds for 100-page PDF

**Query Success:**
- [ ] Query returns relevant chunks (top-5 accuracy >80%)
- [ ] Answer is factual and cites sources
- [ ] Response time <3 seconds (p95)
- [ ] Streaming works without buffering issues
- [ ] Token usage tracked correctly

**Error Handling:**
- [ ] Corrupted PDFs return 400 with clear message
- [ ] File size exceeded returns 413
- [ ] Quota exceeded returns 429
- [ ] Unauthorized access returns 401
- [ ] Server errors return 500 with logged stack trace

**Performance:**
- [ ] Upload handles 10 concurrent requests
- [ ] Query response time <2 seconds (average)
- [ ] Vector search <200ms for 1K chunks
- [ ] No memory leaks after 100+ uploads

---

## Risk Assessment

**High Risk:**
- **OpenAI API failures:** Rate limits, timeouts
  - **Mitigation:** Retry logic + circuit breaker + fallback to cached results
- **Embedding cost overrun:** Large PDFs generate many chunks
  - **Mitigation:** Strict file size limit (10MB) + warn users on upload

**Medium Risk:**
- **Parser failures:** Complex PDFs fail extraction
  - **Mitigation:** Multi-parser fallback (pdf-parse → pdfjs-dist)
- **Vector search quality:** Low relevance scores
  - **Mitigation:** Tune threshold (>0.7) + hybrid search (add BM25 in future)

**Low Risk:**
- **R2 storage costs:** Grow with uploads
  - **Mitigation:** Lifecycle policy (delete after 90 days) + 10MB limit

---

## Security Considerations

**Upload Validation:**
- [ ] Validate MIME type (application/pdf only)
- [ ] Scan for malware (optional, use external service)
- [ ] Reject encrypted PDFs (can't extract text)

**Query Authorization:**
- [ ] Verify userId matches document.userId
- [ ] Return 404 for unauthorized access (not 403 to avoid enumeration)
- [ ] Rate limit queries (50/day for free tier)

**Data Isolation:**
- [ ] All queries filter by userId
- [ ] Vector search scoped to documentId
- [ ] No cross-user data leakage (test with different users)

---

**Phase 2 Deliverables:**
1. PDF upload endpoint operational
2. Text extraction with fallback
3. Chunking and embedding generation
4. Vector storage in pgvector
5. RAG query endpoint with streaming
6. Error handling and validation
7. Integration with billing service
8. Analytics event publishing

**Next Phase:** [Phase 3: Cost Monitoring & Limits](./phase-03-cost-monitoring-limits.md)

# Scout Report: Chat-Service Architecture for PDF Q&A System

**Date:** 2025-11-13  
**Status:** Complete  
**Scope:** Chat-service codebase structure, patterns, and integration points

---

## Service Architecture Overview

**Port:** 3003 | **Tech:** Express + TypeScript + Prisma + PostgreSQL

### Core Structure
```
chat-service/src/
├── app.ts                    # Express app, middleware setup (CORS, auth, Sentry)
├── config/                   # Database, env, logger, tracing
├── controllers/              # HTTP handlers (chat.controller.ts)
├── middleware/               # JWT auth (authenticateToken)
├── routes/                   # Route registration (chat.routes.ts)
├── services/                 # Business logic (chat.service.ts, openai.service.ts)
├── repositories/             # Data access layer (message, conversation)
└── shared/events/            # Event publishing for analytics (RabbitMQ)
```

---

## Key Patterns for PDF Q&A Integration

### 1. Controller Pattern
**File:** `chat.controller.ts` (310 lines)

**Pattern:**
- Class-based controller with async methods
- Receives `AuthRequest` (extends Express.Request with `userId`, `email`)
- Error handling: status codes (400, 404, 429, 500) with JSON responses
- Event publishing post-request (non-blocking)

**Integration Point:** Add `POST /api/documents/upload` and `POST /api/documents/query`

### 2. Service Layer Pattern
**File:** `chat.service.ts` (100+ lines)

**Features:**
- Service class with business logic methods
- Uses repositories for data access
- Integrates with external services (OpenAI, Billing)
- Tracks token usage for billing
- Validates user permissions and quotas

**For PDF Q&A:**
- Create `document.service.ts` for PDF processing logic
- Use repositories for document storage and chunks
- Query Billing service for quota checks
- Track token usage from LLM responses

### 3. OpenAI Integration Pattern
**File:** `openai.service.ts` (80+ lines)

**Features:**
- Singleton client with mock fallback (missing API key)
- `createChatCompletion()` - sends messages to OpenAI
- `estimateTokens()` - calculates token count (important for billing)
- `createStreamingChatCompletion()` - SSE streaming support
- Error handling with retry logic

**For PDF Q&A:** Reuse existing OpenAI client for RAG queries

### 4. Repository Pattern
**File:** `repositories/message.repository.ts` (50 lines)

**Pattern:**
- Simple CRUD operations using Prisma
- Methods: `create()`, `findByConversationId()`, `deleteByConversationId()`
- Uses `withRetry()` wrapper for connection resilience

**For PDF Q&A:**
- Create `document.repository.ts`: store PDF metadata
- Create `document-chunk.repository.ts`: manage text chunks with embeddings

### 5. Authentication Middleware
**File:** `middleware/auth.ts` (30 lines)

**Pattern:**
- Extracts JWT from cookies (`req.cookies.session`)
- Verifies token using `AUTH_SECRET`
- Injects `userId`, `email` into request
- Returns 401 on invalid/missing token

**For PDF Q&A:** All document endpoints must use `authenticateToken` middleware

### 6. Event Publishing
**File:** `shared/events/types.ts`

**Pattern:**
- RabbitMQ-based event publishing (non-blocking)
- Events: `ChatEventType.MESSAGE_SENT`, `CONVERSATION_CREATED`
- Event structure: `{ event_type, user_id, conversation_id, metadata }`

**For PDF Q&A:** Publish `document.uploaded`, `document.queried` events

### 7. Billing Integration
**File:** `services/billing-client.service.ts` (50+ lines)

**Pattern:**
- HTTP client to billing-service (localhost:3004)
- Checks quota: `canUseTokens(userId, estimatedTokens, sessionCookie)`
- Throws 429 on quota exceeded

**For PDF Q&A:** Check quota before upload and query operations

### 8. Streaming Support
**File:** `controllers/chat.controller.ts` → `streamMessage()`

**Pattern:**
- SSE (Server-Sent Events) for real-time responses
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- Chunks: `data: {JSON}\n\n`
- Events: type=chunk, type=done, type=error

**For PDF Q&A:** Stream RAG query results chunk-by-chunk

---

## Database Schema

**File:** `prisma/schema.prisma` (102 lines)

**Existing Models:**
- `Conversation` - user chats with metadata
- `Message` - chat messages (role: user|assistant, token count)
- `TokenUsage` - tracks usage for billing

**For PDF Q&A, add:**
```prisma
model Document {
  id             String    @id @default(cuid())
  userId         String
  title          String    @db.VarChar(255)
  contentType    String    // "pdf", "txt", "docx"
  fileSize       Int
  pageCount      Int?
  status         String    @default("processing")
  chunks         DocumentChunk[]
  uploadedAt     DateTime  @default(now())
  deletedAt      DateTime?
  
  @@index([userId, uploadedAt])
}

model DocumentChunk {
  id             String    @id @default(cuid())
  documentId     String
  content        String    @db.Text
  chunkIndex     Int
  embedding      String?   // JSON vector
  tokens         Int
  createdAt      DateTime  @default(now())
  
  @@index([documentId, chunkIndex])
}
```

---

## Configuration

**File:** `config/env.ts`

**Existing Variables:**
- `NODE_ENV`, `DATABASE_URL`, `OPENAI_API_KEY`
- `AUTH_SECRET`, `RABBITMQ_URL`, `FRONTEND_URL`

**Add for PDF Q&A:**
- `PDF_MAX_SIZE` - max upload size (50MB)
- `VECTOR_DB_URL` - embedding store (Pinecone/pgvector)

---

## Route Registration

**File:** `routes/chat.routes.ts` (59 lines)

**Pattern:** All routes protected by `authenticateToken` middleware

**Add for PDF Q&A:**
```
POST   /api/documents              # Upload PDF
GET    /api/documents              # List documents
DELETE /api/documents/:id          # Delete document
POST   /api/documents/:id/query    # Query with RAG
```

---

## Error Handling

**Pattern:**
- Custom error messages in Vietnamese
- Status codes: 400 (validation), 401 (auth), 404 (not found), 429 (quota), 500 (server)
- JSON format: `{ error: "message" }`

**For PDF Q&A:**
- 400: Invalid PDF file format
- 413: File too large
- 429: Quota exceeded
- 500: PDF parsing failed

---

## File Upload Handling

**Status:** Not found in existing code

**Need to Add:**
- Multer middleware for file upload
- File validation: mimetype=application/pdf, size check
- PDF parsing library: `pdf-parse` or `pdfjs-dist`
- Storage: local filesystem or cloud storage (S3)

---

## Implementation Checklist

- [x] JWT auth middleware exists (reuse)
- [x] Controller → service → repository pattern established
- [x] OpenAI client ready for RAG queries
- [x] Billing quota checking infrastructure
- [x] Event publishing system (RabbitMQ)
- [x] Streaming support (SSE)
- [ ] File upload middleware (NEW)
- [ ] Vector embedding service (NEW)
- [ ] PDF parsing library (NEW)
- [ ] Document chunking logic (NEW)
- [ ] Prisma schema extension (NEW)

---

## Key Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/controllers/document.controller.ts` | CREATE | Handle upload/query |
| `src/services/document.service.ts` | CREATE | PDF processing |
| `src/services/embedding.service.ts` | CREATE | Vector embeddings |
| `src/repositories/document.repository.ts` | CREATE | Document CRUD |
| `src/routes/document.routes.ts` | CREATE | Route registration |
| `prisma/schema.prisma` | UPDATE | Add Document models |
| `src/config/env.ts` | UPDATE | PDF config variables |
| `src/app.ts` | UPDATE | Register document routes |
| `src/middleware/auth.ts` | REUSE | JWT verification |
| `src/services/openai.service.ts` | REUSE | RAG queries |
| `src/services/billing-client.service.ts` | REUSE | Quota checking |

---

**Total:** 5 files to create | 3 files to update | 3 files to reuse


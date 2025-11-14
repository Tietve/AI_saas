# Phase 4: Document Q&A Interface - Implementation Plan

**Date:** 2025-11-14
**Status:** Planning
**Based on:** Phase 3 Complete (CRUD done), Existing RAG infrastructure

---

## 🎯 Goal

Add PDF upload + Q&A functionality to enable users to upload PDFs and ask questions about them using RAG.

---

## ✅ What We Already Have (From Phase 3)

**Database:**
- ✅ Document model in Prisma (orchestrator-service)
- ✅ Document table with userId, title, fileName, status, etc.

**Backend Services (orchestrator-service):**
- ✅ Embedding service (`embedding.service.ts`) - OpenAI text-embedding-3-small
- ✅ Vector store service (`vector-store.service.ts`) - Pinecone integration
- ✅ Document controller with list(), getById(), deleteById()
- ✅ Routes for GET /, GET /:id, DELETE /:id

**Frontend:**
- ✅ Document upload UI (DocumentUploadZone component)
- ✅ Document list UI (DocumentList component)
- ✅ Document item cards with status display
- ✅ Delete functionality with optimistic updates
- ✅ Conditional polling for PROCESSING status

**Infrastructure:**
- ✅ API Gateway routing `/api/documents/*`
- ✅ PostgreSQL with Document table
- ✅ Pinecone connection (optional, graceful degradation)

---

## ❌ What We Need to Add

### Backend (orchestrator-service):
1. **File Upload Middleware** - multer for multipart/form-data
2. **PDF Processing** - Extract text, chunk, embed, store vectors
3. **Q&A Endpoint** - POST /api/documents/:id/query with RAG
4. **Upload Endpoint Enhancement** - Handle actual file uploads

### Frontend:
1. **Q&A Interface** - Question input + answer display
2. **Chat-like UI** - Conversation history per document
3. **Source Citations** - Show relevant chunks with scores
4. **Loading States** - Streaming response support (optional)

---

## 📝 Implementation Plan

### Step 1: Backend - PDF Upload Pipeline (2-3 hours)

**Install Dependencies:**
```bash
cd backend/services/orchestrator-service
npm install multer pdf-parse @types/multer
```

**Files to Create/Modify:**

1. **Create PDF Parser Service** (`src/services/pdf-parser.service.ts`)
   - Extract text from PDF using pdf-parse
   - Handle errors for corrupted/scanned PDFs
   - Return { text, pageCount }

2. **Create Chunking Service** (`src/services/chunking.service.ts`)
   - Split text into 512-token chunks
   - 20% overlap (~100 tokens)
   - Use basic splitting (no need for tiktoken initially)

3. **Update Document Controller** (`src/controllers/document.controller.ts`)
   - Add multer middleware for `/upload` endpoint
   - Implement actual file processing in upload()
   - Save to local storage (or skip storage, just process in-memory)
   - Update Document record with processedAt, pageCount, chunksCount

4. **Update Upload Workflow:**
   ```
   1. Receive PDF file → multer middleware
   2. Create Document record (status: PROCESSING)
   3. Extract text → pdf-parser.service
   4. Chunk text → chunking.service
   5. Generate embeddings → embedding.service (batch)
   6. Store in Pinecone → vector-store.service
   7. Save pineconeIds to Document record
   8. Update status to COMPLETED
   9. Return document with status
   ```

**API Contract:**
```typescript
POST /api/documents/upload
Content-Type: multipart/form-data

Body:
  file: <PDF file>
  title?: string

Response:
{
  id: string,
  title: string,
  fileName: string,
  fileSize: number,
  status: "PROCESSING",
  uploadedAt: string,
  pageCount?: number
}
```

### Step 2: Backend - Q&A Endpoint (1-2 hours)

**Files to Create/Modify:**

1. **Add Q&A Method to Document Controller**
   ```typescript
   async query(req: Request, res: Response): Promise<void> {
     const { id } = req.params;
     const { query, userId } = req.body;

     // 1. Verify document exists and belongs to user
     // 2. Generate query embedding
     // 3. Search Pinecone for relevant chunks (top 5)
     // 4. If Pinecone unavailable, return helpful error
     // 5. Build context from chunks
     // 6. Call OpenAI chat completion (NOT IMPLEMENTED - just return chunks)
     // 7. Return answer + sources
   }
   ```

2. **Add Route:**
   ```typescript
   router.post('/:id/query', (req, res) => documentController.query(req, res));
   ```

**API Contract:**
```typescript
POST /api/documents/:id/query

Body:
{
  query: string,
  userId: string
}

Response:
{
  success: true,
  data: {
    query: string,
    chunks: [
      {
        id: string,
        content: string,
        score: number,
        metadata: { ... }
      }
    ],
    note: "OpenAI chat completion not implemented yet - showing relevant chunks"
  }
}
```

**Phase 4.1 Scope (Minimal):**
- Just return relevant chunks from vector search
- NO OpenAI chat completion (save for Phase 4.2)
- Focus on proving vector search works

### Step 3: Frontend - Q&A Interface (2-3 hours)

**Files to Create:**

1. **Create Q&A Page** (`frontend/src/pages/documents/DocumentQAPage.tsx`)
   - Route: `/documents/:id/qa`
   - Show document title + metadata
   - Question input field
   - Submit button
   - Display list of relevant chunks with scores

2. **Create Q&A Hook** (`frontend/src/features/documents/hooks/useDocumentQuery.ts`)
   ```typescript
   export const useDocumentQuery = () => {
     return useMutation({
       mutationFn: async ({ documentId, query }) => {
         return documentApi.query(documentId, query);
       },
     });
   };
   ```

3. **Update Document API** (`frontend/src/features/documents/api/documentApi.ts`)
   ```typescript
   async query(documentId: string, query: string) {
     const response = await api.post(`/api/documents/${documentId}/query`, {
       query,
       userId: getCurrentUserId(), // Get from auth context
     });
     return response.data;
   }
   ```

4. **Create Components:**
   - `QuestionInput.tsx` - Input field + submit button
   - `ChunkResult.tsx` - Display single chunk with score
   - `ChunksList.tsx` - List of all returned chunks

5. **Update Routes:**
   ```typescript
   <Route path="/documents/:id/qa" element={<DocumentQAPage />} />
   ```

6. **Add Q&A Button to DocumentItem:**
   - "Ask Questions" button in DocumentItem component
   - Links to `/documents/:id/qa`
   - Only enabled when status === "COMPLETED"

**UI Flow:**
```
1. User clicks "Ask Questions" on a document
2. Navigate to /documents/:id/qa
3. Show document title: "Document: {title}"
4. Input field: "What would you like to know?"
5. User types question, clicks "Submit"
6. Loading state while querying
7. Display results:
   - "Found 5 relevant sections:"
   - List chunks with relevance scores
   - Each chunk shows content preview + score
8. User can ask another question
```

---

## 🎯 Success Criteria

**Phase 4.1 (MVP):**
- [ ] PDF upload works (creates Document, stores in DB)
- [ ] Text extraction works (pdf-parse)
- [ ] Chunking works (splits into ~512 token chunks)
- [ ] Embeddings generated (OpenAI)
- [ ] Vectors stored (Pinecone or graceful failure)
- [ ] Document status updates to COMPLETED
- [ ] Q&A endpoint returns relevant chunks
- [ ] Frontend can upload PDF
- [ ] Frontend can ask questions
- [ ] Frontend displays chunk results

**Not in Phase 4.1:**
- ❌ OpenAI chat completion for answers (Phase 4.2)
- ❌ Streaming responses (Phase 4.2)
- ❌ Conversation history (Phase 4.2)
- ❌ File storage (R2/S3) - process in-memory only
- ❌ Virus scanning
- ❌ Advanced chunking (tiktoken)

---

## 📊 Estimated Time

**Backend:**
- PDF upload pipeline: 2-3 hours
- Q&A endpoint: 1-2 hours
- Testing: 1 hour
**Subtotal: 4-6 hours**

**Frontend:**
- Q&A page + components: 2-3 hours
- Integration + testing: 1 hour
**Subtotal: 3-4 hours**

**Total: 7-10 hours for Phase 4.1 MVP**

---

## 🚀 Implementation Order

1. ✅ Install dependencies (multer, pdf-parse)
2. ✅ Create PDF parser service
3. ✅ Create chunking service
4. ✅ Add multer middleware to upload endpoint
5. ✅ Implement PDF processing workflow
6. ✅ Test upload with sample PDF
7. ✅ Add Q&A endpoint to controller
8. ✅ Add Q&A route
9. ✅ Test Q&A endpoint with curl
10. ✅ Create frontend Q&A page
11. ✅ Create Q&A hooks and components
12. ✅ Add "Ask Questions" button to DocumentItem
13. ✅ Test full flow end-to-end
14. ✅ Document any issues

---

## 🧪 Testing Checklist

**Backend:**
- [ ] Upload 1-page PDF → success
- [ ] Upload 10-page PDF → success
- [ ] Upload corrupted PDF → proper error
- [ ] Upload non-PDF file → proper error
- [ ] Query returns relevant chunks
- [ ] Query with non-existent document → 404
- [ ] Query with wrong userId → 404 (not 403)

**Frontend:**
- [ ] Upload PDF → shows PROCESSING status
- [ ] Status updates to COMPLETED (polling works)
- [ ] Click "Ask Questions" → navigates to Q&A page
- [ ] Submit question → shows relevant chunks
- [ ] Shows "no results" when no chunks found
- [ ] Error handling for failed queries

---

## 📝 Phase 4.2 (Future)

After Phase 4.1 MVP working:
- Add OpenAI chat completion for natural language answers
- Add conversation history (multiple Q&A rounds)
- Add streaming responses (SSE)
- Add file storage (R2/S3) instead of in-memory
- Add advanced chunking with tiktoken
- Add source citations in answers
- Add "helpful/not helpful" feedback

---

**Ready to start implementation?** 🚀

**First Step:** Install dependencies and create PDF parser service.

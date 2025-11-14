# 📚 Pinecone Document Upload Guide

> **Hướng dẫn thêm documents vào Pinecone RAG system**
> Last updated: 2025-11-10

---

## 🎯 Tổng Quan

### RAG System hoạt động như thế nào?

```
User Query → Embedding → Pinecone Search → Retrieve Docs → Add to Prompt → LLM
```

1. **User input**: "How to optimize React performance?"
2. **Embedding**: Convert query thành vector (1536 dimensions)
3. **Pinecone search**: Tìm documents có vector tương tự
4. **Retrieve**: Lấy top 5 documents có relevance score > 0.7
5. **Context injection**: Thêm documents vào prompt trước khi gửi LLM
6. **Enhanced response**: LLM trả lời với context từ documents

---

## 🗄️ Document Structure

### Cấu trúc cơ bản của Document trong Pinecone

```typescript
{
  id: "doc-123",                    // Unique identifier
  embedding: [0.123, -0.456, ...],  // 1536-dimension vector
  metadata: {
    content: "Original text here",  // ⚠️ REQUIRED by RAG agent
    title: "Document Title",        // Optional but recommended
    category: "technical",          // For filtering
    tags: ["react", "performance"], // For filtering
    source: "docs.company.com",     // Track source
    createdAt: "2025-11-10",        // Timestamp
    userId: "user-123",             // For multi-tenant filtering
    // ... any custom fields
  }
}
```

### ⚠️ Important Metadata Fields

- **`content`** (REQUIRED): RAG agent expects this field
- **`title`** (Recommended): Helps with document organization
- **`category`** (Optional): For filtering by type
- **`userId`** (Optional): For multi-tenant RAG (user-specific docs)

---

## 🚀 3 Cách Thêm Documents

### Method 1: Seed Script (Development)

**Khi nào dùng:** Initial setup, testing, demo data

**File:** `scripts/seed-documents.ts`

```bash
# Chạy seed script
cd backend/services/orchestrator-service
npm run seed:docs
```

**Seed script sẽ:**
- Load sample documents từ `data/sample-docs.json`
- Generate embeddings cho từng document
- Upsert vào Pinecone
- Log progress và stats

### Method 2: API Endpoint (Production)

**Khi nào dùng:** User-uploaded docs, dynamic content, CMS integration

**Endpoint:** `POST /api/documents/upload`

```bash
curl -X POST http://localhost:3006/api/documents/upload \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Your document content here",
        "title": "Document Title",
        "category": "technical",
        "tags": ["react", "optimization"]
      }
    ],
    "userId": "user-123"
  }'
```

### Method 3: Direct Code (Programmatic)

**Khi nào dùng:** Migration scripts, batch processing, automation

```typescript
import { embeddingService } from './services/embedding.service';
import { vectorStoreService } from './services/vector-store.service';

async function uploadDocuments() {
  const documents = [
    {
      content: "Document content here",
      title: "My Document",
      category: "technical"
    }
  ];

  // Generate embeddings
  const texts = documents.map(d => d.content);
  const embeddingResult = await embeddingService.embedBatch(texts);

  // Prepare vector documents
  const vectorDocs = documents.map((doc, i) => ({
    id: `doc-${Date.now()}-${i}`,
    embedding: embeddingResult.embeddings[i].embedding,
    metadata: {
      content: doc.content,  // Required!
      title: doc.title,
      category: doc.category,
      createdAt: new Date().toISOString()
    }
  }));

  // Upsert to Pinecone
  await vectorStoreService.upsert(vectorDocs);

  console.log(`✅ Uploaded ${vectorDocs.length} documents`);
}
```

---

## 📝 Sample Documents

### Example 1: Technical Documentation

```json
{
  "content": "React.memo is a higher-order component that prevents unnecessary re-renders by memoizing the result. Use it when a component renders the same output given the same props.",
  "title": "React.memo Optimization",
  "category": "technical",
  "tags": ["react", "performance", "memoization"],
  "source": "react-docs"
}
```

### Example 2: Best Practices

```json
{
  "content": "Always use HTTPS in production. Configure SSL certificates using Let's Encrypt or a trusted CA. Enable HSTS headers with a max-age of at least 1 year.",
  "title": "HTTPS Best Practices",
  "category": "security",
  "tags": ["https", "ssl", "security"],
  "source": "security-guidelines"
}
```

### Example 3: Code Snippets

```json
{
  "content": "To optimize PostgreSQL queries, use EXPLAIN ANALYZE to see execution plans. Add indexes on frequently queried columns. Use connection pooling with pg-pool.",
  "title": "PostgreSQL Query Optimization",
  "category": "database",
  "tags": ["postgresql", "optimization", "performance"],
  "source": "postgres-guide"
}
```

### Example 4: User-Specific Knowledge

```json
{
  "content": "Project XYZ uses microservices architecture with Node.js backend. API Gateway runs on port 3000. Auth service uses JWT tokens with 15-minute expiry.",
  "title": "Project XYZ Architecture",
  "category": "project-specific",
  "tags": ["architecture", "microservices"],
  "userId": "user-123",
  "source": "project-docs"
}
```

---

## 🔍 Query & Retrieval

### How to Query Documents

```typescript
import { ragRetrieverAgent } from './agents/rag-retriever.agent';

// Basic query
const result = await ragRetrieverAgent.retrieve("How to optimize React?", {
  topK: 5,           // Get top 5 results
  minScore: 0.7,     // Only return if similarity > 70%
});

// Query with filtering
const result = await ragRetrieverAgent.retrieve("Database optimization", {
  topK: 3,
  minScore: 0.75,
  filter: {
    category: "database",  // Only search in database docs
    userId: "user-123"     // User-specific docs
  }
});

// Format as context
const context = ragRetrieverAgent.formatContext(result.documents);
// Output:
// [Document 1] (Relevance: 92.3%)
// PostgreSQL query optimization content...
//
// [Document 2] (Relevance: 88.1%)
// Database indexing best practices...
```

### Relevance Scoring

- **0.9 - 1.0**: Excellent match (exact or nearly exact semantic match)
- **0.8 - 0.9**: Very good match (highly relevant)
- **0.7 - 0.8**: Good match (relevant but not perfect)
- **< 0.7**: Poor match (not recommended for retrieval)

Default minimum score: **0.7** (configurable in RAG agent)

---

## 📊 Monitoring & Stats

### Check Index Stats

```bash
# Via API
curl http://localhost:3006/api/documents/stats

# Response:
{
  "success": true,
  "data": {
    "totalVectors": 1234,
    "dimension": 1536,
    "indexFullness": 0.0023
  }
}
```

### Check Individual Documents

```bash
# List all documents (with pagination)
curl http://localhost:3006/api/documents?limit=10&offset=0

# Get specific document
curl http://localhost:3006/api/documents/doc-123
```

### Delete Documents

```bash
# Delete by ID
curl -X DELETE http://localhost:3006/api/documents/doc-123

# Delete by filter
curl -X DELETE http://localhost:3006/api/documents \
  -H "Content-Type: application/json" \
  -d '{ "filter": { "category": "outdated" } }'
```

---

## ⚡ Best Practices

### 1. Document Chunking

**Problem:** Long documents (> 8,000 tokens) don't embed well

**Solution:** Split into smaller chunks

```typescript
function chunkDocument(text: string, maxLength: number = 2000): string[] {
  const sentences = text.split(/[.!?]\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
```

### 2. Metadata Strategy

**DO:**
- Store searchable text in `content` field
- Add structured metadata (category, tags, userId)
- Use consistent field names
- Include timestamps

**DON'T:**
- Store entire HTML/Markdown in metadata (strip formatting first)
- Use random field names (maintain schema)
- Store sensitive data (PII) in metadata

### 3. Batch Uploads

**DO:** Use batch embedding for multiple documents

```typescript
// GOOD: Batch embedding (1 API call)
const embeddingResult = await embeddingService.embedBatch(texts);

// BAD: Individual embedding (N API calls)
for (const text of texts) {
  await embeddingService.embed(text); // Slow and expensive!
}
```

### 4. Caching Strategy

- Embeddings are automatically cached in Redis (default TTL: 1 hour)
- Same content = same embedding (cache hit)
- Saves money and reduces latency

### 5. Multi-Tenant Isolation

```typescript
// Upload user-specific docs
await uploadDocuments({
  documents: [...],
  userId: "user-123"  // Add userId to all docs
});

// Query only user's docs
const result = await ragRetrieverAgent.retrieve(query, {
  filter: { userId: "user-123" }
});
```

---

## 🐛 Troubleshooting

### Error: "No documents returned"

**Causes:**
1. Pinecone index is empty → Run seed script
2. Query is too specific → Lower minScore threshold
3. Wrong category filter → Remove filter or check category names

**Fix:**
```typescript
// Check index stats first
const stats = await vectorStoreService.getStats();
console.log('Total vectors:', stats.totalVectors);

// Try query without filters
const result = await ragRetrieverAgent.retrieve(query, {
  minScore: 0.5,  // Lower threshold
  topK: 10        // Get more results
});
```

### Error: "Embedding failed"

**Causes:**
1. OpenAI API key invalid
2. Rate limit exceeded
3. Text too long (> 8,191 tokens)

**Fix:**
```typescript
// Check text length
if (text.length > 30000) {
  text = text.substring(0, 30000); // Truncate
}

// Or chunk it
const chunks = chunkDocument(text, 2000);
```

### Error: "Pinecone connection failed"

**Causes:**
1. Pinecone API key invalid
2. Index not created
3. Network issue

**Fix:**
```bash
# Check health endpoint
curl http://localhost:3006/health

# Verify Pinecone credentials
cat backend/services/orchestrator-service/.env | grep PINECONE
```

---

## 📈 Performance Tips

### 1. Optimize Query Performance

```typescript
// GOOD: Request only what you need
const result = await ragRetrieverAgent.retrieve(query, {
  topK: 3,          // Fewer results = faster
  minScore: 0.75    // Higher threshold = less processing
});

// BAD: Over-fetching
const result = await ragRetrieverAgent.retrieve(query, {
  topK: 100,        // Too many results
  minScore: 0.5     // Too lenient
});
```

### 2. Use Filters for Speed

```typescript
// Filtering reduces search space
const result = await ragRetrieverAgent.retrieve(query, {
  filter: {
    category: "technical",  // Only search technical docs
    createdAt: { $gte: "2025-01-01" }  // Recent docs only
  }
});
```

### 3. Batch Operations

```typescript
// Upload 100 documents efficiently
const BATCH_SIZE = 20;
for (let i = 0; i < documents.length; i += BATCH_SIZE) {
  const batch = documents.slice(i, i + BATCH_SIZE);
  await uploadBatch(batch);
}
```

---

## 🎯 Use Cases

### 1. Technical Documentation RAG

```typescript
// Upload company docs
await seedDocuments([
  { content: "How to deploy...", category: "deployment" },
  { content: "API authentication...", category: "api" },
  { content: "Database schema...", category: "database" }
]);

// Query for specific info
const context = await ragRetrieverAgent.retrieveAndFormat(
  "How do I deploy the app?",
  { filter: { category: "deployment" } }
);
```

### 2. User Knowledge Base

```typescript
// Each user has their own docs
await uploadDocuments({
  documents: [
    {
      content: "My project uses React and TypeScript",
      title: "Project Tech Stack",
      userId: "user-123"
    }
  ]
});

// Retrieve user-specific context
const result = await ragRetrieverAgent.retrieve(
  "What tech stack am I using?",
  { filter: { userId: "user-123" } }
);
```

### 3. Code Examples Library

```typescript
// Store code snippets
await uploadDocuments({
  documents: [
    {
      content: "async function fetchUser() { ... }",
      title: "Fetch User Example",
      category: "code-snippets",
      tags: ["javascript", "async", "api"]
    }
  ]
});
```

---

## 📚 Next Steps

1. ✅ Run seed script: `npm run seed:docs`
2. ✅ Test retrieval: Query via `/api/upgrade` endpoint
3. ✅ Monitor metrics: Check `/metrics` for RAG stats
4. ✅ Add your own docs: Use API or seed script
5. ✅ Test with real prompts: See if context improves responses

---

## 🔗 Related Files

- **Seed Script**: `scripts/seed-documents.ts`
- **API Endpoints**: `src/routes/document.routes.ts`
- **Sample Data**: `data/sample-docs.json`
- **Embedding Service**: `src/services/embedding.service.ts`
- **Vector Store**: `src/services/vector-store.service.ts`
- **RAG Agent**: `src/agents/rag-retriever.agent.ts`

---

**🎓 Summary:**
- Documents = text content with metadata
- Embeddings = 1536-dimension vectors from OpenAI
- Pinecone = stores vectors for similarity search
- RAG = retrieves relevant docs to enhance prompts
- 3 methods: Seed script, API, Direct code

**Ready to start?** → Run `npm run seed:docs` to populate with sample data!

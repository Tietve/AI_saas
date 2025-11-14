# 🚀 Pinecone Quick Start Guide

> **TL;DR** - 3 bước để thêm documents vào Pinecone
> Last updated: 2025-11-10

---

## ⚡ Quick Commands

```bash
# 1. Seed với sample documents
cd backend/services/orchestrator-service
npm run seed:docs

# 2. Test retrieval via API
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "How to optimize React performance?",
    "userId": "user-123"
  }'

# 3. Check index stats
curl http://localhost:3006/api/documents/stats
```

---

## 📝 Method 1: Seed Script (Fastest for Testing)

### Step 1: Run the seed script

```bash
cd D:\my-saas-chat\backend\services\orchestrator-service
npm run seed:docs
```

**What this does:**
- Loads 30 technical documents from `data/sample-docs.json`
- Generates embeddings using OpenAI
- Uploads to Pinecone
- Tests retrieval with sample queries

**Expected output:**
```
🌱 Starting Pinecone document seeding...
📚 Loaded 30 documents from data/sample-docs.json
🔮 Generating embeddings...
   Processing batch 1/2 (20 documents)...
   ✓ Generated 20 embeddings in 1234ms
📤 Uploading to Pinecone...
   ✓ Upserted 100 vectors in 567ms
✅ Upload complete!
🎉 Seeding completed successfully!
   - Documents loaded: 30
   - Vectors created: 30
   - Total in index: 30
```

### Step 2: Test retrieval

```bash
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "How to optimize React performance?",
    "userId": "user-123"
  }'
```

**Expected:** You should see relevant documents retrieved in the response!

---

## 📤 Method 2: Upload via API

### Upload your own documents

```bash
curl -X POST http://localhost:3006/api/documents/upload \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Your document content here",
        "title": "My Custom Document",
        "category": "custom",
        "tags": ["tutorial", "guide"]
      },
      {
        "content": "Another document...",
        "title": "Second Document"
      }
    ],
    "userId": "user-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadedCount": 2,
    "ids": ["doc-1699999999999-0", "doc-1699999999999-1"],
    "totalTokens": 234,
    "durationMs": 567
  }
}
```

---

## 🔍 Method 3: Search Documents

```bash
# Search all documents
curl -X POST http://localhost:3006/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Database optimization tips",
    "topK": 5
  }'

# Search user-specific documents
curl -X POST http://localhost:3006/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "My project settings",
    "topK": 3,
    "userId": "user-123"
  }'

# Search with category filter
curl -X POST http://localhost:3006/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Security best practices",
    "topK": 5,
    "filter": {
      "category": "security"
    }
  }'
```

---

## 📊 Check Stats

```bash
# Get index statistics
curl http://localhost:3006/api/documents/stats

# Response:
{
  "success": true,
  "data": {
    "totalVectors": 30,
    "dimension": 1536,
    "indexFullness": 0.0001
  }
}
```

---

## 🗑️ Delete Documents

```bash
# Delete by IDs
curl -X DELETE http://localhost:3006/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["doc-123", "doc-456"]
  }'

# Delete by category
curl -X DELETE http://localhost:3006/api/documents/filter \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "category": "outdated"
    }
  }'

# Delete user-specific docs
curl -X DELETE http://localhost:3006/api/documents/filter \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "userId": "user-123"
    }
  }'
```

---

## 🎯 Test Complete RAG Pipeline

### Full upgrade request with RAG

```bash
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "Show me how to use React.memo for optimization",
    "userId": "user-123",
    "ragEnabled": true,
    "maxRagResults": 3
  }' | jq
```

**What happens:**
1. ✅ User prompt is received
2. ✅ PII redaction (removes sensitive data)
3. ✅ Summarization (condenses long prompts)
4. ✅ **RAG retrieval (searches Pinecone for relevant docs)**
5. ✅ Context injection (adds docs to prompt)
6. ✅ Final prompt sent to LLM
7. ✅ Response returned with metrics

**Check the response:**
```json
{
  "success": true,
  "data": {
    "upgradedPrompt": "...",
    "rag": {
      "retrieved": true,
      "documents": [
        {
          "id": "doc-...",
          "content": "React.memo is a higher-order component...",
          "score": 0.92,
          "title": "React.memo Optimization"
        }
      ],
      "totalRetrieved": 3,
      "latencyMs": 234
    }
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "No documents returned"

```bash
# Check if index is empty
curl http://localhost:3006/api/documents/stats

# If totalVectors = 0, run seed script:
npm run seed:docs
```

### Issue: "OpenAI API key invalid"

```bash
# Check .env file
cat backend/services/orchestrator-service/.env | grep OPENAI_API_KEY

# If empty, add your key:
OPENAI_API_KEY=sk-...
```

### Issue: "Pinecone connection failed"

```bash
# Check Pinecone credentials
cat backend/services/orchestrator-service/.env | grep PINECONE

# Verify:
PINECONE_API_KEY=your-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=prompt-upgrader
```

### Issue: "Relevance score too low"

```bash
# Lower the threshold (default 0.7)
curl -X POST http://localhost:3006/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Your query",
    "topK": 10,
    "minScore": 0.5
  }'
```

---

## 📚 Sample Documents Topics

The seed script includes documents about:

- ✅ React optimization (React.memo, useMemo)
- ✅ Database indexing & query optimization
- ✅ Redis caching strategies
- ✅ JWT authentication & security
- ✅ HTTPS/SSL/TLS best practices
- ✅ TypeScript strict mode
- ✅ Express.js error handling
- ✅ Prisma ORM patterns
- ✅ Docker containerization
- ✅ Rate limiting & API security
- ✅ Microservices architecture
- ✅ Git workflow
- ✅ Environment variables
- ✅ REST API design
- ✅ Socket.io real-time features
- ✅ Testing strategies
- ✅ Logging best practices
- ✅ CORS configuration
- ✅ Input validation
- ✅ Caching patterns
- ✅ Circuit breaker pattern
- ✅ Monitoring & observability
- ✅ Graceful shutdown
- ✅ Code review practices
- ✅ Database migrations
- ✅ API pagination

---

## 🎓 Next Steps

1. ✅ **Start here:** `npm run seed:docs`
2. ✅ **Test RAG:** Make an upgrade request with RAG enabled
3. ✅ **Check metrics:** Visit `http://localhost:3006/metrics`
4. ✅ **Add your docs:** Use the upload API
5. ✅ **Read full guide:** See `PINECONE_GUIDE.md`

---

## 📖 Documentation

- **Full Guide:** `PINECONE_GUIDE.md` - Complete documentation
- **Sample Data:** `data/sample-docs.json` - 30 sample documents
- **Seed Script:** `scripts/seed-documents.ts` - Upload automation
- **API Endpoints:** `src/routes/document.routes.ts` - REST API

---

## 💡 Pro Tips

### Tip 1: Batch uploads are faster

```javascript
// ❌ BAD: Individual uploads
for (const doc of documents) {
  await uploadOne(doc);
}

// ✅ GOOD: Batch upload
await uploadBatch(documents);
```

### Tip 2: Use filters for multi-tenant

```bash
# Upload with userId
curl -X POST http://localhost:3006/api/documents/upload \
  -d '{"documents": [...], "userId": "user-123"}'

# Search only user's docs
curl -X POST http://localhost:3006/api/documents/search \
  -d '{"query": "...", "userId": "user-123"}'
```

### Tip 3: Monitor embeddings cost

```bash
# Each embedding call costs tokens
# 30 documents ≈ 10,000 tokens ≈ $0.001 USD

# Check usage in response:
{
  "totalTokens": 9876,
  "cacheHits": 5,    // Saved money
  "cacheMisses": 25  // Paid for these
}
```

---

**🎉 That's it! You're ready to use Pinecone RAG!**

Run `npm run seed:docs` now to get started! 🚀

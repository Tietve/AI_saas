# Phase 1: Infrastructure Setup

**Phase:** 1 of 3
**Dates:** Week 1 (Nov 13-19, 2025)
**Priority:** Critical
**Status:** Not Started

---

## Context

**Research Reports:**
- [pgvector Setup](./research/researcher-01-pgvector-setup.md)
- [OpenAI Embeddings](./research/researcher-02-openai-embeddings.md)
- [File Storage](./research/researcher-05-file-storage.md)

**Scout Report:**
- [Chat Service Structure](./scout/scout-01-chat-service-structure.md)

---

## Overview

Setup foundational infrastructure for PDF Q&A system including vector database, cloud storage, and database schema extensions.

**Scope:**
- PostgreSQL pgvector extension installation
- Cloudflare R2 bucket configuration
- Prisma schema updates (Document + DocumentChunk models)
- Vector indexes creation (HNSW)
- Dependencies installation

**Non-Scope:**
- PDF processing logic (Phase 2)
- API endpoints (Phase 2)
- Cost monitoring (Phase 3)

---

## Key Insights from Research

**pgvector (researcher-01):**
- Use ankane/pgvector Docker image (pre-configured)
- Enable extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Vector dimension: 1536 (matches OpenAI text-embedding-3-small)
- Index type: HNSW (225% faster than IVFFlat for concurrent ops)
- Distance metric: Cosine similarity (`<=>` operator)

**OpenAI Embeddings (researcher-02):**
- Model: text-embedding-3-small ($0.02/1M tokens)
- Max tokens per request: 8,191
- Batch API: 50% savings (24-48h turnaround, use for bulk processing)
- Rate limit: 350K TPM (tokens per minute)

**Cloudflare R2 (researcher-05):**
- Zero egress fees (98% savings vs S3)
- S3-compatible API (drop-in replacement)
- Free tier: 10GB storage, 10M reads/month
- Lifecycle policies for auto-deletion

---

## Requirements

### 1. PostgreSQL with pgvector

**Setup:**
```bash
# Update docker-compose.yml
version: '3.8'
services:
  postgres:
    image: ankane/pgvector:latest  # Instead of postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: chat_service
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Verification:**
```sql
-- Run after container start
CREATE EXTENSION IF NOT EXISTS vector;
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Cloudflare R2 Bucket

**Configuration:**
- Bucket name: `my-saas-chat-pdfs`
- Region: Auto (global)
- CORS: Allow chat-service origin
- Lifecycle policy: Delete temp files after 7 days

**Credentials:**
```env
# Add to backend/services/chat-service/.env
CF_ACCOUNT_ID=your_account_id
CF_ACCESS_KEY_ID=your_r2_access_key
CF_SECRET_ACCESS_KEY=your_r2_secret_key
PDF_BUCKET_NAME=my-saas-chat-pdfs
PDF_MAX_SIZE=10485760  # 10MB in bytes
```

**Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "ID": "DeleteTempPDFs",
      "Status": "Enabled",
      "Filter": { "Prefix": "temp/" },
      "Expiration": { "Days": 7 }
    }
  ]
}
```

### 3. Prisma Schema Extensions

**File:** `backend/services/chat-service/prisma/schema.prisma`

**Add Extensions:**
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [vector]
}
```

**New Models:**
```prisma
model Document {
  id             String    @id @default(cuid())
  userId         String
  title          String    @db.VarChar(255)
  fileName       String    @db.VarChar(255)
  contentType    String    @default("application/pdf")
  fileSize       Int
  pageCount      Int?
  storageKey     String    // R2 object key
  status         DocumentStatus @default(PROCESSING)
  errorMessage   String?   @db.Text
  chunks         DocumentChunk[]
  uploadedAt     DateTime  @default(now())
  processedAt    DateTime?
  deletedAt      DateTime?

  @@index([userId, uploadedAt])
  @@index([status])
  @@map("documents")
}

model DocumentChunk {
  id             String    @id @default(cuid())
  documentId     String
  document       Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content        String    @db.Text
  chunkIndex     Int
  pageNumber     Int?
  tokens         Int
  // Vector column for pgvector (1536 dimensions for OpenAI)
  embedding      Unsupported("vector(1536)")?
  createdAt      DateTime  @default(now())

  @@index([documentId, chunkIndex])
  @@map("document_chunks")
}

enum DocumentStatus {
  PROCESSING
  COMPLETED
  FAILED
}
```

### 4. Vector Indexes

**Create after migration:**
```sql
-- HNSW index for cosine similarity (optimal for OpenAI embeddings)
CREATE INDEX idx_document_chunks_embedding_hnsw
ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Tune query performance (run at session level)
SET hnsw.ef_search = 100;  -- Higher = better recall, slower
```

**Index Parameters:**
- `m = 16`: Connections per layer (good balance)
- `ef_construction = 64`: Build-time quality (default)
- `hnsw.ef_search = 100`: Query-time recall (tune based on performance tests)

### 5. Dependencies

**Install:**
```bash
cd backend/services/chat-service
npm install --save \
  pdf-parse \
  @aws-sdk/client-s3 \
  @aws-sdk/s3-request-presigner \
  js-tiktoken
```

**Package Purposes:**
- `pdf-parse`: Fast PDF text extraction
- `@aws-sdk/client-s3`: S3-compatible R2 client
- `@aws-sdk/s3-request-presigner`: Generate signed URLs for uploads
- `js-tiktoken`: Token counting for OpenAI models

---

## Architecture Decisions

### 1. Vector Database: pgvector (Not Pinecone)

**Rationale:**
- Zero additional cost (uses existing PostgreSQL)
- Simple deployment (Docker extension)
- Co-located with application data (no network latency)
- Sufficient performance for <100K documents

**Trade-off:** Scales to ~1M vectors before needing sharding

### 2. Storage: Cloudflare R2 (Not AWS S3)

**Rationale:**
- Zero egress fees (huge savings for download-heavy workloads)
- S3-compatible API (easy migration if needed)
- 10GB free tier (enough for MVP)

**Trade-off:** Less mature than S3, fewer integrations

### 3. Embedding Model: text-embedding-3-small

**Rationale:**
- Low cost ($0.02/1M tokens vs $0.13 for 3-large)
- Fast inference (~0.03µs latency)
- 1536 dimensions (good balance of quality + size)

**Trade-off:** Slightly lower accuracy than 3-large (acceptable for MVP)

### 4. Index: HNSW (Not IVFFlat)

**Rationale:**
- 225% faster with concurrent inserts
- Better query speed (<200ms for 100K vectors)
- Production-ready (battle-tested)

**Trade-off:** Larger index size (~40% more disk space)

---

## Implementation Steps

### Step 1: Update Docker Configuration
```bash
# 1. Backup existing database
cd backend/services/chat-service
npm run db:backup  # Custom script needed

# 2. Update docker-compose.yml with pgvector image
# 3. Restart PostgreSQL container
docker-compose down postgres
docker-compose up -d postgres

# 4. Verify pgvector extension
docker exec -it postgres psql -U postgres -d chat_service -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 2: Configure Cloudflare R2
```bash
# 1. Login to Cloudflare dashboard
# 2. Create R2 bucket: my-saas-chat-pdfs
# 3. Generate API token with R2 permissions
# 4. Add credentials to .env
# 5. Test connection with AWS SDK
```

### Step 3: Update Prisma Schema
```bash
# 1. Edit prisma/schema.prisma (add extensions, models)
# 2. Generate migration
npx prisma migrate dev --name add_document_models

# 3. Apply migration
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Verify schema
npx prisma db pull
```

### Step 4: Create Vector Indexes
```bash
# Run SQL directly (Prisma doesn't support CREATE INDEX for vectors yet)
docker exec -it postgres psql -U postgres -d chat_service << EOF
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Verify index
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'document_chunks';
EOF
```

### Step 5: Install Dependencies
```bash
cd backend/services/chat-service
npm install --save pdf-parse @aws-sdk/client-s3 @aws-sdk/s3-request-presigner js-tiktoken
npm install --save-dev @types/pdf-parse

# Verify installation
npm list pdf-parse @aws-sdk/client-s3 js-tiktoken
```

### Step 6: Configuration Files
```bash
# 1. Update backend/services/chat-service/src/config/env.ts
# 2. Add R2 credentials validation
# 3. Add PDF size limits
# 4. Update TypeScript types
```

---

## Todo List

- [ ] Backup existing PostgreSQL database
- [ ] Update docker-compose.yml with ankane/pgvector image
- [ ] Restart PostgreSQL container
- [ ] Enable pgvector extension (`CREATE EXTENSION vector`)
- [ ] Create Cloudflare R2 bucket (my-saas-chat-pdfs)
- [ ] Generate R2 API credentials
- [ ] Add R2 credentials to .env file
- [ ] Configure R2 CORS policy
- [ ] Set R2 lifecycle policy (delete temp/ after 7 days)
- [ ] Update Prisma schema with extensions and models
- [ ] Run Prisma migration (`npx prisma migrate dev`)
- [ ] Create HNSW vector index manually
- [ ] Verify index creation with pg_indexes query
- [ ] Install npm dependencies (pdf-parse, AWS SDK, tiktoken)
- [ ] Update src/config/env.ts with new variables
- [ ] Create R2 client configuration file
- [ ] Test R2 upload with presigned URL
- [ ] Test vector similarity query (dummy data)
- [ ] Document infrastructure setup in README
- [ ] Create rollback plan for migration

---

## Success Criteria

**Infrastructure Operational:**
- [ ] pgvector extension enabled and queryable
- [ ] HNSW index created (verify with `\d+ document_chunks`)
- [ ] R2 bucket accessible (test upload + download)
- [ ] Prisma client generates without errors
- [ ] All dependencies installed (no warnings)

**Performance Benchmarks:**
- [ ] Vector similarity search <200ms for 1K chunks
- [ ] R2 presigned URL generation <50ms
- [ ] Database connection pool stable (no timeouts)

**Configuration Valid:**
- [ ] .env has all required variables
- [ ] R2 credentials work (test with AWS SDK)
- [ ] Database migrations applied successfully
- [ ] No console errors on service startup

---

## Risk Assessment

**High Risk:**
- **Database migration fails:** Corrupts existing data
  - **Mitigation:** Full backup before migration + test on staging DB first

**Medium Risk:**
- **pgvector installation issues:** Docker image incompatibility
  - **Mitigation:** Use official ankane/pgvector image (tested)
- **R2 credential errors:** Invalid API keys
  - **Mitigation:** Test credentials with simple GET/PUT before integration

**Low Risk:**
- **Index creation slow:** HNSW build time for large datasets
  - **Mitigation:** Create index AFTER initial data load (not in migration)

---

## Security Considerations

**Database:**
- [ ] Vector data isolated per user (enforce userId in queries)
- [ ] No raw SQL injection points (use Prisma parameterized queries)
- [ ] Database credentials rotated after setup

**Storage:**
- [ ] R2 presigned URLs expire after 1 hour
- [ ] Bucket is private (no public access)
- [ ] User can only access own documents (verify userId ownership)

**Configuration:**
- [ ] .env file excluded from git (.gitignore verified)
- [ ] R2 credentials use least-privilege IAM policy
- [ ] Secrets stored in environment variables (never hardcoded)

---

**Phase 1 Deliverables:**
1. PostgreSQL with pgvector operational
2. Cloudflare R2 bucket configured
3. Prisma schema updated and migrated
4. Vector indexes created
5. All dependencies installed and verified

**Next Phase:** [Phase 2: Core Implementation](./phase-02-core-implementation.md)

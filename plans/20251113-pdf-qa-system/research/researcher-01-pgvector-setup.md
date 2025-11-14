# pgvector Setup for Semantic Search in PostgreSQL

## 1. Installation Steps

### PostgreSQL Extension Setup
```bash
# Linux/Mac: Install from source
git clone --branch v0.8.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install

# Or use package managers:
# Debian/Ubuntu: apt install postgresql-contrib-pgvector
# RPM: yum install pgvector
```

### Docker (Recommended)
```dockerfile
FROM ankane/pgvector:latest
# Pre-installed with PostgreSQL + pgvector
```

### Enable Extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
-- Run for each database that needs vector search
```

---

## 2. Prisma Schema Configuration

### Enable Vector Support
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

### Define Vector Columns (1536 for OpenAI)
```prisma
model Document {
  id        Int     @id @default(autoincrement())
  title     String
  content   String
  // 1536 dimensions for OpenAI text-embedding-3-small
  embedding Unsupported("vector(1536)")?
  createdAt DateTime @default(now())
}

model ChatMessage {
  id           Int     @id @default(autoincrement())
  chatId       Int
  content      String
  // Store embeddings for semantic search
  contentEmbedding Unsupported("vector(1536)")?
  createdAt    DateTime @default(now())
}
```

---

## 3. Vector Operations

### Distance Metrics

| Operator | Function | Use Case |
|----------|----------|----------|
| `<->` | Euclidean (L2) | General similarity, balanced accuracy |
| `<=>` | Cosine Distance | NLP, angle-based similarity |
| `<#>` | Negative Inner Product | Maximum dot product |
| `<+>` | Manhattan (L1) | Alternative metric |

### Raw Query Examples
```typescript
// Cosine similarity search (recommended for text embeddings)
const results = await prisma.$queryRaw`
  SELECT id, title, content,
    1 - (embedding <=> $1::vector) as similarity
  FROM Document
  WHERE (embedding <=> $1::vector) < 0.3
  ORDER BY embedding <=> $1::vector
  LIMIT 10
`;

// Euclidean distance
const results = await prisma.$queryRaw`
  SELECT id, title,
    embedding <-> $1::vector as distance
  FROM Document
  ORDER BY embedding <-> $1::vector
  LIMIT 5
`;

// Insert embeddings
const embedding = [0.1, 0.2, ...]; // 1536 dimensions
await prisma.$executeRaw`
  UPDATE Document SET embedding = $1::vector
  WHERE id = $2
` , [embedding, docId];
```

---

## 4. Index Creation for Performance

### HNSW Index (Recommended for Read-Heavy)
```sql
-- Create HNSW index for cosine distance
CREATE INDEX idx_document_embedding_hnsw
ON Document USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Tune parameters:
-- m: connections per layer (16 default, higher = better quality, slower build)
-- ef_construction: construction-time dynamic list (64 default)
```

### IVFFlat Index (For Memory-Constrained)
```sql
-- Faster build, more memory efficient, slightly lower accuracy
CREATE INDEX idx_document_embedding_ivfflat
ON Document USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);

-- lists: number of clusters (tune based on dataset size)
```

### Prisma Migration
```prisma
/// Add this to your migration file
migration.raw(`
  CREATE INDEX idx_document_embedding_hnsw
  ON Document USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
`)
```

---

## 5. Embedding Dimensions Best Practices

### OpenAI Models
- **text-embedding-3-small**: 1536 dimensions (default) ✅ **Recommended**
- **text-embedding-3-large**: 3072 dimensions
- **text-embedding-ada-002**: 1536 dimensions

### Schema Rules
```typescript
// CRITICAL: Vector dimension must match exactly
vector(1536)  // Fixed, immutable

// Generate embeddings from OpenAI
import { openai } from '@openai/api';

const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Your text here',
  encoding_format: 'float',
});
// Returns: vector of exactly 1536 values
```

### Dimension Sizing
- **Small vectors (384-768)**: Fast, low memory, reduced accuracy
- **Standard (1536)**: OpenAI default, optimal for most use cases
- **Large (3072)**: Higher quality, 2x memory/storage cost

---

## 6. Semantic Search Query Patterns

### Basic Semantic Search
```typescript
async function semanticSearch(query: string, limit = 10) {
  const embedding = await generateEmbedding(query);

  const results = await prisma.$queryRaw`
    SELECT
      id, title, content,
      ROUND((1 - (embedding <=> $1::vector))::numeric, 4) as relevance
    FROM Document
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT ${limit}
  `, [embedding];

  return results;
}
```

### Hybrid Search (Vector + Full-Text)
```typescript
async function hybridSearch(query: string) {
  const embedding = await generateEmbedding(query);

  return await prisma.$queryRaw`
    SELECT
      id, title, content,
      (1 - (embedding <=> $1::vector)) as vector_score,
      ts_rank(to_tsvector(content), plainto_tsquery($2)) as text_score
    FROM Document
    WHERE
      embedding IS NOT NULL
      AND (embedding <=> $1::vector) < 0.3
    ORDER BY
      (0.7 * (1 - (embedding <=> $1::vector))) +
      (0.3 * ts_rank(to_tsvector(content), plainto_tsquery($2))) DESC
    LIMIT 10
  `, [embedding, query];
}
```

### Threshold-Based Search
```typescript
// Return only highly relevant results
const results = await prisma.$queryRaw`
  SELECT * FROM Document
  WHERE embedding IS NOT NULL
    AND (embedding <=> $1::vector) < 0.2  -- Only cosine distance < 0.2
  ORDER BY embedding <=> $1::vector
  LIMIT 5
`;
```

---

## 7. Performance Optimization Checklist

### Index Selection
- ✅ Use **HNSW** for production (better query speed, ~225% faster with concurrent inserts)
- ⚠️ Use **IVFFlat** if memory-constrained (<4GB available)

### Tuning Parameters
```sql
-- After index creation, tune query performance
SET hnsw.ef_search = 100;  -- Higher = better recall, slower queries

-- For IVFFlat
SET ivfflat.probes = 10;   -- Number of clusters to probe
```

### Monitoring
```sql
-- Check index size
SELECT pg_size_pretty(pg_relation_size('idx_document_embedding_hnsw'));

-- Monitor slow queries
EXPLAIN ANALYZE
SELECT * FROM Document
WHERE embedding <=> $1::vector < 0.3;
```

---

## References

- [pgvector GitHub](https://github.com/pgvector/pgvector) - Official repository
- [Prisma PostgreSQL Extensions](https://www.prisma.io/docs/postgres/database/postgres-extensions)
- [AWS: HNSW vs IVFFlat](https://aws.amazon.com/blogs/database/optimize-generative-ai-applications-with-pgvector-indexing-a-deep-dive-into-ivfflat-and-hnsw-techniques/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Neon: HNSW Index Performance](https://neon.com/blog/understanding-vector-search-and-hnsw-index-with-pgvector)

---

## Implementation Roadmap for my-saas-chat

1. **Phase 1**: Enable pgvector extension in Docker PostgreSQL
2. **Phase 2**: Update Prisma schema with vector columns (1536 dims)
3. **Phase 3**: Create HNSW indexes for documents/chat messages
4. **Phase 4**: Implement semantic search service with OpenAI embeddings
5. **Phase 5**: Integrate hybrid search (vector + full-text) into chat
6. **Phase 6**: Monitor performance and tune index parameters

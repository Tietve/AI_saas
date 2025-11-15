-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index on knowledge_chunks for fast similarity search
-- HNSW (Hierarchical Navigable Small World) is optimized for high-dimensional vectors
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
ON knowledge_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create HNSW index on document_chunks for fast similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create HNSW index on conversation_summary for fast similarity search
CREATE INDEX IF NOT EXISTS idx_conversation_summary_embedding_hnsw
ON "ConversationSummary"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Performance tuning for pgvector
-- These settings optimize for vector operations
ALTER DATABASE CURRENT SET max_parallel_workers_per_gather = 4;
ALTER DATABASE CURRENT SET maintenance_work_mem = '256MB';

-- Comments explaining the indexes
COMMENT ON INDEX idx_knowledge_chunks_embedding_hnsw IS 'HNSW index for fast cosine similarity search on knowledge chunks. m=16 controls graph connectivity, ef_construction=64 balances build time vs search quality.';
COMMENT ON INDEX idx_document_chunks_embedding_hnsw IS 'HNSW index for fast cosine similarity search on document chunks. m=16 controls graph connectivity, ef_construction=64 balances build time vs search quality.';
COMMENT ON INDEX idx_conversation_summary_embedding_hnsw IS 'HNSW index for fast cosine similarity search on conversation summaries. m=16 controls graph connectivity, ef_construction=64 balances build time vs search quality.';

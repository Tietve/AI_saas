export interface VectorDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export interface VectorSearchOptions {
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
  userId?: string;
  documentId?: string;
  knowledgeBaseId?: string;
  minSimilarity?: number;
}

export interface VectorUpsertResult {
  upsertedCount: number;
  ids: string[];
}

export interface VectorStats {
  totalVectors: number;
  dimension: number;
  indexFullness: number;
  indexes?: string[]; // List of HNSW indexes
}

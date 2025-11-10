export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
  cached: boolean;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface EmbeddingOptions {
  model?: string;
  useCache?: boolean;
  cacheTTL?: number;
}

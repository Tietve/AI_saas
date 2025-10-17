/**
 * Semantic Cache with OpenAI Embeddings
 *
 * Uses vector embeddings to find semantically similar queries
 * and return cached responses, reducing AI costs and latency.
 *
 * Features:
 * - OpenAI text-embedding-3-small (62% cheaper than ada-002)
 * - Cosine similarity for matching
 * - Redis for storage
 * - Configurable similarity threshold
 * - TTL-based expiration
 *
 * Architecture:
 * 1. Generate embedding for query
 * 2. Search Redis for similar embeddings
 * 3. Calculate cosine similarity
 * 4. Return cached response if similarity > threshold
 * 5. Cache new responses with embeddings
 */

import { Redis } from '@upstash/redis'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

// Types
export interface CachedResponse {
  query: string
  response: string
  embedding: number[]
  model: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface SemanticCacheOptions {
  similarityThreshold?: number // Default: 0.95 (95% similarity)
  ttl?: number // Time to live in seconds (default: 3600 = 1 hour)
  maxResults?: number // Max similar results to check (default: 10)
  embeddingModel?: string // Default: text-embedding-3-small
}

export class SemanticCache {
  private redis: Redis
  private openai: OpenAI
  private similarityThreshold: number
  private ttl: number
  private maxResults: number
  private embeddingModel: string
  private embeddingDimensions = 1536 // text-embedding-3-small

  constructor(
    redisUrl: string,
    redisToken: string,
    openaiApiKey: string,
    options: SemanticCacheOptions = {}
  ) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    })

    this.similarityThreshold = options.similarityThreshold ?? 0.95
    this.ttl = options.ttl ?? 3600
    this.maxResults = options.maxResults ?? 10
    this.embeddingModel = options.embeddingModel ?? 'text-embedding-3-small'
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const startTime = Date.now()

      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
        dimensions: this.embeddingDimensions,
      })

      const embedding = response.data[0].embedding
      const duration = Date.now() - startTime

      logger.debug(
        {
          model: this.embeddingModel,
          dimensions: embedding.length,
          duration,
          usage: response.usage,
        },
        'Generated embedding'
      )

      return embedding
    } catch (error) {
      logger.error({ err: error }, 'Failed to generate embedding')
      throw error
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   *
   * Cosine similarity = (A · B) / (||A|| * ||B||)
   * Range: -1 to 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions')
    }

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)

    if (magnitude === 0) {
      return 0
    }

    return dotProduct / magnitude
  }

  /**
   * Search for semantically similar cached queries
   */
  async findSimilar(query: string, model: string): Promise<CachedResponse | null> {
    try {
      const startTime = Date.now()
      const normalizedQuery = query.toLowerCase().trim()

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(normalizedQuery)

      // Get all cache keys for this model
      const pattern = `semantic_cache:${model}:*`
      const keys = await this.redis.keys(pattern)

      if (keys.length === 0) {
        logger.debug({ model }, 'No cached entries found')
        return null
      }

      // Limit search to maxResults most recent entries
      const keysToCheck = keys.slice(0, this.maxResults)

      // Find best match
      let bestMatch: CachedResponse | null = null
      let bestSimilarity = 0

      for (const key of keysToCheck) {
        const cached = await this.redis.get<CachedResponse>(key)

        if (!cached || !cached.embedding) {
          continue
        }

        const similarity = this.cosineSimilarity(queryEmbedding, cached.embedding)

        if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
          bestSimilarity = similarity
          bestMatch = cached
        }
      }

      const duration = Date.now() - startTime

      if (bestMatch) {
        logger.info(
          {
            similarity: bestSimilarity.toFixed(4),
            threshold: this.similarityThreshold,
            duration,
            cachedQuery: bestMatch.query.substring(0, 50),
          },
          'Semantic cache HIT'
        )

        return bestMatch
      }

      logger.debug(
        {
          bestSimilarity: bestSimilarity.toFixed(4),
          threshold: this.similarityThreshold,
          duration,
          keysChecked: keysToCheck.length,
        },
        'Semantic cache MISS'
      )

      return null
    } catch (error) {
      logger.error({ err: error }, 'Semantic cache search failed')
      // Don't throw - cache failures shouldn't break the application
      return null
    }
  }

  /**
   * Store response in cache with embedding
   */
  async set(params: {
    query: string
    response: string
    model: string
    tokensIn: number
    tokensOut: number
    costUsd: number
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      const { query, response, model, tokensIn, tokensOut, costUsd, metadata } = params

      // Normalize query
      const normalizedQuery = query.toLowerCase().trim()

      // Generate embedding
      const embedding = await this.generateEmbedding(normalizedQuery)

      // Create cache entry
      const cached: CachedResponse = {
        query: normalizedQuery,
        response,
        embedding,
        model,
        tokensIn,
        tokensOut,
        costUsd,
        createdAt: new Date().toISOString(),
        metadata,
      }

      // Generate unique key
      const timestamp = Date.now()
      const key = `semantic_cache:${model}:${timestamp}`

      // Store in Redis with TTL
      await this.redis.setex(key, this.ttl, cached)

      logger.debug(
        {
          key,
          ttl: this.ttl,
          queryLength: normalizedQuery.length,
          responseLength: response.length,
          embeddingDimensions: embedding.length,
        },
        'Stored in semantic cache'
      )
    } catch (error) {
      logger.error({ err: error }, 'Failed to store in semantic cache')
      // Don't throw - cache failures shouldn't break the application
    }
  }

  /**
   * Clear all cached entries for a model
   */
  async clearModel(model: string): Promise<number> {
    try {
      const pattern = `semantic_cache:${model}:*`
      const keys = await this.redis.keys(pattern)

      if (keys.length === 0) {
        return 0
      }

      await this.redis.del(...keys)

      logger.info({ model, count: keys.length }, 'Cleared semantic cache for model')

      return keys.length
    } catch (error) {
      logger.error({ err: error, model }, 'Failed to clear semantic cache')
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(model?: string): Promise<{
    totalEntries: number
    models: Record<string, number>
    oldestEntry?: string
    newestEntry?: string
  }> {
    try {
      const pattern = model ? `semantic_cache:${model}:*` : 'semantic_cache:*'
      const keys = await this.redis.keys(pattern)

      const stats: Record<string, number> = {}

      for (const key of keys) {
        const parts = key.split(':')
        const modelName = parts[1]

        stats[modelName] = (stats[modelName] || 0) + 1
      }

      // Extract timestamps for oldest/newest
      const timestamps = keys.map((key) => {
        const parts = key.split(':')
        return parseInt(parts[2], 10)
      })

      return {
        totalEntries: keys.length,
        models: stats,
        oldestEntry: timestamps.length
          ? new Date(Math.min(...timestamps)).toISOString()
          : undefined,
        newestEntry: timestamps.length
          ? new Date(Math.max(...timestamps)).toISOString()
          : undefined,
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to get cache stats')
      return {
        totalEntries: 0,
        models: {},
      }
    }
  }
}

/**
 * Create singleton instance
 */
let semanticCacheInstance: SemanticCache | null = null

export function getSemanticCache(): SemanticCache | null {
  if (semanticCacheInstance) {
    return semanticCacheInstance
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!redisUrl || !redisToken) {
    logger.warn('Redis credentials not configured - semantic cache disabled')
    return null
  }

  if (!openaiApiKey) {
    logger.warn('OpenAI API key not configured - semantic cache disabled')
    return null
  }

  try {
    semanticCacheInstance = new SemanticCache(redisUrl, redisToken, openaiApiKey, {
      similarityThreshold: parseFloat(process.env.SEMANTIC_CACHE_THRESHOLD || '0.95'),
      ttl: parseInt(process.env.SEMANTIC_CACHE_TTL || '3600', 10),
      maxResults: parseInt(process.env.SEMANTIC_CACHE_MAX_RESULTS || '10', 10),
    })

    logger.info('Semantic cache initialized')

    return semanticCacheInstance
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize semantic cache')
    return null
  }
}

/**
 * Helper function to generate embeddings (exported for other uses)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const openai = new OpenAI({ apiKey: openaiApiKey })

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  })

  return response.data[0].embedding
}
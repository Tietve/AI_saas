import crypto from 'crypto';
import { redisCache } from '../../../../shared/cache/redis.client';
import { CACHE_TTL, CACHE_PREFIX } from '../../../../shared/cache/cache.config';

export interface CachedOpenAIResponse {
  response: any;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  cachedAt: number;
  cacheHit: boolean;
}

/**
 * OpenAI Response Caching Service
 * Caches responses based on message content hash to reduce API costs
 */
export class OpenAICacheService {
  /**
   * Generate a cache key based on messages and model
   */
  private generateCacheKey(messages: any[], model: string): string {
    // Create a hash of the messages array to use as cache key
    const messagesStr = JSON.stringify(messages);
    const hash = crypto.createHash('sha256').update(messagesStr).digest('hex');

    return `${CACHE_PREFIX.OPENAI}:${model}:${hash}`;
  }

  /**
   * Try to get cached response for identical prompts
   */
  async getCachedResponse(
    messages: any[],
    model: string
  ): Promise<CachedOpenAIResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(messages, model);
      const cached = await redisCache.get<CachedOpenAIResponse>(cacheKey);

      if (cached) {
        console.log(`[OpenAI Cache] Cache HIT for model ${model}`);
        return {
          ...cached,
          cacheHit: true,
        };
      }

      console.log(`[OpenAI Cache] Cache MISS for model ${model}`);
      return null;
    } catch (error) {
      console.error('[OpenAI Cache] Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache an OpenAI response
   */
  async cacheResponse(
    messages: any[],
    model: string,
    response: any,
    tokens: { prompt: number; completion: number; total: number }
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(messages, model);

      const cacheData: CachedOpenAIResponse = {
        response,
        tokens,
        model,
        cachedAt: Date.now(),
        cacheHit: false,
      };

      await redisCache.set(cacheKey, cacheData, {
        ttl: CACHE_TTL.OPENAI_RESPONSE,
      });

      console.log(`[OpenAI Cache] Cached response for model ${model}`);
    } catch (error) {
      console.error('[OpenAI Cache] Error caching response:', error);
    }
  }

  /**
   * Clear all cached responses for a specific model
   */
  async clearModelCache(model: string): Promise<number> {
    try {
      const pattern = `${CACHE_PREFIX.OPENAI}:${model}:*`;
      const deleted = await redisCache.delPattern(pattern);

      console.log(`[OpenAI Cache] Cleared ${deleted} cached responses for model ${model}`);
      return deleted;
    } catch (error) {
      console.error('[OpenAI Cache] Error clearing model cache:', error);
      return 0;
    }
  }

  /**
   * Clear all OpenAI cached responses
   */
  async clearAllCache(): Promise<number> {
    try {
      const pattern = `${CACHE_PREFIX.OPENAI}:*`;
      const deleted = await redisCache.delPattern(pattern);

      console.log(`[OpenAI Cache] Cleared ${deleted} total cached responses`);
      return deleted;
    } catch (error) {
      console.error('[OpenAI Cache] Error clearing all cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    cacheKeys: string[];
  }> {
    try {
      const pattern = `${CACHE_PREFIX.OPENAI}:*`;
      const keys = await redisCache.getClient().keys(pattern);

      return {
        totalCached: keys.length,
        cacheKeys: keys,
      };
    } catch (error) {
      console.error('[OpenAI Cache] Error getting cache stats:', error);
      return {
        totalCached: 0,
        cacheKeys: [],
      };
    }
  }
}

export const openaiCacheService = new OpenAICacheService();

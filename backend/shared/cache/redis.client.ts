import IORedis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Centralized Redis client for caching across all services
 * Provides connection pooling, retry logic, and standardized caching methods
 */
class RedisClient {
  private client: IORedis;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (redisUrl) {
      // Use Redis URL if provided (Upstash or connection string)
      this.client = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });
    } else {
      // Use individual config values
      this.client = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });
    }

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('[Redis] Connected to Redis server');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      console.error('[Redis] Connection error:', err.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('[Redis] Connection closed');
    });
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.client.get(fullKey);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[Redis] Get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await this.client.setex(fullKey, options.ttl, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      console.error('[Redis] Set error:', error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error('[Redis] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('[Redis] Delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch and store
    const value = await fetcher();
    await this.set(key, value, options);

    return value;
  }

  /**
   * Hash operations - get field from hash
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error('[Redis] HGET error:', error);
      return null;
    }
  }

  /**
   * Hash operations - set field in hash
   */
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('[Redis] HSET error:', error);
      return false;
    }
  }

  /**
   * Hash operations - get all fields from hash
   */
  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    try {
      const data = await this.client.hgetall(key);
      return data as T;
    } catch (error) {
      console.error('[Redis] HGETALL error:', error);
      return null;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.client.expire(fullKey, seconds);
      return true;
    } catch (error) {
      console.error('[Redis] Expire error:', error);
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.incr(fullKey);
    } catch (error) {
      console.error('[Redis] Incr error:', error);
      return 0;
    }
  }

  /**
   * Increment a counter by amount
   */
  async incrby(key: string, amount: number, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.incrby(fullKey, amount);
    } catch (error) {
      console.error('[Redis] Incrby error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('[Redis] Exists error:', error);
      return false;
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.ttl(fullKey);
    } catch (error) {
      console.error('[Redis] TTL error:', error);
      return -1;
    }
  }

  /**
   * Build full key with optional prefix
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): IORedis {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  /**
   * Close the Redis connection
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

// Export singleton instance
export const redisCache = new RedisClient();

// Export class for testing
export { RedisClient };

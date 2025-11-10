import Redis from 'ioredis';
import { env } from './env.config';

// Create Redis client
// For Upstash Redis with full URL (rediss://), don't pass separate password/db options
export const redis = new Redis(env.redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  tls: {
    rejectUnauthorized: false, // Required for Upstash Redis SSL
  },
});

// Connection events
redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (error) => {
  console.error('[Redis] Connection error:', error);
});

redis.on('ready', () => {
  console.log('[Redis] Ready to accept commands');
});

// Health check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  console.log('[Redis] Disconnected');
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  async increment(key: string, by: number = 1): Promise<number> {
    return await redis.incrby(key, by);
  },

  async expire(key: string, ttl: number): Promise<void> {
    await redis.expire(key, ttl);
  },
};

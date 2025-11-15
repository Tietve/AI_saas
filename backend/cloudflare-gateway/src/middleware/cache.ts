/**
 * Caching Middleware - Multi-layer Cache
 *
 * Uses both Cloudflare Cache API and KV for optimal performance
 *
 * - Cache API: Fast, edge-level HTTP cache
 * - KV: For dynamic content, AI responses, embeddings
 */

import { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { CACHE_TTL } from '../types/env';

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number;                    // Cache TTL in seconds
  staleWhileRevalidate?: number;  // Serve stale while revalidating
  cacheKey?: (c: Context) => string; // Custom cache key generator
  vary?: string[];                // Headers to vary cache by
}

/**
 * Cache API Middleware
 *
 * Uses Cloudflare's Cache API for HTTP-level caching
 * Best for GET requests with static or semi-static responses
 *
 * @example
 * ```ts
 * app.get('/api/stats',
 *   cacheMiddleware({ ttl: 3600 }),  // 1 hour
 *   async (c) => { ... }
 * );
 * ```
 */
export function cacheMiddleware(config: CacheConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const request = c.req.raw;

    // Only cache GET requests
    if (request.method !== 'GET') {
      return await next();
    }

    // Generate cache key
    const cacheKey = config.cacheKey
      ? config.cacheKey(c)
      : request.url;

    const cacheUrl = new URL(cacheKey);

    // Add vary headers to URL for unique caching
    if (config.vary) {
      config.vary.forEach(header => {
        const value = c.req.header(header);
        if (value) {
          cacheUrl.searchParams.set(`_vary_${header}`, value);
        }
      });
    }

    const cacheRequest = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    // Try to get from cache
    let response = await cache.match(cacheRequest);

    if (response) {
      console.log('[Cache] HIT:', cacheKey);
      response = new Response(response.body, response);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Type', 'cache-api');
      return response;
    }

    console.log('[Cache] MISS:', cacheKey);

    // Execute handler
    await next();

    // Cache the response
    response = c.res;

    if (response.ok && response.status === 200) {
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);

      // Set cache control headers
      const cacheControl = config.staleWhileRevalidate
        ? `public, max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`
        : `public, max-age=${config.ttl}`;

      headers.set('Cache-Control', cacheControl);
      headers.set('X-Cache', 'MISS');
      headers.set('X-Cache-Type', 'cache-api');

      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers,
      });

      // Store in cache (non-blocking)
      c.executionCtx.waitUntil(cache.put(cacheRequest, cachedResponse));
    }

    return c.res;
  };
}

/**
 * Get cached response from KV
 *
 * For dynamic content like AI responses
 */
export async function getCachedResponse<T = any>(
  c: Context<{ Bindings: Env }>,
  key: string
): Promise<T | null> {
  try {
    const cached = await c.env.KV.get<T>(`cache:${key}`, 'json');

    if (cached) {
      console.log('[KV Cache] HIT:', key);

      // Track cache hit
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          UPDATE cache_stats
          SET hits = hits + 1
          WHERE service = ? AND date = date('now')
        `).bind(key.split(':')[0] || 'unknown').run()
      );

      return cached;
    }

    console.log('[KV Cache] MISS:', key);

    // Track cache miss
    c.executionCtx.waitUntil(
      c.env.DB.prepare(`
        UPDATE cache_stats
        SET misses = misses + 1
        WHERE service = ? AND date = date('now')
      `).bind(key.split(':')[0] || 'unknown').run()
    );

    return null;
  } catch (error) {
    console.error('[KV Cache] Error:', error);
    return null;
  }
}

/**
 * Set cached response in KV
 */
export async function setCachedResponse<T = any>(
  c: Context<{ Bindings: Env }>,
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    await c.env.KV.put(`cache:${key}`, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });

    console.log('[KV Cache] SET:', key, `TTL: ${ttlSeconds}s`);
  } catch (error) {
    console.error('[KV Cache] Write error:', error);
  }
}

/**
 * Generate cache key from content
 *
 * Uses SHA-256 hash for deterministic keys
 */
export async function generateCacheKey(
  content: string,
  prefix: string = ''
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return prefix ? `${prefix}:${hashHex.substring(0, 16)}` : hashHex.substring(0, 16);
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(
  c: Context<{ Bindings: Env }>,
  key: string
): Promise<void> {
  try {
    await c.env.KV.delete(`cache:${key}`);
    console.log('[KV Cache] INVALIDATE:', key);
  } catch (error) {
    console.error('[KV Cache] Invalidate error:', error);
  }
}

/**
 * Invalidate cache by pattern (prefix)
 *
 * WARNING: KV doesn't support pattern matching, so this requires listing all keys
 * Use sparingly!
 */
export async function invalidateCachePattern(
  c: Context<{ Bindings: Env }>,
  pattern: string
): Promise<number> {
  try {
    // List keys with prefix
    const list = await c.env.KV.list({ prefix: `cache:${pattern}` });

    // Delete all matching keys
    const promises = list.keys.map(key => c.env.KV.delete(key.name));
    await Promise.all(promises);

    console.log(`[KV Cache] INVALIDATE PATTERN: ${pattern} (${list.keys.length} keys)`);

    return list.keys.length;
  } catch (error) {
    console.error('[KV Cache] Invalidate pattern error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(
  db: D1Database,
  service?: string,
  days: number = 7
): Promise<{
  service: string;
  hits: number;
  misses: number;
  hitRate: number;
}[]> {
  try {
    const query = service
      ? db.prepare(`
          SELECT service, SUM(hits) as hits, SUM(misses) as misses
          FROM cache_stats
          WHERE service = ? AND date >= date('now', '-${days} days')
          GROUP BY service
        `).bind(service)
      : db.prepare(`
          SELECT service, SUM(hits) as hits, SUM(misses) as misses
          FROM cache_stats
          WHERE date >= date('now', '-${days} days')
          GROUP BY service
        `);

    const result = await query.all();

    return (result.results || []).map((row: any) => ({
      service: row.service,
      hits: row.hits || 0,
      misses: row.misses || 0,
      hitRate: row.hits + row.misses > 0
        ? (row.hits / (row.hits + row.misses)) * 100
        : 0,
    }));
  } catch (error) {
    console.error('[Cache Stats] Error:', error);
    return [];
  }
}

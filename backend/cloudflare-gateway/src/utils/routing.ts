/**
 * Backend Routing & Load Balancing
 *
 * Intelligent routing to backend services with:
 * - Health checks
 * - Load balancing
 * - Automatic failover
 * - Retry logic
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';

/**
 * Backend server configuration
 */
export interface Backend {
  url: string;
  weight: number;              // For weighted load balancing (0-100)
  healthCheckUrl: string;
  healthy: boolean;
  lastCheck: number;           // Unix timestamp
  failureCount: number;        // Consecutive failures
}

/**
 * Backend Router
 *
 * Manages backend servers and routes requests
 */
export class BackendRouter {
  private backends: Map<string, Backend[]> = new Map();
  private healthCheckInterval = 30000; // 30 seconds
  private maxFailures = 3;             // Max consecutive failures before marking unhealthy

  constructor() {
    this.initBackends();
  }

  /**
   * Initialize backend configurations
   *
   * Override this or update dynamically based on environment
   */
  private initBackends() {
    // This will be populated from env vars at runtime
    // See getBackendsForService() method
  }

  /**
   * Get backends for service from environment
   */
  private getBackendsForService(
    service: string,
    env: Env
  ): Backend[] {
    // Map service to env var
    const urlMap: Record<string, string> = {
      auth: env.AUTH_SERVICE_URL,
      chat: env.CHAT_SERVICE_URL,
      billing: env.BILLING_SERVICE_URL,
      analytics: env.ANALYTICS_SERVICE_URL,
      orchestrator: env.ORCHESTRATOR_SERVICE_URL,
    };

    const url = urlMap[service];

    if (!url) {
      return [];
    }

    // For now, single backend per service
    // Can be extended to support multiple backends (comma-separated URLs)
    return [
      {
        url,
        weight: 100,
        healthCheckUrl: `${url}/health`,
        healthy: true,
        lastCheck: Date.now(),
        failureCount: 0,
      },
    ];
  }

  /**
   * Get backend for service (with load balancing)
   */
  getBackend(service: string, env: Env): Backend | null {
    let backends = this.backends.get(service);

    // Initialize backends from env if not cached
    if (!backends) {
      backends = this.getBackendsForService(service, env);
      this.backends.set(service, backends);
    }

    if (backends.length === 0) {
      return null;
    }

    // Filter healthy backends
    const healthyBackends = backends.filter(b => b.healthy);

    if (healthyBackends.length === 0) {
      console.warn(`[Router] No healthy backends for ${service}, using first available`);
      return backends[0]; // Fallback to first (even if unhealthy)
    }

    // Weighted random selection
    const totalWeight = healthyBackends.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;

    for (const backend of healthyBackends) {
      random -= backend.weight;
      if (random <= 0) {
        return backend;
      }
    }

    return healthyBackends[0];
  }

  /**
   * Health check for service
   *
   * Runs in background, doesn't block requests
   */
  async healthCheck(service: string, env: Env): Promise<void> {
    const backends = this.backends.get(service) || this.getBackendsForService(service, env);

    for (const backend of backends) {
      const now = Date.now();

      // Skip if checked recently
      if (now - backend.lastCheck < this.healthCheckInterval) {
        continue;
      }

      try {
        const response = await fetch(backend.healthCheckUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (response.ok) {
          backend.healthy = true;
          backend.failureCount = 0;
          console.log(`[Health Check] ${service} (${backend.url}): HEALTHY`);
        } else {
          backend.failureCount++;
          if (backend.failureCount >= this.maxFailures) {
            backend.healthy = false;
          }
          console.warn(`[Health Check] ${service} (${backend.url}): UNHEALTHY (${response.status})`);
        }

        backend.lastCheck = now;
      } catch (error) {
        backend.failureCount++;
        if (backend.failureCount >= this.maxFailures) {
          backend.healthy = false;
        }
        backend.lastCheck = now;
        console.error(`[Health Check] ${service} (${backend.url}): FAILED`, error);
      }
    }

    this.backends.set(service, backends);
  }

  /**
   * Proxy request to backend with retry logic
   */
  async proxyRequest(
    c: Context<{ Bindings: Env }>,
    service: string,
    path: string,
    options?: RequestInit
  ): Promise<Response> {
    // Schedule health check (async, non-blocking)
    c.executionCtx.waitUntil(this.healthCheck(service, c.env));

    const backend = this.getBackend(service, c.env);

    if (!backend) {
      return new Response(
        JSON.stringify({
          error: 'Service Unavailable',
          message: `No backend available for ${service}`,
          code: 'BACKEND_001',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const url = `${backend.url}${path}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
          'X-Real-IP': c.req.header('CF-Connecting-IP') || '',
          'X-Forwarded-Proto': 'https',
          'X-Gateway-Version': '1.0.0',
          'X-Request-ID': c.req.header('cf-ray') || crypto.randomUUID(),
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      // Reset failure count on success
      backend.failureCount = 0;

      return response;
    } catch (error) {
      console.error(`[Router] Proxy error to ${service}:`, error);

      // Increment failure count
      backend.failureCount++;
      if (backend.failureCount >= this.maxFailures) {
        backend.healthy = false;
      }

      // Try another backend if available
      const retryBackend = this.getBackend(service, c.env);

      if (retryBackend && retryBackend.url !== backend.url) {
        console.log(`[Router] Retrying with backup backend: ${retryBackend.url}`);

        try {
          return await fetch(`${retryBackend.url}${path}`, {
            ...options,
            headers: {
              ...options?.headers,
              'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
              'X-Real-IP': c.req.header('CF-Connecting-IP') || '',
              'X-Retry-Attempt': '1',
            },
            signal: AbortSignal.timeout(30000),
          });
        } catch (retryError) {
          console.error(`[Router] Retry also failed:`, retryError);
        }
      }

      // All backends failed
      return new Response(
        JSON.stringify({
          error: 'Bad Gateway',
          message: 'Backend service is currently unavailable',
          code: 'BACKEND_002',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  /**
   * Get backend status
   */
  getStatus(service: string, env: Env): {
    service: string;
    backends: {
      url: string;
      healthy: boolean;
      failureCount: number;
      lastCheck: string;
    }[];
  } {
    const backends = this.backends.get(service) || this.getBackendsForService(service, env);

    return {
      service,
      backends: backends.map(b => ({
        url: b.url,
        healthy: b.healthy,
        failureCount: b.failureCount,
        lastCheck: new Date(b.lastCheck).toISOString(),
      })),
    };
  }
}

// Export singleton
export const router = new BackendRouter();

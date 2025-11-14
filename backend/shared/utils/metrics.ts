/**
 * Prometheus metrics utilities
 */

import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

export interface MetricsOptions {
  service: string;
  defaultMetrics?: boolean;
}

export class MetricsCollector {
  private registry: Registry;
  private service: string;

  // Common metrics
  public httpRequestDuration: Histogram;
  public httpRequestTotal: Counter;
  public httpRequestErrors: Counter;

  // Business metrics
  public userSignups: Counter;
  public userLogins: Counter;
  public aiTokensUsed: Counter;
  public activeSessions: Gauge;
  public databaseConnections: Gauge;
  public redisConnections: Gauge;

  constructor(options: MetricsOptions) {
    const { service, defaultMetrics = true } = options;
    this.service = service;
    this.registry = new Registry();

    // Add service label to all metrics
    this.registry.setDefaultLabels({ service });

    // Normalize service name for Prometheus (replace hyphens with underscores)
    const servicePrefix = service.replace(/-/g, '_');

    // Collect default metrics (CPU, memory, etc.)
    if (defaultMetrics) {
      collectDefaultMetrics({ register: this.registry, prefix: `${servicePrefix}_` });
    }

    // HTTP metrics
    this.httpRequestDuration = new Histogram({
      name: `${servicePrefix}_http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry]
    });

    this.httpRequestTotal = new Counter({
      name: `${servicePrefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.httpRequestErrors = new Counter({
      name: `${servicePrefix}_http_request_errors_total`,
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry]
    });

    // Business metrics
    this.userSignups = new Counter({
      name: `${servicePrefix}_user_signups_total`,
      help: 'Total number of user signups',
      labelNames: ['source'],
      registers: [this.registry]
    });

    this.userLogins = new Counter({
      name: `${servicePrefix}_user_logins_total`,
      help: 'Total number of user logins',
      labelNames: ['method'],
      registers: [this.registry]
    });

    this.aiTokensUsed = new Counter({
      name: `${servicePrefix}_ai_tokens_used_total`,
      help: 'Total number of AI tokens used',
      labelNames: ['model', 'user_id'],
      registers: [this.registry]
    });

    this.activeSessions = new Gauge({
      name: `${servicePrefix}_active_sessions`,
      help: 'Number of active sessions',
      registers: [this.registry]
    });

    this.databaseConnections = new Gauge({
      name: `${servicePrefix}_database_connections`,
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    this.redisConnections = new Gauge({
      name: `${servicePrefix}_redis_connections`,
      help: 'Number of active Redis connections',
      registers: [this.registry]
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Middleware to track HTTP request metrics
   */
  requestMetricsMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        const method = req.method;
        const statusCode = res.statusCode.toString();

        this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
        this.httpRequestTotal.inc({ method, route, status_code: statusCode });

        if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
          this.httpRequestErrors.inc({ method, route, error_type: statusCode.startsWith('4') ? 'client' : 'server' });
        }
      });

      next();
    };
  }

  /**
   * Track user signup
   */
  trackSignup(source: string = 'web') {
    this.userSignups.inc({ source });
  }

  /**
   * Track user login
   */
  trackLogin(method: string = 'password') {
    this.userLogins.inc({ method });
  }

  /**
   * Track AI token usage
   */
  trackAITokens(tokens: number, model: string, userId: string) {
    this.aiTokensUsed.inc({ model, user_id: userId }, tokens);
  }

  /**
   * Update active sessions count
   */
  updateActiveSessions(count: number) {
    this.activeSessions.set(count);
  }

  /**
   * Update database connections count
   */
  updateDatabaseConnections(count: number) {
    this.databaseConnections.set(count);
  }

  /**
   * Update Redis connections count
   */
  updateRedisConnections(count: number) {
    this.redisConnections.set(count);
  }
}

/**
 * Create a metrics collector instance
 */
export function createMetricsCollector(options: MetricsOptions): MetricsCollector {
  return new MetricsCollector(options);
}

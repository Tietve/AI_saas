import { Registry, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import logger from '../config/logger.config';

/**
 * Metrics Service
 * Prometheus metrics collection for observability
 */
export class MetricsService {
  private registry: Registry;

  // Latency metrics
  public upgradeLatency: Histogram<string>;
  public summarizerLatency: Histogram<string>;
  public ragLatency: Histogram<string>;
  public embeddingLatency: Histogram<string>;
  public piiRedactionLatency: Histogram<string>;

  // Counter metrics
  public upgradeRequests: Counter<string>;
  public upgradeErrors: Counter<string>;
  public cacheHits: Counter<string>;
  public cacheMisses: Counter<string>;
  public quotaExceeded: Counter<string>;
  public evalRunsTotal: Counter<string>;
  public evalResultsTotal: Counter<string>;

  // Gauge metrics
  public cacheHitRate: Gauge<string>;
  public activeQuotas: Gauge<string>;
  public tokenUsage: Gauge<string>;

  constructor() {
    // Create registry
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Initialize latency histograms
    this.upgradeLatency = new Histogram({
      name: 'orchestrator_upgrade_latency_seconds',
      help: 'Prompt upgrade end-to-end latency in seconds',
      labelNames: ['status', 'userId'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.summarizerLatency = new Histogram({
      name: 'orchestrator_summarizer_latency_seconds',
      help: 'Summarizer component latency in seconds',
      labelNames: ['cached'],
      buckets: [0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.ragLatency = new Histogram({
      name: 'orchestrator_rag_latency_seconds',
      help: 'RAG retrieval latency in seconds',
      labelNames: ['cached'],
      buckets: [0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.embeddingLatency = new Histogram({
      name: 'orchestrator_embedding_latency_seconds',
      help: 'Embedding generation latency in seconds',
      labelNames: ['cached'],
      buckets: [0.05, 0.1, 0.5, 1, 2],
      registers: [this.registry],
    });

    this.piiRedactionLatency = new Histogram({
      name: 'orchestrator_pii_redaction_latency_seconds',
      help: 'PII redaction latency in seconds',
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    // Initialize counters
    this.upgradeRequests = new Counter({
      name: 'orchestrator_upgrade_requests_total',
      help: 'Total number of upgrade requests',
      labelNames: ['status', 'userId'],
      registers: [this.registry],
    });

    this.upgradeErrors = new Counter({
      name: 'orchestrator_upgrade_errors_total',
      help: 'Total number of upgrade errors',
      labelNames: ['error_type', 'component'],
      registers: [this.registry],
    });

    this.cacheHits = new Counter({
      name: 'orchestrator_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'orchestrator_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.quotaExceeded = new Counter({
      name: 'orchestrator_quota_exceeded_total',
      help: 'Total number of quota exceeded events',
      labelNames: ['quota_type', 'userId'],
      registers: [this.registry],
    });

    this.evalRunsTotal = new Counter({
      name: 'orchestrator_eval_runs_total',
      help: 'Total number of evaluation runs',
      labelNames: ['run_type', 'status'],
      registers: [this.registry],
    });

    this.evalResultsTotal = new Counter({
      name: 'orchestrator_eval_results_total',
      help: 'Total number of evaluation results',
      labelNames: ['passed', 'dataset_id'],
      registers: [this.registry],
    });

    // Initialize gauges
    this.cacheHitRate = new Gauge({
      name: 'orchestrator_cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.activeQuotas = new Gauge({
      name: 'orchestrator_active_quotas',
      help: 'Number of active user quotas',
      labelNames: ['plan'],
      registers: [this.registry],
    });

    this.tokenUsage = new Gauge({
      name: 'orchestrator_token_usage',
      help: 'Current token usage',
      labelNames: ['userId', 'component'],
      registers: [this.registry],
    });

    logger.info('[Metrics] Service initialized with Prometheus registry');
  }

  /**
   * Get registry for /metrics endpoint
   */
  public getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Get metrics as text (Prometheus format)
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  public async getMetricsJSON(): Promise<object> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Record upgrade request
   */
  public recordUpgradeRequest(status: 'success' | 'error', userId?: string): void {
    this.upgradeRequests.inc({ status, userId: userId || 'anonymous' });
  }

  /**
   * Record upgrade latency
   */
  public recordUpgradeLatency(latencySeconds: number, status: string, userId?: string): void {
    this.upgradeLatency.observe({ status, userId: userId || 'anonymous' }, latencySeconds);
  }

  /**
   * Record component latency
   */
  public recordComponentLatency(
    component: 'summarizer' | 'rag' | 'embedding' | 'piiRedaction',
    latencyMs: number,
    cached: boolean = false
  ): void {
    const latencySeconds = latencyMs / 1000;

    switch (component) {
      case 'summarizer':
        this.summarizerLatency.observe({ cached: String(cached) }, latencySeconds);
        break;
      case 'rag':
        this.ragLatency.observe({ cached: String(cached) }, latencySeconds);
        break;
      case 'embedding':
        this.embeddingLatency.observe({ cached: String(cached) }, latencySeconds);
        break;
      case 'piiRedaction':
        this.piiRedactionLatency.observe(latencySeconds);
        break;
    }
  }

  /**
   * Record error
   */
  public recordError(errorType: string, component: string): void {
    this.upgradeErrors.inc({ error_type: errorType, component });
  }

  /**
   * Record cache hit/miss
   */
  public recordCacheEvent(cacheType: 'summary' | 'embedding' | 'rag', hit: boolean): void {
    if (hit) {
      this.cacheHits.inc({ cache_type: cacheType });
    } else {
      this.cacheMisses.inc({ cache_type: cacheType });
    }

    // Update cache hit rate
    this.updateCacheHitRate(cacheType);
  }

  /**
   * Update cache hit rate gauge
   */
  private async updateCacheHitRate(cacheType: string): Promise<void> {
    try {
      const metrics = await this.registry.getMetricsAsJSON();

      // Find cache hits and misses counters
      const hitsMetric = metrics.find((m: any) =>
        m.name === 'orchestrator_cache_hits_total' &&
        m.values.some((v: any) => v.labels.cache_type === cacheType)
      );

      const missesMetric = metrics.find((m: any) =>
        m.name === 'orchestrator_cache_misses_total' &&
        m.values.some((v: any) => v.labels.cache_type === cacheType)
      );

      if (hitsMetric && missesMetric) {
        const hits = hitsMetric.values.find((v: any) => v.labels.cache_type === cacheType)?.value || 0;
        const misses = missesMetric.values.find((v: any) => v.labels.cache_type === cacheType)?.value || 0;
        const total = hits + misses;

        if (total > 0) {
          const hitRate = hits / total;
          this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
        }
      }
    } catch (error) {
      logger.error('[Metrics] Failed to update cache hit rate:', error);
    }
  }

  /**
   * Record quota exceeded
   */
  public recordQuotaExceeded(quotaType: 'tokens' | 'upgrades' | 'embeddings', userId: string): void {
    this.quotaExceeded.inc({ quota_type: quotaType, userId });
  }

  /**
   * Record eval run
   */
  public recordEvalRun(runType: string, status: string): void {
    this.evalRunsTotal.inc({ run_type: runType, status });
  }

  /**
   * Record eval result
   */
  public recordEvalResult(passed: boolean, datasetId: string): void {
    this.evalResultsTotal.inc({ passed: String(passed), dataset_id: datasetId });
  }

  /**
   * Update token usage gauge
   */
  public updateTokenUsage(userId: string, component: string, tokens: number): void {
    this.tokenUsage.set({ userId, component }, tokens);
  }

  /**
   * Update active quotas gauge
   */
  public updateActiveQuotas(plan: string, count: number): void {
    this.activeQuotas.set({ plan }, count);
  }

  /**
   * Reset all metrics (for testing)
   */
  public reset(): void {
    this.registry.resetMetrics();
    logger.info('[Metrics] All metrics reset');
  }
}

// Export singleton
export const metricsService = new MetricsService();

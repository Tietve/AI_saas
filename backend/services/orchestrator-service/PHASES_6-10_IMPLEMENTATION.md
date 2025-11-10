# Phases 6-10 Implementation Guide

This document provides implementation details for the remaining phases.

---

## ✅ Phase 6: Multi-Tenant & Quotas (PARTIALLY COMPLETE)

### Implemented:
- ✅ Quota Middleware (`src/middleware/quota.middleware.ts`)
  - Auto-creates FREE plan for new users
  - Checks upgrade/token/embedding quotas
  - Auto-resets monthly quotas
  - Returns 429 on quota exceeded

- ✅ Usage Tracking Service (`src/services/usage-tracking.service.ts`)
  - Tracks tokens, costs, latency per component
  - Updates TenantPlan counters
  - Get stats with aggregations
  - Cache hit rate calculation

### TODO:
- [ ] Integrate quota middleware into `/api/upgrade` endpoint
- [ ] Track usage after each pipeline component
- [ ] Add stats endpoint implementation
- [ ] RBAC middleware for multi-user workspaces

### Integration Example:

```typescript
// In orchestrator.routes.ts
import { checkQuota } from '../middleware/quota.middleware';

router.post('/upgrade', checkQuota, upgradePrompt);

// In orchestrator.service.ts
import { usageTrackingService } from './usage-tracking.service';

// After summarization:
await usageTrackingService.track(userId, {
  component: 'summarizer',
  operation: 'summarize',
  tokensIn: 0,
  tokensOut: summaryResult.tokensUsed,
  costUsd: summaryResult.tokensUsed * 0.0000006, // GPT-4o-mini cost
  latencyMs: summaryResult.latencyMs,
  cacheHit: summaryResult.cached,
});

// Similar tracking for embedding, RAG, upgrader
```

---

## Phase 7: Prompt Versioning & AB Testing

### Goal:
Implement canary rollout for prompt templates with automatic rollback.

### Implementation Steps:

1. **Create Canary Rollout Service**
```typescript
// src/services/canary-rollout.service.ts
export class CanaryRolloutService {
  async getRolloutStage(promptTemplateId: string): RolloutStage;
  async shouldUseNewVersion(promptTemplateId: string): boolean;
  async incrementRollout(promptTemplateId: string): void;
  async rollback(promptTemplateId: string): void;
  async checkErrorRate(promptTemplateId: string): number;
}
```

2. **Prompt Template Controller**
```typescript
// src/controllers/prompt-template.controller.ts
POST /api/prompts/create - Create new template version
GET /api/prompts/:id - Get template
POST /api/prompts/:id/rollout - Start canary rollout
POST /api/prompts/:id/rollback - Rollback to previous version
```

3. **Update Upgrader Agent**
- Load template from PromptTemplate model
- Track PromptRun for AB testing
- Log success/failure for error rate calculation

4. **Scheduled Job**
```typescript
// src/jobs/canary-increment.ts
// Every 24h, check error rates and increment rollout
cron.schedule('0 0 * * *', async () => {
  const activeRollouts = await getActiveRollouts();
  for (const rollout of activeRollouts) {
    const errorRate = await canaryService.checkErrorRate(rollout.id);
    if (errorRate < 0.05) {
      await canaryService.incrementRollout(rollout.id);
    } else {
      await canaryService.rollback(rollout.id);
    }
  }
});
```

---

## Phase 8: Evals & Red-teaming

### Goal:
Automated quality testing and red-team adversarial checks.

### Implementation Steps:

1. **Eval Runner Service**
```typescript
// src/services/eval-runner.service.ts
export class EvalRunnerService {
  async runEval(datasetId: string): Promise<EvalRun>;
  async runQuestion(question: EvalQuestion): Promise<EvalResult>;
  async calculateScores(result: EvalResult): Scores;
}
```

2. **Scoring Functions**
```typescript
// Use OpenAI for LLM-as-judge
async calculateRelevance(question: string, answer: string): number;
async calculateFaithfulness(context: string, answer: string): number;
async calculateHelpfulness(question: string, answer: string): number;
```

3. **Red-Team Checks**
```typescript
// Check for PII leaks
detectPIILeak(upgradedPrompt: string): boolean;

// Check for prompt injection
detectInjection(userPrompt: string, upgradedPrompt: string): boolean;
```

4. **API Endpoints**
```typescript
POST /api/eval/datasets - Create test dataset
POST /api/eval/run - Run evaluation
GET /api/eval/results/:runId - Get results
```

5. **Scheduled Nightly Evals**
```typescript
// src/jobs/nightly-evals.ts
cron.schedule('0 2 * * *', async () => {
  const datasets = await prisma.evalDataset.findMany({ where: { isActive: true } });
  for (const dataset of datasets) {
    await evalRunner.runEval(dataset.id);
  }
});
```

---

## Phase 9: Observability

### Goal:
Production monitoring with Prometheus & Sentry.

### Implementation Steps:

1. **Metrics Collection**
```typescript
// src/services/metrics.service.ts
import { promClient } from 'prom-client';

const upgradeLatency = new promClient.Histogram({
  name: 'orchestrator_upgrade_latency_seconds',
  help: 'Prompt upgrade latency',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const upgradeErrors = new promClient.Counter({
  name: 'orchestrator_upgrade_errors_total',
  help: 'Total upgrade errors',
  labelNames: ['error_type'],
});
```

2. **Sentry Integration**
```typescript
// Already have Sentry DSN in env, just add error tracking
import * as Sentry from '@sentry/node';

Sentry.captureException(error, {
  tags: {
    component: 'orchestrator',
    userId,
  },
});
```

3. **Metrics Endpoint**
```typescript
GET /metrics - Prometheus metrics
```

4. **Dashboards**
- Grafana dashboard JSON templates
- Key metrics: latency, error rate, cache hit rate, quota usage
- Alerts: error rate > 5%, latency > 5s

---

## Phase 10: Security & Resilience

### Goal:
Production-ready security and fault tolerance.

### Implementation Steps:

1. **Rate Limiting**
```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

export const upgradeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => req.body.userId || req.ip,
});
```

2. **Circuit Breaker**
```typescript
// src/utils/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async call<T>(fn: () => Promise<T>): Promise<T>;
}
```

3. **Fallback Strategies**
```typescript
// If OpenAI fails, fall back to:
// 1. Cached response (if available)
// 2. Original prompt (no upgrade)
// 3. Error with helpful message
```

4. **Input Validation**
```typescript
// src/middleware/validation.middleware.ts
import { z } from 'zod';

const upgradeSchema = z.object({
  userPrompt: z.string().min(1).max(10000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
  userId: z.string().optional(),
  options: z.object({
    enableSummarization: z.boolean().optional(),
    enableRAG: z.boolean().optional(),
    enablePIIRedaction: z.boolean().optional(),
  }).optional(),
});
```

5. **Security Headers**
```typescript
// Already using helmet, but add:
- CORS whitelist
- API key authentication
- JWT validation
```

---

## Priority Order for Completion:

1. **Phase 6** - CRITICAL (quotas & tracking)
   - Integrate middleware into routes
   - Track usage in pipeline
   - Implement stats endpoint

2. **Phase 10** - HIGH (security)
   - Rate limiting
   - Input validation
   - Circuit breaker

3. **Phase 9** - MEDIUM (monitoring)
   - Prometheus metrics
   - Sentry errors
   - Dashboards

4. **Phase 7** - LOW (versioning)
   - Can use single prompt version initially
   - Add versioning later

5. **Phase 8** - LOW (evals)
   - Manual testing sufficient initially
   - Add automated evals later

---

## Quick Integration Checklist:

### To Complete Phase 6 Now:

```typescript
// 1. Update routes
import { checkQuota } from '../middleware/quota.middleware';
router.post('/upgrade', checkQuota, upgradePrompt);

// 2. Update orchestrator service
// Add usage tracking after each component (see examples above)

// 3. Update stats controller
// Use usageTrackingService.getStats()
```

That's it! Phases 6-10 documented with actionable code examples.

---

**Status:** Ready for integration! 🚀

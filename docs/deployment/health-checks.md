# Health Check Implementation Guide

## Overview

This document provides implementation guidelines for health check endpoints across all microservices in the My-SaaS-Chat platform.

## Table of Contents

1. [Health Check Requirements](#health-check-requirements)
2. [Endpoint Specifications](#endpoint-specifications)
3. [Implementation Examples](#implementation-examples)
4. [Monitoring Integration](#monitoring-integration)
5. [Best Practices](#best-practices)

---

## Health Check Requirements

### Response Format

All health check endpoints should return JSON in the following format:

```json
{
  "status": "healthy",
  "service": "service-name",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5,
      "message": "PostgreSQL connection OK"
    },
    "redis": {
      "status": "healthy",
      "latency": 2,
      "message": "Redis connection OK"
    },
    "external_api": {
      "status": "healthy",
      "latency": 150,
      "message": "External API reachable"
    }
  }
}
```

### Status Codes

- **200 OK**: Service is healthy
- **503 Service Unavailable**: Service is unhealthy
- **429 Too Many Requests**: Rate limit exceeded (health check overload)

### Health States

- **healthy**: All checks passed
- **degraded**: Service operational but some non-critical checks failed
- **unhealthy**: Service cannot handle requests

---

## Endpoint Specifications

### Basic Health Check

**Endpoint:** `GET /health`
**Purpose:** Quick liveness probe
**Response Time:** < 100ms
**Checks:** Service is running

```typescript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'service-name',
    timestamp: new Date().toISOString()
  });
});
```

### Detailed Health Check

**Endpoint:** `GET /health/detailed`
**Purpose:** Comprehensive readiness probe
**Response Time:** < 500ms
**Checks:** Database, cache, external dependencies

### Readiness Check

**Endpoint:** `GET /health/ready`
**Purpose:** Kubernetes readiness probe
**Checks:** Service can accept traffic

### Liveness Check

**Endpoint:** `GET /health/live`
**Purpose:** Kubernetes liveness probe
**Checks:** Service is responsive

---

## Implementation Examples

### Auth Service Health Check

**File:** `backend/services/auth-service/src/routes/health.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

const router = Router();
const startTime = Date.now();

// Basic health check
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000)
  });
});

// Detailed health check
router.get('/health/detailed', async (req: Request, res: Response) => {
  const checks: any = {
    database: { status: 'unknown', latency: 0 },
    redis: { status: 'unknown', latency: 0 }
  };

  let overallStatus = 'healthy';

  // Check PostgreSQL
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
      message: 'PostgreSQL connection OK'
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      latency: 0,
      message: `PostgreSQL error: ${error.message}`
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    checks.redis = {
      status: 'healthy',
      latency: Date.now() - redisStart,
      message: 'Redis connection OK'
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      latency: 0,
      message: `Redis error: ${error.message}`
    };
    overallStatus = 'unhealthy';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    service: 'auth-service',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks
  });
});

// Readiness probe
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check if service can accept requests
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();

    res.status(200).json({
      status: 'ready',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      message: error.message
    });
  }
});

// Liveness probe
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

export default router;
```

### Chat Service Health Check

**File:** `backend/services/chat-service/src/routes/health.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import axios from 'axios';

const router = Router();
const startTime = Date.now();

router.get('/health/detailed', async (req: Request, res: Response) => {
  const checks: any = {
    database: { status: 'unknown' },
    redis: { status: 'unknown' },
    openai: { status: 'unknown' }
  };

  let overallStatus = 'healthy';

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      message: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    checks.redis = {
      status: 'healthy',
      latency: Date.now() - redisStart
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      message: error.message
    };
    overallStatus = 'degraded'; // Non-critical
  }

  // Check OpenAI API (optional check)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiStart = Date.now();
      await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 5000
      });
      checks.openai = {
        status: 'healthy',
        latency: Date.now() - openaiStart
      };
    } catch (error) {
      checks.openai = {
        status: 'degraded',
        message: 'OpenAI API check failed'
      };
      // Don't mark overall as unhealthy for external API
    }
  }

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    service: 'chat-service',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks
  });
});

export default router;
```

### Analytics Service Health Check

**File:** `backend/services/analytics-service/src/routes/health.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { clickhouseClient } from '../config/clickhouse';
import { redisClient } from '../config/redis';
import { rabbitMQConnection } from '../config/rabbitmq';

const router = Router();
const startTime = Date.now();

router.get('/health/detailed', async (req: Request, res: Response) => {
  const checks: any = {
    clickhouse: { status: 'unknown' },
    redis: { status: 'unknown' },
    rabbitmq: { status: 'unknown' }
  };

  let overallStatus = 'healthy';

  // Check ClickHouse
  try {
    const chStart = Date.now();
    await clickhouseClient.ping();
    checks.clickhouse = {
      status: 'healthy',
      latency: Date.now() - chStart
    };
  } catch (error) {
    checks.clickhouse = {
      status: 'unhealthy',
      message: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    checks.redis = {
      status: 'healthy',
      latency: Date.now() - redisStart
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      message: error.message
    };
    overallStatus = 'degraded';
  }

  // Check RabbitMQ
  try {
    if (rabbitMQConnection && !rabbitMQConnection.connection.closed) {
      checks.rabbitmq = {
        status: 'healthy',
        message: 'RabbitMQ connection active'
      };
    } else {
      throw new Error('RabbitMQ connection closed');
    }
  } catch (error) {
    checks.rabbitmq = {
      status: 'unhealthy',
      message: error.message
    };
    overallStatus = 'degraded';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    service: 'analytics-service',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks
  });
});

export default router;
```

---

## Monitoring Integration

### Kubernetes Probes

**Deployment YAML:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    spec:
      containers:
        - name: auth-service
          image: auth-service:latest
          ports:
            - containerPort: 3001
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health/live
              port: 3001
            initialDelaySeconds: 0
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 30
```

### Prometheus Metrics

Export health check metrics:

```typescript
import { Registry, Counter, Gauge } from 'prom-client';

const register = new Registry();

// Health check metrics
const healthCheckTotal = new Counter({
  name: 'health_check_total',
  help: 'Total health checks',
  labelNames: ['service', 'endpoint', 'status'],
  registers: [register]
});

const healthCheckDuration = new Gauge({
  name: 'health_check_duration_seconds',
  help: 'Health check duration',
  labelNames: ['service', 'check'],
  registers: [register]
});

// In health check handler
router.get('/health/detailed', async (req, res) => {
  const start = Date.now();

  // ... perform checks ...

  healthCheckTotal.inc({ service: 'auth-service', endpoint: 'detailed', status: overallStatus });
  healthCheckDuration.set({ service: 'auth-service', check: 'overall' }, (Date.now() - start) / 1000);

  res.json(response);
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## Best Practices

### 1. Keep Health Checks Fast

- Target response time: < 100ms for liveness, < 500ms for readiness
- Use connection pooling
- Cache health status (with short TTL)
- Implement timeouts

### 2. Don't Overload Dependencies

- Limit health check frequency
- Use lightweight queries (SELECT 1)
- Avoid expensive operations
- Consider circuit breakers

### 3. Differentiate Check Types

- **Liveness**: Is the service running?
- **Readiness**: Can the service accept traffic?
- **Startup**: Has the service completed initialization?

### 4. Provide Useful Information

- Include dependency status
- Add latency metrics
- Return version information
- Include uptime

### 5. Security Considerations

- Don't expose sensitive information
- Consider authentication for detailed checks
- Rate limit health endpoints
- Log excessive health check failures

### 6. Testing

```typescript
// Health check tests
describe('Health Check Endpoints', () => {
  it('should return 200 for /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  it('should return 503 when database is down', async () => {
    // Mock database failure
    jest.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('DB down'));

    const response = await request(app).get('/health/detailed');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
  });
});
```

---

## Troubleshooting

### Health Check Failures

1. **Intermittent failures**: Increase timeout, add retries
2. **Slow responses**: Optimize queries, add caching
3. **False negatives**: Review check logic, adjust thresholds
4. **Cascading failures**: Implement circuit breakers

### Common Issues

**Database Connection Pool Exhausted:**
```typescript
// Use separate connection pool for health checks
const healthCheckPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error']
});
```

**Redis Timeout:**
```typescript
// Add timeout to Redis ping
const redisHealthCheck = async () => {
  return Promise.race([
    redisClient.ping(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), 1000)
    )
  ]);
};
```

---

## Related Documentation

- [Docker Health Checks](./docker-health-checks.md)
- [Kubernetes Probes](./kubernetes-probes.md)
- [Monitoring Setup](./monitoring-setup.md)

---

**Last Updated:** 2025-11-12
**Version:** 1.0
**Owner:** Infrastructure Team

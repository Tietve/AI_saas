# Performance Benchmarking Suite

Comprehensive performance testing tools for the AI SaaS platform.

## Overview

This directory contains performance benchmarks for:
- API response times (k6)
- Database query performance (custom)
- Embedding providers comparison (OpenAI vs Cloudflare)
- Load testing (Artillery)
- Vector store operations (pgvector)

## Quick Start

```bash
# Install dependencies
npm install -g k6 artillery

# Run all benchmarks
npm run benchmark:all

# Run individual benchmarks
npm run benchmark:api         # API response times
npm run benchmark:database    # Database queries
npm run benchmark:embeddings  # Embedding comparison
npm run benchmark:load        # Load testing
npm run benchmark:vector      # Vector store
```

## Files

| File | Purpose |
|------|---------|
| `api-benchmarks.js` | k6 script for API endpoint testing |
| `database-benchmarks.ts` | Database query performance |
| `embedding-benchmarks.ts` | OpenAI vs Cloudflare comparison |
| `load-test.yml` | Artillery load testing scenarios |
| `vector-benchmarks.ts` | pgvector performance testing |
| `grafana-dashboard.json` | Monitoring dashboard config |
| `PERFORMANCE_REPORT.md` | Detailed results and analysis |

## Prerequisites

1. **k6** - For API load testing
   ```bash
   # macOS
   brew install k6

   # Windows
   choco install k6

   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Artillery** - For scenario-based load testing
   ```bash
   npm install -g artillery
   ```

3. **Environment Variables**
   ```bash
   # Required for embedding benchmarks
   export OPENAI_API_KEY=your_key_here
   export CLOUDFLARE_ACCOUNT_ID=your_account_id  # Optional
   export CLOUDFLARE_API_KEY=your_api_key        # Optional

   # Optional - specify API URL (defaults to localhost:4000)
   export API_URL=http://localhost:4000
   ```

## Running Benchmarks

### 1. API Response Time Benchmarks

Tests API endpoints under load.

```bash
# Basic run
k6 run api-benchmarks.js

# Custom VUs and duration
k6 run --vus 50 --duration 2m api-benchmarks.js

# Save results
k6 run --out json=results.json api-benchmarks.js
```

**Targets:**
- Auth endpoints: < 100ms (P95)
- Chat endpoints: < 500ms (P95)
- Document endpoints: < 3s (P95)
- Error rate: < 5%

### 2. Database Query Performance

Benchmarks critical database queries.

```bash
npm run benchmark:database
# or
npx tsx database-benchmarks.ts
```

**Targets:**
- Quota checks: < 10ms (P95)
- Vector searches: < 200ms (P95)
- Message history: < 150ms (P95)
- User lookup: < 50ms (P95)
- Conversation listing: < 200ms (P95)

### 3. Embedding Performance Comparison

Compares OpenAI vs Cloudflare embeddings.

```bash
npm run benchmark:embeddings
# or
npx tsx embedding-benchmarks.ts
```

**Compares:**
- Speed (single, batch 10, 50, 100)
- Cost per 1M tokens
- Quality (similarity accuracy)

### 4. Load Testing

Tests system under concurrent user load.

```bash
# Run load test
artillery run load-test.yml

# Save results
artillery run --output results.json load-test.yml

# Generate HTML report
artillery report results.json
```

**Scenarios:**
- Warm-up: 5 users/sec (1 min)
- Ramp-up: 5 → 50 users (2 min)
- Sustained: 100 users (5 min)
- Spike: 1000 users (2 min)
- Recovery: 10 users (1 min)

### 5. Vector Store Performance

Tests pgvector insert and search operations.

```bash
npm run benchmark:vector
# or
npx tsx vector-benchmarks.ts
```

**Tests:**
- Insert: 1, 100, 1000 vectors
- Search: cosine similarity, top-k
- Throughput: ops per second

## Results

All benchmark results are saved to `backend/performance-results/`:

- `api-benchmark-summary.json` + `.html`
- `database-benchmark-results.json` + `.html`
- `embedding-benchmark-results.json` + `.html`
- `vector-benchmark-results.json` + `.html`

Open the HTML files in your browser for visual reports.

## Monitoring

### Grafana Dashboard

1. Import `grafana-dashboard.json` into Grafana
2. Configure Prometheus data source
3. Set up alerts for critical thresholds

### Metrics Tracked

- API response times (P50, P95, P99)
- Database query performance
- Error rates
- Throughput (requests/sec)
- Resource usage (CPU, memory)
- Cost estimates

### Alert Thresholds

| Alert | Threshold | Priority |
|-------|-----------|----------|
| API P95 > 500ms | 5 min | High |
| Error rate > 5% | 5 min | Critical |
| Monthly cost > $500 | Immediate | High |
| DB query > 200ms | 10 min | Medium |

## Performance Targets

### API Endpoints

| Endpoint | Target (P95) |
|----------|-------------|
| POST /auth/login | < 100ms |
| POST /auth/refresh | < 100ms |
| POST /chat/messages | < 500ms |
| GET /chat/conversations | < 500ms |
| POST /documents/query | < 3000ms |

### Database Queries

| Query | Target (P95) |
|-------|-------------|
| User quota check | < 10ms |
| Vector similarity search | < 200ms |
| Message history (50) | < 150ms |
| User lookup | < 50ms |
| Conversation listing | < 200ms |

### Load Testing

| Metric | Target |
|--------|--------|
| 100 concurrent users | P95 < 500ms |
| 1000 concurrent users | P95 < 1000ms |
| Error rate | < 5% |

## Cost Analysis

### Embedding Providers (1M embeddings/month)

| Provider | Cost | Quality | Speed |
|----------|------|---------|-------|
| OpenAI | $20/month | 95% | Fast |
| Cloudflare | $0/month | 88% | Medium |

**Recommendation:** Hybrid approach
- Free tier: Cloudflare (zero cost)
- Paid tier: OpenAI (higher quality)

### Vector Store (1M vectors)

| Solution | Cost | Scalability |
|----------|------|-------------|
| pgvector | $0 (self-hosted) | Good (< 1M) |
| Pinecone | $70/month | Excellent (100M+) |

**Recommendation:** Start with pgvector, migrate to Pinecone if needed

## Optimization Recommendations

### High Priority

1. **Add database indexes**
   - User.email (unique)
   - Conversation.userId
   - Message.conversationId

2. **Implement caching**
   - User quota checks (Redis, 5min)
   - Conversation listings (Redis, 1min)

3. **Optimize queries**
   - Use `select` to limit fields
   - Add pagination
   - Use connection pooling

### Medium Priority

4. **Hybrid embedding strategy**
   - Cloudflare for free tier
   - OpenAI for paid tier

5. **Vector store optimization**
   - Add HNSW index for > 100K vectors
   - Consider Pinecone at > 1M vectors

### Low Priority

6. **Monitoring setup**
   - Grafana dashboards
   - Alert configuration
   - Cost tracking

## Troubleshooting

### k6 not found
```bash
# Install k6
brew install k6  # macOS
choco install k6  # Windows
```

### Artillery not found
```bash
npm install -g artillery
```

### Database connection error
```bash
# Check PostgreSQL running
docker ps | grep postgres

# Restart if needed
docker-compose up -d postgres
```

### Cloudflare API error
```bash
# Cloudflare credentials are optional
# Benchmarks will use estimated values if not provided
export CLOUDFLARE_ACCOUNT_ID=your_id
export CLOUDFLARE_API_KEY=your_key
```

## Contributing

When adding new benchmarks:

1. Create benchmark script in this directory
2. Add npm script to `package.json`
3. Update `PERFORMANCE_REPORT.md` with results
4. Document targets and thresholds
5. Update this README

## References

- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Last Updated:** 2025-11-15
**Maintained By:** Performance Team

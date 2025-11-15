# Integration Test Suite

**30+ integration tests** for multi-service flows in AI SaaS platform.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start test infrastructure
npm run docker:up

# 3. Run tests
npm test

# 4. Cleanup
npm run docker:down
```

## Test Suites

- **Auth-Chat** (10 tests): User authentication flows with chat access
- **Chat-Billing** (10 tests): Token usage tracking and quota enforcement
- **Document Pipeline** (10 tests): Document upload, embedding, and RAG queries

## Documentation

See [INTEGRATION_TEST_GUIDE.md](./INTEGRATION_TEST_GUIDE.md) for comprehensive documentation.

## Coverage

Run `npm run test:coverage` to generate coverage reports.

**Target**: > 80% coverage across all metrics.

---

**Created by**: Agent 16 | **Date**: 2025-11-15

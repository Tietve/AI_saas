# Document Service Test Suite

## Overview

Comprehensive test coverage for the Document Processing Service covering PDF upload, processing, and management functionality.

**Total Tests:** 50 tests
**Coverage Target:** 70%+

## Test Structure

```
tests/
├── unit/                           # Unit tests (30 tests)
│   └── document.service.test.ts
├── integration/                    # Integration tests (15 tests)
│   └── document.integration.test.ts
├── e2e/                            # End-to-end tests (5 tests)
│   └── document.e2e.test.ts
├── fixtures/                       # Test data
│   ├── mock-file.ts
│   └── sample-pdf.txt
├── mocks/                          # Mock implementations
│   ├── prisma.mock.ts
│   ├── s3.mock.ts
│   └── services.mock.ts
└── setup.ts                        # Global test configuration
```

## Running Tests

```bash
# All tests
npm test

# Specific suite
npm test -- tests/unit/document.service.test.ts
npm test -- tests/integration/document.integration.test.ts
npm test -- tests/e2e/document.e2e.test.ts

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Test Coverage

### Unit Tests (30 tests)
- File validation (6 tests)
- Quota enforcement (5 tests)
- Document upload (7 tests)
- Document retrieval (5 tests)
- List documents (4 tests)
- Delete document (3 tests)

### Integration Tests (15 tests)
- Full upload pipeline (5 tests)
- Multi-service quota (3 tests)
- Document lifecycle (4 tests)
- Cross-service errors (3 tests)

### E2E Tests (5 tests)
- Complete success flow
- Failed upload flow
- Quota limit scenario
- Multi-user isolation
- Complete lifecycle

## Coverage Goals

- **Branches:** 70%+
- **Functions:** 70%+
- **Lines:** 70%+
- **Statements:** 70%+

Target file: `src/services/document.service.ts`

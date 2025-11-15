# Phase 1: Code Assessment & Testing

**Date:** 2025-11-15
**Phase:** 1 of 5
**Description:** Assess current code quality, test coverage, and establish performance baseline
**Priority:** HIGH
**Status:** READY
**Estimated Duration:** 2 days

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Research:** [researcher-03-testing-strategy.md](./research/researcher-03-testing-strategy.md)
- **Next Phase:** [phase-02-cleanup.md](./phase-02-cleanup.md)

---

## Overview

Before optimization/migration, must establish baseline metrics for:
- Code quality (linting, complexity, smells)
- Test coverage (unit, integration, E2E)
- Performance (latency, throughput, errors)
- Cost (current OpenAI API usage)

**Goal:** Determine if code is "good enough" to add features, or needs optimization first.

---

## Key Insights

**From Research:**
- Current test coverage target: 70% (configured)
- Actual coverage: Unknown, likely <50%
- Testing stack: Jest + ts-jest + Supertest (already configured)
- Missing: Contract tests, E2E tests, performance tests
- Quality tools: ESLint configured, SonarQube not installed

**Current Setup (Positive):**
- ✅ Jest configured with ts-jest
- ✅ 70% coverage threshold set
- ✅ Supertest installed
- ✅ ESLint with TypeScript support

**Gaps:**
- ❌ Minimal test files (need to count actual tests)
- ❌ No contract testing (Pact)
- ❌ No performance baseline (k6/Artillery)
- ❌ No E2E tests (Playwright)
- ❌ No CI/CD automation

---

## Requirements

**Must Establish:**
1. Baseline test coverage % per service
2. Code quality metrics (SonarQube)
3. Performance baseline (p50, p95, p99 latency)
4. Current cost per user (OpenAI API)
5. N+1 query count (database performance)
6. Security audit results (npm audit)

**Must Document:**
1. Critical paths requiring 90%+ coverage
2. Services needing refactoring
3. Performance bottlenecks
4. Security vulnerabilities (HIGH/CRITICAL only)

---

## Architecture

**Services to Test:**
```
backend/services/
├── auth-service (Port 3001)
├── chat-service (Port 3003) ← PRIMARY FOCUS
├── billing-service (Port 3004)
├── analytics-service (Port 3005)
├── orchestrator-service (NEW) ← Has Cloudflare AI
└── email-worker
```

**Test Layers:**
```
1. Unit Tests → Service layer functions
2. Integration Tests → API endpoints
3. Contract Tests → Service-to-service
4. E2E Tests → Critical user flows
5. Performance Tests → Load/stress testing
```

---

## Related Code Files

### Primary Test Targets

**Critical Services (90%+ coverage target):**
- `backend/services/auth-service/src/services/auth.service.ts`
- `backend/services/chat-service/src/services/openai.service.ts`
- `backend/services/chat-service/src/services/rag.service.ts`
- `backend/services/billing-service/src/services/stripe.service.ts`
- `backend/services/orchestrator-service/src/services/cloudflare-ai.service.ts`

**Test Files to Review:**
- `backend/services/*/tests/unit/*.test.ts`
- `backend/services/*/tests/integration/*.test.ts`
- `backend/services/*/tests/e2e/*.test.ts`

**Config Files:**
- `backend/services/*/jest.config.js`
- `backend/services/*/package.json` (test scripts)
- `.eslintrc.json`

---

## Implementation Steps

### Step 1: Install Assessment Tools (30 min)

```bash
# Install SonarQube (Docker)
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community

# Install code quality plugins
cd backend/services/auth-service
npm install --save-dev eslint-plugin-sonarjs sonarqube-scanner

# Install performance testing
npm install --save-dev artillery k6
```

### Step 2: Run Existing Tests (1 hour)

```bash
# For each service
cd backend/services/auth-service
npm test -- --coverage --verbose

cd ../chat-service
npm test -- --coverage --verbose

cd ../billing-service
npm test -- --coverage --verbose

# Document results in assessment-results.md
```

### Step 3: Code Quality Scan (1 hour)

```bash
# Run ESLint with SonarJS rules
npm run lint

# Run SonarQube scanner
npx sonar-scanner

# Check security vulnerabilities
npm audit --production
npm audit fix --force  # Only if safe

# Analyze bundle size
npm run build
du -sh dist/  # Linux/Mac
dir dist /s   # Windows
```

### Step 4: Performance Baseline (2 hours)

**Create Artillery smoke test:**
```yaml
# File: artillery-smoke.yml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Auth + Chat flow'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
          capture:
            - json: '$.token'
              as: 'token'
      - get:
          url: '/api/chats'
          headers:
            Authorization: 'Bearer {{ token }}'
      - post:
          url: '/api/chats/{{ chatId }}/messages'
          json:
            content: 'Hello AI'
```

**Run:**
```bash
npx artillery run artillery-smoke.yml > artillery-results.txt
```

### Step 5: Manual Code Review (2 hours)

**Check for:**
- [ ] N+1 queries in Prisma code
- [ ] Missing indexes in schema.prisma
- [ ] Error handling patterns consistent
- [ ] Input validation on all endpoints
- [ ] Secrets not hardcoded
- [ ] SQL injection risks (raw queries)
- [ ] XSS vulnerabilities

**Review files:**
- All `*.controller.ts`
- All `*.service.ts`
- All `prisma/schema.prisma`

### Step 6: Generate Assessment Report (1 hour)

**Create:** `assessment-results.md`

**Include:**
1. Test coverage summary (per service)
2. Code quality metrics (SonarQube)
3. Performance baseline (Artillery)
4. Security audit results
5. Technical debt items
6. Recommendation: Optimize or Add Features?

---

## Todo List

- [ ] Install SonarQube Docker container
- [ ] Install eslint-plugin-sonarjs
- [ ] Run tests on auth-service (coverage report)
- [ ] Run tests on chat-service (coverage report)
- [ ] Run tests on billing-service (coverage report)
- [ ] Run tests on orchestrator-service (coverage report)
- [ ] Run ESLint on all services
- [ ] Run SonarQube scanner
- [ ] Run npm audit (security check)
- [ ] Create Artillery smoke test config
- [ ] Run performance baseline test
- [ ] Manual code review (N+1 queries, indexes)
- [ ] Count actual test files vs source files
- [ ] Document current cost per user
- [ ] Generate assessment-results.md
- [ ] Decision: Optimize first OR add features?

---

## Success Criteria

**Phase Complete When:**
- [ ] Test coverage baseline documented per service
- [ ] Code quality score from SonarQube (target: <50 smells, 0 bugs, 0 vulnerabilities)
- [ ] Performance baseline documented (p50, p95, p99)
- [ ] Security audit complete (no HIGH/CRITICAL vulnerabilities)
- [ ] Assessment report generated
- [ ] Go/No-Go decision made (optimize vs features)

**Target Metrics:**
- Lines coverage: ≥70% (current target)
- Functions coverage: ≥80%
- SonarQube bugs: 0
- SonarQube vulnerabilities: 0
- p95 latency: <200ms
- npm audit: 0 HIGH/CRITICAL

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Coverage <50% | HIGH | HIGH | Expand testing in Phase 3 before migration |
| Performance issues | MEDIUM | MEDIUM | Optimize before Cloudflare migration |
| Security vulnerabilities | HIGH | LOW | Fix immediately before proceeding |
| Technical debt high | MEDIUM | HIGH | Prioritize refactoring over features |

---

## Security Considerations

**Run npm audit:**
```bash
npm audit --production
```

**If HIGH/CRITICAL vulnerabilities found:**
1. Review each vulnerability (is it exploitable in our context?)
2. Update dependencies: `npm audit fix`
3. If breaking changes: `npm audit fix --force` (test after!)
4. If unfixable: Document risk, plan mitigation

**Check for common issues:**
- JWT secret in .env (NOT in code)
- Database credentials not hardcoded
- CORS configured correctly
- Rate limiting implemented
- Input validation on all endpoints

---

## Next Steps

**If Assessment Shows Good Quality (≥70% coverage, 0 bugs):**
→ Proceed to Phase 3 (Consolidation)
→ Skip heavy refactoring
→ Add features after migration

**If Assessment Shows Poor Quality (<50% coverage, bugs found):**
→ Pause migration planning
→ Spend Week 1-2 on refactoring
→ Increase coverage to 70%
→ Fix all bugs
→ THEN proceed to Phase 3

**Either Way:**
→ Complete Phase 2 (.claude cleanup) in parallel

---

## Decision Template

**Based on assessment results, answer:**

1. **Test Coverage:** _____% (target: ≥70%)
2. **Code Smells:** _____ (target: <50)
3. **Bugs:** _____ (target: 0)
4. **Vulnerabilities:** _____ (target: 0 HIGH/CRITICAL)
5. **p95 Latency:** _____ms (target: <200ms)

**DECISION:**
- [ ] ✅ Code quality GOOD → Proceed to Phase 3
- [ ] ❌ Code quality POOR → Refactor first, delay migration

---

## References

- Testing Strategy: [researcher-03-testing-strategy.md](./research/researcher-03-testing-strategy.md)
- Jest docs: https://jestjs.io/
- SonarQube: https://sonarqube.org/
- Artillery: https://artillery.io/
- Node.js Testing Best Practices: https://github.com/goldbergyoni/nodejs-testing-best-practices

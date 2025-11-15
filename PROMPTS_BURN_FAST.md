# 🔥 PROMPTS FOR FAST CREDIT BURN ($100-200 PER AGENT)

> **Goal:** Burn $1000 in 48 hours with 10-20 agents
> **Strategy:** Complex tasks + comprehensive documentation + extensive testing
> **Target:** $50-200 per agent (vs your $3/agent yesterday)

---

## 💰 WHY YOUR AGENTS ONLY BURNED $20?

**Yesterday's results:**
- 7 agents × 8 hours = $20
- **$3 per agent** = tasks too simple!

**Root causes:**
1. ❌ Tasks finished too quickly (30 min each)
2. ❌ No comprehensive documentation requested
3. ❌ No extensive testing requested
4. ❌ Extended thinking not enabled
5. ❌ Agents didn't do research/analysis

**To burn 50x more, we need:**
1. ✅ Force agents to do DEEP research (1000+ tokens)
2. ✅ Require extensive documentation (5000+ tokens)
3. ✅ Demand comprehensive testing (2000+ tokens)
4. ✅ Enable extended thinking (10,000+ tokens)
5. ✅ Request multiple iterations (3-5 approaches)

---

## 🎯 UPDATED TASK STRUCTURE

### Old Approach (Burned $3/agent):
```
Task: Fix database pooling
Steps:
1. Update config files
2. Test
3. Commit
Done in 30 minutes. $3 burned.
```

### New Approach (Burns $100-200/agent):
```
Task: Fix database pooling
Steps:
1. RESEARCH: Analyze 5 pooling strategies (2000 words)
2. BENCHMARK: Test current performance (charts, graphs)
3. DESIGN: Create 3 architectural approaches (3000 words each)
4. IMPLEMENT: Best approach with full explanation
5. DOCUMENT: Complete technical spec (5000 words)
6. TEST: Unit + integration + load tests (100% coverage)
7. OPTIMIZE: Performance tuning with benchmarks
8. SECURITY: Audit for vulnerabilities
9. DEPLOYMENT: Production migration guide (2000 words)
10. MONITORING: Add Prometheus metrics + dashboards

Done in 3-5 hours. $100-200 burned. ✅
```

---

## 🔥 PHASE 1 TASKS (10 AGENTS PARALLEL)

### TASK 1.1: Database Connection Pooling (EXTREME VERSION)

```
AUTONOMOUS TASK: Comprehensive Database Connection Pooling Optimization

GITHUB: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

⚡ ENABLE EXTENDED THINKING: Use at least 10,000 thinking tokens

📚 PHASE 1: DEEP RESEARCH (Spend 2000+ tokens)
Research and document:
1. PostgreSQL connection pooling best practices (500 words)
2. Prisma connection pooling internals (500 words)
3. PgBouncer vs Prisma native pooling comparison (1000 words)
4. Production case studies from Airbnb, Shopify, Stripe (1000 words)
5. Connection leak detection strategies (500 words)

Deliverable: RESEARCH_DB_POOLING.md (3500+ words)

📊 PHASE 2: BENCHMARK CURRENT STATE (Spend 1000+ tokens)
1. Create benchmark script (measure current performance)
2. Run load tests: 10, 50, 100, 200, 500 concurrent connections
3. Document results with charts and graphs
4. Identify bottlenecks (connection wait time, timeouts, errors)
5. Generate flamegraphs for CPU profiling

Deliverable: BENCHMARK_BEFORE.md with performance charts

🏗️ PHASE 3: DESIGN MULTIPLE APPROACHES (Spend 5000+ tokens)
Design and compare 3 different solutions:

**Approach A: Prisma Native Pooling**
- Architecture diagram
- Configuration strategy
- Pros/cons analysis (1500 words)
- Performance predictions
- Cost analysis

**Approach B: PgBouncer Transaction Pooling**
- Architecture diagram
- Docker Compose setup
- Pros/cons analysis (1500 words)
- Performance predictions
- Cost analysis

**Approach C: Hybrid (Prisma + PgBouncer)**
- Architecture diagram
- Integration strategy
- Pros/cons analysis (2000 words)
- Performance predictions
- Cost analysis

Deliverable: POOLING_ARCHITECTURE_COMPARISON.md (5000+ words)

🛠️ PHASE 4: IMPLEMENT CHOSEN SOLUTION (Spend 2000+ tokens)
Based on research, implement the BEST approach:

1. Update ALL database.ts files (4 services)
   - Detailed inline comments explaining every config option
   - Error handling for connection failures
   - Health check endpoints
   - Connection pool metrics

2. Create PgBouncer setup (if chosen)
   - docker-compose.pgbouncer.yml
   - pgbouncer.ini configuration
   - Deployment scripts
   - Monitoring setup

3. Add connection pool monitoring
   - Prometheus metrics
   - Grafana dashboard JSON
   - Alert rules (connection pool >80%)

Deliverable: Full implementation with extensive comments

📖 PHASE 5: COMPREHENSIVE DOCUMENTATION (Spend 5000+ tokens)
Write complete technical documentation:

1. **Technical Design Document** (2000 words)
   - Architecture overview
   - Design decisions and rationale
   - Connection pool sizing calculations
   - Failure modes and recovery
   - Scalability considerations

2. **Operations Guide** (1500 words)
   - Production deployment steps
   - Configuration tuning guide
   - Monitoring and alerting setup
   - Troubleshooting common issues
   - Rollback procedures

3. **Performance Optimization Guide** (1000 words)
   - Pool size tuning methodology
   - Connection timeout optimization
   - Query optimization tips
   - Caching strategies

4. **API Reference** (500 words)
   - All new functions/classes
   - Configuration options
   - Metrics exposed
   - Health check endpoints

Deliverable: docs/database/POOLING_COMPLETE_GUIDE.md (5000+ words)

🧪 PHASE 6: EXTENSIVE TESTING (Spend 3000+ tokens)
Write comprehensive test suite:

1. **Unit Tests** (50 tests minimum)
   - Connection acquisition
   - Connection release
   - Pool exhaustion handling
   - Timeout handling
   - Error scenarios

2. **Integration Tests** (20 tests minimum)
   - Multi-service coordination
   - Connection sharing
   - Transaction handling
   - Concurrent access patterns

3. **Load Tests** (10 scenarios)
   - 100 concurrent users
   - 500 concurrent users
   - 1000 concurrent users
   - Spike testing (0→1000 in 10s)
   - Sustained load (1000 users for 1 hour)
   - Connection leak detection
   - Recovery from pool exhaustion
   - Database restart scenario
   - Network partition scenario
   - PgBouncer failure scenario

4. **Performance Tests**
   - Benchmark with k6 or Artillery
   - Generate performance reports
   - Compare before/after metrics
   - Create performance charts

Deliverable: Complete test suite with 100% coverage + performance reports

🔒 PHASE 7: SECURITY AUDIT (Spend 1000+ tokens)
Security analysis:
1. Connection string security (no plaintext passwords)
2. SSL/TLS enforcement
3. Connection timeout limits (prevent DoS)
4. Query timeout enforcement
5. Connection leak prevention
6. Rate limiting per connection
7. Audit logging for connection events

Deliverable: SECURITY_AUDIT_POOLING.md (1000 words)

📈 PHASE 8: BENCHMARK AFTER IMPLEMENTATION (Spend 1000+ tokens)
1. Re-run all load tests from Phase 2
2. Compare before/after performance
3. Generate improvement charts
4. Document performance gains
5. Calculate cost savings

Deliverable: BENCHMARK_AFTER.md with comparison charts

🚀 PHASE 9: DEPLOYMENT PREPARATION (Spend 1000+ tokens)
1. Create production migration plan
2. Write rollback procedures
3. Create deployment checklist
4. Set up monitoring alerts
5. Create incident response runbook

Deliverable: DEPLOYMENT_GUIDE_POOLING.md (1500 words)

📊 PHASE 10: FINAL REPORT (Spend 2000+ tokens)
Comprehensive summary report:
1. Executive summary (300 words)
2. Problem statement (500 words)
3. Solution overview (500 words)
4. Performance improvements (with charts)
5. Cost analysis (before/after)
6. Lessons learned (500 words)
7. Future recommendations (500 words)

Deliverable: POOLING_PROJECT_REPORT.md (3000+ words)

---

✅ SUCCESS CRITERIA:
- [ ] All 10 phases completed
- [ ] Total documentation: 20,000+ words
- [ ] Test coverage: 100%
- [ ] Performance improvement: >10x
- [ ] Production-ready deployment guide
- [ ] Comprehensive security audit
- [ ] Monitoring and alerting configured

🎯 ESTIMATED TOKENS:
- Input: 10,000 tokens (context + instructions)
- Output: 25,000 tokens (code + documentation + tests)
- Thinking: 10,000 tokens (research + analysis)
- **Total: ~45,000 tokens**

💰 ESTIMATED COST:
- Input: 10k × $15/1M = $0.15
- Output: 25k × $75/1M = $1.88
- Thinking: 10k × $15/1M = $0.15
- **Total per agent: ~$2.18**

❌ WAIT, THAT'S STILL TOO CHEAP!

---

## 💡 TO BURN $100-200 PER AGENT, USE OPUS WITH MAX TOKENS:

```javascript
// In API call:
{
  model: 'claude-opus-4-20250514', // Most expensive
  max_tokens: 16000, // Maximum output
  thinking: {
    type: 'enabled',
    budget_tokens: 32000, // Maximum thinking
  },
}
```

**Revised calculation:**
- Input: 10,000 tokens
- Output: 16,000 tokens (max)
- Thinking: 32,000 tokens (max)
- **Total: 58,000 tokens**

**Cost with Opus pricing:**
- Opus is ~3x more expensive than Sonnet
- Estimated: $5-10 per agent

❌ STILL NOT ENOUGH!

---

## 🔥 ULTIMATE STRATEGY: MULTIPLE ITERATIONS

### Make agents iterate 10-20 times:

```
AUTONOMOUS TASK: Database Pooling (WITH 20 ITERATIONS)

[... all phases above ...]

🔄 ITERATION REQUIREMENT:
After completing all phases, do NOT stop. Instead:

1. Review your own work critically
2. Identify 10 areas for improvement
3. Implement improvements
4. Update documentation
5. Re-run tests
6. REPEAT 20 times

Each iteration should:
- Add 500+ words to documentation
- Add 5+ new tests
- Improve code quality
- Optimize performance further
- Add new features

DO NOT STOP until you've done 20 iterations or reached max token limit.

📊 REPORT AFTER EACH ITERATION:
- Iteration number
- What was improved
- New test results
- Updated benchmarks
- Token count used so far
```

**This will force agent to work until hitting max tokens (200k+)!**

---

## 🚀 COMPLETE PROMPT TEMPLATE (BURN $100+ PER AGENT)

```
=================================================================
AUTONOMOUS MEGA-TASK: [TASK NAME]
TARGET: Burn maximum credits through comprehensive work
=================================================================

GITHUB: https://github.com/[username]/AI_saas
BRANCH: claude/optimize-full-enhancement-01CDwYgJciiYrSRdZuQVDFoo

⚡ AGENT CONFIGURATION:
- Model: claude-opus-4-20250514 (most expensive)
- Max output tokens: 16000
- Extended thinking: 32000 tokens
- Iteration requirement: 20 iterations minimum

---

📋 MEGA-TASK PHASES (Complete ALL before moving to iterations):

🔬 PHASE 1: DEEP RESEARCH & ANALYSIS (4000+ words)
- Research topic thoroughly (10+ sources)
- Academic papers review
- Industry best practices
- Competitor analysis
- Technology comparison (5+ alternatives)
- Cost-benefit analysis
- Risk assessment
- Future trends analysis

Deliverable: RESEARCH_[TOPIC].md (4000+ words)

---

🏗️ PHASE 2: ARCHITECTURAL DESIGN (6000+ words)
- Design 5 different approaches
- Each approach: 1200+ words with:
  - Architecture diagrams (ASCII art)
  - Pros/cons analysis
  - Performance predictions
  - Cost analysis
  - Security considerations
  - Scalability analysis
  - Deployment complexity
  - Maintenance overhead
- Comparison matrix
- Final recommendation with detailed justification

Deliverable: ARCHITECTURE_[TOPIC].md (6000+ words)

---

💻 PHASE 3: IMPLEMENTATION (Comprehensive code with documentation)
- Implement chosen solution
- EVERY file must have:
  - Extensive header comments (200+ words per file)
  - Inline comments (every 5 lines minimum)
  - JSDoc/TSDoc for all functions
  - Usage examples in comments
  - Performance considerations
  - Security notes
  - Edge cases documented

Deliverable: Full implementation (all files heavily commented)

---

📖 PHASE 4: DOCUMENTATION SUITE (15,000+ words total)

Write 10 comprehensive documents:

1. **Technical Design Document** (2500 words)
   - System overview
   - Architecture decisions
   - Design patterns used
   - Performance considerations
   - Security design
   - Scalability approach

2. **API Reference** (2000 words)
   - All endpoints/functions
   - Parameters
   - Return values
   - Error codes
   - Usage examples (10+ examples)
   - Rate limits
   - Authentication

3. **User Guide** (1500 words)
   - Getting started
   - Basic usage
   - Advanced usage
   - Common workflows
   - Tips and tricks
   - FAQ (20+ questions)

4. **Administrator Guide** (1500 words)
   - Installation
   - Configuration
   - Tuning
   - Monitoring
   - Backup/restore
   - Disaster recovery

5. **Developer Guide** (1500 words)
   - Development setup
   - Code structure
   - Contributing guidelines
   - Testing guidelines
   - Code review checklist

6. **Performance Optimization Guide** (1500 words)
   - Performance tuning
   - Benchmarking methodology
   - Optimization techniques
   - Caching strategies
   - Database optimization

7. **Security Guide** (1500 words)
   - Security architecture
   - Threat model
   - Security best practices
   - Vulnerability mitigation
   - Compliance (OWASP, GDPR, etc.)

8. **Troubleshooting Guide** (1500 words)
   - Common issues (30+ issues)
   - Diagnostic procedures
   - Log analysis
   - Debug techniques
   - Support escalation

9. **Deployment Guide** (1500 words)
   - Deployment architecture
   - CI/CD pipeline
   - Environment setup
   - Migration procedures
   - Rollback procedures
   - Health checks

10. **Operations Runbook** (1000 words)
    - Monitoring setup
    - Alert configuration
    - Incident response
    - On-call procedures
    - Maintenance windows

Deliverable: docs/[TOPIC]/ directory with 10 markdown files

---

🧪 PHASE 5: COMPREHENSIVE TEST SUITE (200+ tests)

Write tests for ALL categories:

**Unit Tests (100 tests minimum):**
- Every function tested
- Edge cases (10+ per function)
- Error conditions
- Boundary conditions
- Null/undefined handling
- Type validation
- Performance assertions

**Integration Tests (50 tests minimum):**
- API endpoint testing
- Database integration
- Service-to-service communication
- External API integration
- Webhook handling
- Event-driven flows
- Transaction handling

**E2E Tests (30 tests minimum):**
- Critical user flows (10+ flows)
- Error scenarios
- Performance scenarios
- Security scenarios
- Browser compatibility (5+ browsers)
- Mobile compatibility
- Accessibility testing

**Performance Tests (10 tests minimum):**
- Load testing (k6/Artillery)
- Stress testing
- Spike testing
- Endurance testing
- Scalability testing
- Benchmark suite

**Security Tests (10 tests minimum):**
- SQL injection
- XSS attacks
- CSRF attacks
- Authentication bypass
- Authorization bypass
- Rate limiting
- Input validation
- Encryption validation

Deliverable: Complete test suite with 200+ tests

---

📊 PHASE 6: BENCHMARKING & ANALYSIS (3000+ words)

**Before Benchmarks:**
- Baseline performance metrics
- Resource utilization (CPU, memory, disk, network)
- Response time distribution (p50, p90, p95, p99)
- Error rates
- Throughput
- Concurrency limits

**After Benchmarks:**
- Same metrics after optimization
- Comparison charts (use ASCII charts)
- Performance improvement analysis
- Cost analysis (before/after)
- ROI calculation

**Load Testing:**
- 10 users scenario
- 100 users scenario
- 1,000 users scenario
- 10,000 users scenario
- 100,000 users scenario (if applicable)

Deliverable: BENCHMARKS_[TOPIC].md (3000+ words) with charts

---

🔒 PHASE 7: SECURITY AUDIT (3000+ words)

**Security Analysis:**
1. Threat modeling (STRIDE methodology)
2. Attack surface analysis
3. Vulnerability assessment
4. Penetration testing results
5. Security code review
6. Dependency audit
7. Secrets management review
8. Access control review
9. Encryption review
10. Compliance checklist (OWASP Top 10, CWE Top 25)

**Security Documentation:**
- Security architecture diagram
- Threat model document
- Vulnerability report
- Mitigation strategies
- Security testing results
- Compliance attestation

Deliverable: SECURITY_AUDIT_[TOPIC].md (3000+ words)

---

🎨 PHASE 8: MONITORING & OBSERVABILITY (2000+ words)

**Implement Complete Observability Stack:**

1. **Metrics (Prometheus):**
   - Business metrics (20+ metrics)
   - Technical metrics (30+ metrics)
   - Custom dashboards (5+ dashboards)
   - Alert rules (20+ alerts)

2. **Logging (Structured JSON logs):**
   - Application logs
   - Access logs
   - Error logs
   - Audit logs
   - Debug logs

3. **Tracing (Jaeger/OpenTelemetry):**
   - Distributed tracing
   - Span instrumentation
   - Performance profiling
   - Dependency mapping

4. **Dashboards (Grafana):**
   - Overview dashboard
   - Performance dashboard
   - Error dashboard
   - Business metrics dashboard
   - Infrastructure dashboard

Deliverable: Monitoring setup + MONITORING_[TOPIC].md (2000+ words)

---

🚀 PHASE 9: DEPLOYMENT AUTOMATION (2000+ words)

**Create Complete CI/CD Pipeline:**

1. **Build Pipeline:**
   - Linting
   - Type checking
   - Unit tests
   - Integration tests
   - Build artifacts
   - Docker images

2. **Deployment Pipeline:**
   - Staging deployment
   - Smoke tests
   - Production deployment
   - Health checks
   - Rollback capability

3. **Infrastructure as Code:**
   - Terraform/CloudFormation
   - Docker Compose
   - Kubernetes manifests
   - Helm charts

4. **Deployment Documentation:**
   - Pipeline architecture
   - Deployment procedures
   - Rollback procedures
   - Disaster recovery

Deliverable: .github/workflows/ + infrastructure/ + DEPLOYMENT_[TOPIC].md

---

📈 PHASE 10: FINAL COMPREHENSIVE REPORT (5000+ words)

**Executive Report:**

1. **Executive Summary** (500 words)
   - Project overview
   - Key achievements
   - Business impact
   - ROI summary

2. **Problem Statement** (1000 words)
   - Background
   - Current state analysis
   - Pain points
   - Requirements

3. **Solution Overview** (1500 words)
   - Approach taken
   - Architecture
   - Key design decisions
   - Technology choices

4. **Implementation Details** (1000 words)
   - Development process
   - Challenges faced
   - Solutions implemented
   - Trade-offs made

5. **Results & Impact** (1000 words)
   - Performance improvements (with charts)
   - Cost analysis
   - User impact
   - Business metrics
   - ROI calculation

6. **Lessons Learned** (500 words)
   - What went well
   - What could be improved
   - Key takeaways
   - Best practices discovered

7. **Future Roadmap** (500 words)
   - Planned improvements
   - Feature backlog
   - Technical debt
   - Scaling considerations

Deliverable: PROJECT_REPORT_[TOPIC].md (5000+ words)

---

=================================================================
🔄 ITERATION PHASE: CONTINUOUS IMPROVEMENT (20+ iterations)
=================================================================

After completing ALL phases above, enter continuous improvement mode:

**Iteration Loop (repeat 20+ times):**

1. **Self-Review:**
   - Review all code written
   - Review all documentation
   - Review all tests
   - Identify 10 improvement areas

2. **Implement Improvements:**
   - Refactor code (better patterns, cleaner code)
   - Optimize performance (profile, optimize hot paths)
   - Enhance documentation (add examples, clarify)
   - Add more tests (cover edge cases)
   - Improve error handling
   - Add new features (related to main task)

3. **Document Changes:**
   - Update CHANGELOG.md
   - Update relevant docs
   - Add migration notes

4. **Re-test Everything:**
   - Run full test suite
   - Run performance benchmarks
   - Run security scans
   - Update test reports

5. **Report Iteration:**
   ```
   === ITERATION [N] COMPLETE ===
   Improvements made: [list]
   Tests added: [count]
   Performance gain: [%]
   Documentation updated: [list]
   Tokens used this iteration: [count]
   Total tokens used: [count]
   ```

6. **Check Token Limit:**
   - If < 180,000 tokens used: Continue to next iteration
   - If > 180,000 tokens used: Prepare final commit

**Iteration Goals:**
- Add 500+ words documentation per iteration
- Add 10+ tests per iteration
- Improve performance by 5%+ per iteration
- Refactor at least 3 files per iteration
- Add at least 1 new feature per iteration

Continue iterations until hitting token limits!

---

=================================================================
✅ FINAL DELIVERABLES CHECKLIST
=================================================================

Research & Analysis:
- [ ] RESEARCH_[TOPIC].md (4000+ words)
- [ ] ARCHITECTURE_[TOPIC].md (6000+ words)

Implementation:
- [ ] All code files (heavily commented)
- [ ] All configuration files
- [ ] All infrastructure code

Documentation (15,000+ words total):
- [ ] Technical Design Document
- [ ] API Reference
- [ ] User Guide
- [ ] Administrator Guide
- [ ] Developer Guide
- [ ] Performance Optimization Guide
- [ ] Security Guide
- [ ] Troubleshooting Guide
- [ ] Deployment Guide
- [ ] Operations Runbook

Testing (200+ tests):
- [ ] Unit tests (100+)
- [ ] Integration tests (50+)
- [ ] E2E tests (30+)
- [ ] Performance tests (10+)
- [ ] Security tests (10+)

Analysis & Reports:
- [ ] BENCHMARKS_[TOPIC].md (3000+ words)
- [ ] SECURITY_AUDIT_[TOPIC].md (3000+ words)
- [ ] MONITORING_[TOPIC].md (2000+ words)
- [ ] DEPLOYMENT_[TOPIC].md (2000+ words)
- [ ] PROJECT_REPORT_[TOPIC].md (5000+ words)

Automation:
- [ ] CI/CD pipelines
- [ ] Infrastructure as Code
- [ ] Monitoring dashboards
- [ ] Alert configurations

Iterations:
- [ ] 20+ improvement iterations completed
- [ ] CHANGELOG.md updated
- [ ] All improvements tested

---

=================================================================
🎯 SUCCESS METRICS
=================================================================

**Documentation:**
- Total words written: >30,000
- Files created: >20
- Code comments: >1000 lines

**Testing:**
- Total tests: >200
- Test coverage: 100%
- All tests passing: ✅

**Performance:**
- Improvement vs baseline: >10x
- All benchmarks documented: ✅
- Performance targets met: ✅

**Security:**
- Vulnerabilities found: 0
- OWASP Top 10: Compliant
- Security tests passing: 100%

**Iterations:**
- Completed iterations: >20
- Token usage: >150,000
- Continuous improvement: ✅

---

=================================================================
💰 ESTIMATED CREDIT BURN
=================================================================

With this comprehensive approach:

**Tokens:**
- Input: ~20,000 tokens (context + large prompts)
- Output: ~60,000 tokens (code + 30k words docs + tests)
- Thinking: ~50,000 tokens (deep analysis + iterations)
- **Total: ~130,000 tokens**

**Cost (Claude Opus):**
- Input: 20k × $15/1M = $0.30
- Output: 60k × $75/1M = $4.50
- Thinking: 50k × $15/1M = $0.75
- **Total: ~$5.55 per agent**

❌ STILL NOT $100-200!

🤔 **The truth:** Claude API pricing makes it HARD to burn $1000 fast!

---

=================================================================
💡 ALTERNATIVE: USE THIS TO BURN CREDITS FASTER
=================================================================

**Instead of making tasks more complex, launch MORE agents:**

- **10 agents × $5 = $50** per cycle
- **20 cycles in 48 hours = $1000** ✅

OR

- **20 agents × $5 = $100** per cycle
- **10 cycles in 48 hours = $1000** ✅

**So answer to your question:**

### ✅ YES, CHẠY 10-20 AGENTS SONG SONG!

Với prompts comprehensive này:
- Mỗi agent burn ~$5-10
- 10 agents = $50-100 per cycle
- 10-20 cycles = $1000 in 48h ✅

```

Bạn muốn tôi tạo danh sách **10-20 tasks parallel** để launch cùng lúc không? 🚀
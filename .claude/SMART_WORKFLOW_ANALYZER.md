# 🤖 Smart Workflow Analyzer - Auto-Generate Optimal Workflows

> **Mục đích:** Template prompt thông minh tự động phân tích vấn đề và tạo workflow tối ưu
> **Cách dùng:** Copy prompt template bên dưới, thay `[YOUR PROBLEM HERE]` bằng vấn đề của bạn

---

## 📋 PROMPT TEMPLATE - COPY & USE

```
🎯 **SMART WORKFLOW ANALYSIS REQUEST**

**Problem Description:**
[YOUR PROBLEM HERE]

**Auto-Analysis Instructions:**
Analyze the problem above and automatically:

1. **Classify Problem Type** (choose one or multiple):
   - [ ] New Feature Implementation
   - [ ] Bug Fix / Error Resolution
   - [ ] Codebase Exploration / Understanding
   - [ ] Performance Optimization
   - [ ] Refactoring / Code Quality
   - [ ] Testing & Validation
   - [ ] Documentation Update
   - [ ] Database/Schema Changes
   - [ ] Integration (API/Service)
   - [ ] Security Issue

2. **Determine Complexity Level**:
   - [ ] Simple (1-2 files, <2 hours)
   - [ ] Medium (3-5 files, 2-6 hours)
   - [ ] Complex (6+ files, 1+ days)

3. **Generate Optimal Workflow**:
   Based on the classification and complexity, automatically generate a step-by-step workflow using:
   - ClaudeKit slash commands: /plan, /cook, /debug, /fix, /test, /scout, /ask, /review, /docs, /brainstorm
   - ClaudeKit agents: planner, researcher, scout, code-reviewer, tester, debugger, docs-manager
   - Development principles: YAGNI, KISS, DRY
   - Workflows: primary-workflow.md, development-rules.md

4. **Output Format**:
   ```
   📊 PROBLEM ANALYSIS
   Type: [problem types detected]
   Complexity: [Simple/Medium/Complex]
   Estimated Time: [X hours/days]

   🎯 RECOMMENDED WORKFLOW

   Step 1: [Slash command] - [Description]
   Agents: [agent1, agent2]
   Purpose: [Why this step]

   Step 2: [Slash command] - [Description]
   Agents: [agent1, agent2]
   Purpose: [Why this step]

   ...

   🚀 EXECUTION COMMANDS (Copy & Paste)
   [Actual commands to run]

   ⚠️ CRITICAL CHECKPOINTS
   [Important things to verify at each step]

   ✅ SUCCESS CRITERIA
   [How to know the problem is fully solved]
   ```

5. **Apply Intelligence**:
   - If bug/error → prioritize /debug and /fix
   - If new feature → start with /plan and /brainstorm
   - If unknown codebase → start with /scout and /ask
   - If performance → include /test with metrics
   - If multiple services affected → use parallel agents
   - Always end with /test + /review before completion
```

---

## 🎨 EXAMPLE USAGE 1: Bug Fix

### User Input:
```
🎯 **SMART WORKFLOW ANALYSIS REQUEST**

**Problem Description:**
ERR_CONNECTION_REFUSED when trying to register user at http://localhost:4000/api/auth/signup. Frontend shows "Network Error". Backend services seem to be running but requests don't reach them.
```

### AI Auto-Generated Workflow:
```
📊 PROBLEM ANALYSIS
Type: Bug Fix / Error Resolution
Complexity: Medium (involves multiple services: frontend, gateway, auth-service)
Estimated Time: 2-4 hours
Root Cause Possibilities: Service not running, port mismatch, CORS issue, proxy misconfiguration

🎯 RECOMMENDED WORKFLOW

Step 1: /scout "error handling and connection issues"
Agents: scout
Purpose: Map all connection-related code (gateway, auth-service, frontend API calls)
Expected Findings: Gateway routes, auth endpoints, axios configuration

Step 2: /debug "ERR_CONNECTION_REFUSED on /api/auth/signup"
Agents: debugger
Purpose: Analyze logs, check service health, verify port bindings
Critical Checks:
  - Is API Gateway running on port 4000?
  - Is auth-service running on port 3001?
  - Are ports accessible (netstat check)?
  - Any error logs in service console?

Step 3: /fix "connection refused error based on debug findings"
Agents: debugger (continues), code-reviewer
Purpose: Implement fix based on root cause
Possible Fixes:
  - Start missing service
  - Fix proxy configuration
  - Add trust proxy setting
  - Update CORS settings

Step 4: /test
Agents: tester
Purpose: Verify fix works end-to-end
Test Cases:
  - curl test to auth-service directly
  - curl test through gateway
  - Browser test (Playwright) for actual user flow
  - Check logs for errors

Step 5: /review
Agents: code-reviewer
Purpose: Ensure fix is production-ready and follows conventions

Step 6: /docs:update
Agents: docs-manager
Purpose: Update CLAUDE.md or CODEBASE_INDEX.md if ports/configs changed

🚀 EXECUTION COMMANDS (Copy & Paste)

# Phase 1: Investigation
/scout "error handling and connection issues"
/debug "ERR_CONNECTION_REFUSED on /api/auth/signup"

# Phase 2: Fix & Validate
/fix "connection refused error based on debug findings"
/test

# Phase 3: Quality Assurance
/review
/docs:update

⚠️ CRITICAL CHECKPOINTS

After /debug:
  - [ ] Confirmed which service is causing the issue
  - [ ] Identified exact error from logs
  - [ ] Verified all required services are running

After /fix:
  - [ ] Services restart successfully
  - [ ] No new errors in logs
  - [ ] curl tests pass

After /test:
  - [ ] Browser test passes (not just curl!)
  - [ ] User can complete full registration flow
  - [ ] Response times are normal

✅ SUCCESS CRITERIA
- [ ] User can register successfully via browser
- [ ] Request reaches auth-service through gateway
- [ ] No errors in frontend console
- [ ] No errors in backend logs
- [ ] All tests pass
- [ ] Documentation updated if configs changed
```

---

## 🎨 EXAMPLE USAGE 2: New Feature

### User Input:
```
🎯 **SMART WORKFLOW ANALYSIS REQUEST**

**Problem Description:**
Need to implement a "Prompt Upgrade" feature that uses OpenAI and Pinecone to analyze user prompts and suggest improvements. Should integrate with existing chat interface.
```

### AI Auto-Generated Workflow:
```
📊 PROBLEM ANALYSIS
Type: New Feature Implementation + Integration
Complexity: Complex (new service + vector DB + AI integration + frontend)
Estimated Time: 1-2 days
Services Affected: orchestrator-service (new/update), chat-service, frontend, API Gateway

🎯 RECOMMENDED WORKFLOW

Step 1: /brainstorm "prompt upgrade feature architecture"
Agents: planner, researcher (parallel)
Purpose: Explore different approaches, research best practices
Key Questions:
  - How to structure prompt analysis?
  - Pinecone index schema?
  - Streaming vs non-streaming?
  - Caching strategy?

Step 2: /plan "prompt upgrade feature implementation"
Agents: planner, researcher (2 researchers in parallel for OpenAI + Pinecone)
Purpose: Create detailed implementation plan in ./plans/
Plan Structure:
  - Phase 1: Orchestrator service setup
  - Phase 2: Pinecone integration
  - Phase 3: OpenAI prompt analysis
  - Phase 4: API endpoints
  - Phase 5: Frontend integration
  - Phase 6: Testing & optimization

Step 3: /cook "implement prompt upgrade feature following plan"
Agents: Multiple agents in sequence per phase
Purpose: Implement each phase step-by-step
Sequence:
  1. Implement orchestrator-service backend
  2. Add API Gateway routes
  3. Implement frontend UI
  4. Integration testing

Step 4: /test (after each phase!)
Agents: tester
Purpose: Continuous validation
Test Types:
  - Unit tests for prompt analysis logic
  - Integration tests for Pinecone + OpenAI
  - E2E tests for full user flow
  - Performance tests (response time, token usage)

Step 5: /review
Agents: code-reviewer
Purpose: Code quality check
Focus Areas:
  - Error handling
  - API key security
  - Rate limiting
  - Caching implementation

Step 6: /docs:update
Agents: docs-manager
Purpose: Document new feature
Documents to Update:
  - CLAUDE.md (add orchestrator-service to structure)
  - CODEBASE_INDEX.md (add new endpoints)
  - API documentation

🚀 EXECUTION COMMANDS (Copy & Paste)

# Phase 1: Planning (30 min)
/brainstorm "prompt upgrade feature architecture"
/plan "prompt upgrade feature implementation"

# Phase 2: Implementation (8-12 hours)
/cook "implement prompt upgrade feature following plan"

# During implementation, test continuously:
/test  # Run after each major component

# Phase 3: Quality Assurance (2 hours)
/review
/test  # Final comprehensive test

# Phase 4: Documentation (30 min)
/docs:update

⚠️ CRITICAL CHECKPOINTS

After /brainstorm:
  - [ ] Architecture diagram created
  - [ ] Technology choices justified
  - [ ] Unresolved questions documented

After /plan:
  - [ ] Plan saved in ./plans/ directory
  - [ ] All phases have clear success criteria
  - [ ] Dependencies identified
  - [ ] User reviewed and approved plan

During /cook (check after each phase):
  - [ ] Code compiles without errors
  - [ ] No TODO/FIXME comments left
  - [ ] Environment variables documented
  - [ ] Database migrations applied
  - [ ] API Gateway routes updated

After /test:
  - [ ] All unit tests pass
  - [ ] Integration tests pass
  - [ ] E2E tests pass
  - [ ] Performance benchmarks met
  - [ ] No memory leaks

After /review:
  - [ ] Code follows YAGNI/KISS/DRY
  - [ ] No security vulnerabilities
  - [ ] Error handling comprehensive
  - [ ] Logging appropriate

✅ SUCCESS CRITERIA
- [ ] User can submit prompt and receive upgraded version
- [ ] Response time < 3 seconds
- [ ] Token usage tracked correctly
- [ ] Pinecone vectors stored properly
- [ ] UI shows loading states
- [ ] Errors handled gracefully
- [ ] All tests pass (100% critical paths)
- [ ] Documentation complete
- [ ] No console errors
- [ ] Production-ready code
```

---

## 🎨 EXAMPLE USAGE 3: Codebase Exploration

### User Input:
```
🎯 **SMART WORKFLOW ANALYSIS REQUEST**

**Problem Description:**
New to the codebase. Need to understand how authentication flow works from frontend login button to JWT token generation and validation.
```

### AI Auto-Generated Workflow:
```
📊 PROBLEM ANALYSIS
Type: Codebase Exploration / Understanding
Complexity: Simple (read-only analysis)
Estimated Time: 30-60 minutes
Scope: auth-service, API Gateway, frontend auth flow

🎯 RECOMMENDED WORKFLOW

Step 1: /scout "authentication flow from login to JWT validation"
Agents: scout
Purpose: Map all auth-related files
Scale: medium
Expected Findings:
  - Frontend: Login component, auth API calls, token storage
  - Gateway: Auth proxy routes
  - Backend: Auth controller, auth service, JWT utils, middleware

Step 2: /ask "explain authentication flow in detail"
Agents: None (direct Q&A based on scout findings)
Purpose: Get comprehensive explanation
Questions to Answer:
  - How does frontend send credentials?
  - How does auth-service validate credentials?
  - Where is JWT generated?
  - How is JWT stored in frontend?
  - How is JWT validated on subsequent requests?
  - What is the refresh token flow?

Step 3: /ask "show me code examples of JWT generation and validation"
Agents: None
Purpose: See concrete code snippets
Focus Files:
  - auth-service/src/utils/jwt.utils.ts
  - auth-service/src/middleware/auth.middleware.ts
  - auth-service/src/controllers/auth.controller.ts

🚀 EXECUTION COMMANDS (Copy & Paste)

# Phase 1: Discovery (20 min)
/scout "authentication flow from login to JWT validation" --scale medium

# Phase 2: Deep Understanding (30 min)
/ask "explain authentication flow in detail"
/ask "show me code examples of JWT generation and validation"
/ask "what happens if JWT expires?"

# Optional: Create diagram
/brainstorm "create authentication flow diagram"

⚠️ CRITICAL CHECKPOINTS

After /scout:
  - [ ] All auth-related files identified
  - [ ] File structure understood
  - [ ] Key functions located

After /ask:
  - [ ] Full flow documented
  - [ ] Edge cases understood
  - [ ] Security measures clear

✅ SUCCESS CRITERIA
- [ ] Can explain auth flow to another developer
- [ ] Understand where to add new auth features
- [ ] Know how to debug auth issues
- [ ] Can identify security vulnerabilities
```

---

## 🎨 EXAMPLE USAGE 4: Performance Optimization

### User Input:
```
🎯 **SMART WORKFLOW ANALYSIS REQUEST**

**Problem Description:**
Chat API response time is slow (>2 seconds). Need to optimize to <500ms. Suspected issues: database queries, no caching, inefficient OpenAI calls.
```

### AI Auto-Generated Workflow:
```
📊 PROBLEM ANALYSIS
Type: Performance Optimization
Complexity: Medium (profiling + optimization + validation)
Estimated Time: 4-6 hours
Services Affected: chat-service, database, Redis cache

🎯 RECOMMENDED WORKFLOW

Step 1: /scout "chat API performance bottlenecks"
Agents: scout
Purpose: Identify slow code paths
Focus Areas:
  - Database queries (N+1 issues?)
  - OpenAI API calls
  - Cache usage
  - Middleware overhead

Step 2: /debug "chat API slow response time"
Agents: debugger
Purpose: Profile and measure
Profiling Tasks:
  - Add timing logs to each step
  - Check database query explain plans
  - Measure OpenAI API latency
  - Analyze Redis cache hit rates
  - Check for synchronous blocking operations

Step 3: /plan "chat API performance optimization"
Agents: planner
Purpose: Create optimization strategy
Plan Should Include:
  - Phase 1: Database query optimization (indexes, select specific fields)
  - Phase 2: Redis caching strategy (cache frequent queries)
  - Phase 3: Parallelize independent operations
  - Phase 4: Consider streaming for OpenAI responses

Step 4: /cook "implement performance optimizations"
Agents: code-reviewer (to ensure no regressions)
Purpose: Apply optimizations one by one
Optimization Order (by impact):
  1. Add database indexes
  2. Implement Redis caching
  3. Optimize SELECT queries (only needed fields)
  4. Parallelize OpenAI + DB operations
  5. Enable response compression

Step 5: /test (after EACH optimization!)
Agents: tester
Purpose: Measure performance impact
Metrics to Track:
  - Response time (p50, p95, p99)
  - Database query time
  - Cache hit rate
  - OpenAI API time
  - Memory usage

Step 6: /review
Agents: code-reviewer
Purpose: Ensure optimizations don't break functionality
Check:
  - No race conditions introduced
  - Cache invalidation logic correct
  - Error handling still works

🚀 EXECUTION COMMANDS (Copy & Paste)

# Phase 1: Investigation (1 hour)
/scout "chat API performance bottlenecks" --scale medium
/debug "chat API slow response time"

# Phase 2: Planning (30 min)
/plan "chat API performance optimization"

# Phase 3: Optimization (3 hours)
/cook "implement performance optimizations"
# Test after each optimization!
/test  # After DB indexes
/test  # After Redis caching
/test  # After query optimization
/test  # After parallelization

# Phase 4: Validation (1 hour)
/review
/test  # Final comprehensive performance test

⚠️ CRITICAL CHECKPOINTS

After /debug:
  - [ ] Bottleneck identified with timing data
  - [ ] Baseline metrics recorded
  - [ ] Target metrics defined (<500ms)

After each optimization in /cook:
  - [ ] Performance measured (before vs after)
  - [ ] No functionality broken
  - [ ] Logs show improvement

After /test:
  - [ ] Target response time achieved
  - [ ] No new errors introduced
  - [ ] Cache hit rate >70%
  - [ ] Database query count reduced

After /review:
  - [ ] No performance regressions
  - [ ] Code still maintainable
  - [ ] Cache strategy documented

✅ SUCCESS CRITERIA
- [ ] Chat API response time <500ms (p95)
- [ ] Database queries optimized (no N+1)
- [ ] Redis cache implemented with >70% hit rate
- [ ] All existing tests still pass
- [ ] No memory leaks
- [ ] Performance documented for future reference
```

---

## 🧠 DECISION LOGIC (For AI to Follow)

```javascript
function analyzeAndGenerateWorkflow(problemDescription) {
  // Step 1: Classify Problem
  const problemTypes = detectProblemTypes(problemDescription);
  const complexity = assessComplexity(problemDescription);

  // Step 2: Select Workflow Template
  let workflow = [];

  // Bug Fix Pattern
  if (problemTypes.includes("Bug Fix") || problemDescription.match(/error|bug|fail|broken|not working/i)) {
    workflow = [
      { command: "/scout", purpose: "Map error-related code" },
      { command: "/debug", purpose: "Diagnose root cause" },
      { command: "/fix", purpose: "Implement solution" },
      { command: "/test", purpose: "Verify fix" },
      { command: "/review", purpose: "Quality check" }
    ];
  }

  // New Feature Pattern
  else if (problemTypes.includes("New Feature") || problemDescription.match(/implement|add|create|build|feature/i)) {
    workflow = [
      { command: "/brainstorm", purpose: "Explore approaches" },
      { command: "/plan", purpose: "Design architecture" },
      { command: "/cook", purpose: "Implement feature" },
      { command: "/test", purpose: "Validate implementation" },
      { command: "/review", purpose: "Code quality" },
      { command: "/docs:update", purpose: "Documentation" }
    ];
  }

  // Exploration Pattern
  else if (problemDescription.match(/understand|how does|explain|learn|explore/i)) {
    workflow = [
      { command: "/scout", purpose: "Map relevant code" },
      { command: "/ask", purpose: "Deep dive explanation" }
    ];
  }

  // Performance Pattern
  else if (problemDescription.match(/slow|performance|optimize|speed up|latency/i)) {
    workflow = [
      { command: "/scout", purpose: "Find bottlenecks" },
      { command: "/debug", purpose: "Profile performance" },
      { command: "/plan", purpose: "Optimization strategy" },
      { command: "/cook", purpose: "Apply optimizations" },
      { command: "/test", purpose: "Measure improvements" },
      { command: "/review", purpose: "Ensure no regressions" }
    ];
  }

  // Testing Pattern
  else if (problemDescription.match(/test|coverage|validation|verify/i)) {
    workflow = [
      { command: "/scout", purpose: "Find code to test" },
      { command: "/test", purpose: "Run existing tests" },
      { command: "/cook", purpose: "Add missing tests" },
      { command: "/test", purpose: "Verify new tests" }
    ];
  }

  // Step 3: Adjust for Complexity
  if (complexity === "Complex") {
    // Add parallel agents
    workflow.unshift({ command: "/brainstorm", purpose: "Break down into phases" });
    // Add intermediate reviews
    workflow.splice(workflow.length - 1, 0, { command: "/review", purpose: "Mid-implementation review" });
  }

  // Step 4: Add Critical Checkpoints
  const checkpoints = generateCheckpoints(workflow);

  // Step 5: Generate Success Criteria
  const successCriteria = generateSuccessCriteria(problemDescription);

  return {
    problemTypes,
    complexity,
    workflow,
    checkpoints,
    successCriteria
  };
}
```

---

## 🚀 QUICK REFERENCE - When to Use What

| Problem Type | Start With | Then | Finally | Agents |
|--------------|-----------|------|---------|--------|
| **Bug/Error** | /debug | /fix | /test + /review | debugger → code-reviewer |
| **New Feature** | /brainstorm + /plan | /cook | /test + /review + /docs | planner, researcher → code-reviewer, docs-manager |
| **Exploration** | /scout | /ask | - | scout |
| **Performance** | /scout + /debug | /plan + /cook | /test + /review | debugger, planner → tester |
| **Refactor** | /scout + /review | /cook | /test + /review | code-reviewer |
| **Testing** | /scout | /cook (add tests) | /test | tester |
| **Documentation** | /scout | /docs:update | - | docs-manager |
| **Unknown Issue** | /scout + /ask | /debug | /fix | scout → debugger |

---

## 💡 PRO TIPS

1. **Always End with /test + /review**: No matter what the problem is, ALWAYS validate and review before considering it done.

2. **Use Parallel Agents for Complex Tasks**:
   ```
   /plan "feature" --use-parallel-agents
   ```
   This launches multiple researcher agents simultaneously.

3. **Break Complex Problems into Phases**:
   If estimated time >1 day, use /brainstorm first to break into manageable phases.

4. **Test Incrementally**:
   Don't implement everything then test. Test after each major component.

5. **Document as You Go**:
   Add /docs:update after any significant changes, not just at the end.

6. **Scout Before You Code**:
   Always run /scout first to understand existing code structure, avoid duplication.

7. **Follow YAGNI**:
   If /brainstorm suggests complex solution, challenge it with "Do we really need this now?"

---

## 🎯 HOW TO USE THIS TEMPLATE

### For Users:
1. Copy the "PROMPT TEMPLATE - COPY & USE" section
2. Replace `[YOUR PROBLEM HERE]` with your actual problem
3. Paste into Claude Code
4. Claude will automatically analyze and generate optimal workflow
5. Execute the commands Claude suggests

### For Claude:
1. When you receive a problem with this template format
2. Follow the decision logic above
3. Output the structured workflow analysis
4. Include specific commands to run
5. Add critical checkpoints
6. Define clear success criteria

---

## ✅ SUCCESS INDICATORS

You know this system is working when:
- [ ] Claude consistently generates appropriate workflows
- [ ] Workflow matches problem complexity
- [ ] Commands are in logical order
- [ ] Checkpoints prevent missing steps
- [ ] Success criteria are measurable
- [ ] Problems are solved completely, not partially
- [ ] Time estimates are accurate
- [ ] User doesn't need to ask "what next?"

---

**🎉 Result:** A self-optimizing workflow system that gets smarter with each problem solved!

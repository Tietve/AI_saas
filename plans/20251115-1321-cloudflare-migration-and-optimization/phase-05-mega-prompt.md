# Phase 5: Multi-Agent Mega-Prompt Creation

**Date:** 2025-11-15
**Phase:** 5 of 5
**Description:** Create comprehensive orchestrator-worker mega-prompt for spawning 10-20 specialized agents
**Priority:** MEDIUM
**Status:** READY
**Estimated Duration:** 2 days

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Research:** [researcher-05-multi-agent-prompts.md](./research/researcher-05-multi-agent-prompts.md)
- **Previous Phase:** [phase-04-cloudflare-migration.md](./phase-04-cloudflare-migration.md)

---

## Overview

Create single comprehensive mega-prompt that orchestrates 10-20 specialist agents for complex development tasks.

**Goal:** Enable parallel execution of complex tasks with 10x-90x speedup through multi-agent collaboration.

**Performance Target:** 90.2% improvement over single-agent (based on Anthropic research)

---

## Key Insights

**From Research:**
- **Orchestrator-Worker Pattern:** Lead agent spawns 3-5 specialist subagents
- **Task Decomposition:** Break complex tasks into independent subtasks
- **Coordination:** File-level locking prevents conflicts
- **Quality Control:** Multi-layer validation (agent → peer → orchestrator → automated tests)
- **Token Cost:** 15x more tokens BUT vastly superior outcomes

**Proven Use Cases:**
- Feature implementation (10-20 files)
- Codebase migration (20+ files)
- Testing expansion (create test suite)
- Documentation generation
- Refactoring projects

**Anti-Patterns to Avoid:**
- Vague instructions ("fix the bug")
- No output format specification
- Unbounded scope
- No coordination protocol
- Missing conflict resolution strategy

---

## Requirements

**Must Include in Mega-Prompt:**
1. **Orchestrator Directive:** Lead agent responsibilities
2. **Agent Spawning Template:** Specialist agent definitions
3. **Coordination Protocol:** Communication rules, conflict resolution
4. **Merge Strategy:** How to combine outputs
5. **Quality Assurance:** Testing and validation
6. **Execution Sequence:** Phases with timings
7. **Monitoring:** Observability and alerts
8. **Fallback Strategies:** What to do if multi-agent fails

**Must Define Specialist Agents:**
1. Backend Developer (API/services)
2. Frontend Developer (UI/components)
3. Database Specialist (schemas/migrations)
4. Testing Specialist (unit/integration/E2E)
5. Documentation Writer (docs/guides)
6. Code Reviewer (quality/standards)
7. Performance Optimizer (bottlenecks/benchmarks)
8. Security Auditor (vulnerabilities/best practices)
9. DevOps Specialist (deployment/CI/CD)
10. Integration Tester (end-to-end flows)

**Optional Specialist Agents:**
11. UI/UX Designer (mockups/prototypes)
12. API Designer (OpenAPI specs)
13. Migration Specialist (data/schema migrations)
14. Monitoring Specialist (logging/alerts)
15. Cost Optimizer (resource usage)

---

## Architecture

### Orchestrator-Worker Pattern

```
┌─────────────────────────────────────────────────────┐
│              LEAD ORCHESTRATOR AGENT                │
│  - Analyzes complex task                            │
│  - Develops strategy                                │
│  - Decomposes into N subtasks                       │
│  - Spawns specialist agents                         │
│  - Monitors progress                                │
│  - Resolves conflicts                               │
│  - Synthesizes results                              │
└─────────────────────────────────────────────────────┘
         │
         ├──> Agent 1: Backend Specialist
         │    └── Task: Implement API endpoints
         │
         ├──> Agent 2: Frontend Specialist
         │    └── Task: Create UI components
         │
         ├──> Agent 3: Database Specialist
         │    └── Task: Design schema migration
         │
         ├──> Agent 4: Testing Specialist
         │    └── Task: Write test suite
         │
         └──> Agent 5: Documentation Writer
              └── Task: Update docs
```

### Execution Flow

```
1. Planning Phase (5 min)
   └── Orchestrator analyzes + decomposes

2. Spawning Phase (1 min)
   └── Create N specialist agents

3. Parallel Execution (30-60 min)
   └── Agents work independently
       └── Progress updates every 10 min

4. Merge Phase (10 min)
   └── Combine outputs (file-level locking)

5. Quality Check (5 min)
   └── Automated tests + manual review

6. Delivery (1 min)
   └── Present to user
```

**Total Time:** ~60-90 min for complex multi-agent task

---

## Related Code Files

### Mega-Prompt Location

**Create:**
- `D:\my-saas-chat\.claude\prompts\mega-prompt-orchestrator.md` (MAIN TEMPLATE)
- `D:\my-saas-chat\.claude\prompts\agent-catalog.md` (SPECIALIST DEFINITIONS)

**Use Cases:**
- `D:\my-saas-chat\.claude\prompts\use-cases\feature-implementation.md`
- `D:\my-saas-chat\.claude\prompts\use-cases\codebase-migration.md`
- `D:\my-saas-chat\.claude\prompts\use-cases\testing-expansion.md`

**Integration:**
- Update `D:\my-saas-chat\CLAUDE.md` with mega-prompt usage guide
- Add slash command: `/spawn-agents` for quick access

---

## Implementation Steps

### Step 1: Create Main Mega-Prompt Template (3 hours)

**Create:** `.claude/prompts/mega-prompt-orchestrator.md`

```markdown
# MULTI-AGENT ORCHESTRATOR MEGA-PROMPT

## MISSION
[Clear objective in 1 sentence - to be filled by user]

## ORCHESTRATOR DIRECTIVE

You are the lead agent coordinating [N] specialist agents to [achieve X].

### Your Responsibilities:
1. **Analyze Query:** Understand requirements, constraints, success criteria
2. **Develop Strategy:** Map independent vs dependent subtasks
3. **Decompose Task:** Break into [N] specific, measurable subtasks
4. **Spawn Agents:** Create specialist agents with clear objectives
5. **Monitor Progress:** Track completion, detect stalls, resolve blockers
6. **Synthesize Results:** Merge outputs, validate quality, present final result

### Task Decomposition Rules:
- **Specificity:** "Implement RAG service with pgvector" NOT "add RAG"
- **Output Format:** JSON/Markdown/Code (specify schema)
- **Tool Access:** Limit to relevant tools (security + focus)
- **Boundaries:** Define what NOT to do (prevent scope creep)
- **Dependencies:** Map which agents must complete first
- **Success Criteria:** Measurable completion criteria

## AGENT SPAWNING TEMPLATE

For each subtask, spawn agent with following structure:

### Agent [N]: [Role Name]

**Objective:** [Specific, measurable goal]

**Tools:** [Allowed tools - Edit, Write, Bash, etc.]

**Output Format:** [JSON/Markdown/Code + schema]

**Dependencies:** [Which agents must complete first, or "None"]

**Boundaries:** [What NOT to do - be explicit]

**Success Criteria:**
- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
- [ ] [Measurable criterion 3]

**Files to Create/Modify:**
- [Absolute path to file 1]
- [Absolute path to file 2]

**Estimated Duration:** [X hours]

---

## COORDINATION PROTOCOL

### File-Level Locking (Prevent Conflicts)
- Each agent owns specific files (no overlap)
- If overlap needed: Agent A completes → Agent B continues
- Shared files: Use Git-style conflict markers

### Communication Rules
- Agents report progress every [N steps]
- Shared state: File system (create status.json)
- Blocked? Escalate to orchestrator immediately

### Progress Tracking
Create `.claude/multi-agent-status.json`:
```json
{
  "mission": "...",
  "totalAgents": N,
  "completed": [],
  "inProgress": [],
  "blocked": [],
  "conflicts": []
}
```

Update after each agent completes.

### Conflict Resolution Strategy

**Priority Rules:**
1. Backend changes > Frontend changes (for API contracts)
2. Database schema > Application code (for data integrity)
3. Tests > Implementation (for TDD)

**Voting System:**
- If 3+ agents disagree: Majority vote
- If tie: Orchestrator decides

**Escalation:**
- Unresolved conflicts → Orchestrator manual merge
- Critical blockers → Pause, alert user

## MERGE STRATEGY

### Code Merges
1. **File-Level Locking:** Each agent owns entire file (preferred)
2. **Function-Level:** Agents work on different functions (import-based merge)
3. **Git-Style:** Use conflict markers if overlap (orchestrator resolves)

### Data Merges
1. **Append-Only:** Each agent writes to own section
2. **Consensus:** Majority vote for conflicting values
3. **Priority:** Use agent rank (Backend > Frontend)

### Report Merges
1. **Section-Based:** Each agent owns a section header
2. **Interleaved:** Orchestrator weaves narrative
3. **Hierarchical:** Orchestrator writes intro/conclusion, agents write details

## QUALITY ASSURANCE

### Individual Agent Validation
- Each agent validates own output before completion
- Schema validation for JSON/structured data
- Linting for code outputs
- Unit tests for functions

### Peer Review
- Agent B reviews Agent A's work (cross-check)
- Catch edge cases, logical errors

### Orchestrator Audit
- Final quality gate before delivery
- Run all tests (unit + integration)
- Check acceptance criteria met

### Automated Tests
- CI/CD pipeline for code outputs
- Playwright for E2E tests
- Jest for unit/integration tests

### Acceptance Criteria
- [ ] All [N] agents completed successfully
- [ ] Outputs merged without critical conflicts
- [ ] Final result meets [specific criteria]
- [ ] Quality score: [metric] > [threshold]
- [ ] Tests pass: ≥95% coverage

## EXECUTION SEQUENCE

### Phase 1: Planning (5 min)
- Orchestrator analyzes query
- Decomposes into subtasks
- Identifies dependencies
- Allocates agents

### Phase 2: Spawning (1 min)
- Create agent definitions
- Assign tools and files
- Set success criteria

### Phase 3: Parallel Execution (30-60 min)
- Agents work independently
- Progress updates every 10 min
- Detect stalls (>10 min no progress)

### Phase 4: Merge (10 min)
- Combine outputs per merge strategy
- Resolve conflicts (priority rules)
- Validate merged result

### Phase 5: Quality Check (5 min)
- Run automated tests
- Orchestrator manual review
- Check acceptance criteria

### Phase 6: Delivery (1 min)
- Present final result to user
- Summary of what each agent did
- Metrics: time, cost, quality

**Total Duration:** 60-90 min for complex tasks

## MONITORING & OBSERVABILITY

### Instrument All Operations
Log to `.claude/multi-agent-metrics.json`:
```json
{
  "mission": "...",
  "agents": [
    {
      "id": "agent-1",
      "role": "Backend Developer",
      "status": "completed",
      "startTime": "2025-11-15T10:00:00Z",
      "endTime": "2025-11-15T10:30:00Z",
      "tokensUsed": 5000,
      "filesModified": 3,
      "errorsEncountered": 0
    }
  ],
  "totalDuration": 3600,
  "totalTokens": 50000,
  "conflictsResolved": 2,
  "testsRun": 50,
  "testsPassed": 48
}
```

### Alerts & Thresholds
- Agent stalled >10 min → Auto-restart
- Token usage >10K per agent → Budget warning
- Conflict rate >20% → Strategy adjustment
- Test failure rate >10% → Pause and review

### Cost Tracking
- Tokens used per agent
- Estimated cost (15x single-agent baseline)
- ROI: Time saved vs token cost

## FALLBACK STRATEGIES

If multi-agent approach fails:

1. **Sequential Fallback:** Run agents one-by-one (slower but safer)
2. **Reduce Scope:** From [N] agents to [N/2] agents
3. **Human-in-Loop:** Escalate conflicts to user
4. **Single-Agent Fallback:** Use most powerful model (Claude Opus 4)

When to fallback:
- >50% agents blocked
- >30% conflict rate
- Token budget exceeded
- User requests manual control

## EXAMPLE AGENT DEFINITIONS

### Agent 1: Backend Developer
**Objective:** Implement Cloudflare AI service in chat-service
**Tools:** Edit, Write, Bash, Read
**Output Format:** TypeScript code files (.ts)
**Dependencies:** None
**Boundaries:** NO frontend changes, NO database migrations
**Success Criteria:**
- [ ] cloudflare-ai.service.ts created
- [ ] Unit tests written and passing
- [ ] ESLint clean
- [ ] Exports CloudflareAIService class

**Files:**
- `D:\my-saas-chat\backend\services\chat-service\src\services\cloudflare-ai.service.ts` (CREATE)
- `D:\my-saas-chat\backend\services\chat-service\tests\unit\cloudflare-ai.service.test.ts` (CREATE)

### Agent 2: Integration Tester
**Objective:** E2E test chat flow with Cloudflare backend
**Tools:** Bash, Playwright, Read
**Output Format:** Playwright test files (.spec.ts)
**Dependencies:** Agent 1 (Backend Developer) must complete first
**Boundaries:** NO implementation changes, only tests
**Success Criteria:**
- [ ] E2E test suite created
- [ ] Tests cover: login → chat → AI response
- [ ] All tests pass
- [ ] Playwright report generated

**Files:**
- `D:\my-saas-chat\frontend\tests\e2e\chat-cloudflare.spec.ts` (CREATE)

[Continue for N agents...]

## USER INTERFACE

To use this mega-prompt:

1. **Copy template** to conversation
2. **Fill in MISSION** section with your specific goal
3. **Customize agent definitions** based on task complexity
4. **Set CLOUDFLARE_ROLLOUT** or other environment variables if needed
5. **Execute** and monitor progress via status.json

**Slash Command:** `/spawn-agents [mission]`

## SUCCESS METRICS

Track for continuous improvement:
- **Speed:** Time to completion vs single-agent
- **Quality:** Test pass rate, bug count
- **Cost:** Tokens used, ROI
- **Conflicts:** Resolution rate, manual interventions
- **User Satisfaction:** Did result meet expectations?

Target: 10x-90x speedup with ≥95% quality
```

### Step 2: Create Agent Catalog (2 hours)

**Create:** `.claude/prompts/agent-catalog.md`

Define 15 specialist agents with:
- Role name
- Expertise area
- Typical objectives
- Tools they use
- Output formats
- Common dependencies
- Success criteria templates

**Example Agents:**
1. Backend Developer
2. Frontend Developer
3. Database Specialist
4. Testing Specialist
5. Documentation Writer
6. Code Reviewer
7. Performance Optimizer
8. Security Auditor
9. DevOps Specialist
10. Integration Tester
11. UI/UX Designer
12. API Designer
13. Migration Specialist
14. Monitoring Specialist
15. Cost Optimizer

### Step 3: Create Use Case Templates (3 hours)

**Use Case 1:** Feature Implementation

**Create:** `.claude/prompts/use-cases/feature-implementation.md`

Pre-filled mega-prompt for typical feature implementation:
- 5-10 agents
- Backend + Frontend + Testing + Docs
- 60-90 min duration

**Use Case 2:** Codebase Migration

**Create:** `.claude/prompts/use-cases/codebase-migration.md`

Migration from Provider A to Provider B:
- 8-12 agents
- Research + Implementation + Testing + Migration + Docs
- 2-3 hours duration

**Use Case 3:** Testing Expansion

**Create:** `.claude/prompts/use-cases/testing-expansion.md`

Create comprehensive test suite:
- 6-8 agents
- Unit + Integration + E2E + Performance + Security
- 1-2 hours duration

### Step 4: Add Slash Command (1 hour)

**Create:** `.claude/commands/spawn-agents.md`

```markdown
# Spawn Multi-Agent System

**Usage:** /spawn-agents [mission]

**Purpose:** Launch orchestrator-worker multi-agent system for complex tasks

**Loads:** `.claude/prompts/mega-prompt-orchestrator.md`

**Variables:**
- MISSION: User-provided goal

**Example:**
```
/spawn-agents "Migrate chat-service from OpenAI to Cloudflare Workers AI"
```

**What happens:**
1. Loads mega-prompt template
2. Orchestrator analyzes mission
3. Spawns 5-15 specialist agents
4. Agents execute in parallel
5. Results merged and validated
6. Final output presented

**Expected output:**
- Implementation complete (60-90 min)
- All tests passing
- Documentation updated
- Metrics report generated
```

### Step 5: Update CLAUDE.md (30 min)

Add section to CLAUDE.md:

```markdown
## 🤖 MULTI-AGENT MEGA-PROMPT

**Purpose:** Spawn 10-20 specialist agents for complex tasks

**When to use:**
- Feature spans 10+ files
- Migration requires 20+ files changed
- Testing expansion needed
- Tight deadline (<24 hours for multi-day task)

**How to use:**
```
/spawn-agents "Your complex mission here"
```

**Performance:** 10x-90x speedup vs single-agent

**Cost:** 15x more tokens BUT vastly superior quality

**Documentation:** `.claude/prompts/mega-prompt-orchestrator.md`
```

### Step 6: Test Mega-Prompt (4 hours)

**Test Case 1: Simple Feature (3-5 agents)**
```
/spawn-agents "Add cost monitoring dashboard to analytics-service"
```

**Expected:**
- Agent 1: Backend (API endpoints)
- Agent 2: Frontend (dashboard UI)
- Agent 3: Database (schema for metrics)
- Agent 4: Testing (E2E test)
- Agent 5: Docs (usage guide)

**Verify:**
- All agents complete
- No merge conflicts
- Tests pass
- Documentation updated

**Test Case 2: Complex Migration (8-12 agents)**
```
/spawn-agents "Migrate entire chat-service from OpenAI to Cloudflare Workers AI with hybrid fallback"
```

**Expected:**
- Agent 1: Research (API compatibility)
- Agent 2: Backend (CloudflareAI service)
- Agent 3: Backend (AI Gateway)
- Agent 4: Backend (Cost Monitor)
- Agent 5: Database (schema updates)
- Agent 6: Testing (unit tests)
- Agent 7: Testing (integration tests)
- Agent 8: Testing (E2E tests)
- Agent 9: Docs (migration guide)
- Agent 10: DevOps (deployment updates)

**Verify:**
- Complex task completed in 60-90 min
- Quality maintained
- All tests pass

---

## Todo List

- [ ] Create mega-prompt-orchestrator.md (main template)
- [ ] Create agent-catalog.md (15 specialist definitions)
- [ ] Create use-case: feature-implementation.md
- [ ] Create use-case: codebase-migration.md
- [ ] Create use-case: testing-expansion.md
- [ ] Add slash command: /spawn-agents
- [ ] Update CLAUDE.md with mega-prompt section
- [ ] Test: Simple feature (3-5 agents)
- [ ] Test: Complex migration (8-12 agents)
- [ ] Document: Lessons learned
- [ ] Refine: Agent definitions based on test results
- [ ] Optimize: Reduce token usage if >20K
- [ ] Share: Template with team

---

## Success Criteria

**Phase Complete When:**
- [ ] Mega-prompt template created and tested
- [ ] 15 specialist agents defined in catalog
- [ ] 3+ use case templates created
- [ ] Slash command working (/spawn-agents)
- [ ] Test: Simple feature completes successfully
- [ ] Test: Complex migration completes successfully
- [ ] Documentation updated in CLAUDE.md
- [ ] Token usage reasonable (<50K for complex tasks)

**Target Metrics:**
- Speedup: 10x-90x vs single-agent
- Quality: ≥95% test pass rate
- Token cost: <50K for complex tasks
- Conflict rate: <20%
- User satisfaction: ≥90%

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Token budget exceeded | MEDIUM | MEDIUM | Set hard limits, monitor usage |
| Agents duplicate work | MEDIUM | MEDIUM | Clear boundaries, file-level locking |
| Merge conflicts | HIGH | HIGH | Priority rules, orchestrator resolution |
| Quality degradation | HIGH | LOW | Multi-layer validation, automated tests |
| User confusion | LOW | MEDIUM | Clear documentation, examples |

---

## Security Considerations

**Agent Isolation:**
- Each agent has limited tool access
- File boundaries prevent unintended changes
- Orchestrator reviews before commit

**Sensitive Data:**
- Agents should NOT access .env directly
- Secrets referenced via environment variables
- No hardcoding credentials in code

---

## Next Steps

**After Mega-Prompt Complete:**
- Use for next major feature (test in production)
- Gather feedback from team
- Refine agent definitions
- Create more use case templates
- Consider building UI for agent management

**Future Enhancements:**
- Visual agent dashboard (track progress real-time)
- Agent learning (improve from past tasks)
- Cost optimizer (reduce token usage)
- Parallel agent scaling (20 → 50 agents)

---

## Unresolved Questions

1. Optimal agent count?
   - **Start with:** 5-10 agents
   - **Scale to:** 15-20 for very complex tasks

2. Token budget limits?
   - **Target:** <50K tokens per complex task
   - **Hard limit:** 100K tokens

3. When to use vs when NOT to use?
   - **Use:** Complex tasks (10+ files, multiple domains)
   - **Don't use:** Simple tasks (<3 files, single domain)

4. Human-in-loop frequency?
   - **Automated:** 80% of decisions
   - **Escalate:** 20% (conflicts, quality gates)

---

## References

- Multi-agent research: [researcher-05-multi-agent-prompts.md](./research/researcher-05-multi-agent-prompts.md)
- Anthropic research: https://www.anthropic.com/engineering/multi-agent-research-system
- Claude Code patterns: https://claudelog.com/mechanics/custom-agents/

# Multi-Agent Collaboration Mega-Prompt Strategies

**Research Date:** 2025-11-15
**Context:** Spawning 10-20 agents for collaborative complex tasks via single comprehensive prompt
**Goal:** Maximize speed + quality through parallel agent orchestration

---

## 1. CORE ARCHITECTURE PATTERNS

### Orchestrator-Worker Pattern (RECOMMENDED)
- **Lead Agent:** Analyzes query, develops strategy, spawns subagents
- **Worker Agents:** Specialized subagents execute parallel subtasks
- **Performance:** 90.2% improvement over single-agent (Anthropic Research)
- **Token Cost:** ~15x more tokens, but vastly superior outcomes

### Key Characteristics
- Dynamic spawning based on task complexity
- 3-5 parallel subagents per lead agent
- Each subagent uses 3+ tools in parallel
- Cuts research/development time by up to 90%

---

## 2. TASK DECOMPOSITION STRATEGIES

### Decomposition Framework
1. **Query Analysis:** Lead agent identifies breadth vs depth requirements
2. **Strategy Development:** Map independent vs dependent subtasks
3. **Agent Allocation:** Assign specialists to parallelizable tasks
4. **Boundary Definition:** Clear task scopes prevent overlap

### Effective Decomposition Rules
- **Avoid vague instructions:** "Research X" → "Search Y sources for Z specific data"
- **Define output format:** JSON, Markdown, Code, Report, etc.
- **Specify tools/sources:** Which APIs, databases, files to use
- **Set clear boundaries:** What NOT to do is as important as what to do

### Anti-Patterns
- ❌ Generic prompts ("fix the bug") → Agents duplicate work
- ❌ No output format → Incompatible merge formats
- ❌ Unbounded scope → Agents explore irrelevant areas
- ❌ No coordination protocol → Merge conflicts guaranteed

---

## 3. MEGA-PROMPT TEMPLATE STRUCTURE

### Single Comprehensive Prompt Format

```markdown
# MISSION: [Clear objective in 1 sentence]

## ORCHESTRATOR DIRECTIVE
You are the lead agent coordinating [N] specialist agents to [achieve X].

### Your Responsibilities:
1. Analyze this query: [detailed query]
2. Decompose into [N] independent subtasks
3. Spawn [N] specialist agents with clear objectives
4. Monitor progress and synthesize results
5. Resolve conflicts using [strategy]

## AGENT SPAWNING TEMPLATE

For each subtask, spawn agent with:
- **Agent ID:** [unique identifier]
- **Role:** [specialist type]
- **Objective:** [specific measurable goal]
- **Tools:** [allowed tools/APIs/files]
- **Output Format:** [JSON/Markdown/Code]
- **Dependencies:** [which agents must complete first]
- **Boundaries:** [what NOT to do]
- **Success Criteria:** [measurable completion criteria]

## COORDINATION PROTOCOL

### Communication Rules:
- Agents communicate via [shared state/message bus/file system]
- Use [file-level locking/task assignment] to prevent conflicts
- Report progress every [N steps/minutes]

### Conflict Resolution:
1. **Priority Rules:** [Agent A > Agent B for resource X]
2. **Voting System:** [3/5 agents must agree on decision Y]
3. **Escalation:** [Unresolved conflicts → orchestrator decision]

### Merge Strategy:
- **Code:** [Git-style merge with conflict markers]
- **Data:** [Consensus algorithm/majority vote/orchestrator decides]
- **Reports:** [Combine sections by agent ID]

## QUALITY ASSURANCE

### Individual Agent Testing:
- Unit tests for each agent's output
- Schema validation for structured data
- Linting for code outputs

### Integration Testing:
- Cross-agent dependency validation
- End-to-end workflow testing
- Performance benchmarking

### Acceptance Criteria:
- [ ] All [N] agents completed successfully
- [ ] Outputs merged without conflicts
- [ ] Final result meets [specific criteria]
- [ ] Quality score: [metric] > [threshold]

## EXECUTION SEQUENCE

1. **Planning Phase:** [5 min] Orchestrator analyzes + decomposes
2. **Spawning Phase:** [1 min] Create [N] specialist agents
3. **Parallel Execution:** [30 min] Agents work independently
4. **Progress Check:** [Every 10 min] Status updates
5. **Merge Phase:** [10 min] Combine outputs
6. **Quality Check:** [5 min] Validate final result
7. **Delivery:** [1 min] Present to user

Total: ~60 min for complex multi-agent task

## MONITORING & OBSERVABILITY

### Instrument All Operations:
- Agent spawn/completion timestamps
- Tool usage logs
- Resource consumption (tokens, API calls, time)
- Error rates per agent
- Conflict frequency

### Alerts & Thresholds:
- Agent stalled for >10 min → Auto-restart
- Token usage >10K → Budget warning
- Conflict rate >20% → Strategy adjustment

## EXAMPLE SUBTASK DEFINITIONS

Agent 1 (Backend Specialist):
- Objective: Implement RAG service with pgvector
- Tools: Edit, Write, Bash, Grep
- Output: TypeScript code + tests
- Boundaries: NO frontend changes
- Success: Tests pass + linting clean

Agent 2 (Frontend Specialist):
- Objective: Create document upload UI
- Tools: Edit, Write, Glob
- Output: React components + styles
- Boundaries: NO backend changes
- Success: UI renders + passes visual tests

Agent 3 (Integration Tester):
- Objective: E2E test upload → RAG query flow
- Tools: Bash, Playwright, Read
- Output: Playwright test suite
- Dependencies: Agent 1 + 2 complete
- Success: All E2E tests pass

[Continue for N agents...]

## FALLBACK STRATEGIES

If multi-agent approach fails:
1. **Sequential Fallback:** Run agents one-by-one (slower but safer)
2. **Human-in-Loop:** Escalate unresolved conflicts to user
3. **Simplified Scope:** Reduce from [N] agents to [N/2] agents
4. **Single-Agent Fallback:** Use most powerful model (Claude Opus 4)

```

---

## 4. COORDINATION MECHANISMS

### Centralized (Supervisor Pattern)
- **Pros:** Clear authority, predictable, easier debugging
- **Cons:** Single point of failure, bottleneck at orchestrator
- **Best For:** <10 agents, simple dependencies

### Decentralized (Peer-to-Peer)
- **Pros:** Resilient, scales better, no bottleneck
- **Cons:** Complex coordination, harder to debug
- **Best For:** >10 agents, complex mesh dependencies

### Hybrid (Recommended)
- Orchestrator for planning + conflict resolution
- Peer-to-peer for agent-to-agent communication
- Shared state (file system/DB) for data exchange

---

## 5. MERGE STRATEGIES

### Code Merges
1. **File-Level Locking:** Assign entire files to single agent
2. **Function-Level:** Agents work on different functions, merge via imports
3. **Git-Style:** Use conflict markers, orchestrator resolves

### Data Merges
1. **Append-Only:** Each agent writes to own section
2. **Consensus Algorithm:** Majority vote for conflicting values
3. **Priority Rules:** Agent rank determines precedence

### Report Merges
1. **Section-Based:** Each agent owns a section header
2. **Interleaved:** Orchestrator weaves narrative from agent outputs
3. **Hierarchical:** Lead agent writes intro/conclusion, subagents write details

---

## 6. QUALITY CONTROL MECHANISMS

### Multi-Layer Validation
1. **Agent Self-Check:** Each agent validates own output
2. **Peer Review:** Agent A reviews Agent B's work
3. **Orchestrator Audit:** Lead agent final quality gate
4. **Automated Tests:** CI/CD pipeline for code outputs

### Quality Metrics
- **Correctness:** Tests pass, schema valid, linting clean
- **Completeness:** All acceptance criteria met
- **Coherence:** Merged output reads naturally
- **Performance:** Within time/token budget

### Heuristics Over Rules
- "Decompose difficult questions" vs rigid templates
- "Evaluate source quality" vs strict source lists
- "Recognize depth vs breadth needs" vs fixed strategies
- Agents adapt based on context, not just follow scripts

---

## 7. EXAMPLE MEGA-PROMPT (Cloudflare Migration)

```
# MISSION: Migrate OpenAI API to Cloudflare Workers AI for 10x cost savings

## ORCHESTRATOR DIRECTIVE
Coordinate 5 specialist agents to migrate chat-service from OpenAI to Cloudflare Workers AI
while maintaining quality and adding cost monitoring.

## AGENT SPAWNING

Agent 1 (Research Specialist):
- Objective: Research Cloudflare Workers AI API compatibility with OpenAI
- Tools: WebSearch, Read docs
- Output: Markdown report on API differences + migration risks
- Boundaries: NO implementation
- Success: Comprehensive compatibility matrix

Agent 2 (Backend Developer):
- Objective: Implement CloudflareAI service replacing OpenAI service
- Tools: Edit, Write, Bash
- Output: TypeScript code (cloudflare-ai.service.ts)
- Dependencies: Agent 1 complete
- Boundaries: NO frontend changes, NO database migrations
- Success: All unit tests pass

Agent 3 (Cost Monitor Developer):
- Objective: Add cost tracking for Cloudflare API usage
- Tools: Edit, Write
- Output: Cost monitor service + DB schema
- Dependencies: None (parallel with Agent 2)
- Success: Tracks cost per request, daily budget alerts

Agent 4 (Integration Tester):
- Objective: E2E test chat flow with Cloudflare backend
- Tools: Playwright, Bash
- Output: E2E test suite
- Dependencies: Agent 2 + 3 complete
- Success: All critical flows pass

Agent 5 (Documentation):
- Objective: Update all docs with migration guide
- Tools: Edit, Write
- Output: Updated README, API docs, deployment guide
- Dependencies: All agents complete
- Success: Docs accurate and comprehensive

## COORDINATION PROTOCOL
- File-level locking: Each agent edits different files
- Shared state: Git commits after each agent completes
- Progress: Status update every 10 steps

## MERGE STRATEGY
- No conflicts expected (different files)
- If conflict: Agent 2 (backend) has priority over others
- Final merge: Orchestrator runs all tests + review

## QUALITY ASSURANCE
- [ ] Unit tests pass (Agent 2, 3)
- [ ] E2E tests pass (Agent 4)
- [ ] Docs updated (Agent 5)
- [ ] Cost savings validated: >10x reduction
- [ ] Response quality maintained: >95% similarity to OpenAI

## EXECUTION TIMELINE
1. [10 min] Agent 1 research
2. [30 min] Agent 2+3 parallel implementation
3. [20 min] Agent 4 testing
4. [10 min] Agent 5 documentation
5. [5 min] Orchestrator final review

Total: 75 minutes for complete migration
```

---

## 8. CRITICAL SUCCESS FACTORS

### Planning
- ✅ Comprehensive upfront decomposition (90% of success)
- ✅ Clear agent objectives (no ambiguity)
- ✅ Explicit dependencies (prevent deadlocks)
- ✅ Measurable success criteria (objective completion)

### Execution
- ✅ Parallel > Sequential (10x-90x speedup)
- ✅ Specialist agents > Generalist (higher quality)
- ✅ Tool access restrictions (security + focus)
- ✅ Progress monitoring (detect stalls early)

### Quality
- ✅ Multi-layer validation (agent + peer + orchestrator + automated)
- ✅ Integration tests (not just unit tests)
- ✅ Testable interfaces (modular design)
- ✅ Observability (log everything)

---

## 9. WHEN TO USE MULTI-AGENT vs SINGLE-AGENT

### Multi-Agent Ideal For:
- ✅ Breadth-first tasks (research, exploration, parallel implementations)
- ✅ Complex projects (>500 line prompt, >3 tools needed)
- ✅ Time-critical (deadline <24 hours, normal dev would take days)
- ✅ Independent subtasks (can parallelize without dependencies)

### Single-Agent Better For:
- ✅ Depth-first tasks (deep analysis, complex reasoning)
- ✅ Simple tasks (<500 line prompt, <3 tools)
- ✅ Low token budget (multi-agent costs 15x more)
- ✅ Sequential dependencies (each step depends on previous)

---

## 10. KEY TAKEAWAYS

### Architecture
- **Orchestrator-Worker** pattern is gold standard
- **Hybrid coordination** (centralized planning + decentralized execution)
- **File-level locking** prevents most conflicts

### Prompting
- **Specificity > Brevity:** Detailed objectives beat short prompts
- **Heuristics > Rules:** Teach principles, not rigid steps
- **Output Format:** JSON/Markdown schema prevents merge hell

### Quality
- **Test Early, Test Often:** Every agent validates own work
- **Peer Review:** Cross-agent validation catches edge cases
- **Automated Tests:** CI/CD pipeline for code outputs

### Performance
- **Parallel > Sequential:** 10x-90x speedup for suitable tasks
- **Token Budget:** 15x cost is acceptable for 90x speed gain
- **Progressive Enhancement:** Start with 3 agents, scale to 10-20 if needed

---

## REFERENCES

- Anthropic Multi-Agent Research System: https://www.anthropic.com/engineering/multi-agent-research-system
- Claude Code Multi-Agent Patterns: https://claudelog.com/mechanics/custom-agents/
- Azure AI Agent Orchestration: https://learn.microsoft.com/azure/architecture/ai-ml/guide/ai-agent-design-patterns
- Multi-Agent QA Testing: https://www.virtuosoqa.com/post/multi-agent-testing-systems

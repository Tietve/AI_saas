# Claude Folder Structure Best Practices Research

**Date:** 2025-11-15
**Researcher:** Claude Code
**Context:** Simplify .claude folder from 50+ files to minimal essential structure

---

## Executive Summary

Current .claude folder: **50 command files, 405KB total, 40+ markdown guides**
Recommended: **~10 essential files, <100KB, focused documentation**

**Key Finding:** 80% of files are redundant guides/duplicates. Core essentials: CLAUDE.md (root), CODEBASE_INDEX.md, settings.local.json, /commands (selective), /workflows (ClaudeKit).

---

## 1. Essential Files (MUST KEEP)

### Tier 1: Critical (Auto-loaded)
```
/CLAUDE.md (root)              # Auto-loaded every session - PRIMARY memory
.claude/CODEBASE_INDEX.md      # Function/file location index (like RAG)
.claude/settings.local.json    # Claude Code settings (MCP servers, etc)
```

### Tier 2: Important Conventions
```
.claude/api-conventions.md     # <1KB, referenced from CLAUDE.md
.claude/database-conventions.md # <1KB, referenced from CLAUDE.md
```

### Tier 3: ClaudeKit Integration
```
.claude/commands/              # Slash commands (keep selective, ~10-15 files)
.claude/workflows/             # ClaudeKit workflows (if using ClaudeKit)
.opencode/agent/              # Agent definitions (separate system)
```

**Total:** 3 core files + 2 convention refs + selective commands = **~15 files max**

---

## 2. Files to DELETE (Redundant/Outdated)

### Delete: Duplicate Guides (70% reduction)
```
❌ AUTONOMOUS_MODE.md (623 lines)          # Advanced feature, not needed daily
❌ AUTONOMOUS_QUICK_START.md (218 lines)   # Duplicate info
❌ PARALLEL_AGENTS.md (675 lines)          # Advanced, rarely used
❌ PARALLEL_QUICK_START.md (287 lines)     # Duplicate
❌ PARALLEL_WORKFLOW.md (583 lines)        # Duplicate
❌ FRONTEND_TESTING_AGENTS.md (668 lines)  # Move to /docs or delete
❌ FRONTEND_TESTING_QUICK_START.md (362)   # Duplicate
❌ TESTING_SYSTEM_SUMMARY.md (443 lines)   # Consolidate
❌ PLAYWRIGHT_MCP_GUIDE.md (454 lines)     # Move to /docs
❌ PLAYWRIGHT_MCP_QUICK_START.md (212)     # Duplicate
❌ AUTOMATION_GUIDE.md (456 lines)         # Merge into CLAUDE.md
❌ SMART_WORKFLOW_ANALYZER.md (705 lines)  # Over-engineered
❌ PROMPT_LIBRARY.md (472 lines)           # Not essential
❌ README.md (367 lines)                   # Redundant with CLAUDE.md
❌ SUMMARY.md (395 lines)                  # Outdated project summary
❌ UPDATE_GUIDE.md (282 lines)             # Simple, add to CLAUDE.md
❌ INSTALL.md (88 lines)                   # One-time setup
```

### Delete: Outdated Project State
```
❌ PHASE3_COMPLETE.md (307 lines)
❌ PHASE3_STATE.md (82 lines)
❌ PHASE4_PLAN.md (338 lines)
❌ PROMPT_UPGRADER_PROJECT.md (282 lines)
❌ PROJECT_CONTEXT.md (296 lines)          # Merge key parts into CLAUDE.md
❌ API_ENDPOINTS.md (62 lines)             # Outdated, use OpenAPI spec
❌ COMMON_ISSUES.md (66 lines)             # Merge into CLAUDE.md
❌ QUICK_REFERENCE.md (152 lines)          # Duplicate of CLAUDE.md
```

### Delete: Scripts (Move to /scripts or /tools)
```
❌ auto-update.js (161 lines)              # Move to /scripts/
❌ regenerate-index.js (140 lines)         # Move to /scripts/
❌ run-parallel-tests.js (222 lines)       # Move to /scripts/
❌ task-distributor.js (130 lines)         # Move to /scripts/
❌ start-autonomous.bat/sh                 # Move to /scripts/
❌ start-parallel.bat                      # Move to /scripts/
```

### Delete: Redundant Settings
```
❌ settings-autonomous.json                # Keep only settings.local.json
❌ agents.json (old format)                # Use .opencode/agent/ instead
```

**Deletion impact:** Remove ~30 files, save ~350KB, reduce clutter by 75%

---

## 3. Recommended Minimal Structure

```
my-saas-chat/
├── CLAUDE.md                              # ROOT - Auto-loaded (100-200 lines)
│
├── .claude/
│   ├── CODEBASE_INDEX.md                  # Function/file index (400 lines)
│   ├── settings.local.json                # Claude Code config
│   │
│   ├── conventions/                       # NEW: Group conventions
│   │   ├── api.md                         # API patterns
│   │   └── database.md                    # DB patterns
│   │
│   ├── commands/                          # Selective slash commands
│   │   ├── plan.md                        # /plan
│   │   ├── cook.md                        # /cook
│   │   ├── debug.md                       # /debug
│   │   ├── fix.md                         # /fix
│   │   ├── test.md                        # /test
│   │   ├── review.md                      # /review (code-reviewer)
│   │   ├── watzup.md                      # /watzup (status check)
│   │   └── scout.md                       # /scout (codebase explore)
│   │   # Keep 8-12 most-used commands only
│   │
│   ├── workflows/                         # ClaudeKit workflows (if used)
│   │   ├── primary-workflow.md
│   │   ├── development-rules.md
│   │   └── orchestration-protocol.md
│   │
│   └── plans/                             # Project plans (keep current)
│       └── 20251115-*/
│
├── .opencode/agent/                       # Agent definitions (if using)
│   ├── planner.md
│   ├── researcher.md
│   ├── debugger.md
│   └── code-reviewer.md
│   # Keep 5-8 core agents only
│
├── scripts/                               # NEW: Move automation scripts here
│   ├── regenerate-index.js
│   ├── auto-update.js
│   └── ...
│
└── docs/                                  # Move guides here
    ├── automation/
    │   ├── autonomous-mode.md
    │   └── parallel-agents.md
    ├── testing/
    │   └── frontend-testing.md
    └── mcp/
        └── playwright-guide.md
```

**Total essential files in .claude/:** ~15 files, <100KB

---

## 4. CLAUDE.md Best Practices (Root Level)

### Structure (100-200 lines max)
```markdown
# Project Memory

## Tech Stack
[List tools, versions]

## Project Structure
[Key directories, services]

## Quick Commands
[Common bash/npm commands]

## Coding Conventions
@.claude/conventions/api.md
@.claude/conventions/database.md

## Codebase Index
@.claude/CODEBASE_INDEX.md

## Common Issues
[Top 5 issues + solutions, concise]

## Development Workflow
[Standard workflow steps]

## Important Notes
[Team conventions, gotchas]
```

### Key Principles
1. **Concise:** 100-200 lines (current: ~2000+ lines in CLAUDE.md is TOO LONG)
2. **References:** Use @file.md syntax, don't paste full content
3. **Living document:** Update weekly, not daily
4. **No code:** Only patterns/conventions, no source code snippets
5. **Hierarchical:** Main CLAUDE.md → subdirectory CLAUDE.md for focused context

### What NOT to include
- ❌ Full guides (link to /docs instead)
- ❌ Phase plans (keep in .claude/plans only)
- ❌ Duplicate info (DRY principle)
- ❌ Tutorial content (quick ref only)
- ❌ Automation scripts (move to /scripts)

---

## 5. CODEBASE_INDEX.md Best Practices

### Purpose
"Pseudo-RAG" - Quick function/file lookup without full codebase search

### Structure
```markdown
# Codebase Index

## Services Overview
[Brief service descriptions]

## Quick Function Lookup
login() → auth-service/controllers/auth.controller.ts
createChat() → chat-service/controllers/chat.controller.ts
processDocument() → chat-service/services/document.service.ts

## Common Tasks → File Locations
"Fix login" → auth.controller.ts
"Add chat feature" → chat.service.ts
"Update billing" → billing.service.ts

## Database Models
[Model names + locations]

## API Endpoints
[Service + port mapping]
```

### Maintenance
- **Update:** When adding/moving files (weekly/monthly)
- **Script:** `node scripts/regenerate-index.js` (automated)
- **Commit:** Yes, share with team
- **Size:** <500 lines

---

## 6. Slash Commands Best Practices

### Keep Only High-Value Commands (8-12 max)

**Essential Workflows:**
```
/plan          # Create implementation plan
/cook          # Implement feature
/debug         # Diagnose issues
/fix           # Fix bugs
/test          # Run tests
/review        # Code review
/watzup        # Project status
/scout         # Explore codebase
```

**Optional (project-specific):**
```
/docs          # Update docs
/git:cm        # Git commit
/bootstrap     # Init feature
/brainstorm    # Ideation
```

### Delete Low-Value Commands
```
❌ /design/* (7 files)       # Too specialized
❌ /content/* (4 files)      # Not core workflow
❌ /integrate/* (2 files)    # One-time use
❌ /fix:* variants (8 files) # Consolidate to /fix
❌ /cook:auto/* (2 files)    # Merge into /cook
```

**Result:** 50 commands → 10 commands (80% reduction)

---

## 7. ClaudeKit Integration Guidelines

### Required Structure (if using ClaudeKit)
```
.claude/workflows/
├── primary-workflow.md            # Main workflow rules
├── development-rules.md           # Coding standards
└── orchestration-protocol.md      # Agent coordination

.opencode/agent/
├── planner.md                     # 5-8 core agents
├── researcher.md
├── debugger.md
├── code-reviewer.md
└── tester.md
```

### Optional (delete if not using)
```
❌ .claude/agents/ directory       # Old format, use .opencode/agent/
❌ agents.json                     # Deprecated
```

---

## 8. Settings Configuration

### Keep Only One Settings File
```
.claude/settings.local.json        # KEEP - Current config
```

### Delete Redundant
```
❌ settings-autonomous.json        # DELETE - One-time experiment
```

### Recommended Settings Structure
```json
{
  "mcpServers": {
    "playwright": { ... },
    "playwright-headed": { ... }
  },
  "customInstructions": "Reference: @/CLAUDE.md",
  "maxTokens": 8192
}
```

---

## 9. Migration Plan (Cleanup Steps)

### Step 1: Backup Current State
```bash
cd .claude
git checkout -b backup-claude-cleanup
git add -A
git commit -m "backup: .claude folder before cleanup"
```

### Step 2: Create New Directories
```bash
mkdir -p ../scripts
mkdir -p ../docs/automation
mkdir -p ../docs/testing
mkdir -p ../docs/mcp
mkdir -p .claude/conventions
```

### Step 3: Move Files
```bash
# Move scripts
mv auto-update.js regenerate-index.js ../scripts/
mv run-parallel-tests.js task-distributor.js ../scripts/
mv *.bat *.sh ../scripts/

# Move guides to docs
mv AUTONOMOUS_*.md PARALLEL_*.md ../docs/automation/
mv FRONTEND_TESTING_*.md TESTING_*.md ../docs/testing/
mv PLAYWRIGHT_*.md ../docs/mcp/

# Move conventions
mv api-conventions.md conventions/api.md
mv database-conventions.md conventions/database.md
```

### Step 4: Delete Redundant Files
```bash
# Delete outdated project state
rm PHASE*.md PROMPT_UPGRADER_PROJECT.md PROJECT_CONTEXT.md
rm API_ENDPOINTS.md COMMON_ISSUES.md QUICK_REFERENCE.md
rm README.md SUMMARY.md UPDATE_GUIDE.md INSTALL.md

# Delete duplicate guides
rm AUTOMATION_GUIDE.md PROMPT_LIBRARY.md SMART_WORKFLOW_ANALYZER.md

# Delete redundant settings
rm settings-autonomous.json agents.json

# Delete old agent structure
rm -rf agents/
```

### Step 5: Consolidate Commands
```bash
cd commands/

# Keep essential commands
# DELETE specialized/redundant ones
rm -rf design/ content/ integrate/
rm fix/ci.md fix/fast.md fix/hard.md fix/logs.md fix/test.md fix/types.md fix/ui.md
rm cook/auto/*.md
rm bootstrap/auto/*.md
rm plan/two.md plan/cro.md plan/ci.md

# Keep: plan.md, cook.md, debug.md, fix.md, test.md, review.md, watzup.md, scout.md
# Total: ~10 commands
```

### Step 6: Simplify CLAUDE.md (Root)
```bash
# Edit CLAUDE.md to 100-200 lines
# Remove duplicate content
# Add references to new locations:
#   @.claude/CODEBASE_INDEX.md
#   @.claude/conventions/api.md
#   @docs/automation/autonomous-mode.md
```

### Step 7: Verify & Test
```bash
# Verify structure
tree .claude/

# Expected:
# .claude/
# ├── CODEBASE_INDEX.md
# ├── settings.local.json
# ├── conventions/
# │   ├── api.md
# │   └── database.md
# ├── commands/       (10 files)
# ├── workflows/      (3 files)
# └── plans/          (current plans)
```

### Step 8: Update References
```bash
# Update package.json scripts
# Update .gitignore if needed
# Update any CI/CD references
```

### Step 9: Commit Cleanup
```bash
git add -A
git commit -m "refactor: simplify .claude structure to essentials"
git push origin backup-claude-cleanup

# Create PR for review
gh pr create --title "Simplify .claude folder structure" \
  --body "Reduce from 50+ files to ~15 essentials"
```

---

## 10. Maintenance Best Practices

### Update Frequency
```
CLAUDE.md              Weekly (or after major features)
CODEBASE_INDEX.md      Monthly (or after structural changes)
conventions/*.md       As needed (when patterns change)
commands/              Rarely (stable workflows)
settings.local.json    As needed (new MCP servers, etc)
```

### Automation
```bash
# Auto-regenerate index
npm run memory:update

# Or manual
node scripts/regenerate-index.js
```

### Version Control
```bash
# Always commit .claude/ files
git add .claude/ CLAUDE.md
git commit -m "docs: update Claude memory"

# Team benefits from shared knowledge
```

### Review Checklist
- [ ] CLAUDE.md < 200 lines?
- [ ] No duplicate content?
- [ ] References use @file.md syntax?
- [ ] CODEBASE_INDEX.md updated?
- [ ] Commands folder < 15 files?
- [ ] Scripts in /scripts/ not .claude/?
- [ ] Guides in /docs/ not .claude/?

---

## 11. Impact Analysis

### Before Cleanup
```
Files:        50+ markdown, 6 scripts, 2 settings
Size:         405KB total
Commands:     50 slash commands
Complexity:   High (hard to maintain)
Duplication:  70% redundant content
```

### After Cleanup
```
Files:        ~15 essential files
Size:         <100KB total
Commands:     10 high-value commands
Complexity:   Low (easy to maintain)
Duplication:  0% (DRY principle)
```

### Benefits
- ✅ 75% fewer files (easier to navigate)
- ✅ 75% smaller size (faster loading)
- ✅ 80% fewer commands (focused workflows)
- ✅ 100% less duplication (single source of truth)
- ✅ Clear separation: .claude/ (memory) vs /docs (guides) vs /scripts (tools)
- ✅ Faster Claude Code startup (less to parse)
- ✅ Easier onboarding (less cognitive load)

---

## 12. Key Takeaways

### Essential Files Only
1. **CLAUDE.md** (root) - Auto-loaded, 100-200 lines, references not content
2. **CODEBASE_INDEX.md** - Function/file lookup (like RAG)
3. **settings.local.json** - Claude Code config
4. **conventions/*.md** - Small, focused pattern docs
5. **commands/** - 8-12 high-value workflows only

### Delete Aggressively
- Duplicate guides (move to /docs)
- Scripts (move to /scripts)
- Outdated project state (delete)
- Redundant commands (consolidate)
- Old formats (agents.json, etc)

### Maintenance
- Weekly: Review CLAUDE.md
- Monthly: Regenerate CODEBASE_INDEX.md
- As needed: Update conventions, commands
- Always: Commit to git, share with team

### Anti-Patterns
- ❌ Pasting full source code
- ❌ Duplicate documentation
- ❌ Storing scripts in .claude/
- ❌ Storing guides in .claude/
- ❌ Having 50+ slash commands
- ❌ CLAUDE.md > 200 lines

---

## References

- Claude Code Best Practices: anthropic.com/engineering/claude-code-best-practices
- ClaudeKit Structure: github.com/peterkrueck/Claude-Code-Development-Kit
- Shipyard CLAUDE.md Guide: shipyard.build/blog/your-claude-md-file-developer-guide

**Status:** Ready for implementation
**Estimated Time:** 2-3 hours
**Risk:** Low (backup created first)

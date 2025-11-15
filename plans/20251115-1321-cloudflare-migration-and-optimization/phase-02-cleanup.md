# Phase 2: .claude Folder Cleanup

**Date:** 2025-11-15
**Phase:** 2 of 5
**Description:** Cleanup bloated .claude folder from 45+ files to <20 essential files
**Priority:** MEDIUM
**Status:** READY
**Estimated Duration:** 1 day

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Research:** [researcher-04-claude-structure.md](./research/researcher-04-claude-structure.md) (missing - need to analyze current structure)
- **Previous Phase:** [phase-01-assessment.md](./phase-01-assessment.md)

---

## Overview

.claude folder currently contains 45+ files (405KB total). Many are redundant, outdated, or can be consolidated.

**Goal:** Reduce to <20 core files while preserving essential functionality.

---

## Key Insights

**Current Structure Analysis:**
```
.claude/
├── CLAUDE.md (KEEP - auto-loaded)
├── CODEBASE_INDEX.md (KEEP - essential)
├── api-conventions.md (KEEP - referenced)
├── database-conventions.md (KEEP - referenced)
├── commands/ (KEEP - slash commands)
├── workflows/ (LIKELY KEEP - orchestration)
├── agents/ (REVIEW - may merge into workflows)
├── hooks/ (KEEP - automation)
├── prompts/ (CONSOLIDATE - too many files)
├── test-templates/ (MOVE to frontend/tests/)
├── Duplicate files (DELETE)
└── Redundant guides (ARCHIVE)
```

**Bloat Sources:**
- Multiple "QUICK_START" guides (consolidate)
- Parallel/Autonomous docs (merge)
- Testing docs scattered
- Old experiment files

---

## Requirements

**Must Keep:**
1. CLAUDE.md (auto-loaded project memory)
2. CODEBASE_INDEX.md (fast file navigation)
3. api-conventions.md, database-conventions.md (referenced in CLAUDE.md)
4. commands/ directory (slash commands)
5. workflows/ directory (agent orchestration)
6. hooks/ directory (git automation)

**Can Consolidate:**
1. All "QUICK_START" docs → Single QUICK_START.md
2. Parallel + Autonomous docs → MULTI_AGENT.md
3. Testing docs → TESTING.md
4. Prompt library files → prompts/README.md + essential templates

**Should Move:**
1. test-templates/ → `frontend/tests/templates/`
2. agents/ → `workflows/agents/` (if needed)

**Should Delete/Archive:**
1. Duplicate documentation
2. Old experiment files
3. Redundant guides
4. Generated files (regenerate-index.js can stay)

---

## Architecture

**Target Structure (≤20 files):**
```
.claude/
├── CLAUDE.md (main memory, 200 lines)
├── CODEBASE_INDEX.md (file navigation, 300 lines)
├── QUICK_START.md (consolidated guide, 100 lines)
├── MULTI_AGENT.md (parallel + autonomous, 200 lines)
├── TESTING.md (all testing strategies, 150 lines)
├── api-conventions.md (50 lines)
├── database-conventions.md (50 lines)
├── regenerate-index.js (automation)
├── auto-update.js (automation)
├── settings-autonomous.json (config)
├── agents.json (config)
├── commands/ (directory, ~30 files - keep as-is)
│   ├── plan.md
│   ├── cook.md
│   ├── debug.md
│   └── ... (other slash commands)
├── workflows/ (directory, 5-10 files)
│   ├── primary-workflow.md
│   ├── development-rules.md
│   └── orchestration-protocol.md
├── hooks/ (directory, 5 files)
│   ├── install-hooks.bat
│   ├── post-commit.ps1
│   └── ...
└── prompts/ (directory, 5-10 essential prompts)
    ├── README.md (catalog)
    ├── autonomous-fix-all.txt
    └── parallel-template.txt
```

**Total: ~15 root files + 3 directories = ~18 core items**

---

## Related Code Files

**Files to Audit:**
- All files in `D:\my-saas-chat\.claude\` (45+ files)
- Cross-reference with CLAUDE.md (which files are referenced?)
- Check commands/ for unused slash commands

**Files to Move:**
- `D:\my-saas-chat\.claude\test-templates\*.js` → `D:\my-saas-chat\frontend\tests\templates\`
- `D:\my-saas-chat\.claude\test-templates\*.ts` → `D:\my-saas-chat\frontend\tests\templates\`

**Files to Create:**
- `D:\my-saas-chat\.claude\QUICK_START.md` (consolidate all quick starts)
- `D:\my-saas-chat\.claude\MULTI_AGENT.md` (merge parallel + autonomous)
- `D:\my-saas-chat\.claude\TESTING.md` (merge all testing docs)

---

## Implementation Steps

### Step 1: Audit Current Files (1 hour)

```bash
# List all files with sizes
cd .claude
ls -lh  # Linux/Mac
dir     # Windows

# Create audit spreadsheet
# Columns: Filename | Size | Keep/Delete/Consolidate | Reason
```

**Categorize each file:**
- KEEP: Referenced in CLAUDE.md or essential
- CONSOLIDATE: Merge into larger file
- MOVE: Relocate to better location
- DELETE: Redundant or outdated
- ARCHIVE: Keep but move to .claude/archive/

### Step 2: Create Consolidated Files (2 hours)

**QUICK_START.md:**
Merge content from:
- AUTONOMOUS_QUICK_START.md
- PARALLEL_QUICK_START.md
- FRONTEND_TESTING_QUICK_START.md
- PLAYWRIGHT_MCP_QUICK_START.md

**MULTI_AGENT.md:**
Merge content from:
- AUTONOMOUS_MODE.md
- PARALLEL_AGENTS.md
- PARALLEL_WORKFLOW.md

**TESTING.md:**
Merge content from:
- FRONTEND_TESTING_AGENTS.md
- TESTING_SYSTEM_SUMMARY.md
- PLAYWRIGHT_MCP_GUIDE.md

### Step 3: Move Files to Proper Locations (30 min)

```bash
# Move test templates to frontend
mkdir -p ../frontend/tests/templates
mv test-templates/* ../frontend/tests/templates/
rmdir test-templates

# Move agents to workflows (if merging)
mv agents/*.md workflows/agents/
rmdir agents
```

### Step 4: Delete Redundant Files (30 min)

**Before deleting, verify:**
- NOT referenced in CLAUDE.md
- NOT referenced in CODEBASE_INDEX.md
- NOT used by automation scripts
- NOT critical for workflows

**Create archive first:**
```bash
mkdir archive
mv REDUNDANT_FILE.md archive/
```

### Step 5: Update References (1 hour)

**Update CLAUDE.md:**
- Fix links to consolidated files
- Remove references to deleted files
- Add references to new files

**Update CODEBASE_INDEX.md:**
- Update .claude folder structure
- Fix any broken links

**Update commands/:**
- Fix slash commands referencing moved files

### Step 6: Verify Functionality (30 min)

```bash
# Test slash commands still work
/plan "test task"
/cook "test task"
/debug "test issue"

# Test automation scripts
npm run memory:check
npm run memory:update

# Test hooks
git add . && git commit -m "test"
```

---

## Todo List

- [ ] Create file audit spreadsheet
- [ ] Categorize all 45+ files (KEEP/CONSOLIDATE/MOVE/DELETE)
- [ ] Create QUICK_START.md (consolidate 4 guides)
- [ ] Create MULTI_AGENT.md (merge 3 files)
- [ ] Create TESTING.md (merge 3 files)
- [ ] Move test-templates/ to frontend/tests/templates/
- [ ] Move agents/ to workflows/agents/ (if needed)
- [ ] Create .claude/archive/ directory
- [ ] Move redundant files to archive/
- [ ] Delete truly obsolete files (after archive)
- [ ] Update CLAUDE.md references
- [ ] Update CODEBASE_INDEX.md
- [ ] Update commands/ references
- [ ] Test all slash commands
- [ ] Test automation scripts
- [ ] Test git hooks
- [ ] Verify file count <20 (excluding commands/, workflows/, hooks/, prompts/)

---

## Success Criteria

**Phase Complete When:**
- [ ] .claude root contains <20 files (excluding subdirectories)
- [ ] All essential functionality preserved
- [ ] All links in CLAUDE.md work
- [ ] All slash commands work
- [ ] Automation scripts work
- [ ] Git hooks work
- [ ] Total size reduced by ≥30%

**Specific Targets:**
- Root files: <20
- Total files (including subdirs): <80
- Total size: <300KB (vs 405KB current)
- Broken links: 0
- Missing references: 0

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Delete critical file | HIGH | LOW | Archive before delete, test thoroughly |
| Break slash commands | MEDIUM | MEDIUM | Test each command after cleanup |
| Break automation | MEDIUM | LOW | Test hooks/scripts after changes |
| Lose documentation | LOW | LOW | Archive all deletes, can restore |

---

## Security Considerations

**Before deleting:**
- Check for hardcoded secrets/tokens
- Archive first (can restore if needed)
- Don't commit sensitive data to archive

**Files to audit:**
- settings-autonomous.json
- agents.json
- Any config files

---

## Next Steps

**After Cleanup:**
- Document new structure in CLAUDE.md
- Update README.md with simplified layout
- Consider similar cleanup for:
  - plans/ directory
  - docs/ directory

**Maintenance:**
- Review .claude quarterly
- Delete old plan files after implementation
- Keep only active documentation

---

## File Audit Template

| File | Size | Category | Reason | Action |
|------|------|----------|--------|--------|
| CLAUDE.md | 50KB | KEEP | Auto-loaded memory | No change |
| CODEBASE_INDEX.md | 40KB | KEEP | Essential navigation | No change |
| AUTONOMOUS_QUICK_START.md | 5KB | CONSOLIDATE | Merge → QUICK_START.md | Delete after merge |
| ... | ... | ... | ... | ... |

---

## Consolidation Map

**QUICK_START.md** ← Merge from:
- AUTONOMOUS_QUICK_START.md
- PARALLEL_QUICK_START.md
- FRONTEND_TESTING_QUICK_START.md
- PLAYWRIGHT_MCP_QUICK_START.md

**MULTI_AGENT.md** ← Merge from:
- AUTONOMOUS_MODE.md
- PARALLEL_AGENTS.md
- PARALLEL_WORKFLOW.md
- agents/production-web-architect.md (if not used)

**TESTING.md** ← Merge from:
- FRONTEND_TESTING_AGENTS.md
- TESTING_SYSTEM_SUMMARY.md
- PLAYWRIGHT_MCP_GUIDE.md

**DELETE (after archiving):**
- Duplicate SUMMARY.md files
- Old experiment docs
- Redundant README variations

---

## References

- CLAUDE.md sections on automation
- Current .claude folder structure (45+ files found via Glob)

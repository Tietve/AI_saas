# 📦 Archive Index - Historical Documentation

> **Purpose:** Catalog of archived documentation and completed work
> **Last Updated:** 2025-11-15
> **Archived By:** Agent 19 - Cleanup Task

---

## 📋 WHAT'S IN THE ARCHIVE

This archive contains:
- ✅ Completed phase documentation
- ✅ Historical project plans
- ✅ Old brainstorming reports
- ✅ Test templates (moved after setup)
- ✅ Completed project files
- ✅ Outdated reference documents
- ✅ Archived slash commands (nested variants)

**Why archived?**
- These files are no longer actively referenced
- Content has been consolidated into current guides
- Historical record for future reference
- Reduce clutter in main `.claude/` directory

---

## 📁 ARCHIVE STRUCTURE

```
.claude/archive/
├── phases/               # Completed development phases
├── plans/                # Historical planning documents
├── completed-projects/   # Finished project documentation
├── test-templates/       # Template files (setup complete)
├── commands/             # Archived command variants
└── outdated/             # Superseded documentation
```

---

## 🗂️ PHASES (Completed Development Phases)

### PHASE3_COMPLETE.md
**Date:** 2025-11
**Purpose:** Phase 3 completion report
**Status:** ✅ Completed
**Size:** 9.7KB
**Why Archived:** Phase completed, superseded by current development focus

### PHASE3_STATE.md
**Date:** 2025-11
**Purpose:** Phase 3 state snapshot
**Status:** ✅ Completed
**Size:** 2.3KB
**Why Archived:** Historical state, no longer current

### PHASE4_PLAN.md
**Date:** 2025-11
**Purpose:** Phase 4 planning document
**Status:** ✅ Completed
**Size:** 9.2KB
**Why Archived:** Phase completed or superseded

---

## 📊 PLANS (Historical Planning Documents)

### market-launch-brainstorm-2025-11-13.md
**Date:** 2025-11-13
**Purpose:** Market launch strategy brainstorming
**Status:** ✅ Referenced in CLAUDE.md
**Size:** 16KB
**Why Archived:** Planning complete, insights integrated into CLAUDE.md
**Reference in CLAUDE.md:** Line 428

**Key Content:**
- Product strategy & market positioning
- Unit economics analysis
- MVP feature set prioritization
- Competitive analysis
- Risk mitigation strategies

**Where to find insights now:**
- Product Strategy → CLAUDE.md "PRODUCT STRATEGY & MARKET LAUNCH PLAN"
- Unit Economics → CLAUDE.md "Unit Economics (Critical Constraints)"
- Feature Set → CLAUDE.md "MVP Feature Set (Tier 1 - MUST HAVE)"

---

## 🧪 TEST TEMPLATES (Setup Complete)

All test templates moved to archive after frontend testing system setup:

### e2e.spec.ts
**Size:** 12KB
**Purpose:** E2E test template for Playwright
**Status:** ✅ Setup complete in `frontend/tests/e2e/`
**Why Archived:** Template copied to project, no longer needed in `.claude/`

### integration.spec.ts
**Size:** 11KB
**Purpose:** Backend integration test template
**Status:** ✅ Setup complete in `frontend/tests/integration/`
**Why Archived:** Template deployed, archived for reference

### visual-regression.spec.ts
**Size:** 5.5KB
**Purpose:** Visual regression test template
**Status:** ✅ Setup complete in `frontend/tests/visual/`
**Why Archived:** Template in use, archived original

### layout-checker.js
**Size:** 7.6KB
**Purpose:** UI layout checker utility
**Status:** ✅ Setup complete in `frontend/tests/layout/`
**Why Archived:** Utility deployed to project

**Current Testing Guide:** `.claude/TESTING_GUIDE.md`

---

## 📝 COMPLETED PROJECTS

### PROMPT_UPGRADER_PROJECT.md
**Date:** 2025-11
**Size:** 7.3KB
**Purpose:** Prompt upgrader feature documentation
**Status:** ✅ Feature completed and integrated
**Why Archived:** Project-specific doc, feature complete

### TESTING_SYSTEM_SUMMARY.md
**Date:** 2025-11
**Size:** 13KB
**Purpose:** Testing system implementation summary
**Status:** ✅ Testing system deployed
**Why Archived:** Consolidated into `.claude/TESTING_GUIDE.md`

**Current Guide:** `.claude/TESTING_GUIDE.md` (comprehensive)

---

## 🗑️ OUTDATED (Superseded Documentation)

### PROJECT_CONTEXT.md
**Size:** 6.1KB
**Why Archived:** Context integrated into CLAUDE.md, no longer maintained

### SUMMARY.md
**Size:** 8.6KB
**Why Archived:** Outdated project summary, replaced by current CLAUDE.md

### QUICK_REFERENCE.md
**Size:** 3.7KB
**Why Archived:** Quick reference info moved to CLAUDE.md and CODEBASE_INDEX.md

### API_ENDPOINTS.md
**Size:** 1.2KB
**Why Archived:** API info integrated into `api-conventions.md` and CODEBASE_INDEX.md

### COMMON_ISSUES.md
**Size:** 1.4KB
**Why Archived:** Common issues moved to CLAUDE.md "Common Issues & Solutions" section

**Current References:**
- Project context → `CLAUDE.md`
- API endpoints → `.claude/api-conventions.md` + `.claude/CODEBASE_INDEX.md`
- Common issues → `CLAUDE.md` (lines 133-161)

---

## 🎯 COMMANDS (Archived Command Variants)

Nested command variants archived to reduce clutter. Only top-level essential commands retained.

### Archived Command Categories:

**bootstrap/** (3 files)
- `bootstrap/auto.md` - Auto bootstrap
- `bootstrap/auto/fast.md` - Fast auto bootstrap

**content/** (4 files)
- `content/cro.md` - CRO content
- `content/enhance.md` - Content enhancement
- `content/fast.md` - Fast content
- `content/good.md` - Good content

**cook/** (2 files)
- `cook/auto.md` - Auto cooking
- `cook/auto/fast.md` - Fast auto cooking

**design/** (6 files)
- `design/3d.md` - 3D design
- `design/describe.md` - Describe design
- `design/fast.md` - Fast design
- `design/good.md` - Good design
- `design/screenshot.md` - Screenshot-based design
- `design/video.md` - Video-based design

**docs/** (3 files)
- `docs/init.md` - Initialize docs
- `docs/summarize.md` - Summarize docs
- `docs/update.md` - Update docs

**fix/** (6 files)
- `fix/ci.md` - CI/CD fixes
- `fix/fast.md` - Fast fixes
- `fix/hard.md` - Hard issues
- `fix/logs.md` - Log analysis
- `fix/test.md` - Test fixes
- `fix/types.md` - Type fixes
- `fix/ui.md` - UI fixes

**git/** (3 files)
- `git/cm.md` - Commit only
- `git/cp.md` - Commit and push
- `git/pr.md` - Create PR

**integrate/** (2 files)
- `integrate/polar.md` - Polar.sh integration
- `integrate/sepay.md` - SePay.vn integration

**plan/** (3 files)
- `plan/ci.md` - CI planning
- `plan/cro.md` - CRO planning
- `plan/two.md` - Two-approach planning

**review/** (1 file)
- `review/codebase.md` - Codebase review

**scout/** (1 file)
- `scout/ext.md` - External scouting

**skill/** (3 files)
- `skill/create.md` - Create skill
- `skill/fix-logs.md` - Fix skill logs
- `skill/optimize.md` - Optimize skill

**Total Archived Commands:** 37 nested command files

**Retained Commands (13 essential):**
- ask.md
- bootstrap.md
- brainstorm.md
- code.md
- cook.md
- debug.md
- fix.md
- journal.md
- plan.md
- scout.md
- test.md
- use-mcp.md
- watzup.md

**Why Archived:**
- Reduce command clutter from 50 files to 13
- Keep only most-used top-level commands
- Specialized variants archived but accessible if needed

---

## 🔍 HOW TO USE ARCHIVED FILES

### To Reference Archived Content:

```bash
# View archived file
cat .claude/archive/phases/PHASE3_COMPLETE.md

# Search in archive
grep -r "pattern" .claude/archive/

# Restore file if needed (copy back)
cp .claude/archive/outdated/COMMON_ISSUES.md .claude/
```

### To Find Current Equivalent:

Most archived content has been consolidated into:
- **CLAUDE.md** - Main project memory
- **CODEBASE_INDEX.md** - File locations & architecture
- **AUTONOMOUS_GUIDE.md** - Autonomous mode (consolidated)
- **PARALLEL_GUIDE.md** - Parallel agents (consolidated)
- **TESTING_GUIDE.md** - Frontend testing (consolidated)
- **PLAYWRIGHT_GUIDE.md** - Browser automation (consolidated)

---

## 📊 ARCHIVE STATISTICS

**Files Archived:** 60+ files
**Space Saved in Main .claude/:** ~250KB (60% reduction)
**Categories:** 6 main categories
**Total Archive Size:** ~200KB

**Before Cleanup:**
- 110 files
- 563KB total size
- Complex navigation

**After Cleanup:**
- ~50 files (active)
- ~313KB (active)
- Clean, organized structure
- 60+ files archived for reference

---

## 💡 BENEFITS OF ARCHIVING

### Organization:
- ✅ Essential files easy to find
- ✅ Reduced clutter in main `.claude/` directory
- ✅ Clear separation: active vs. historical

### Performance:
- ✅ Faster file searches
- ✅ Reduced context loading time
- ✅ Easier navigation for AI and humans

### Maintainability:
- ✅ Historical record preserved
- ✅ Easy to restore if needed
- ✅ Clear documentation of what was archived and why

---

## 🔄 MAINTENANCE

### When to Add to Archive:
- ✅ Completed project phases
- ✅ Outdated documentation superseded by new versions
- ✅ Historical planning documents (insights integrated)
- ✅ Template files after deployment
- ✅ Specialized commands no longer frequently used

### When to Restore from Archive:
- Need historical context
- Reference old implementation approach
- Compare with previous versions
- Restore accidentally archived content

---

## 📚 SEE ALSO

- **Active Documentation:** `.claude/` (parent directory)
- **Project Memory:** `.claude/CLAUDE.md`
- **Codebase Index:** `.claude/CODEBASE_INDEX.md`
- **Automation Guide:** `.claude/AUTOMATION_GUIDE.md`

---

**Last Cleanup:** 2025-11-15
**Next Review:** When major project phase completes
**Maintained By:** Claude Code automation

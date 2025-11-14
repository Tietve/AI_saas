# Visual Regression Tests - Index

Welcome to the visual regression test suite! This directory contains comprehensive Playwright screenshot tests for the frontend application.

## 📁 Files Overview

### Test Files (TypeScript)

| File | Tests | Lines | Description |
|------|-------|-------|-------------|
| **screenshots.spec.ts** | 9 | 192 | Main page screenshots (login, signup, chat, pricing, 404) |
| **responsive.spec.ts** | 12 | 250 | Responsive design across desktop/tablet/mobile |
| **themes.spec.ts** | 12 | 368 | Light/dark mode and theme variations |
| **components.spec.ts** | 24 | 487 | Individual UI components (buttons, forms, modals, etc.) |

**Total: 57 tests, ~1,300 lines of test code**

### Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Complete documentation and best practices |
| **QUICK_START.md** | Quick reference for common commands |
| **TEST_COVERAGE.md** | Detailed breakdown of what's tested |
| **PACKAGE_SCRIPTS.md** | Suggested npm scripts to add |
| **INDEX.md** | This file - navigation guide |

---

## 🚀 Getting Started

### New to this project?
1. Read **QUICK_START.md** (5 min read)
2. Run tests: `npx playwright test tests/visual/`
3. View results: `npx playwright show-report`

### Need detailed info?
- **Full documentation:** README.md
- **Coverage details:** TEST_COVERAGE.md
- **Script setup:** PACKAGE_SCRIPTS.md

---

## 📊 What's Tested

### Pages (6 unique routes)
- Homepage (redirects)
- Login page
- Signup page
- Chat page
- Pricing page
- Subscription page
- 404 page

### Viewports (3 sizes)
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

### Themes (2 modes)
- Light mode
- Dark mode

### Components
- Forms (login, signup)
- Buttons (all states)
- Inputs (focus, error, filled)
- Chat interface
- Navigation
- Modals
- Dropdowns
- Pricing cards
- Loading states

**Total Screenshots: ~100 baseline images**

---

## 🎯 Quick Commands

```bash
# Run all visual tests
npx playwright test tests/visual/

# Run specific suite
npx playwright test tests/visual/screenshots.spec.ts
npx playwright test tests/visual/responsive.spec.ts
npx playwright test tests/visual/themes.spec.ts
npx playwright test tests/visual/components.spec.ts

# Update baselines (after intentional UI changes)
npx playwright test tests/visual/ --update-snapshots

# View test report with diff viewer
npx playwright show-report

# Debug mode
npx playwright test tests/visual/ --debug
```

---

## 📖 Documentation Guide

### By Use Case

**"I want to run tests quickly"**
→ Read: QUICK_START.md

**"I need to understand what's tested"**
→ Read: TEST_COVERAGE.md

**"I want full documentation"**
→ Read: README.md

**"I want to add npm scripts"**
→ Read: PACKAGE_SCRIPTS.md

**"I want to see all test code"**
→ Open: *.spec.ts files

### By Experience Level

**Beginner**
1. QUICK_START.md
2. Run tests
3. View report

**Intermediate**
1. README.md
2. TEST_COVERAGE.md
3. Customize tests

**Advanced**
1. Read all docs
2. Add CI/CD integration
3. Extend test coverage

---

## 🗂️ Test File Details

### screenshots.spec.ts
**Purpose:** Full-page screenshots of main routes

**Test Groups:**
- Page Screenshots (5 tests)
- Authenticated Pages (2 tests)
- Page Elements and States (2 tests)

**Key Features:**
- Full page screenshots
- Mocked authentication
- Error state testing
- Dynamic content masking

**When to run:** After page layout changes

---

### responsive.spec.ts
**Purpose:** Test responsive behavior across viewports

**Test Groups:**
- Multiple Viewports (3 × 4 pages = 12 tests)
- Mobile Behavior (3 tests)
- Navigation (2 tests)
- Forms (2 tests)
- Pricing Cards (3 tests)

**Key Features:**
- Desktop/tablet/mobile testing
- Sidebar behavior
- Form layouts
- Card grid layouts

**When to run:** After responsive design changes

---

### themes.spec.ts
**Purpose:** Test light/dark mode and theme consistency

**Test Groups:**
- Light Mode (4 tests)
- Dark Mode (5 tests)
- Theme Toggle (2 tests)
- Component Comparison (3 tests)
- Contrast Verification (2 tests)

**Key Features:**
- Theme switching
- Theme persistence
- Component variations
- Contrast checking

**When to run:** After theme or color changes

---

### components.spec.ts
**Purpose:** Test individual UI components

**Test Groups:**
- Form Components (5 tests)
- Button Components (4 tests)
- Chat Interface (5 tests)
- Modals and Dialogs (3 tests)
- Pricing Components (3 tests)
- Navigation Components (2 tests)
- Loading States (2 tests)

**Key Features:**
- Component isolation
- State variations (hover, focus, error)
- Interactive elements
- Loading indicators

**When to run:** After component updates

---

## 🔧 Maintenance

### Regular Tasks
- [ ] Run tests before commits
- [ ] Update baselines after intentional UI changes
- [ ] Review test failures in PRs
- [ ] Keep documentation in sync

### When to Update Baselines
```bash
# After intentional changes
npx playwright test tests/visual/ --update-snapshots
git add tests/visual/
git commit -m "Update visual baselines"
```

### When to Add Tests
- New page added → Add to screenshots.spec.ts
- New component → Add to components.spec.ts
- New theme → Add to themes.spec.ts
- New viewport → Add to responsive.spec.ts

---

## 📈 Test Statistics

| Metric | Value |
|--------|-------|
| Total tests | 57 |
| Total screenshots | ~100 |
| Test code lines | 1,297 |
| Documentation lines | 936 |
| Files | 8 |
| Browsers | 3 (Chromium, Firefox, WebKit) |
| Viewports | 3 (Desktop, Tablet, Mobile) |
| Pages covered | 6 |
| Execution time | ~13-17 min (single browser) |

---

## 🔗 Related Files

### Project Structure
```
frontend/
├── tests/
│   ├── visual/              ← You are here
│   │   ├── *.spec.ts        ← Test files
│   │   ├── *.md             ← Documentation
│   │   └── *-snapshots/     ← Screenshots (generated)
│   ├── e2e/                 ← E2E tests
│   └── integration/         ← Integration tests
├── playwright.config.ts     ← Playwright config
└── package.json             ← Dependencies
```

### Key Configuration Files
- **playwright.config.ts** - Playwright settings
- **package.json** - Dependencies and scripts
- **.gitignore** - Ignore snapshots (optional)

---

## 💡 Tips

1. **First Run:** Tests create baselines, so all pass
2. **Subsequent Runs:** Tests compare against baselines
3. **Failures:** Review with `npx playwright show-report`
4. **Updates:** Use `--update-snapshots` flag
5. **Speed:** Run specific test files during development
6. **CI/CD:** Only run chromium in CI for speed

---

## 📞 Need Help?

- **Quick questions:** Check QUICK_START.md
- **Detailed info:** Check README.md
- **Coverage info:** Check TEST_COVERAGE.md
- **Commands:** Check PACKAGE_SCRIPTS.md
- **Playwright docs:** https://playwright.dev/docs/test-snapshots

---

## ✅ Ready to Start?

```bash
# Step 1: Create baselines
npx playwright test tests/visual/

# Step 2: View report
npx playwright show-report

# Step 3: Make UI changes
# ... edit your code ...

# Step 4: Run tests again
npx playwright test tests/visual/

# Step 5: Review diffs
npx playwright show-report

# Step 6: Update baselines (if needed)
npx playwright test tests/visual/ --update-snapshots
```

---

**Created:** 2025-11-06
**Version:** 1.0
**Status:** ✅ Complete and production-ready

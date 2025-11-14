# Visual Regression Tests - Quick Start

## TL;DR

```bash
# First time - Create baselines
npx playwright test tests/visual/

# After UI changes - Compare
npx playwright test tests/visual/

# View failures
npx playwright show-report

# Update baselines (if changes are intentional)
npx playwright test tests/visual/ --update-snapshots
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npx playwright test tests/visual/` | Run all visual tests |
| `npx playwright test tests/visual/screenshots.spec.ts` | Run specific test file |
| `npx playwright test tests/visual/ --update-snapshots` | Update all baselines |
| `npx playwright show-report` | View test results with diff viewer |
| `npx playwright test tests/visual/ --debug` | Debug mode |
| `npx playwright test tests/visual/ --headed` | Run with visible browser |
| `npx playwright test tests/visual/ --project=chromium` | Run in specific browser |

## Workflow

### 1. First Time Setup
```bash
# Install dependencies (if not already done)
npm install

# Run tests to create baselines
npx playwright test tests/visual/

# All tests should pass (green) - baselines created
```

### 2. After Making UI Changes
```bash
# Run tests to compare
npx playwright test tests/visual/

# If tests fail, review diffs
npx playwright show-report

# If changes are intentional, update baselines
npx playwright test tests/visual/ --update-snapshots

# Commit updated baselines
git add tests/visual/
git commit -m "Update visual regression baselines"
```

### 3. Before Committing Code
```bash
# Run visual tests
npx playwright test tests/visual/

# Ensure all pass or update baselines if needed
```

## Test Files Overview

| File | Purpose | Screenshot Count |
|------|---------|------------------|
| `screenshots.spec.ts` | Main pages (login, signup, chat, etc.) | ~10 |
| `responsive.spec.ts` | Responsive design (desktop/tablet/mobile) | ~30 |
| `themes.spec.ts` | Light/dark mode and themes | ~35 |
| `components.spec.ts` | Individual components (buttons, forms, etc.) | ~25 |

**Total: ~100 screenshots**

## When Tests Fail

### Option 1: Changes Are Bugs (Fix Code)
```bash
# Fix the CSS/component
# Re-run tests
npx playwright test tests/visual/
```

### Option 2: Changes Are Intentional (Update Baselines)
```bash
# Update baselines
npx playwright test tests/visual/ --update-snapshots

# Verify changes look good
npx playwright show-report

# Commit new baselines
git add tests/visual/
git commit -m "Update visual baselines after button redesign"
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tests take too long | Run specific file: `npx playwright test tests/visual/screenshots.spec.ts` |
| Too many pixel diffs | Increase `maxDiffPixels` in test file |
| Flaky tests | Add longer waits or mask dynamic content |
| Different results locally vs CI | Generate baselines in CI environment |

## Tips

- **Run specific tests during development:**
  ```bash
  npx playwright test tests/visual/components.spec.ts
  ```

- **Run tests for specific viewport:**
  ```bash
  npx playwright test tests/visual/responsive.spec.ts --grep "mobile"
  ```

- **Debug specific test:**
  ```bash
  npx playwright test tests/visual/screenshots.spec.ts --debug --grep "login"
  ```

- **View screenshots:**
  - Baselines: `frontend/tests/visual/*-snapshots/`
  - Failures: `playwright-report/`

## What Gets Tested

✅ All major pages (login, signup, chat, pricing, etc.)
✅ Responsive design (desktop, tablet, mobile)
✅ Light and dark themes
✅ Component states (default, hover, focus, error, loading)
✅ Forms and inputs
✅ Buttons
✅ Navigation
✅ Modals and dropdowns
✅ Chat interface

## Next Steps

1. Run tests to create baselines
2. Integrate into CI/CD pipeline
3. Run before every commit
4. Update baselines after intentional UI changes
5. Review diffs in PRs

---

**Need help?** See `README.md` for full documentation.

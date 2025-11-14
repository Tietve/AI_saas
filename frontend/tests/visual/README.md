# Visual Regression Tests

This directory contains comprehensive visual regression tests using Playwright screenshots.

## Overview

Visual regression testing helps catch unintended visual changes by comparing screenshots against baseline images. These tests capture the UI appearance across different pages, viewports, themes, and component states.

## Test Files

### 1. `screenshots.spec.ts` - Main Pages
Captures full-page screenshots of all major routes:
- Homepage (redirects to chat/login)
- Login page
- Signup page
- Chat page (authenticated)
- Pricing page
- Subscription page (authenticated)
- 404 page
- Pages with error states

**Screenshots:** ~10 baseline images

### 2. `responsive.spec.ts` - Responsive Design
Tests responsive behavior across viewports:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
- Mobile sidebar behavior
- Form layouts at different sizes
- Pricing card layouts

**Screenshots:** ~30+ baseline images

### 3. `themes.spec.ts` - Theme Variations
Tests light/dark mode and theme consistency:
- Light mode for all pages
- Dark mode for all pages
- Theme toggle functionality
- Theme persistence across navigation
- Component comparisons (buttons, forms, inputs)
- Color contrast verification

**Screenshots:** ~35+ baseline images

### 4. `components.spec.ts` - Individual Components
Tests specific UI components:
- Forms (default, filled, error states)
- Buttons (default, hover, disabled, loading)
- Chat interface (sidebar, input, messages)
- Modals and dialogs
- Dropdowns (user menu, model selector)
- Navigation components
- Pricing cards
- Loading states (spinners, skeletons)

**Screenshots:** ~25+ baseline images

**Total Screenshots:** ~100+ baseline images

## Running the Tests

### First Run - Create Baselines
```bash
# Run all visual tests (creates baseline screenshots)
npx playwright test tests/visual/

# Run specific test file
npx playwright test tests/visual/screenshots.spec.ts
npx playwright test tests/visual/responsive.spec.ts
npx playwright test tests/visual/themes.spec.ts
npx playwright test tests/visual/components.spec.ts
```

### Subsequent Runs - Compare Against Baselines
```bash
# Run all visual tests (compares against baselines)
npx playwright test tests/visual/

# If tests fail, review the diff images in playwright-report
npx playwright show-report
```

### Update Baselines
```bash
# Update all baselines after intentional UI changes
npx playwright test tests/visual/ --update-snapshots

# Update specific test baselines
npx playwright test tests/visual/screenshots.spec.ts --update-snapshots
```

### Run in Specific Browser
```bash
# Run only in Chromium
npx playwright test tests/visual/ --project=chromium

# Run in all browsers
npx playwright test tests/visual/ --project=chromium --project=firefox --project=webkit
```

### Debug Mode
```bash
# Run in debug mode with UI
npx playwright test tests/visual/screenshots.spec.ts --debug

# Run with headed browser
npx playwright test tests/visual/ --headed
```

## Screenshot Storage

Baseline screenshots are stored in:
```
frontend/tests/visual/
├── screenshots.spec.ts-snapshots/
│   ├── chromium-win32/
│   │   ├── homepage-redirect.png
│   │   ├── login-page.png
│   │   └── ...
│   └── firefox-win32/
│       └── ...
├── responsive.spec.ts-snapshots/
├── themes.spec.ts-snapshots/
└── components.spec.ts-snapshots/
```

## Handling Test Failures

When visual tests fail, Playwright generates:
1. **Diff images** - Highlighting differences
2. **Actual images** - Current screenshot
3. **Expected images** - Baseline screenshot

### Review Failures
```bash
# View HTML report with diff viewer
npx playwright show-report
```

### If Changes Are Intentional
```bash
# Update baselines for all tests
npx playwright test tests/visual/ --update-snapshots

# Update specific test
npx playwright test tests/visual/screenshots.spec.ts --update-snapshots
```

### If Changes Are Bugs
Fix the CSS/component code and re-run tests.

## Configuration

### Diff Tolerance
Tests use `maxDiffPixels` to allow minor rendering differences:
- Static pages: 50-100 pixels
- Dynamic pages: 100-200 pixels
- Components: 50-150 pixels

Adjust in test files if needed:
```typescript
await expect(page).toHaveScreenshot('name.png', {
  maxDiffPixels: 100, // Adjust tolerance
});
```

### Masking Dynamic Content
Tests mask dynamic elements like timestamps:
```typescript
await expect(page).toHaveScreenshot('chat.png', {
  mask: [
    page.locator('[data-testid="timestamp"]'),
    page.locator('.timestamp'),
  ],
});
```

Add more selectors if your app has dynamic content.

## Best Practices

### 1. Consistent Test Data
Use mocked authentication and predictable data:
```typescript
await page.evaluate(() => {
  localStorage.setItem('accessToken', 'mock-token');
  localStorage.setItem('user', JSON.stringify({
    id: 'mock-user-id',
    email: 'test@example.com'
  }));
});
```

### 2. Wait for Stability
Always wait for animations/transitions:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Wait for animations
```

### 3. Full Page Screenshots
Use `fullPage: true` for page-level tests:
```typescript
await expect(page).toHaveScreenshot('page.png', {
  fullPage: true,
});
```

### 4. Component Screenshots
For specific components, screenshot the element:
```typescript
const button = page.locator('button[type="submit"]');
await expect(button).toHaveScreenshot('button.png');
```

### 5. Update Baselines After UI Changes
After intentional design changes:
```bash
npx playwright test tests/visual/ --update-snapshots
git add tests/visual/
git commit -m "Update visual regression baselines"
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Visual Tests
  run: npx playwright test tests/visual/

- name: Upload Test Results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: playwright-report/
```

### Handling CI Differences
If screenshots differ between local and CI:
1. Run tests in CI to generate CI baselines
2. Download artifacts and commit them
3. Or use `npx playwright test --update-snapshots` in CI

## Troubleshooting

### Tests Fail Locally But Pass in CI
- Font rendering differences
- Screen resolution differences
- Solution: Generate baselines in same environment as CI

### Too Many Pixel Differences
- Increase `maxDiffPixels` tolerance
- Check for dynamic content (timestamps, IDs)
- Add more masking for dynamic elements

### Screenshots Look Different Across Browsers
- Expected behavior - each browser renders differently
- Baselines are stored per browser (chromium, firefox, webkit)
- Run tests for all target browsers

### Flaky Tests
- Add longer waits: `await page.waitForTimeout(1000)`
- Wait for specific elements: `await element.waitFor()`
- Use `networkidle` load state
- Mask animated elements

## Pages Covered

### Public Pages
- [x] Login page
- [x] Signup page
- [x] Pricing page
- [x] 404 page

### Authenticated Pages
- [x] Chat page
- [x] Subscription page

### Responsive Breakpoints
- [x] Desktop (1920x1080)
- [x] Tablet (768x1024)
- [x] Mobile (375x667)

### Themes
- [x] Light mode
- [x] Dark mode
- [x] Theme toggle
- [x] Theme persistence

### Components
- [x] Forms (login, signup)
- [x] Buttons (all states)
- [x] Chat interface
- [x] Modals/dialogs
- [x] Dropdowns
- [x] Navigation
- [x] Pricing cards
- [x] Loading states

## Maintenance

### Regular Updates
- Update baselines after intentional UI changes
- Review failed tests in PRs
- Keep tests in sync with component changes

### Adding New Tests
1. Create new test in appropriate file
2. Run with `--update-snapshots` to create baseline
3. Verify screenshot looks correct
4. Commit baseline images with code

### Removing Tests
1. Delete test from spec file
2. Delete baseline images from snapshots folder
3. Commit changes

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**Last Updated:** 2025-11-06
**Test Count:** 100+ screenshots
**Browsers:** Chromium, Firefox, WebKit
**Viewports:** Desktop, Tablet, Mobile

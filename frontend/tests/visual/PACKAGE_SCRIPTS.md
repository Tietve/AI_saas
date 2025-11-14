# Suggested Package.json Scripts

Add these scripts to `frontend/package.json` for easier visual testing:

```json
{
  "scripts": {
    "test:visual": "playwright test tests/visual/",
    "test:visual:update": "playwright test tests/visual/ --update-snapshots",
    "test:visual:report": "playwright show-report",
    "test:visual:screenshots": "playwright test tests/visual/screenshots.spec.ts",
    "test:visual:responsive": "playwright test tests/visual/responsive.spec.ts",
    "test:visual:themes": "playwright test tests/visual/themes.spec.ts",
    "test:visual:components": "playwright test tests/visual/components.spec.ts",
    "test:visual:debug": "playwright test tests/visual/ --debug",
    "test:visual:headed": "playwright test tests/visual/ --headed",
    "test:visual:chromium": "playwright test tests/visual/ --project=chromium"
  }
}
```

## Usage

After adding these scripts, you can run:

```bash
# Run all visual tests
npm run test:visual

# Update all baselines
npm run test:visual:update

# View test report
npm run test:visual:report

# Run specific test suite
npm run test:visual:screenshots
npm run test:visual:responsive
npm run test:visual:themes
npm run test:visual:components

# Debug mode
npm run test:visual:debug

# Run with visible browser
npm run test:visual:headed

# Run only in Chromium
npm run test:visual:chromium
```

## CI/CD Scripts

For CI/CD, you might want to add:

```json
{
  "scripts": {
    "test:visual:ci": "playwright test tests/visual/ --project=chromium --reporter=github",
    "test:visual:ci-all": "playwright test tests/visual/ --reporter=github"
  }
}
```

Then in your CI pipeline:

```yaml
- name: Run Visual Tests
  run: npm run test:visual:ci

- name: Upload Test Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

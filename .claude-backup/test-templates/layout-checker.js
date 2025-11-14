/**
 * Layout Checker - Detects UI overlapping and z-index issues
 *
 * Usage: node layout-checker.js <url>
 */

const playwright = require('playwright');

async function checkLayout(url = 'http://localhost:3000') {
  console.log('📐 Starting Layout Analysis...\n');

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const issues = [];

  // Check 1: Overlapping clickable elements
  console.log('🔍 Checking for overlapping elements...');
  const overlapping = await page.evaluate(() => {
    const clickables = Array.from(
      document.querySelectorAll('button, a, input, select, textarea')
    );

    const problems = [];

    for (let i = 0; i < clickables.length; i++) {
      for (let j = i + 1; j < clickables.length; j++) {
        const rect1 = clickables[i].getBoundingClientRect();
        const rect2 = clickables[j].getBoundingClientRect();

        // Check if rectangles overlap
        const overlap = !(
          rect1.right < rect2.left ||
          rect2.right < rect1.left ||
          rect1.bottom < rect2.top ||
          rect2.bottom < rect1.top
        );

        if (overlap && rect1.width > 0 && rect1.height > 0) {
          problems.push({
            element1: clickables[i].outerHTML.substring(0, 100),
            element2: clickables[j].outerHTML.substring(0, 100),
            position1: { x: rect1.x, y: rect1.y, width: rect1.width, height: rect1.height },
            position2: { x: rect2.x, y: rect2.y, width: rect2.width, height: rect2.height },
          });
        }
      }
    }

    return problems;
  });

  if (overlapping.length > 0) {
    issues.push({
      type: 'Overlapping Elements',
      severity: 'HIGH',
      count: overlapping.length,
      details: overlapping,
    });
    console.log(`❌ Found ${overlapping.length} overlapping elements`);
  } else {
    console.log('✅ No overlapping elements found');
  }

  // Check 2: Z-index conflicts
  console.log('\n🔍 Checking z-index stacking...');
  const zIndexIssues = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const problems = [];

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex);

      // Check if modal/dialog has low z-index
      if (el.getAttribute('role') === 'dialog' && zIndex < 1000) {
        problems.push({
          element: el.outerHTML.substring(0, 100),
          zIndex: zIndex,
          issue: 'Modal has low z-index, may be hidden by other elements',
        });
      }

      // Check if dropdown/tooltip has low z-index
      if (
        (el.classList.contains('dropdown') ||
          el.classList.contains('tooltip') ||
          el.getAttribute('role') === 'menu') &&
        zIndex < 100
      ) {
        problems.push({
          element: el.outerHTML.substring(0, 100),
          zIndex: zIndex,
          issue: 'Dropdown/menu has low z-index, may be cut off',
        });
      }
    });

    return problems;
  });

  if (zIndexIssues.length > 0) {
    issues.push({
      type: 'Z-Index Issues',
      severity: 'MEDIUM',
      count: zIndexIssues.length,
      details: zIndexIssues,
    });
    console.log(`⚠️  Found ${zIndexIssues.length} z-index issues`);
  } else {
    console.log('✅ Z-index stacking looks good');
  }

  // Check 3: Overflow issues
  console.log('\n🔍 Checking overflow issues...');
  const overflowIssues = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const problems = [];

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Check if content is cut off
      if (
        style.overflow === 'hidden' &&
        (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
      ) {
        problems.push({
          element: el.outerHTML.substring(0, 100),
          issue: 'Content is cut off by overflow:hidden',
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        });
      }

      // Check if fixed/absolute positioned element is off-screen
      if (
        (style.position === 'fixed' || style.position === 'absolute') &&
        (rect.right > window.innerWidth || rect.bottom > window.innerHeight)
      ) {
        problems.push({
          element: el.outerHTML.substring(0, 100),
          issue: 'Element positioned outside viewport',
          position: { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom },
        });
      }
    });

    return problems;
  });

  if (overflowIssues.length > 0) {
    issues.push({
      type: 'Overflow Issues',
      severity: 'MEDIUM',
      count: overflowIssues.length,
      details: overflowIssues,
    });
    console.log(`⚠️  Found ${overflowIssues.length} overflow issues`);
  } else {
    console.log('✅ No overflow issues found');
  }

  // Check 4: Responsive design issues
  console.log('\n🔍 Checking responsive design...');
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);

    const responsiveIssues = await page.evaluate(() => {
      const problems = [];

      // Check for horizontal scrollbar (usually bad on mobile)
      if (document.documentElement.scrollWidth > window.innerWidth) {
        problems.push({
          issue: 'Horizontal scrollbar detected',
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        });
      }

      // Check for tiny text
      const allText = Array.from(document.querySelectorAll('p, span, div, a, button'));
      allText.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseInt(style.fontSize);
        if (fontSize < 12 && el.textContent.trim().length > 0) {
          problems.push({
            element: el.outerHTML.substring(0, 100),
            issue: 'Text too small (< 12px)',
            fontSize: fontSize,
          });
        }
      });

      return problems;
    });

    if (responsiveIssues.length > 0) {
      issues.push({
        type: `Responsive Issues (${viewport.name})`,
        severity: 'LOW',
        count: responsiveIssues.length,
        details: responsiveIssues,
      });
      console.log(`⚠️  ${viewport.name}: Found ${responsiveIssues.length} issues`);
    } else {
      console.log(`✅ ${viewport.name}: Looks good`);
    }
  }

  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 LAYOUT ANALYSIS SUMMARY');
  console.log('='.repeat(60));

  if (issues.length === 0) {
    console.log('\n✅ No layout issues found! UI looks perfect.\n');
  } else {
    console.log(`\n❌ Found ${issues.length} types of issues:\n`);
    issues.forEach(issue => {
      console.log(`${issue.severity === 'HIGH' ? '❌' : '⚠️'}  ${issue.type}: ${issue.count} issues`);
    });
    console.log('\n💡 Run with --verbose flag to see detailed issues\n');
  }

  console.log('='.repeat(60) + '\n');

  return issues;
}

// Run if called directly
if (require.main === module) {
  const url = process.argv[2] || 'http://localhost:3000';
  checkLayout(url)
    .then(issues => {
      process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

module.exports = { checkLayout };

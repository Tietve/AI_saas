# 🎭 Playwright MCP - Browser Automation & UI Debugging

> **Mục đích:** Cho phép Claude kiểm soát browser để debug UI, test real-time, inspect DOM
> **Cập nhật:** 2025-11-07

---

## 🎯 OVERVIEW

Playwright MCP (Model Context Protocol) cho phép Claude:
- ✅ Mở và kiểm soát browser (Chrome/Firefox/Safari)
- ✅ Inspect DOM elements trực tiếp
- ✅ Đọc console logs và network requests
- ✅ Click buttons, fill forms, navigate pages
- ✅ Take screenshots và analyze UI
- ✅ Debug layout issues (overlapping, z-index)

---

## 🚀 SETUP (ĐÃ HOÀN TẤT)

### Files Configured:

1. **`.mcp.json`** - MCP server definitions
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@playwright/mcp@latest", "--browser", "chromium"],
         "description": "Playwright MCP for browser automation"
       }
     }
   }
   ```

2. **`.claude/settings.local.json`** - Enable MCP servers
   ```json
   {
     "enableAllProjectMcpServers": true
   }
   ```

### ✅ Setup Complete! No further installation needed.

---

## 💡 HOW TO USE

### Basic Commands:

```
"Open the homepage in browser and inspect the layout"
"Navigate to /login and check if the form is visible"
"Click the submit button and check console for errors"
"Take a screenshot of the chat interface"
"Find all buttons and check if any are overlapping"
"Debug why the modal is not appearing on top"
```

### Advanced Debugging:

```
"Open /chat, send a message, and verify the response appears"
"Check if there are any z-index issues with the modal"
"Inspect the DOM and find elements with display:none"
"Test the responsive layout on mobile viewport"
"Monitor network requests when clicking 'Subscribe'"
```

---

## 🎯 USE CASES

### 1. UI Layout Debugging
**Problem:** Elements overlapping, z-index issues
**Command:**
```
"Open /dashboard, inspect all clickable elements, and check if any are overlapping or have z-index problems"
```

**Claude will:**
- Open browser to /dashboard
- Get all button/link positions
- Check for overlaps
- Report z-index issues

---

### 2. Form Validation Testing
**Problem:** Need to test form error messages
**Command:**
```
"Open /register, fill the form with invalid data, and check what error messages appear"
```

**Claude will:**
- Navigate to /register
- Fill form with test data
- Submit form
- Capture error messages
- Verify error styling

---

### 3. Console Error Debugging
**Problem:** JavaScript errors not visible in logs
**Command:**
```
"Open /chat, monitor console logs, send a message, and report any errors"
```

**Claude will:**
- Open browser with DevTools
- Monitor console
- Perform actions
- Capture all errors/warnings
- Report findings

---

### 4. Visual Regression Testing
**Problem:** UI changed unexpectedly
**Command:**
```
"Take screenshots of all main pages (/, /login, /dashboard, /chat) and compare layouts"
```

**Claude will:**
- Navigate to each page
- Take full-page screenshots
- Analyze layout consistency
- Report visual issues

---

### 5. Responsive Design Testing
**Problem:** Mobile layout broken
**Command:**
```
"Test /dashboard on mobile viewport (375x667) and check for layout issues"
```

**Claude will:**
- Set mobile viewport
- Navigate to page
- Check responsive design
- Report mobile-specific issues

---

## 🔥 EXAMPLE SCENARIOS

### Scenario 1: Debug Modal Not Showing

**User asks:**
> "The settings modal is not appearing when I click the button. Debug this."

**Claude response:**
```
1. Opening browser to /dashboard...
2. Clicking "Settings" button...
3. Inspecting modal element...
4. Found issue: Modal has z-index: 10, but backdrop has z-index: 1000!
5. Recommendation: Change modal z-index to 1001 in styles.css
```

---

### Scenario 2: Test Chat Flow End-to-End

**User asks:**
> "Test the full chat flow: login → open chat → send message → verify response"

**Claude response:**
```
1. ✅ Login successful
2. ✅ Navigated to /chat
3. ✅ Chat interface loaded
4. ✅ Sent message: "Hello"
5. ❌ Error: WebSocket connection failed (500)
6. Console error: "Cannot connect to ws://localhost:3003"
7. Recommendation: Check if chat-service is running
```

---

### Scenario 3: Check Accessibility

**User asks:**
> "Check if all buttons have proper labels and are keyboard accessible"

**Claude response:**
```
Accessibility Audit:
✅ 45/50 buttons have aria-labels
❌ 5 buttons missing labels:
   - Button at .chat-input (no aria-label)
   - Icon button at .sidebar (no aria-label)
✅ All buttons are keyboard focusable
❌ Tab order is incorrect on /billing page
```

---

## 📊 AVAILABLE BROWSER OPTIONS

### Browsers:
- `chromium` (default)
- `firefox`
- `webkit` (Safari)
- `msedge`

### Modes:
- **Headless** (default): Browser runs in background
- **Headed**: Browser window visible (add `--no-headless` to args in .mcp.json)

### Viewports:
- **Desktop**: 1280x720 (default)
- **Tablet**: 768x1024
- **Mobile**: 375x667

To change viewport, update args in `.mcp.json`:
```json
{
  "args": [
    "-y",
    "@playwright/mcp@latest",
    "--browser",
    "chromium",
    "--viewport-size",
    "375x667"
  ]
}
```

---

## 🔧 ADVANCED CONFIGURATION

### Enable Video Recording

Edit `.mcp.json`:
```json
{
  "playwright": {
    "command": "npx",
    "args": [
      "-y",
      "@playwright/mcp@latest",
      "--browser", "chromium",
      "--save-video", "800x600",
      "--output-dir", "./test-output"
    ]
  }
}
```

### Enable Trace Viewer

```json
{
  "args": [
    "--save-trace",
    "--output-dir", "./traces"
  ]
}
```

View trace:
```bash
npx playwright show-trace traces/trace.zip
```

---

## 🚨 TROUBLESHOOTING

### MCP Server Not Starting

**Problem:** Claude says "MCP tools not available"

**Solution:**
1. Restart Claude Code completely
2. Check `.mcp.json` syntax is valid
3. Verify `enableAllProjectMcpServers: true` in settings.local.json
4. Run manually to test:
   ```bash
   npx -y @playwright/mcp@latest --browser chromium
   ```

---

### Browser Won't Open

**Problem:** "Failed to launch browser"

**Solution:**
1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```
2. Check browser path in system
3. Try different browser (firefox instead of chromium)

---

### Permission Denied

**Problem:** "Cannot access browser"

**Solution:**
Add to `.claude/settings.local.json`:
```json
{
  "permissions": {
    "allow": [
      "Bash(npx:*)"
    ]
  }
}
```

---

## 💡 BEST PRACTICES

### 1. Use for Interactive Debugging
- ✅ "Debug why button X is not clickable"
- ✅ "Find the element causing scroll issues"
- ❌ Don't use for simple static analysis (use Read tool instead)

### 2. Combine with E2E Tests
- Run MCP for exploratory testing
- Convert findings into Playwright tests
- Automate common checks

### 3. Screenshot Everything
- Always take screenshots when debugging UI
- Use screenshots to document issues
- Compare before/after when fixing bugs

### 4. Monitor Console
- Always check console logs during tests
- Look for warnings, not just errors
- Check network tab for failed requests

---

## 🎯 INTEGRATION WITH PROJECT

### Frontend Testing Workflow:

```mermaid
1. Manual Testing (Playwright MCP)
   ↓
2. Find Issues
   ↓
3. Create E2E Test (Playwright Test)
   ↓
4. Automate via Frontend Testing Agents
   ↓
5. CI/CD Integration
```

### When to Use What:

| Task | Tool | Reason |
|------|------|--------|
| Debug UI issue | **Playwright MCP** | Interactive, real-time |
| Automate regression tests | **Playwright Tests** | Repeatable, CI-friendly |
| Quick layout check | **Layout Agent** | Fast, automated |
| Performance audit | **Performance Agent** | Specialized metrics |
| Full integration test | **E2E Agent** | Comprehensive flow |

---

## 📝 QUICK COMMANDS REFERENCE

### Navigation
```
"Open [url]"
"Navigate to /page"
"Go back"
"Reload page"
```

### Interaction
```
"Click [selector]"
"Fill [input] with [value]"
"Press Enter"
"Scroll to bottom"
```

### Inspection
```
"Get element at [selector]"
"Check if [element] is visible"
"Get all buttons"
"Inspect DOM structure"
```

### Console
```
"Monitor console logs"
"Check for JavaScript errors"
"Get network requests"
"Check WebSocket connections"
```

### Screenshots
```
"Take screenshot"
"Take full page screenshot"
"Screenshot [selector]"
"Compare with baseline"
```

---

## 🔗 RESOURCES

- **Playwright Docs**: https://playwright.dev
- **MCP Specification**: https://modelcontextprotocol.io
- **MCP GitHub**: https://github.com/microsoft/playwright-mcp
- **Claude Code MCP Guide**: https://docs.claude.com/claude-code/mcp

---

## 🎉 READY TO USE!

**Restart Claude Code** và bắt đầu dùng:

```
"Open my frontend in browser and debug the login form"
```

Claude will automatically use Playwright MCP to control browser! 🚀

---

**Pro Tip:** Combine Playwright MCP với Sub-agents để test nhiều pages simultaneously:

```
"Launch 3 parallel agents:
- Agent 1: Test login flow with Playwright MCP
- Agent 2: Test chat interface with Playwright MCP
- Agent 3: Test billing page with Playwright MCP

Each agent uses separate browser instances!"
```

**Result:** 3x faster testing with zero conflicts! ⚡

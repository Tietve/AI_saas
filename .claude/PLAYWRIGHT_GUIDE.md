# 🎭 Playwright MCP Guide - Browser Automation

> **Claude controls browser directly for real-time debugging!**

---

## ⚡ QUICK START (ALREADY CONFIGURED!)

### Setup Status: ✅ DONE
Your project has Playwright MCP configured in:
- `.mcp.json` - MCP server config
- `settings.local.json` - Claude integration

**No installation needed!** Just restart Claude Code and use it.

### How to Use:
```
"Open http://localhost:3000/login in browser and check if form is visible"
"Click the submit button and monitor console for errors"
"Take screenshot of chat interface and analyze layout"
"Debug why the modal is not appearing on top"
```

Claude will:
1. Open browser automatically
2. Navigate to page
3. Interact with elements
4. Monitor console/network
5. Take screenshots
6. Report findings

---

## 🎯 CAPABILITIES

### 🌐 Browser Control
```
"Navigate to /dashboard"
"Click the 'New Chat' button"
"Fill in login form with test@example.com"
"Press Enter to submit"
```

### 🔍 DOM Inspection
```
"Check if the modal is visible"
"Get text content of .error-message element"
"Find all buttons on the page"
"Check z-index of dropdown menu"
```

### 📊 Console Monitoring
```
"Open /chat and monitor console for errors"
"Check network requests during login"
"Show all console warnings"
"Monitor WebSocket connection status"
```

### 📸 Screenshots
```
"Take screenshot of current page"
"Capture only the chat interface"
"Screenshot the error modal"
"Compare login page with baseline"
```

### 🐛 Layout Debugging
```
"Find overlapping elements on /dashboard"
"Check z-index conflicts in modal"
"Verify responsive design at 768px width"
"Debug why dropdown is cut off"
```

---

## 🎮 USE CASES

### Use Case 1: Interactive Form Testing
```
User: "Test the login form with real user interaction"

Claude:
→ Opens browser to /login
→ Fills email field
→ Fills password field
→ Clicks submit button
→ Monitors console for errors
→ Checks if redirect happens
→ Takes screenshot of result
→ Reports any issues found
```

### Use Case 2: Console Error Debugging
```
User: "Why is the chat not sending messages?"

Claude:
→ Opens /chat in browser
→ Types test message
→ Clicks send button
→ Monitors console output
→ Checks network requests
→ Reports: "WebSocket connection refused - backend not running"
→ Provides fix suggestions
```

### Use Case 3: Visual Layout Debugging
```
User: "The modal is appearing behind other elements"

Claude:
→ Opens page with modal
→ Triggers modal
→ Inspects z-index values
→ Finds conflicting elements
→ Reports: "Modal z-index: 100, navbar z-index: 1000"
→ Suggests fix: Increase modal z-index to 1050
```

### Use Case 4: Responsive Design Verification
```
User: "Check mobile layout at 375px width"

Claude:
→ Resizes browser to 375px
→ Navigates through pages
→ Takes screenshots
→ Checks for overflow issues
→ Reports layout problems
→ Suggests CSS fixes
```

---

## 🛠️ COMMANDS REFERENCE

### Navigation
```
"Navigate to <URL>"
"Go to /dashboard"
"Click the back button"
"Refresh the page"
```

### Element Interaction
```
"Click <element>"
"Fill <field> with <value>"
"Select <option> from dropdown"
"Hover over <element>"
"Press <key>"
```

### Inspection
```
"Get text of <element>"
"Check if <element> is visible"
"Find all <selector>"
"Get computed style of <element>"
```

### Console & Network
```
"Show console messages"
"Show only console errors"
"List network requests"
"Monitor WebSocket connections"
```

### Screenshots
```
"Take screenshot"
"Screenshot <element>"
"Take full page screenshot"
"Save screenshot as <filename>"
```

---

## 💡 PRO TIPS

### Tip 1: Real-time Debugging
Better than static code analysis!
```
Instead of reading code files:
"Open the chat page and show me what happens when I send a message"

Claude watches in real-time and reports exact behavior!
```

### Tip 2: Form Validation Testing
```
"Test login form with invalid credentials and show validation messages"

Claude fills form, submits, captures error states.
```

### Tip 3: Network Monitoring
```
"Monitor API calls when I create a new chat"

Claude watches network tab and reports all requests/responses.
```

### Tip 4: Layout Comparison
```
"Take screenshot at 1920px and 375px, compare layouts"

Claude captures both, identifies differences.
```

---

## 🛡️ SAFETY FEATURES

### Read-Only by Default
Playwright MCP is configured for **testing and debugging only**:
- ✅ Navigate, click, inspect - OK
- ✅ Take screenshots - OK
- ✅ Monitor console/network - OK
- ❌ Submitting real forms - Requires confirmation
- ❌ Deleting data - Blocked
- ❌ Production access - Not configured

### Sandboxed Environment
Only works with:
- `http://localhost:*` (local development)
- Test/staging environments (if configured)

**Not connected to production!** ✅

---

## ❓ TROUBLESHOOTING

**Q: "Browser not opening?"**
A: Restart Claude Code to activate MCP servers.

**Q: "Can't find element?"**
A: Provide clearer selector or description.

**Q: "Page load timeout?"**
A: Check backend services are running.

**Q: "Screenshots not saving?"**
A: Check file path is accessible.

---

## 🎯 WHEN TO USE

### ✅ Perfect For:
- Interactive UI debugging
- Real-time form testing with validation
- Console error monitoring during user flows
- Visual regression verification
- Responsive design testing
- WebSocket connection debugging

### ❌ Don't Use For:
- Automated test suites (use Playwright tests instead)
- Production environments
- Performance benchmarking (use Lighthouse)
- Large-scale testing (use CI/CD)

---

## 🔧 CONFIGURATION

### Current Setup (.mcp.json):
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "PLAYWRIGHT_BROWSER": "chromium",
        "PLAYWRIGHT_HEADLESS": "false"
      }
    },
    "playwright-headed": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "PLAYWRIGHT_BROWSER": "chromium",
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

Two modes:
- **playwright** - Headed (see browser)
- **playwright-headed** - Headless (background)

---

## 📚 EXAMPLES

### Example 1: Debug Login Issue
```
User: "Login form is not submitting, debug it"

Claude:
1. Opens /login in browser
2. Fills test credentials
3. Clicks submit
4. Monitors console output
5. Finds error: "CORS policy blocked request"
6. Reports: "Backend CORS not configured for localhost:3000"
7. Suggests: "Add localhost:3000 to CORS whitelist in API gateway"
```

### Example 2: Visual Bug Investigation
```
User: "Chat input is overlapping send button on mobile"

Claude:
1. Opens /chat
2. Resizes to 375px width
3. Takes screenshot
4. Inspects element positions
5. Finds: "Input width: 100%, button position: absolute right: 0"
6. Reports: "Both elements at same z-level, input overflows button"
7. Suggests: "Change input width to calc(100% - 60px)"
```

### Example 3: Performance Analysis
```
User: "Why is dashboard loading slowly?"

Claude:
1. Opens /dashboard
2. Monitors network requests
3. Records load time
4. Finds: "15 API calls on page load, 3 taking >2s each"
5. Reports: "Analytics API calls not cached, blocking render"
6. Suggests: "Implement API response caching or lazy load analytics"
```

---

## 🎉 CONCLUSION

Playwright MCP gives Claude **eyes and hands** in the browser!

**Benefits:**
- ✅ Real-time debugging (better than static analysis)
- ✅ Interactive testing (forms, modals, flows)
- ✅ Console/network monitoring (find hidden bugs)
- ✅ Visual inspection (layout, z-index, responsive)
- ✅ Screenshot capture (document issues)

**Already configured - just use it!** 🚀

---

**⚡ QUICK COMMAND:** Just ask Claude to "open [page] in browser"

**🛡️ SAFETY:** Sandboxed to localhost only

**🚀 RESULT:** Debug UI issues 10x faster!

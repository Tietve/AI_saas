# 🚀 Playwright MCP - Quick Start

## ✅ SETUP ĐÃ HOÀN TẤT!

Files đã được cấu hình:
- ✅ `.mcp.json` - MCP server definitions
- ✅ `.claude/settings.local.json` - Enable MCP servers
- ✅ `.gitignore` - Ignore MCP outputs

---

## 🎯 CÁCH DÙNG

### Bước 1: Restart Claude Code

**QUAN TRỌNG:** MCP servers chỉ activate sau khi restart!

```bash
# Đóng Claude Code hoàn toàn
# Mở lại từ terminal:
claude
```

---

### Bước 2: Test MCP đã hoạt động chưa

Sau khi restart, gõ lệnh đơn giản:

```
"List available MCP tools"
```

Nếu thấy các tools như `playwright_navigate`, `playwright_click`, `playwright_screenshot` → **Setup thành công!** 🎉

---

## 💡 EXAMPLE COMMANDS

### 1. Debug UI Layout Issue

```
"Open http://localhost:3000/dashboard in browser and check if any elements are overlapping"
```

**Claude sẽ:**
- Mở browser (Chromium)
- Navigate tới /dashboard
- Inspect all elements
- Report overlapping issues

---

### 2. Test Login Form

```
"Open /login, fill email with 'test@example.com', fill password with 'wrong', click submit, and check what error appears"
```

**Claude sẽ:**
- Navigate tới /login
- Fill form với test data
- Click submit button
- Capture error message
- Take screenshot

---

### 3. Monitor Console Errors

```
"Open /chat, monitor console logs, send a test message, and report any JavaScript errors"
```

**Claude sẽ:**
- Open browser with DevTools
- Navigate to /chat
- Monitor console
- Perform actions
- Report errors/warnings

---

### 4. Check Modal Z-Index

```
"Open /settings, click 'Edit Profile', and verify the modal appears on top of everything"
```

**Claude sẽ:**
- Navigate to page
- Click button
- Get modal z-index
- Check stacking order
- Report issues

---

### 5. Take Screenshots

```
"Take screenshots of /, /login, /dashboard, and /chat pages"
```

**Claude sẽ:**
- Navigate to each page
- Take full-page screenshots
- Save to test-output/
- Return image paths

---

## 🎭 ADVANCED: Parallel Browser Testing

```
"Launch 3 parallel agents with Playwright MCP:

Agent 1: Test login flow in browser
Agent 2: Test chat interface in browser
Agent 3: Test billing page in browser

Each uses separate browser instance!"
```

**Result:** 3 browsers testing simultaneously! 🚀

---

## 🔍 VERIFY SETUP

### Test 1: Check MCP Available

```
"Check if Playwright MCP is available"
```

Expected response:
```
✅ Playwright MCP is configured and available!
Available tools:
- playwright_navigate
- playwright_click
- playwright_fill
- playwright_screenshot
- playwright_evaluate
... (and more)
```

---

### Test 2: Simple Browser Open

```
"Open http://example.com in browser and take a screenshot"
```

Expected result:
- Browser opens (headless by default)
- Navigates to example.com
- Takes screenshot
- Returns: "Screenshot saved to test-output/screenshot-*.png"

---

## 🚨 TROUBLESHOOTING

### Problem: "MCP tools not available"

**Solution:**
1. Verify `.mcp.json` exists in project root
2. Check `enableAllProjectMcpServers: true` in settings
3. **Restart Claude Code completely** (critical!)
4. Test manually:
   ```bash
   npx -y @playwright/mcp@latest --browser chromium
   ```

---

### Problem: "Browser failed to launch"

**Solution:**
```bash
# Install Playwright browsers
npx playwright install
```

---

### Problem: "Permission denied"

**Solution:** Add to `.claude/settings.local.json`:
```json
{
  "permissions": {
    "allow": ["Bash(npx:*)"]
  }
}
```

---

## 📚 NEXT STEPS

1. **Read full guide:** `.claude/PLAYWRIGHT_MCP_GUIDE.md`
2. **Try example commands** above
3. **Combine with Sub-agents** for parallel testing
4. **Create E2E tests** from findings

---

## 🎯 REAL-WORLD EXAMPLE

**Scenario:** User reports "Can't click Submit button on /register"

**Debug command:**
```
"Open /register in browser, inspect the submit button, check if it's visible, check its z-index, check if anything is covering it, take a screenshot, and report findings"
```

**Claude response (example):**
```
🔍 Investigation Results:

1. ✅ Submit button exists in DOM
2. ❌ Button visibility: hidden behind modal backdrop!
3. 📊 Z-index analysis:
   - Submit button: z-index: 1
   - Modal backdrop: z-index: 999
4. 📸 Screenshot saved: test-output/register-issue.png
5. 🐛 Root cause: Backdrop has higher z-index, covering button

💡 Recommendation:
Change submit button z-index to 1000 or move it above backdrop in DOM
```

---

**🎉 YOU'RE READY!**

Restart Claude Code và bắt đầu debug UI với browser automation! 🚀

---

**Pro Tip:** Dùng headed mode để xem browser hoạt động:

Edit `.mcp.json`:
```json
{
  "playwright": {
    "args": [
      "-y",
      "@playwright/mcp@latest",
      "--browser",
      "chromium"
      // Note: Headless by default. Remove --headless flag doesn't exist,
      // it's headed by default unless you add --headless
    ]
  }
}
```

Actually, Playwright MCP is **headed by default**! Chỉ cần dùng thôi! 🎭

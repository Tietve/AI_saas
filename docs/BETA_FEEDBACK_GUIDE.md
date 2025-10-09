# Beta Feedback Guide

Welcome to the AI SaaS Platform Beta! Your feedback is crucial for making this platform better. This guide will help you report bugs, share feedback, and contribute to improving the platform.

**Beta Version**: v1.0.0-beta
**Beta Period**: October 9, 2025 - November 9, 2025 (30 days)

---

## 🎯 What We're Testing

### Priority Areas

**P0 - Critical** (Report immediately):
- Authentication (signup, signin, password reset)
- Chat messaging (sending messages, receiving responses)
- Payment processing (can't upgrade, charged but no upgrade)
- Data loss (conversations deleted, messages missing)
- Security issues (exposed data, bypass authentication)

**P1 - High** (Report within 24 hours):
- Feature not working (export, projects, file upload)
- Performance issues (slow loading, timeouts)
- Error messages (unexpected errors, crashes)
- UI bugs (broken layout, invisible buttons)

**P2 - Medium** (Report within 3 days):
- Minor UI issues (styling problems, alignment)
- Usability improvements (confusing workflows)
- Feature requests (new capabilities)
- Documentation issues (unclear instructions)

**P3 - Low** (Report anytime):
- Typos and text improvements
- Small visual improvements
- Nice-to-have features

---

## 📝 How to Report Bugs

### Quick Bug Report Template

```markdown
## Bug Report

**Title**: [Short, descriptive title]

**Severity**: P0 / P1 / P2 / P3

**What happened**:
[Describe what went wrong]

**Expected behavior**:
[What should have happened]

**Steps to reproduce**:
1. Go to...
2. Click on...
3. Enter...
4. See error

**Environment**:
- Browser: [Chrome 120, Firefox 118, Safari 17, etc.]
- OS: [Windows 11, macOS 14, Ubuntu 22.04, etc.]
- Device: [Desktop, Mobile, Tablet]
- Account tier: [FREE, PREMIUM, ENTERPRISE]

**Screenshots/Videos**:
[Attach or paste screenshot URLs]

**Additional context**:
[Any other relevant information]
```

### Where to Submit

**Option 1: Email** (Recommended for P0/P1)
- Send to: `beta-feedback@yourdomain.com`
- Subject: `[BUG P0]` or `[BUG P1]` for urgent issues
- Attach screenshots/videos

**Option 2: GitHub Issues** (For detailed tracking)
- Repository: [https://github.com/your-org/ai-saas-platform/issues](https://github.com/your-org/ai-saas-platform/issues)
- Use bug report template
- Add appropriate labels

**Option 3: Discord** (For quick questions)
- Channel: `#beta-feedback`
- Server: [Discord invite link]
- Good for discussions, not formal bug reports

---

## 📸 How to Take Good Screenshots

### What Makes a Good Screenshot

**✅ DO**:
- Include the entire browser window (not just content)
- Show URL bar (helps us identify the page)
- Include any error messages completely
- Capture console errors (F12 → Console tab)
- Annotate with arrows/highlights if needed

**❌ DON'T**:
- Crop out important context
- Take blurry photos of screen
- Hide error messages
- Include sensitive personal data (passwords, API keys)

### Tools We Recommend

- **Windows**: Snipping Tool (Win + Shift + S)
- **macOS**: Screenshot tool (Cmd + Shift + 4)
- **Linux**: Flameshot, GNOME Screenshot
- **Browser Extension**: Awesome Screenshot, Nimbus
- **Video**: Loom, OBS Studio, Windows Game Bar

---

## 🐛 Common Issues & How to Report Them

### Issue 1: "I can't sign in"

**What to include**:
1. Email used (or confirm it's in database)
2. Error message shown
3. Screenshot of signin page
4. Browser console errors (F12)

**Console logs to capture**:
```
1. Press F12
2. Go to "Console" tab
3. Try to sign in
4. Screenshot any red errors
```

---

### Issue 2: "Chat messages not working"

**What to include**:
1. Which AI model selected
2. Message content (if not sensitive)
3. Screenshot of chat interface
4. Network tab errors (F12 → Network)
5. Was there an error message?

**Network logs**:
```
1. F12 → Network tab
2. Send a message
3. Look for /api/chat/stream request
4. Right-click → Copy → Copy as cURL
5. Paste in bug report (remove sensitive data)
```

---

### Issue 3: "Export not working"

**What to include**:
1. Export format attempted (PDF, Markdown, JSON, CSV)
2. Number of conversations selected
3. Size of conversation (message count)
4. Screenshot of error
5. Did download start? Did file open?

---

### Issue 4: "Payment processed but tier not upgraded"

**What to include** (DO NOT include card details):
1. Order ID from PayOS
2. Amount paid
3. Tier attempted to upgrade to
4. Screenshot of payment success page
5. Screenshot of current profile showing tier
6. Time of payment (with timezone)

**IMPORTANT**: We can lookup payment details on our end. Never share:
- Credit card numbers
- CVV codes
- Bank account details

---

### Issue 5: "Performance is slow"

**What to include**:
1. Which page is slow
2. What action is slow (loading, sending message, etc.)
3. Time it takes (seconds)
4. Internet speed (fast.com result)
5. Browser performance tab (F12 → Performance)

**How to capture performance**:
```
1. F12 → Performance tab
2. Click record (circle icon)
3. Perform slow action
4. Stop recording
5. Right-click → Save Profile
6. Attach file to bug report
```

---

## 💡 How to Share Feature Requests

### Feature Request Template

```markdown
## Feature Request

**Title**: [Feature name]

**Problem**:
[What problem does this solve?]

**Proposed solution**:
[How would this feature work?]

**Alternatives considered**:
[Any other ways to solve this?]

**Use case**:
[Specific example of when you'd use this]

**Priority**: P2 / P3

**Additional context**:
[Mockups, examples from other apps, etc.]
```

### Examples of Good Feature Requests

**Example 1**:
```
Title: Add keyboard shortcut to switch AI models

Problem: I switch between GPT-4 and Claude frequently,
         and clicking the dropdown is slow

Proposed solution: Add Cmd+M to open model selector,
                   then arrow keys to select

Use case: When I need fast responses, I switch to GPT-4o-mini.
          For deep analysis, I switch to Claude Opus.
```

**Example 2**:
```
Title: Export conversation as Word document

Problem: My boss requires Word format for reports

Proposed solution: Add .docx to export format options

Use case: Weekly meeting notes from AI conversations
          need to be formatted in Word
```

---

## 📊 Sharing Positive Feedback

We love hearing what's working well!

**Where to share**:
- Email: `beta-feedback@yourdomain.com`
- Discord: `#beta-wins` channel
- Twitter: Tag `@YourApp` with `#BetaFeedback`

**What to include**:
- What feature you love
- How it helped you
- Any specific moment that stood out

**Example**:
> "The export to PDF feature is amazing! I used it to create
> a 50-page AI conversation summary for my thesis. Saved me
> hours of copy-pasting. Thank you!"

---

## 🔒 Privacy & Data Sharing

### What We Can See

**We have access to**:
- Your account email
- Usage statistics (message count, features used)
- Error logs (server errors, crash reports)
- Conversation metadata (titles, timestamps, NOT content)

**We CANNOT see** (unless you share):
- Your conversation content (end-to-end private)
- Your password (encrypted)
- Your payment details (handled by PayOS)

### Sharing Sensitive Data

If you need to share a bug with **sensitive conversation content**:

1. **Recreate bug with test data**: Try to reproduce with non-sensitive content
2. **Redact sensitive parts**: Replace names, numbers, addresses with `[REDACTED]`
3. **Use pastebin for logs**: Don't paste long logs in email
4. **Mark email as confidential**: Add `[CONFIDENTIAL]` in subject

---

## 📈 How We Use Your Feedback

### Our Process

1. **Report received** → Acknowledged within 24 hours
2. **Triage** → Assigned priority (P0-P3)
3. **Investigation** → Dev team reviews
4. **Fix/Implement** → Code changes made
5. **Deploy** → Fix released
6. **Follow-up** → We notify you when fixed

### Expected Response Times

| Priority | Acknowledgment | Fix Target |
|----------|---------------|------------|
| P0 (Critical) | Within 2 hours | 24 hours |
| P1 (High) | Within 24 hours | 3-5 days |
| P2 (Medium) | Within 3 days | 1-2 weeks |
| P3 (Low) | Within 1 week | Next release |

### Tracking Your Reports

**Email submissions**:
- You'll receive a ticket number: `BETA-1234`
- Reply to the same email for updates

**GitHub Issues**:
- Watch the issue for updates
- We'll tag you when status changes

**Discord**:
- DM @BetaSupport for your ticket status

---

## 🏆 Beta Tester Rewards

As a thank you for your time and effort:

### All Beta Testers

- ✅ Free PREMIUM plan for 3 months (after beta)
- ✅ Early access to v1.1 features
- ✅ Name in "Beta Testers" hall of fame (if you opt-in)

### Top Contributors (5+ quality bug reports)

- ✅ Free PREMIUM plan for 6 months
- ✅ Exclusive "Beta Legend" badge on profile
- ✅ Direct line to product team for feature input

### Most Valuable Feedback Award (1 winner)

- ✅ Free PREMIUM plan for 1 year
- ✅ 1-hour video call with CTO
- ✅ Feature named after you

---

## 📅 Beta Testing Schedule

### Week 1 (Oct 9-15): Core Features
**Focus**: Auth, Chat, Projects, Export
**What to test**: All core functionality

### Week 2 (Oct 16-22): Performance & Scale
**Focus**: Multiple conversations, large exports, heavy usage
**What to test**: Push the limits

### Week 3 (Oct 23-29): Edge Cases
**Focus**: Unusual inputs, error handling, recovery
**What to test**: Try to break it (safely!)

### Week 4 (Oct 30-Nov 5): Polish
**Focus**: UI/UX refinements, small bugs
**What to test**: Final checks

### Week 5 (Nov 6-9): Final Validation
**Focus**: Last-minute issues
**What to test**: Re-test previously fixed bugs

---

## 🎓 Best Practices for Beta Testing

### DO

✅ Test features you'll actually use
✅ Report bugs as soon as you find them
✅ Include as much detail as possible
✅ Verify the bug still exists before reporting
✅ Search existing reports first (avoid duplicates)
✅ Test on different browsers/devices if possible
✅ Try both expected and unexpected inputs
✅ Follow up on your reports

### DON'T

❌ Report the same bug multiple times
❌ Share sensitive data without redacting
❌ Expect instant fixes for P2/P3 issues
❌ Use beta for mission-critical work (it's beta!)
❌ Share beta access credentials
❌ Publicly disclose security vulnerabilities (email us directly)

---

## 🆘 Getting Help

### I'm stuck and can't continue testing

**Quick help**:
1. Check [FAQ](https://docs.your-app.com/faq)
2. Ask in Discord `#beta-help`
3. Email `beta-support@yourdomain.com`

### I found a critical security issue

**DO NOT** post publicly!

1. Email `security@yourdomain.com` immediately
2. Subject: `[SECURITY] Beta - Critical Issue`
3. We'll respond within 2 hours
4. Wait for our response before disclosing

### I accidentally deleted important data

1. Email `beta-support@yourdomain.com` with:
   - Your account email
   - What was deleted (conversation title, message content)
   - Approximate time of deletion
2. We'll check if we can restore from backups

---

## 📞 Contact Information

**Email**:
- General feedback: `beta-feedback@yourdomain.com`
- Bug reports: `beta-feedback@yourdomain.com` (mark severity in subject)
- Security issues: `security@yourdomain.com`
- Support: `beta-support@yourdomain.com`

**Discord**:
- Server: [Invite link]
- Channels: `#beta-feedback`, `#beta-help`, `#beta-wins`

**GitHub**:
- Issues: [https://github.com/your-org/ai-saas-platform/issues](https://github.com/your-org/ai-saas-platform/issues)

**Response Time**: We aim to acknowledge all feedback within 24 hours during business days (Mon-Fri, 9AM-6PM UTC+7).

---

## 🙏 Thank You!

Your participation in this beta is invaluable. Every bug report, feature request, and piece of feedback helps us build a better product.

Together, we're making AI chat better for everyone! 🚀

---

**Questions about this guide?**
Email `beta-feedback@yourdomain.com` with subject `[FEEDBACK GUIDE] Question`

**Last Updated**: October 9, 2025
**Version**: 1.0

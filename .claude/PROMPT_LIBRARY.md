# 📚 Autonomous Prompt Library

Collection of proven prompts for autonomous mode.

---

## 🎯 HOW TO USE

1. Copy prompt from this library
2. Replace [PLACEHOLDERS] with your specifics
3. Paste into Claude in autonomous mode
4. Watch Claude work autonomously!

---

## 🔥 TOP PROMPTS

### 1. Fix All Errors (Most Used) ⭐⭐⭐⭐⭐
```
Fix all TypeScript/ESLint errors in [PROJECT/FOLDER] autonomously:

1. Scan all files for errors
2. Fix each error
3. Run 'npm test' after each fix
4. If tests fail: debug and fix
5. Continue until 0 errors and all tests pass

Work autonomously without asking approval.
Report progress every 10 fixes.
Provide final summary.
```

**Example:**
```
Fix all TypeScript errors in backend/services/auth-service autonomously:
[... instructions ...]
```

---

### 2. Implement Complete Feature ⭐⭐⭐⭐
```
Implement [FEATURE] autonomously end-to-end:

Feature: [Describe feature]

Steps:
1. Understand requirements (ask if unclear)
2. Design database schema (if needed)
3. Implement backend logic
4. Create API endpoints
5. Add validation & error handling
6. Write comprehensive tests
7. Run tests and fix failures
8. Update API documentation

Follow conventions from CLAUDE.md.
Work autonomously.
Test thoroughly.
Report when complete.
```

**Example:**
```
Implement user profile management feature autonomously end-to-end:

Feature: Users can view and edit their profile (name, email, avatar)

Steps:
[... instructions ...]
```

---

### 3. Refactor for Clean Code ⭐⭐⭐
```
Refactor [FILE/SERVICE] autonomously for better code quality:

Goals:
- Remove code duplication
- Improve naming
- Extract functions/classes
- Apply SOLID principles
- Improve readability

Process:
1. Analyze current code
2. Identify issues
3. Refactor incrementally
4. Run tests after each change
5. If tests fail: fix immediately
6. Continue until code is clean

Work autonomously.
Don't break functionality.
```

**Example:**
```
Refactor backend/services/chat-service/src/services/chat.service.ts autonomously for better code quality:
[... instructions ...]
```

---

### 4. Add Tests for Existing Code ⭐⭐⭐⭐
```
Add comprehensive tests for [FILE/MODULE] autonomously:

Requirements:
- Unit tests for all functions
- Integration tests for workflows
- Edge case testing
- Error case testing
- Achieve >80% coverage

Process:
1. Analyze code to understand behavior
2. Write tests for each function
3. Run tests
4. If tests reveal bugs: fix bugs
5. Add more edge case tests
6. Verify coverage

Work autonomously.
Fix any bugs found.
Report coverage at end.
```

---

### 5. Database Migration ⭐⭐⭐
```
Implement database schema changes autonomously:

Changes needed:
[Describe schema changes]

Steps:
1. Update Prisma schema
2. Generate migration
3. Review migration SQL
4. Run migration on dev DB
5. Update models/types
6. Update queries using changed tables
7. Update tests
8. Run all tests
9. Fix any failures

Work autonomously.
Be careful with data.
Report completion.
```

---

### 6. Performance Optimization ⭐⭐⭐
```
Optimize performance of [FEATURE/ENDPOINT] autonomously:

Current issue: [Describe performance problem]
Target: [Performance goal]

Steps:
1. Measure current performance
2. Identify bottlenecks (N+1 queries, etc)
3. Implement optimizations:
   - Add database indexes
   - Optimize queries
   - Add caching
   - Reduce API calls
4. Measure again
5. Compare before/after
6. Verify functionality unchanged

Work autonomously.
Test after each optimization.
Report metrics.
```

---

### 7. Security Audit & Fix ⭐⭐⭐⭐⭐
```
Security audit and fix for [SERVICE/ENDPOINT] autonomously:

Check for:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication issues
- Authorization issues
- Input validation
- Rate limiting
- CORS issues
- Sensitive data exposure

Process:
1. Audit code for security issues
2. List all vulnerabilities found
3. Fix each vulnerability
4. Add security tests
5. Run tests
6. Verify all issues resolved

Work autonomously.
Be thorough.
Report all findings.
```

---

### 8. Update Dependencies ⭐⭐
```
Update dependencies autonomously:

1. Check for outdated packages: npm outdated
2. Update packages one by one
3. After each update:
   - Run npm test
   - Check for breaking changes
   - Fix any issues
   - Verify app still works
4. Update package-lock.json
5. Test entire application

Work autonomously.
Fix breaking changes.
Report updates made.
```

---

### 9. Add Comprehensive Logging ⭐⭐⭐
```
Add logging to [SERVICE] autonomously:

Requirements:
- Log all errors with stack traces
- Log important operations
- Log performance metrics
- Use appropriate log levels
- Include context (userId, requestId, etc)

Process:
1. Identify what to log
2. Add logger throughout codebase
3. Use structured logging
4. Test logging works
5. Ensure no sensitive data logged

Work autonomously.
Follow logging conventions.
```

---

### 10. Documentation Generation ⭐⭐
```
Generate/update documentation for [MODULE] autonomously:

Create:
- README.md with overview
- API documentation
- Function JSDoc comments
- Usage examples
- Setup instructions

Process:
1. Read code to understand
2. Write clear documentation
3. Add code examples
4. Keep concise but complete
5. Use proper markdown formatting

Work autonomously.
```

---

## 🎯 ADVANCED PROMPTS

### 11. Migrate to New Technology
```
Migrate [COMPONENT] from [OLD_TECH] to [NEW_TECH] autonomously:

Current: [Current implementation]
Target: [Target implementation]

Migration plan:
1. Set up new technology
2. Create compatibility layer
3. Migrate one module at a time
4. Test each migration
5. Update dependencies
6. Remove old code
7. Final testing

Work incrementally.
Don't break existing functionality.
Test thoroughly.
```

---

### 12. API Versioning
```
Implement API versioning for [SERVICE] autonomously:

Requirements:
- Support v1 (current) and v2 (new)
- Deprecate old endpoints gradually
- Maintain backward compatibility
- Update documentation

Implementation:
1. Create v2 folder structure
2. Copy v1 endpoints to v2
3. Implement breaking changes in v2
4. Update routing
5. Add version negotiation
6. Update tests for both versions
7. Document changes

Work autonomously.
```

---

### 13. Implement Feature Flags
```
Add feature flags system autonomously:

Requirements:
- Toggle features on/off
- Per-user flags
- Environment-based flags
- Admin interface

Steps:
1. Design flag schema
2. Implement flag checking
3. Add flags to features
4. Create admin endpoints
5. Add tests
6. Document usage

Work autonomously.
```

---

## 💡 PROMPT MODIFIERS

Add these to any prompt for special behaviors:

### For Faster Execution:
```
+ "Work quickly, prioritize speed over perfection"
+ "Skip comments/documentation for now"
+ "Use simple solutions"
```

### For Higher Quality:
```
+ "Be thorough and careful"
+ "Write extensive tests"
+ "Add detailed comments"
+ "Follow all best practices"
```

### For Better Reporting:
```
+ "Report progress every 5 changes"
+ "Explain each major decision"
+ "Document issues encountered"
+ "Provide detailed final report"
```

---

## 🎮 COMBINATION PROMPTS

### Clean Slate (Fix Everything)
```
Complete code quality overhaul for [SERVICE] autonomously:

1. Fix all TypeScript errors
2. Fix all ESLint warnings
3. Add missing tests (>80% coverage)
4. Refactor duplicate code
5. Improve naming
6. Add documentation
7. Run all tests
8. Verify everything works

This is a marathon task. Work autonomously for as long as needed.
Take breaks after major milestones.
Report progress regularly.
```

### Production Ready (Ship It!)
```
Make [SERVICE] production-ready autonomously:

Checklist:
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Error handling comprehensive
- [ ] Logging added
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Environment configs set
- [ ] Deployment scripts ready

Work through checklist autonomously.
Fix everything needed.
Report when production-ready.
```

---

## 🏆 BEST PRACTICES

### DO:
✅ Be specific about requirements
✅ Give clear success criteria
✅ Mention testing expectations
✅ Include "work autonomously" reminder
✅ Ask for progress reports
✅ Define done state clearly

### DON'T:
❌ Be vague ("make it better")
❌ Give contradictory instructions
❌ Forget to mention testing
❌ Skip defining "done"

---

## 📊 PROMPT EFFECTIVENESS

| Prompt Type | Success Rate | Avg Time | Complexity |
|-------------|--------------|----------|------------|
| Fix Errors | 95% | 5-10 min | Low |
| Implement Feature | 85% | 30-60 min | High |
| Refactor | 90% | 15-30 min | Medium |
| Add Tests | 92% | 20-40 min | Medium |
| Security Fix | 88% | 10-20 min | Medium |

---

## 🚀 QUICK START

1. Start autonomous mode:
   ```bash
   .claude\start-autonomous.bat
   ```

2. Copy a prompt from this library

3. Replace placeholders

4. Paste and let Claude work!

5. Review results when done

---

**💡 TIP:** Save your successful prompts for reuse!

**📚 More:** See `.claude/AUTONOMOUS_MODE.md` for full guide!

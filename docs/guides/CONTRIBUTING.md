# Contributing Guide

Complete guide for contributing to the AI SaaS platform.

**Version**: 1.0.0
**Last Updated**: 2025-11-14

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Style](#code-style)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Requirements](#documentation-requirements)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### 1. Fork the Repository

```bash
# Visit GitHub and click "Fork" button
# https://github.com/yourusername/ai-saas
```

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/ai-saas.git
cd ai-saas

# Add upstream remote
git remote add upstream https://github.com/yourusername/ai-saas.git

# Verify remotes
git remote -v
# origin = your fork
# upstream = official repo
```

### 3. Set Up Development Environment

```bash
# Follow GETTING_STARTED.md
npm install
npm run db:setup
cp .env.example .env
# Edit .env with your config
```

---

## Development Workflow

### Step 1: Create Feature Branch

```bash
# Update main from upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-awesome-feature

# Branch naming conventions:
# - feature/add-oauth-login
# - fix/auth-token-validation
# - refactor/database-queries
# - docs/api-documentation
# - test/unit-tests-auth
```

### Step 2: Make Changes

```bash
# Make code changes
# Run tests frequently
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Step 3: Commit Changes

```bash
# Stage changes
git add src/

# Commit with descriptive message
git commit -m "feat: add OAuth login support"

# See Commit Conventions section for format
```

### Step 4: Push to Fork

```bash
git push origin feature/my-awesome-feature
```

### Step 5: Create Pull Request

- Go to https://github.com/YOUR_USERNAME/ai-saas
- Click "Create Pull Request"
- Fill in template
- Request code review

---

## Code Style

### TypeScript

```typescript
// ✅ Good: Type everything
interface User {
  id: string;
  email: string;
  name: string;
}

const getUser = (userId: string): Promise<User> => {
  // implementation
};

// ❌ Bad: Implicit any
const getUser = (userId) => {
  // implementation
};
```

### Naming Conventions

```typescript
// Classes: PascalCase
class UserService {
  // methods: camelCase
  public getUserById(id: string) { }

  // private methods: _camelCase
  private _validateEmail(email: string) { }
}

// Constants: UPPER_SNAKE_CASE
const DEFAULT_PAGE_SIZE = 50;
const MAX_RETRIES = 3;

// Variables: camelCase
const userName = 'John';
const isActive = true;

// Files: kebab-case
// user-service.ts
// auth-controller.ts
// database-config.ts
```

### Function Guidelines

```typescript
// ✅ Good: Clear, documented functions
/**
 * Sends a chat message and returns AI response
 * @param userId - Authenticated user ID
 * @param content - Message content
 * @param conversationId - Optional existing conversation
 * @returns Promise of chat response
 * @throws Error if user quota exceeded
 */
export async function sendChatMessage(
  userId: string,
  content: string,
  conversationId?: string
): Promise<ChatResponse> {
  // implementation
}

// ❌ Bad: Unclear, no documentation
export async function send(u, c, id) {
  // implementation
}
```

### Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const response = await openaiApi.createCompletion(prompt);
  return response;
} catch (error) {
  if (error instanceof RateLimitError) {
    logger.warn('OpenAI rate limit hit');
    throw new ServiceUnavailableError('API rate limited');
  }
  if (error instanceof AuthenticationError) {
    logger.error('Invalid OpenAI API key');
    throw new ConfigurationError('Invalid API key');
  }
  logger.error({ error }, 'Unexpected error');
  throw new InternalServerError('Failed to generate response');
}

// ❌ Bad: Generic error handling
try {
  const response = await openaiApi.createCompletion(prompt);
} catch (e) {
  throw new Error('API failed');
}
```

### File Organization

```
services/auth-service/src/
├── controllers/
│   └── auth.controller.ts
├── services/
│   └── auth.service.ts
├── middleware/
│   └── auth.middleware.ts
├── routes/
│   └── auth.routes.ts
├── models/
│   ├── user.model.ts
│   └── session.model.ts
├── utils/
│   └── jwt.util.ts
└── types/
    └── auth.types.ts
```

### Comments & Documentation

```typescript
// ✅ Good: JSDoc for public functions
/**
 * Verifies JWT token and returns decoded payload
 * @param token - JWT token string
 * @returns Decoded token payload
 * @throws Error if token invalid or expired
 */
export function verifyToken(token: string) {
  // implementation
}

// For complex logic, explain why not what
const result = expensiveOperation();
// We cache the result because it's called frequently
// and the data doesn't change often (updates once/hour)
cache.set('key', result, { ttl: 3600 });

// ✅ Good: Clear inline comments
// Retry logic: exponential backoff with jitter
const delay = Math.min(
  1000 * Math.pow(2, attempts) + Math.random() * 1000,
  30000
);

// ❌ Bad: Obvious comments
const name = 'John'; // Set name to John
if (age > 18) { // If age greater than 18
  // do something
}
```

---

## Commit Conventions

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only
- **style**: Changes that don't affect code logic (formatting, etc.)
- **refactor**: Code change without feature or fix
- **perf**: Code change improving performance
- **test**: Adding or updating tests
- **chore**: Build system, dependencies, etc.

### Scope

The area of the codebase being modified:

```
auth-service
chat-service
billing-service
analytics-service
api-gateway
frontend
database
tests
docs
```

### Subject

- Imperative mood ("add" not "added")
- No period at the end
- Max 50 characters
- Lowercase

### Examples

```bash
git commit -m "feat(auth-service): add email verification"

git commit -m "fix(chat-service): prevent token overflow in cache"

git commit -m "docs(readme): update installation instructions"

git commit -m "refactor(database): optimize user query indexes"

git commit -m "test(auth-service): add password reset tests"

git commit -m "perf(chat-service): implement response caching"
```

### Commits with Body

```bash
git commit -m "feat(billing-service): implement subscription cancellation

Add endpoint to cancel active subscriptions.
Update user plan tier to FREE.
Send cancellation confirmation email.

Fixes #123"
```

---

## Pull Request Process

### PR Title Format

Same as commit convention:

```
feat(auth-service): add email verification
fix(chat-service): prevent token overflow
docs: update API documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement

## Related Issues
Fixes #123
Related to #456

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Documentation
- [ ] Documentation updated
- [ ] CHANGELOG updated

## Checklist
- [ ] Code follows style guide
- [ ] No console.logs left
- [ ] Tests pass locally
- [ ] No TypeScript errors
```

### PR Size Guidelines

- **Small PR** (< 200 lines): Can merge quickly with 1 approval
- **Medium PR** (200-500 lines): Should have 2 approvals
- **Large PR** (> 500 lines): Consider splitting, requires 2+ approvals

### Code Review Expectations

**As an Author**:
- Respond to feedback promptly
- Don't take criticism personally
- Ask questions if feedback unclear
- Update PR based on feedback

**As a Reviewer**:
- Be constructive and kind
- Approve when satisfied
- Don't block on minor style issues
- Ask questions if code unclear

---

## Testing Requirements

### Before Committing

```bash
# 1. Run unit tests
npm run test:unit

# 2. Run integration tests
npm run test:integration

# 3. Run type checking
npm run type-check

# 4. Run linter
npm run lint

# 5. Build project
npm run build
```

### Test Coverage Standards

- **Minimum**: 70% coverage
- **Target**: 85% coverage
- **Critical paths**: 95% coverage

### Writing Tests

```typescript
// ✅ Good: Clear test structure
describe('AuthService', () => {
  describe('signup', () => {
    it('should create user with valid email and password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'SecurePass123!';

      // Act
      const user = await authService.signup(email, password);

      // Assert
      expect(user.email).toBe(email);
      expect(user.id).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const email = 'invalid-email';
      const password = 'SecurePass123!';

      // Act & Assert
      await expect(
        authService.signup(email, password)
      ).rejects.toThrow('Invalid email');
    });

    it('should hash password before saving', async () => {
      // Arrange
      const plainPassword = 'SecurePass123!';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password');

      // Act
      await authService.signup('test@example.com', plainPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, expect.any(Number));
    });
  });
});
```

---

## Documentation Requirements

### Update Documentation For

- New features
- API changes
- Database schema changes
- Configuration changes
- Deployment procedures

### Documentation Format

1. **README** - If affects project overview
2. **Architecture docs** - If affects system design
3. **API docs** - If adds/changes endpoints
4. **Guides** - If affects development workflow
5. **CHANGELOG** - All changes

### Example

```markdown
## Feature: Email Verification

### Overview
Users must verify their email before accessing paid features.

### Implementation
- New EmailVerification table in database
- Email verification endpoint
- Resend verification email endpoint

### Breaking Changes
None

### API Changes
```
POST /api/auth/verify-email
POST /api/auth/resend-verification
```

### Database Changes
```sql
CREATE TABLE emailVerifications (...)
```
```

---

## Troubleshooting

### Tests Failing Locally

```bash
# 1. Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Run tests in isolation
npm run test -- --testNamePattern="specific test"

# 3. Debug test
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

### Linter Errors

```bash
# View all lint errors
npm run lint

# Auto-fix fixable errors
npm run lint -- --fix

# For specific file
npm run lint -- src/auth/service.ts
```

### TypeScript Errors

```bash
# Full type checking
npm run type-check

# Watch mode
npm run type-check -- --watch
```

### Git Conflicts

```bash
# During merge, resolve conflicts in editor
git status
# Edit conflicted files
git add .
git commit -m "merge: resolve conflicts"
```

---

## Performance Considerations

### When Writing Code

1. **Database Queries**
   - Use indexes appropriately
   - Paginate large result sets
   - Avoid N+1 queries

2. **Caching**
   - Cache computed values
   - Use appropriate TTLs
   - Invalidate when data changes

3. **Async Operations**
   - Use async/await
   - Handle promises correctly
   - Implement timeouts

4. **File Size**
   - Keep functions small (<50 lines)
   - Keep files focused (single responsibility)
   - Use meaningful variable names

---

## Security Considerations

### Code Review Checklist

- [ ] No hardcoded secrets
- [ ] No SQL injection vulnerability
- [ ] No XSS vulnerability
- [ ] Proper input validation
- [ ] Proper error messages (no leaks)
- [ ] Rate limiting applied
- [ ] Authentication required
- [ ] Authorization checked

### Before Committing

```bash
# Check for secrets
npm run security:check

# Scan dependencies for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Resources

- **Code Style Guide**: This document
- **Commit Guide**: https://www.conventionalcommits.org/
- **PR Checklist**: See template in GitHub
- **Testing Guide**: `docs/guides/TESTING.md`
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## Getting Help

- **Slack**: #development channel
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: dev-team@yourdomain.com


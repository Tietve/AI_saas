# Test Database Seeding

This directory contains scripts for seeding the test database with realistic data.

## Overview

The seed scripts populate all three microservice databases:
- **Auth Service** - Users, verification tokens
- **Chat Service** - Conversations, messages, token usage
- **Billing Service** - Subscriptions, payments, usage alerts

## Quick Start

```bash
# Seed the test database with sample data
npm run db:seed:test

# Reset and re-seed the database
npm run db:reset:test
```

## What Gets Seeded

### Users (5 accounts)
- `test1@example.com` - PRO tier, verified, with active subscription
- `test2@example.com` - PLUS tier, verified, with active subscription
- `test3@example.com` - FREE tier, verified
- `test4@example.com` - FREE tier, unverified
- `test5@example.com` - FREE tier, unverified

**All passwords:** `Test123!`

### Conversations
- 2-5 conversations per user
- Random mix of GPT-4, GPT-3.5, and Claude models
- Some pinned, some archived
- Realistic titles

### Messages
- 3-10 messages per conversation
- Alternating user/assistant messages
- Realistic content using Faker.js
- Token counts calculated

### Subscriptions
- Active subscriptions for PRO and PLUS users
- Stripe IDs generated
- Realistic billing periods

### Payments
- 1-6 payment records per subscription
- Mostly successful, some pending
- Realistic amounts ($9.99 for PLUS, $19.99 for PRO)

### Token Usage
- 5-15 usage records per conversation
- Realistic token counts
- Calculated costs based on model

## Sample Data Statistics

After running the seed script, you'll have approximately:
- **5 users** across different tiers
- **15-25 conversations** with various models
- **50-200 messages** with realistic content
- **2-3 subscriptions** for paid users
- **5-15 payments** in history
- **75-300 token usage** records

## Scripts

### `seed.ts`
Main seeding script that populates all databases with test data.

**Usage:**
```bash
npm run db:seed:test
```

**Environment:**
- Uses `DATABASE_URL` from environment
- Can override with service-specific URLs:
  - `AUTH_DATABASE_URL`
  - `CHAT_DATABASE_URL`
  - `BILLING_DATABASE_URL`

### `reset.ts`
Cleans all test data from databases.

**Usage:**
```bash
tsx tests/seeds/reset.ts
```

**⚠️ Warning:** This deletes ALL data from the test database. Use with caution!

## Integration with Tests

### Before Test Suite
```typescript
import { seed } from '../seeds/seed';
import { reset } from '../seeds/reset';

beforeAll(async () => {
  await reset(); // Clean database
  await seed();  // Populate with test data
});
```

### Using Seeded Data
```typescript
it('should login with seeded user', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test1@example.com',
      password: 'Test123!'
    });

  expect(response.status).toBe(200);
  expect(response.body.user.planTier).toBe('PRO');
});
```

## Fixtures vs Seeds

**Seeds** (`seed.ts`)
- Run once to populate database
- Fixed set of test accounts
- Consistent across test runs
- Use for: Integration tests, manual testing

**Fixtures** (`../fixtures/`)
- Generate data on-demand
- Unique data each time
- Flexible and customizable
- Use for: Unit tests, specific test cases

## Customization

### Adding Custom Seed Data

Edit `seed.ts` and add your custom seeding functions:

```typescript
async function seedCustomData() {
  console.log('📦 Seeding custom data...');

  // Your custom seeding logic here
  await prisma.customModel.create({
    data: { ... }
  });

  console.log('✅ Custom data seeded');
}

// Add to main seed function
async function seed() {
  await cleanDatabase();
  await seedUsers();
  await seedConversations();
  await seedCustomData(); // Add here
  // ...
}
```

### Changing Seed Quantities

Modify the counts in `seed.ts`:

```typescript
// Change number of users
for (let i = 1; i <= 10; i++) { // Was 5, now 10
  const user = await authPrisma.user.create({ ... });
}

// Change conversations per user
const conversationCount = faker.number.int({ min: 5, max: 10 }); // Was 2-5
```

## Troubleshooting

### "Database not found"
Make sure your test database exists and DATABASE_URL is set correctly in `.env.test`

### "Foreign key constraint failed"
The seed script should handle dependencies automatically, but if you see this:
1. Check the order of seeding (users before conversations, etc.)
2. Ensure reset script runs before seeding
3. Verify Prisma schema relationships

### "Out of memory"
If seeding very large datasets:
1. Reduce the number of records
2. Use `createMany()` instead of individual `create()` calls
3. Process in batches

### "Timeout"
Increase timeout in your test configuration:
```typescript
jest.setTimeout(30000); // 30 seconds
```

## Performance

**Typical seed time:** 2-5 seconds

**Optimization tips:**
- Use `createMany()` for bulk inserts
- Remove unnecessary Faker calls
- Reduce record counts if testing doesn't need them
- Use database indexes

## Security

⚠️ **Never use seed scripts in production!**

The seed scripts:
- Use weak, known passwords
- Generate fake Stripe IDs
- Create test data that could expose vulnerabilities

Always use different credentials and data in production.

## Related

- See `../fixtures/` for on-demand test data generation
- See `../integration/` for integration tests using seeded data
- See `.env.test` for test database configuration

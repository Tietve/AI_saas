/**
 * Database Test Helpers
 *
 * Utilities for database operations in tests:
 * - Database cleanup
 * - Test data seeding
 * - Transaction management
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Clean all test data from database
 *
 * WARNING: This will delete ALL data from the database.
 * Only use in test environments!
 */
export async function cleanDatabase(prisma: PrismaClient) {
  // Delete in correct order to respect foreign key constraints
  await prisma.$transaction([
    // Chat-related tables
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.documentChunk.deleteMany(),
    prisma.document.deleteMany(),
    prisma.tokenUsage.deleteMany(),

    // Billing-related tables
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),

    // Analytics-related tables (if any)
    // prisma.analyticsEvent.deleteMany(),

    // User-related tables (last due to foreign keys)
    prisma.session.deleteMany(),
    prisma.user.deleteMany()
  ]);

  console.log('✅ Database cleaned successfully');
}

/**
 * Clean only test users and their related data
 */
export async function cleanTestUsers(prisma: PrismaClient) {
  // Find test user IDs
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { emailLower: { contains: 'test' } },
        { emailLower: { contains: '@integ.test' } },
        { emailLower: { contains: '@test.example' } }
      ]
    },
    select: { id: true }
  });

  const testUserIds = testUsers.map(u => u.id);

  if (testUserIds.length === 0) {
    console.log('ℹ️  No test users found to clean');
    return;
  }

  // Delete all related data
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversation: { userId: { in: testUserIds } } } }),
    prisma.conversation.deleteMany({ where: { userId: { in: testUserIds } } }),
    prisma.documentChunk.deleteMany({ where: { document: { userId: { in: testUserIds } } } }),
    prisma.document.deleteMany({ where: { userId: { in: testUserIds } } }),
    prisma.tokenUsage.deleteMany({ where: { userId: { in: testUserIds } } }),
    prisma.payment.deleteMany({ where: { userId: { in: testUserIds } } }),
    prisma.subscription.deleteMany({ where: { userId: { in: testUserIds } } }),
    prisma.session.deleteMany({ where: { userId: { in: testUserIds } } }),
    prisma.user.deleteMany({ where: { id: { in: testUserIds } } })
  ]);

  console.log(`✅ Cleaned ${testUserIds.length} test users and their data`);
}

/**
 * Seed basic test data
 */
export async function seedTestData(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  const freeUser = await prisma.user.create({
    data: {
      email: `test-free-${randomBytes(4).toString('hex')}@test.example`,
      emailLower: `test-free-${randomBytes(4).toString('hex')}@test.example`,
      passwordHash,
      planTier: 'FREE',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const plusUser = await prisma.user.create({
    data: {
      email: `test-plus-${randomBytes(4).toString('hex')}@test.example`,
      emailLower: `test-plus-${randomBytes(4).toString('hex')}@test.example`,
      passwordHash,
      planTier: 'PLUS',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const proUser = await prisma.user.create({
    data: {
      email: `test-pro-${randomBytes(4).toString('hex')}@test.example`,
      emailLower: `test-pro-${randomBytes(4).toString('hex')}@test.example`,
      passwordHash,
      planTier: 'PRO',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  console.log('✅ Test data seeded successfully');

  return {
    users: {
      free: freeUser,
      plus: plusUser,
      pro: proUser
    },
    passwordPlaintext: 'TestPassword123!'
  };
}

/**
 * Create a test user with options
 */
export async function createTestUser(
  prisma: PrismaClient,
  options: {
    email?: string;
    planTier?: 'FREE' | 'PLUS' | 'PRO';
    isEmailVerified?: boolean;
    password?: string;
  } = {}
) {
  const email = options.email || `test-${randomBytes(8).toString('hex')}@test.example`;
  const password = options.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      emailLower: email.toLowerCase(),
      passwordHash,
      planTier: options.planTier || 'FREE',
      isEmailVerified: options.isEmailVerified ?? true,
      emailVerifiedAt: options.isEmailVerified !== false ? new Date() : null
    }
  });

  return {
    user,
    passwordPlaintext: password
  };
}

/**
 * Create a test conversation with messages
 */
export async function createTestConversation(
  prisma: PrismaClient,
  userId: string,
  options: {
    title?: string;
    model?: string;
    messageCount?: number;
  } = {}
) {
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      title: options.title || 'Test Conversation',
      model: options.model || 'gpt-3.5-turbo'
    }
  });

  const messageCount = options.messageCount || 2;
  const messages = [];

  for (let i = 0; i < messageCount; i++) {
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Test message ${i + 1}`,
        tokenCount: 10,
        model: options.model || 'gpt-3.5-turbo'
      }
    });
    messages.push(message);
  }

  return {
    conversation,
    messages
  };
}

/**
 * Create a test document
 */
export async function createTestDocument(
  prisma: PrismaClient,
  userId: string,
  options: {
    filename?: string;
    textContent?: string;
    pageCount?: number;
  } = {}
) {
  const document = await prisma.document.create({
    data: {
      userId,
      filename: options.filename || 'test-document.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024 * 100, // 100KB
      s3Key: `documents/${randomBytes(16).toString('hex')}.pdf`,
      textContent: options.textContent || 'Sample document text content for testing.',
      pageCount: options.pageCount || 5,
      embeddingStatus: 'completed'
    }
  });

  return document;
}

/**
 * Create a test subscription
 */
export async function createTestSubscription(
  prisma: PrismaClient,
  userId: string,
  options: {
    planTier?: 'PLUS' | 'PRO';
    status?: string;
  } = {}
) {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: `sub_test_${randomBytes(8).toString('hex')}`,
      stripeCustomerId: `cus_test_${randomBytes(8).toString('hex')}`,
      planTier: options.planTier || 'PLUS',
      status: options.status || 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false
    }
  });

  return subscription;
}

/**
 * Create test token usage records
 */
export async function createTestTokenUsage(
  prisma: PrismaClient,
  userId: string,
  options: {
    count?: number;
    tokensPerRecord?: number;
  } = {}
) {
  const count = options.count || 5;
  const tokensPerRecord = options.tokensPerRecord || 1000;

  const usageRecords = [];

  for (let i = 0; i < count; i++) {
    const usage = await prisma.tokenUsage.create({
      data: {
        userId,
        model: 'gpt-3.5-turbo',
        promptTokens: Math.floor(tokensPerRecord * 0.3),
        completionTokens: Math.floor(tokensPerRecord * 0.7),
        totalTokens: tokensPerRecord,
        cost: tokensPerRecord * 0.000002 // Approximate cost
      }
    });
    usageRecords.push(usage);
  }

  return usageRecords;
}

/**
 * Get total token usage for a user
 */
export async function getUserTokenUsage(
  prisma: PrismaClient,
  userId: string,
  startDate?: Date
): Promise<number> {
  const where: any = { userId };

  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  const result = await prisma.tokenUsage.aggregate({
    where,
    _sum: {
      totalTokens: true
    }
  });

  return result._sum.totalTokens || 0;
}

/**
 * Get conversation count for a user
 */
export async function getUserConversationCount(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  return await prisma.conversation.count({
    where: { userId }
  });
}

/**
 * Delete a test user and all related data
 */
export async function deleteTestUser(prisma: PrismaClient, userId: string) {
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversation: { userId } } }),
    prisma.conversation.deleteMany({ where: { userId } }),
    prisma.documentChunk.deleteMany({ where: { document: { userId } } }),
    prisma.document.deleteMany({ where: { userId } }),
    prisma.tokenUsage.deleteMany({ where: { userId } }),
    prisma.payment.deleteMany({ where: { userId } }),
    prisma.subscription.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ]);

  console.log(`✅ Deleted test user ${userId} and all related data`);
}

/**
 * Truncate all tables (WARNING: Use only in test environments!)
 */
export async function truncateAllTables(prisma: PrismaClient) {
  // Get all table names
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  // Truncate each table
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.warn(`Warning: Could not truncate table ${tablename}:`, error);
      }
    }
  }

  console.log('✅ All tables truncated');
}

/**
 * Check if database is in test mode (has test data)
 */
export async function isDatabaseInTestMode(prisma: PrismaClient): Promise<boolean> {
  const testUserCount = await prisma.user.count({
    where: {
      emailLower: { contains: 'test' }
    }
  });

  return testUserCount > 0;
}

/**
 * Wait for database to be ready
 */
export async function waitForDatabase(
  prisma: PrismaClient,
  maxAttempts = 10,
  delayMs = 1000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database is ready');
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Database not ready after ${maxAttempts} attempts`);
      }
      console.log(`⏳ Waiting for database... (attempt ${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

import { PrismaClient as AuthPrismaClient } from '../../services/auth-service/node_modules/.prisma/client';
import { PrismaClient as ChatPrismaClient } from '../../services/chat-service/node_modules/.prisma/client';
import { PrismaClient as BillingPrismaClient } from '../../services/billing-service/node_modules/.prisma/client';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const authPrisma = new AuthPrismaClient({
  datasources: { db: { url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL } }
});

const chatPrisma = new ChatPrismaClient({
  datasources: { db: { url: process.env.CHAT_DATABASE_URL || process.env.DATABASE_URL } }
});

const billingPrisma = new BillingPrismaClient({
  datasources: { db: { url: process.env.BILLING_DATABASE_URL || process.env.DATABASE_URL } }
});

interface SeedStats {
  users: number;
  conversations: number;
  messages: number;
  subscriptions: number;
  payments: number;
  tokenUsage: number;
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing test data...');

  // Clean chat service
  await chatPrisma.message.deleteMany();
  await chatPrisma.conversation.deleteMany();
  await chatPrisma.tokenUsage.deleteMany();

  // Clean billing service (order matters for foreign keys)
  await billingPrisma.payments.deleteMany();
  await billingPrisma.subscriptions.deleteMany();
  await billingPrisma.messages.deleteMany();
  await billingPrisma.conversations.deleteMany();
  await billingPrisma.token_usage.deleteMany();
  await billingPrisma.usage_alerts.deleteMany();
  await billingPrisma.user.deleteMany();

  // Clean auth service
  await authPrisma.emailVerificationToken.deleteMany();
  await authPrisma.passwordResetToken.deleteMany();
  await authPrisma.user.deleteMany();

  console.log('✅ Database cleaned');
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  const hashedPassword = await bcrypt.hash('Test123!', 10);
  const users = [];

  // Create test users in auth service
  for (let i = 1; i <= 5; i++) {
    const email = `test${i}@example.com`;
    const user = await authPrisma.user.create({
      data: {
        email,
        emailLower: email.toLowerCase(),
        username: `testuser${i}`,
        passwordHash: hashedPassword,
        name: faker.person.fullName(),
        avatar: faker.image.avatar(),
        isEmailVerified: i <= 3, // First 3 users are verified
        emailVerifiedAt: i <= 3 ? new Date() : null,
        planTier: i === 1 ? 'PRO' : i === 2 ? 'PLUS' : 'FREE',
        monthlyTokenUsed: faker.number.int({ min: 0, max: 50000 }),
        lastLoginAt: faker.date.recent({ days: 7 })
      }
    });
    users.push(user);

    // Also create user in billing service (for subscriptions)
    await billingPrisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        emailLower: user.emailLower,
        passwordHash: user.passwordHash,
        planTier: user.planTier as any,
        monthlyTokenUsed: user.monthlyTokenUsed,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function seedConversations(users: any[]) {
  console.log('💬 Seeding conversations...');

  const conversations = [];

  for (const user of users) {
    // Create 2-5 conversations per user
    const conversationCount = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < conversationCount; i++) {
      const conversation = await chatPrisma.conversation.create({
        data: {
          userId: user.id,
          title: faker.helpers.arrayElement([
            'Project Planning Discussion',
            'Code Review Session',
            'Technical Architecture',
            'Bug Investigation',
            'Feature Brainstorming',
            'API Design Review'
          ]),
          model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
          pinned: faker.datatype.boolean(0.2), // 20% chance of being pinned
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'archived']),
          temperature: faker.number.float({ min: 0.5, max: 1.5, fractionDigits: 1 })
        }
      });
      conversations.push({ ...conversation, userId: user.id });
    }
  }

  console.log(`✅ Created ${conversations.length} conversations`);
  return conversations;
}

async function seedMessages(conversations: any[]): Promise<number> {
  console.log('📝 Seeding messages...');

  let totalMessages = 0;

  for (const conversation of conversations) {
    // Create 3-10 messages per conversation
    const messageCount = faker.number.int({ min: 3, max: 10 });

    for (let i = 0; i < messageCount; i++) {
      const isUserMessage = i % 2 === 0; // Alternate between user and assistant

      const content = isUserMessage
        ? faker.helpers.arrayElement([
            'Can you help me understand this code?',
            'How do I implement authentication?',
            'What are the best practices for API design?',
            'Explain this error message',
            'How can I optimize this query?'
          ])
        : faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 }));

      const tokenCount = Math.ceil(content.length / 4); // Rough estimate

      await chatPrisma.message.create({
        data: {
          conversationId: conversation.id,
          role: isUserMessage ? 'user' : 'assistant',
          content,
          contentType: 'text',
          tokenCount,
          model: conversation.model,
          createdAt: faker.date.recent({ days: 30 })
        }
      });
      totalMessages++;
    }
  }

  console.log(`✅ Created ${totalMessages} messages`);
  return totalMessages;
}

async function seedSubscriptions(users: any[]) {
  console.log('💳 Seeding subscriptions...');

  const subscriptions = [];

  for (const user of users) {
    // Only create subscriptions for paid users
    if (user.planTier !== 'FREE') {
      const now = new Date();
      const periodStart = faker.date.past({ years: 0.5 });
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subscription = await billingPrisma.subscriptions.create({
        data: {
          id: faker.string.uuid(),
          userId: user.id,
          stripeSubscriptionId: `sub_${faker.string.alphanumeric(24)}`,
          stripeCustomerId: `cus_${faker.string.alphanumeric(24)}`,
          planTier: user.planTier,
          status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'TRIALING']),
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          createdAt: periodStart,
          updatedAt: now
        }
      });
      subscriptions.push(subscription);
    }
  }

  console.log(`✅ Created ${subscriptions.length} subscriptions`);
  return subscriptions;
}

async function seedPayments(subscriptions: any[]): Promise<number> {
  console.log('💰 Seeding payments...');

  let paymentsCount = 0;

  for (const subscription of subscriptions) {
    // Create 1-6 payment records per subscription (monthly payments)
    const paymentCount = faker.number.int({ min: 1, max: 6 });

    for (let i = 0; i < paymentCount; i++) {
      const amount = subscription.planTier === 'PRO' ? 1999 : 999; // in cents
      await billingPrisma.payments.create({
        data: {
          id: faker.string.uuid(),
          userId: subscription.userId,
          stripePaymentId: `pi_${faker.string.alphanumeric(24)}`,
          stripeInvoiceId: `in_${faker.string.alphanumeric(24)}`,
          amount,
          currency: 'usd',
          status: faker.helpers.arrayElement(['SUCCEEDED', 'SUCCEEDED', 'SUCCEEDED', 'PENDING']),
          planTier: subscription.planTier,
          description: `${subscription.planTier} Plan - Monthly Subscription`,
          paidAt: faker.date.past({ years: 0.5 }),
          createdAt: faker.date.past({ years: 0.5 })
        }
      });
      paymentsCount++;
    }
  }

  console.log(`✅ Created ${paymentsCount} payments`);
  return paymentsCount;
}

async function seedTokenUsage(conversations: any[]): Promise<number> {
  console.log('📊 Seeding token usage...');

  let totalUsageRecords = 0;

  for (const conversation of conversations) {
    // Create 5-15 usage records per conversation
    const usageCount = faker.number.int({ min: 5, max: 15 });

    for (let i = 0; i < usageCount; i++) {
      const promptTokens = faker.number.int({ min: 100, max: 1000 });
      const completionTokens = faker.number.int({ min: 200, max: 2000 });
      const totalTokens = promptTokens + completionTokens;

      // Calculate cost based on model (approximate)
      const costPerToken = conversation.model === 'gpt-4' ? 0.00003 : 0.000002;
      const cost = totalTokens * costPerToken;

      await chatPrisma.tokenUsage.create({
        data: {
          userId: conversation.userId,
          conversationId: conversation.id,
          messageId: null, // We could link to specific messages if needed
          model: conversation.model,
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
          createdAt: faker.date.recent({ days: 30 })
        }
      });
      totalUsageRecords++;
    }
  }

  console.log(`✅ Created ${totalUsageRecords} token usage records`);
  return totalUsageRecords;
}

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clean existing data
    await cleanDatabase();

    // Seed data
    const users = await seedUsers();
    const conversations = await seedConversations(users);
    const messagesCount = await seedMessages(conversations);
    const subscriptions = await seedSubscriptions(users);
    const paymentsCount = await seedPayments(subscriptions);
    const tokenUsageCount = await seedTokenUsage(conversations);

    // Summary
    const stats: SeedStats = {
      users: users.length,
      conversations: conversations.length,
      messages: messagesCount,
      subscriptions: subscriptions.length,
      payments: paymentsCount,
      tokenUsage: tokenUsageCount
    };

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('─────────────────────────────');
    console.log(`👥 Users:         ${stats.users}`);
    console.log(`💬 Conversations: ${stats.conversations}`);
    console.log(`📝 Messages:      ${stats.messages}`);
    console.log(`💳 Subscriptions: ${stats.subscriptions}`);
    console.log(`💰 Payments:      ${stats.payments}`);
    console.log(`📊 Token Usage:   ${stats.tokenUsage}`);
    console.log('─────────────────────────────\n');

    console.log('🔑 Test Credentials:');
    console.log('  Email:    test1@example.com (PRO)');
    console.log('  Email:    test2@example.com (PLUS)');
    console.log('  Email:    test3@example.com (FREE)');
    console.log('  Email:    test4@example.com (FREE)');
    console.log('  Email:    test5@example.com (FREE)');
    console.log('  Password: Test123!\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await authPrisma.$disconnect();
    await chatPrisma.$disconnect();
    await billingPrisma.$disconnect();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };

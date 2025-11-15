import { PrismaClient as AuthPrismaClient } from '../../services/auth-service/node_modules/.prisma/client';
import { PrismaClient as ChatPrismaClient } from '../../services/chat-service/node_modules/.prisma/client';
import { PrismaClient as BillingPrismaClient } from '../../services/billing-service/node_modules/.prisma/client';

const authPrisma = new AuthPrismaClient({
  datasources: { db: { url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL } }
});

const chatPrisma = new ChatPrismaClient({
  datasources: { db: { url: process.env.CHAT_DATABASE_URL || process.env.DATABASE_URL } }
});

const billingPrisma = new BillingPrismaClient({
  datasources: { db: { url: process.env.BILLING_DATABASE_URL || process.env.DATABASE_URL } }
});

async function reset() {
  console.log('🔄 Resetting test database...\n');

  try {
    console.log('🧹 Cleaning chat service...');
    await chatPrisma.message.deleteMany();
    await chatPrisma.conversation.deleteMany();
    await chatPrisma.tokenUsage.deleteMany();
    console.log('  ✅ Chat service cleaned');

    console.log('🧹 Cleaning billing service...');
    await billingPrisma.payments.deleteMany();
    await billingPrisma.subscriptions.deleteMany();
    await billingPrisma.messages.deleteMany();
    await billingPrisma.conversations.deleteMany();
    await billingPrisma.token_usage.deleteMany();
    await billingPrisma.usage_alerts.deleteMany();
    await billingPrisma.user.deleteMany();
    console.log('  ✅ Billing service cleaned');

    console.log('🧹 Cleaning auth service...');
    await authPrisma.emailVerificationToken.deleteMany();
    await authPrisma.passwordResetToken.deleteMany();
    await authPrisma.user.deleteMany();
    console.log('  ✅ Auth service cleaned');

    console.log('\n✨ Database reset completed successfully!\n');

  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await authPrisma.$disconnect();
    await chatPrisma.$disconnect();
    await billingPrisma.$disconnect();
  }
}

// Run reset if executed directly
if (require.main === module) {
  reset()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { reset };

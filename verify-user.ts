/**
 * Manually verify user for testing
 */

import { PrismaClient } from '../backend/services/auth-service/node_modules/@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_vQGfJx9H8pjD@ep-sparkling-sun-a1gledz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function verifyUser() {
  try {
    const user = await prisma.user.update({
      where: { emailLower: 'test@example.com' },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    console.log('✅ User verified successfully:', {
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt
    });
  } catch (error: any) {
    console.error('❌ Error verifying user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();

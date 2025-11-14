// Quick script to manually verify email
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error('Usage: node verify-email-manual.js <email>');
  process.exit(1);
}

async function verifyEmail() {
  try {
    const user = await prisma.user.update({
      where: { emailLower: email.toLowerCase() },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, email: true, emailVerifiedAt: true }
    });

    console.log('✅ Email verified successfully!');
    console.log(user);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ User not found with email:', email);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmail();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('🗑️  Deleting all users...');

    // Delete all users (cascade delete will handle related records)
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users`);

    console.log('✅ All users deleted successfully!');
    console.log('\n👉 Now you can signup with any email again!');

  } catch (error) {
    console.error('❌ Error deleting users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPinnedColumn() {
  try {
    // Add the pinned column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false
    `);

    console.log('✓ Successfully added pinned column to conversations table');
  } catch (error) {
    console.error('Error adding pinned column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPinnedColumn();

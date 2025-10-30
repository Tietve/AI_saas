/**
 * E2E Test Setup
 * Global setup for end-to-end tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Setup test database
 */
export async function setupTestDatabase() {
  // Clean up test data
  await cleanupTestData();
}

/**
 * Cleanup test data
 */
export async function cleanupTestData() {
  // Delete test users (emails starting with 'test' or 'e2e')
  await prisma.user.deleteMany({
    where: {
      OR: [
        { emailLower: { startsWith: 'test' } },
        { emailLower: { startsWith: 'e2e' } },
        { emailLower: { contains: '@test.com' } }
      ]
    }
  });

  console.log('Test data cleaned up');
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase() {
  await cleanupTestData();
  await prisma.$disconnect();
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `e2e-test-${timestamp}-${random}@test.com`;
}

/**
 * Wait helper
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

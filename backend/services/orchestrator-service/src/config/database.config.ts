import { PrismaClient } from '@prisma/client';
import { env } from './env.config';

// Create Prisma Client instance
export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Connection test
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[Database] PostgreSQL connected successfully');
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('[Database] PostgreSQL disconnected');
}

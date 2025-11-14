import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton with connection error handling
 * Handles connection pooling, timeouts, and auto-reconnect
 */

// Singleton instance
let prisma: PrismaClient | null = null;

/**
 * Get Prisma client instance
 * Creates new instance if not exists or connection is lost
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'minimal',
    });

    // Handle connection errors
    prisma.$connect().catch((error) => {
      console.error('[Prisma] Initial connection failed:', error.message);
      // Don't throw - will retry on next query
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma?.$disconnect();
    });
  }

  return prisma;
}

/**
 * Execute query with retry logic for connection errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection error
      const isConnectionError =
        error.code === 'P1001' || // Can't reach database
        error.code === 'P1017' || // Server closed connection
        error.message?.includes('connection') ||
        error.message?.includes('timeout');

      if (isConnectionError && attempt < maxRetries) {
        console.warn(`[Prisma] Connection error on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms...`);

        // Disconnect and reconnect
        await prisma?.$disconnect();
        prisma = null; // Force recreation

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));

        continue;
      }

      // Not a connection error or max retries reached
      throw error;
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

// Export default client
export const db = getPrismaClient();

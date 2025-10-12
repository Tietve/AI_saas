/**
 * Lazy-loaded Prisma Client for Memory Optimization
 *
 * Instead of loading Prisma in every API endpoint (200MB+),
 * we load it only when needed and reuse the same instance.
 *
 * Usage:
 *   import { getPrisma } from '@/lib/prisma-lazy'
 *   const prisma = getPrisma()
 */

import { PrismaClient } from '@prisma/client'

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'minimal',
    })
  }
  return prismaInstance
}

// Singleton pattern - ensure only one instance
export const prisma = getPrisma()

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect()
      prismaInstance = null
    }
  })
}

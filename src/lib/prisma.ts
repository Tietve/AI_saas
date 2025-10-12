/**
 * Prisma Client Singleton - Production Ready
 *
 * This is the ONLY place where PrismaClient should be instantiated.
 * All other files MUST import from this module.
 *
 * Features:
 * - Single instance (prevents "e.$use is not a function" errors)
 * - Connection pooling (configured in DATABASE_URL)
 * - Query performance monitoring
 * - Error tracking
 * - Proper cleanup on shutdown
 */

import { PrismaClient } from '@prisma/client'
import { logger, logDbQuery, logError } from './logger'

declare global {
    var prisma: PrismaClient | undefined
}

/**
 * Create Prisma Client with optimal configuration
 */
function createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
        // Minimize logging in production to reduce memory usage
        log: process.env.NODE_ENV === 'production'
            ? ['error', 'warn']
            : ['error', 'warn'],
        errorFormat: 'minimal',
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    })

    // Add middleware for query performance monitoring (only once)
    client.$use(async (params, next) => {
        const startTime = Date.now()

        try {
            const result = await next(params)
            const duration = Date.now() - startTime

            // Log slow queries (> 1000ms)
            if (duration > 1000) {
                logDbQuery({
                    operation: params.action,
                    model: params.model || 'unknown',
                    duration,
                })
            }

            // Debug logging in development only
            if (process.env.NODE_ENV === 'development' && duration > 500) {
                logger.debug(
                    {
                        model: params.model,
                        action: params.action,
                        duration,
                    },
                    `DB: ${params.model}.${params.action} - ${duration}ms`
                )
            }

            return result
        } catch (error) {
            const duration = Date.now() - startTime

            logDbQuery({
                operation: params.action,
                model: params.model || 'unknown',
                duration,
                error: error instanceof Error ? error : new Error(String(error)),
            })

            if (error instanceof Error) {
                logError(error, {
                    extra: {
                        operation: params.action,
                        model: params.model,
                        args: params.args,
                    },
                    tags: {
                        component: 'database',
                        model: params.model || 'unknown',
                    },
                })
            }

            throw error
        }
    })

    logger.info('Prisma client initialized')

    return client
}

/**
 * Singleton Prisma Client Instance
 *
 * Uses globalThis in development to prevent hot-reload connection spam.
 * In production, creates a single instance.
 */
export const prisma = globalThis.prisma ?? createPrismaClient()

// Cache in development to prevent connection spam during hot reload
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}

/**
 * Database Connection Test
 */
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        logger.info('✅ Database connected successfully')
        return true
    } catch (error) {
        logger.error({ err: error }, '❌ Database connection failed')
        logger.error('Please check your DATABASE_URL in .env file')
        return false
    }
}

/**
 * Database Disconnect (cleanup)
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect()
        logger.info('📊 Database disconnected')
    } catch (error) {
        logger.error({ err: error }, 'Error disconnecting database')
    }
}

/**
 * Database Health Check (for /api/health)
 */
export async function checkDatabaseHealth(): Promise<{
    healthy: boolean
    latency: number
    error?: string
}> {
    const startTime = Date.now()

    try {
        await prisma.$queryRaw`SELECT 1`
        const latency = Date.now() - startTime

        return {
            healthy: true,
            latency,
        }
    } catch (error) {
        const latency = Date.now() - startTime

        logger.error({ err: error }, 'Database health check failed')

        return {
            healthy: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
    process.on('SIGINT', async () => {
        await disconnectDatabase()
        process.exit(0)
    })

    process.on('SIGTERM', async () => {
        await disconnectDatabase()
        process.exit(0)
    })
}

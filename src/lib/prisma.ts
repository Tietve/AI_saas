/**
 * Prisma Client with Production-Ready Configuration
 *
 * Features:
 * - Connection pooling (configured in DATABASE_URL)
 * - Query performance monitoring
 * - Slow query logging
 * - Error tracking with Sentry
 */

import { PrismaClient } from '@prisma/client'
import { logger, logDbQuery, logError } from './logger'

declare global {
    var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        errorFormat: 'pretty',
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    })

    // Add middleware for query performance monitoring
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

            // Debug logging in development
            if (process.env.NODE_ENV === 'development' && duration > 100) {
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

    logger.info('Prisma client initialized with connection pooling')

    return client
}

// Lazy singleton instance
let prismaInstance: PrismaClient | undefined

/**
 * Get Prisma Client instance (lazy initialization)
 *
 * This function creates the Prisma Client only when first called,
 * avoiding module-level initialization that would fail during
 * Next.js build-time page data collection.
 */
export function db(): PrismaClient {
    if (!prismaInstance) {
        // Check if we have a cached instance in development
        if (typeof globalThis.prisma !== 'undefined') {
            prismaInstance = globalThis.prisma
        } else {
            // Create new instance
            prismaInstance = prismaClientSingleton()

            // Cache in development to prevent connection spam during hot reload
            if (process.env.NODE_ENV !== 'production') {
                globalThis.prisma = prismaInstance
            }
        }
    }
    return prismaInstance
}

/**
 * Export prisma directly from db() for backwards compatibility
 * This ensures all methods like $use work correctly
 */
export const prisma = db()

export async function testDatabaseConnection(): Promise<boolean> {
    try {
        const client = db()
        await client.$connect()
        await client.$queryRaw`SELECT 1`
        logger.info('✅ Database connected successfully')
        return true
    } catch (error) {
        logger.error({ err: error }, '❌ Database connection failed')
        logger.error('Please check your DATABASE_URL in .env file')
        return false
    }
}

export async function disconnectDatabase(): Promise<void> {
    try {
        const client = db()
        await client.$disconnect()
        logger.info('📊 Database disconnected')
    } catch (error) {
        logger.error({ err: error }, 'Error disconnecting database')
        process.exit(1)
    }
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{
    healthy: boolean
    latency: number
    error?: string
}> {
    const startTime = Date.now()

    try {
        const client = db()
        await client.$queryRaw`SELECT 1`
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
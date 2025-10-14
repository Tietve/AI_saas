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

/**
 * Create Prisma Client with optimal configuration
 */
function createPrismaClient() {
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

    // Add query extension for performance monitoring (replaces deprecated $use)
    const extendedClient = client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const startTime = Date.now()

                    try {
                        const result = await query(args)
                        const duration = Date.now() - startTime

                        // Log slow queries (> 1000ms)
                        if (duration > 1000) {
                            logDbQuery({
                                operation,
                                model: model || 'unknown',
                                duration,
                            })
                        }

                        // Debug logging in development only
                        if (process.env.NODE_ENV === 'development' && duration > 500) {
                            logger.debug(
                                {
                                    model,
                                    action: operation,
                                    duration,
                                },
                                `DB: ${model}.${operation} - ${duration}ms`
                            )
                        }

                        return result
                    } catch (error) {
                        const duration = Date.now() - startTime

                        logDbQuery({
                            operation,
                            model: model || 'unknown',
                            duration,
                            error: error instanceof Error ? error : new Error(String(error)),
                        })

                        if (error instanceof Error) {
                            logError(error, {
                                extra: {
                                    operation,
                                    model,
                                    args,
                                },
                                tags: {
                                    component: 'database',
                                    model: model || 'unknown',
                                },
                            })
                        }

                        throw error
                    }
                }
            }
        }
    })

    logger.info('Prisma client initialized')

    return extendedClient
}

// Extended Prisma Client Type
type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

// Global declaration for development hot-reload
declare global {
    var prisma: ExtendedPrismaClient | undefined
}

/**
 * Singleton Prisma Client Instance
 *
 * Uses globalThis in development to prevent hot-reload connection spam.
 * In production, creates a single instance.
 */
/**
 * Lazily create Prisma client on first actual use to avoid
 * instantiating during build-time analysis (e.g., on Vercel).
 */
function getOrCreatePrisma(): ExtendedPrismaClient {
    if (!globalThis.prisma) {
        globalThis.prisma = createPrismaClient()
    }
    return globalThis.prisma
}

export const prisma: ExtendedPrismaClient = new Proxy({} as any, {
    get(_target, prop, receiver) {
        const instance = getOrCreatePrisma()
        return Reflect.get(instance as any, prop, receiver)
    },
}) as ExtendedPrismaClient

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

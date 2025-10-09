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



const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}


export { prisma }


export const db = prisma

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

export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect()
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
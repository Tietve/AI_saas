
import { PrismaClient } from '@prisma/client'


declare global {
    
    var prisma: PrismaClient | undefined
}


const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        errorFormat: 'pretty',
    })
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
        console.log('✅ Database connected successfully')
        return true
    } catch (error) {
        console.error('❌ Database connection failed:', error)
        console.error('Please check your DATABASE_URL in .env file')
        return false
    }
}


export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect()
        console.log('📊 Database disconnected')
    } catch (error) {
        console.error('Error disconnecting database:', error)
        
        process.exit(1)
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
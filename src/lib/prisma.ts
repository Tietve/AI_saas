// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Khai báo global để tránh TypeScript errors
declare global {
    // Cho phép PrismaClient được lưu trong globalThis
    var prisma: PrismaClient | undefined
}

// Tạo function để khởi tạo Prisma với proper configuration
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        errorFormat: 'pretty',
    })
}

// Sử dụng singleton pattern để tránh multiple connections
// Trong development, lưu instance vào global để hot reload không tạo connections mới
const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}

// Export mặc định là prisma
export { prisma }

// Export alias 'db' để backward compatibility với code cũ
export const db = prisma

// Helper function để test database connection
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        // Thử kết nối và query đơn giản
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

// Graceful shutdown helper
export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect()
        console.log('📊 Database disconnected')
    } catch (error) {
        console.error('Error disconnecting database:', error)
        // Force exit nếu không thể disconnect gracefully
        process.exit(1)
    }
}

// Handle process termination
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
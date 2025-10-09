// scripts/setup-database.ts
// Chạy với: npx tsx scripts/setup-database.ts

import { prisma, testDatabaseConnection } from '../src/lib/prisma'
import * as bcrypt from 'bcryptjs'

async function main() {
    console.log('🚀 Starting database setup...\n')

    // Test connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
        console.error('❌ Cannot connect to database. Please check your DATABASE_URL')
        process.exit(1)
    }

    try {
        // 1. Check if tables exist
        console.log('📊 Checking existing tables...')
        const tables = await prisma.$queryRaw<Array<{tablename: string}>>`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        `

        if (tables.length === 0) {
            console.log('⚠️  No tables found. Please run: npx prisma migrate dev')
            process.exit(1)
        }

        console.log(`✅ Found ${tables.length} tables:`, tables.map(t => t.tablename).join(', '))

        // 2. Create demo user for testing
        console.log('\n👤 Setting up demo user for testing...')

        const demoEmail = 'demo@example.com'
        const demoPassword = 'demo1234' // Chỉ cho testing

        // Tìm user với email hoặc emailLower matching
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: demoEmail },
                    { emailLower: demoEmail.toLowerCase() }
                ]
            }
        })

        if (existingUser) {
            console.log('✓ Demo user already exists')
            console.log(`  ID: ${existingUser.id}`)
            console.log(`  Email: ${demoEmail}`)
            console.log(`  Password: ${demoPassword}`)

            // Đảm bảo demo user đã verified email
            if (!existingUser.emailVerifiedAt) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { emailVerifiedAt: new Date() }
                })
                console.log('  ✅ Verified email for demo user')
            }
        } else {
            const hashedPassword = await bcrypt.hash(demoPassword, 12)

            const newUser = await prisma.user.create({
                data: {
                    email: demoEmail,
                    emailLower: demoEmail.toLowerCase(),
                    passwordHash: hashedPassword,
                    emailVerifiedAt: new Date(), // Auto verify cho demo
                    planTier: 'FREE',
                    monthlyTokenUsed: 0
                }
            })

            console.log('✅ Demo user created successfully!')
            console.log(`  ID: ${newUser.id}`)
            console.log(`  Email: ${demoEmail}`)
            console.log(`  Password: ${demoPassword}`)
            console.log(`  Status: Email verified`)
        }

        // 3. Check and fix any data inconsistencies
        console.log('\n🔧 Checking data consistency...')

        // Lấy tất cả users để kiểm tra emailLower
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                emailLower: true
            }
        })

        let fixedCount = 0
        for (const user of allUsers) {
            const expectedLower = user.email.toLowerCase()

            // Check if emailLower is empty string or doesn't match expected value
            if (!user.emailLower || user.emailLower !== expectedLower) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { emailLower: expectedLower }
                })
                fixedCount++
                console.log(`  Fixed emailLower for user: ${user.email}`)
            }
        }

        if (fixedCount > 0) {
            console.log(`✅ Fixed emailLower for ${fixedCount} users`)
        } else {
            console.log('✅ All users have correct emailLower values')
        }

        // 4. Clean up expired tokens
        console.log('\n🧹 Cleaning up expired tokens...')

        const now = new Date()

        // Clean expired email verification tokens
        const expiredEmailTokens = await prisma.emailVerificationToken.deleteMany({
            where: { expiresAt: { lt: now } }
        })

        // Clean expired password reset tokens
        const expiredResetTokens = await prisma.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { usedAt: { not: null } } // Also clean used tokens
                ]
            }
        })

        console.log(`✅ Cleaned up ${expiredEmailTokens.count} expired email tokens`)
        console.log(`✅ Cleaned up ${expiredResetTokens.count} expired/used reset tokens`)

        // 5. Create sample conversation for demo user
        console.log('\n💬 Setting up sample conversation...')

        const demoUser = await prisma.user.findFirst({
            where: { emailLower: demoEmail.toLowerCase() }
        })

        if (demoUser) {
            // Check if demo user already has conversations
            const existingConversations = await prisma.conversation.count({
                where: { userId: demoUser.id }
            })

            if (existingConversations === 0) {
                // Create a welcome conversation
                const welcomeConvo = await prisma.conversation.create({
                    data: {
                        userId: demoUser.id,
                        title: 'Welcome to AI Chat Platform',
                        systemPrompt: 'You are a helpful AI assistant.',
                        model: 'gpt-4o-mini'
                    }
                })

                // Add welcome messages
                await prisma.message.createMany({
                    data: [
                        {
                            conversationId: welcomeConvo.id,
                            role: 'USER',
                            content: 'Hello! What can you help me with?'
                        },
                        {
                            conversationId: welcomeConvo.id,
                            role: 'ASSISTANT',
                            content: 'Hello! I\'m your AI assistant. I can help you with a wide range of tasks including:\n\n• Answering questions\n• Writing and editing text\n• Code generation and debugging\n• Creative writing\n• Analysis and problem-solving\n\nFeel free to ask me anything!'
                        }
                    ]
                })

                console.log('✅ Created welcome conversation for demo user')
            } else {
                console.log(`✓ Demo user already has ${existingConversations} conversation(s)`)
            }
        }

        // 6. Display system statistics
        console.log('\n📈 System Statistics:')

        const [
            totalUsers,
            totalConversations,
            totalMessages,
            totalTokenUsage,
            activeSubscriptions
        ] = await Promise.all([
            prisma.user.count(),
            prisma.conversation.count(),
            prisma.message.count(),
            prisma.tokenUsage.count(),
            prisma.subscription.count({ where: { status: 'ACTIVE' } })
        ])

        console.log(`  Total Users: ${totalUsers}`)
        console.log(`  Total Conversations: ${totalConversations}`)
        console.log(`  Total Messages: ${totalMessages}`)
        console.log(`  Total Token Usage Records: ${totalTokenUsage}`)
        console.log(`  Active Subscriptions: ${activeSubscriptions}`)

        // 7. Verify critical environment variables
        console.log('\n🔐 Environment Check:')

        const envChecks = {
            'Database': !!process.env.DATABASE_URL,
            'Auth Secret': !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
            'OpenAI API': !!process.env.OPENAI_API_KEY,
            'Anthropic API': !!process.env.ANTHROPIC_API_KEY,
            'Google API': !!process.env.GOOGLE_API_KEY,
            'SMTP Config': !!process.env.SMTP_HOST
        }

        for (const [key, value] of Object.entries(envChecks)) {
            console.log(`  ${key}: ${value ? '✅' : '⚠️  Missing'}`)
        }

        const missingCount = Object.values(envChecks).filter(v => !v).length
        if (missingCount > 0) {
            console.log(`\n⚠️  ${missingCount} configuration(s) missing. Check your .env.local file`)
        }

        // Success message
        console.log('\n✨ Database setup completed successfully!')
        console.log('\n📝 Next steps:')
        console.log('1. Run the app: npm run dev')
        console.log(`2. Open browser: http://localhost:3000`)
        console.log(`3. Login with: ${demoEmail} / ${demoPassword}`)
        console.log('4. Test the chat functionality')

        if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GOOGLE_API_KEY) {
            console.log('\n⚠️  No AI provider API keys found!')
            console.log('   Add at least one API key to .env.local:')
            console.log('   - OPENAI_API_KEY=sk-...')
            console.log('   - ANTHROPIC_API_KEY=sk-ant-...')
            console.log('   - GOOGLE_API_KEY=AIza...')
        }

    } catch (error) {
        console.error('❌ Setup failed:', error)

        // Provide more helpful error messages
        if (error instanceof Error) {
            if (error.message.includes('P2002')) {
                console.error('\n📝 This looks like a unique constraint violation.')
                console.error('   Try running: npm run db:reset')
            } else if (error.message.includes('P2025')) {
                console.error('\n📝 Record not found error.')
                console.error('   The database might be in an inconsistent state.')
            } else if (error.message.includes('connect')) {
                console.error('\n📝 Database connection error.')
                console.error('   Check if PostgreSQL is running and DATABASE_URL is correct.')
            }
        }

        process.exit(1)
    } finally {
        await prisma.$disconnect()
        console.log('\n👋 Database connection closed')
    }
}

// Run the setup
main().catch(error => {
    console.error('Unhandled error:', error)
    process.exit(1)
})
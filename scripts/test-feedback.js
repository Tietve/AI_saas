const { PrismaClient } = require('@prisma/client')

async function testFeedback() {
    const prisma = new PrismaClient()
    
    try {
        console.log('Testing database connection...')
        
        // Test MessageFeedback model
        const feedbackCount = await prisma.messageFeedback.count()
        console.log('MessageFeedback count:', feedbackCount)
        
        // Test unique constraint
        const constraintTest = await prisma.messageFeedback.findMany({
            take: 1
        })
        console.log('Constraint test result:', constraintTest.length > 0 ? 'Working' : 'No data')
        
        console.log('✅ Database connection successful')
        
    } catch (error) {
        console.error('❌ Database error:', error.message)
        console.error('Full error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testFeedback()


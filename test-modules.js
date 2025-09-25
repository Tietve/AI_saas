// Test script để kiểm tra các modules
const testModules = async () => {
  console.log('🧪 Testing modules...')
  
  try {
    // Test Prisma
    console.log('\n1. Testing Prisma...')
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Prisma OK')
    await prisma.$disconnect()
    
    // Test OpenAI
    console.log('\n2. Testing OpenAI...')
    const OpenAI = require('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'test' })
    console.log('✅ OpenAI client created')
    
    // Test other modules
    console.log('\n3. Testing other modules...')
    
    try {
      const { getUserIdFromSession } = require('./src/lib/auth/session')
      console.log('✅ Auth session module OK')
    } catch (e) {
      console.log('❌ Auth session module error:', e.message)
    }
    
    try {
      const { performanceMonitor } = require('./src/lib/monitoring/performance')
      console.log('✅ Performance monitor module OK')
    } catch (e) {
      console.log('❌ Performance monitor module error:', e.message)
    }
    
    try {
      const { withMemoryOptimization } = require('./src/lib/optimization/memory-manager')
      console.log('✅ Memory manager module OK')
    } catch (e) {
      console.log('❌ Memory manager module error:', e.message)
    }
    
    try {
      const { withErrorHandling } = require('./src/lib/error/error-handler')
      console.log('✅ Error handler module OK')
    } catch (e) {
      console.log('❌ Error handler module error:', e.message)
    }
    
    console.log('\n✅ Module tests completed!')
    
  } catch (error) {
    console.error('❌ Module test failed:', error)
  }
}

testModules()

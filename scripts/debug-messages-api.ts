#!/usr/bin/env tsx

/**
 * Debug script to test messages API
 * Usage: npx tsx scripts/debug-messages-api.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testMessagesAPI() {
    console.log('🔍 Testing Messages API')
    console.log('API Base:', API_BASE)
    
    // You need to replace these with actual values from your production
    const conversationId = 'cmgxax24g001anyv9bxq26td6' // From your error log
    const sessionToken = process.env.TEST_SESSION_TOKEN // Set this in your env
    
    if (!sessionToken) {
        console.error('❌ Please set TEST_SESSION_TOKEN environment variable')
        console.log('   Get it from browser DevTools > Application > Cookies > session')
        process.exit(1)
    }
    
    const url = `${API_BASE}/api/conversations/${conversationId}/messages?limit=100`
    
    console.log('\n📤 Request:')
    console.log('URL:', url)
    console.log('Cookie:', sessionToken.substring(0, 20) + '...')
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cookie': `session=${sessionToken}`,
                'Content-Type': 'application/json',
            },
        })
        
        console.log('\n📥 Response:')
        console.log('Status:', response.status, response.statusText)
        console.log('Headers:', Object.fromEntries(response.headers.entries()))
        
        const text = await response.text()
        console.log('\nBody (raw):', text)
        
        try {
            const json = JSON.parse(text)
            console.log('\nBody (parsed):', JSON.stringify(json, null, 2))
        } catch (e) {
            console.log('(Not valid JSON)')
        }
        
        if (response.status !== 200) {
            console.error('\n❌ API returned error status:', response.status)
            return false
        }
        
        console.log('\n✅ Success!')
        return true
        
    } catch (error) {
        console.error('\n❌ Request failed:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
            console.error('Stack:', error.stack)
        }
        return false
    }
}

// Also test health endpoint
async function testHealth() {
    console.log('\n\n🏥 Testing Health Endpoint')
    const url = `${API_BASE}/api/health`
    
    try {
        const response = await fetch(url)
        const data = await response.json()
        console.log('Status:', response.status)
        console.log('Data:', JSON.stringify(data, null, 2))
        return response.status === 200
    } catch (error) {
        console.error('Health check failed:', error)
        return false
    }
}

async function main() {
    console.log('=' .repeat(60))
    console.log('🐛 Messages API Debug Script')
    console.log('=' .repeat(60))
    
    const healthOk = await testHealth()
    if (!healthOk) {
        console.error('\n⚠️  Health check failed, but continuing...')
    }
    
    const messagesOk = await testMessagesAPI()
    
    console.log('\n' + '='.repeat(60))
    console.log(messagesOk ? '✅ All tests passed' : '❌ Tests failed')
    console.log('=' .repeat(60))
    
    process.exit(messagesOk ? 0 : 1)
}

main()

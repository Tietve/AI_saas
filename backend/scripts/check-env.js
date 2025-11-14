// scripts/check-env.js
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Checking authentication environment...\n')

const checks = {
    'AUTH_SECRET': {
        value: process.env.AUTH_SECRET,
        check: (v) => v && v.length >= 32,
        message: 'Must be at least 32 characters'
    },
    'AUTH_COOKIE_NAME': {
        value: process.env.AUTH_COOKIE_NAME || 'session',
        check: (v) => v && v.length > 0,
        message: 'Cookie name should be set'
    },
    'NODE_ENV': {
        value: process.env.NODE_ENV,
        check: (v) => ['development', 'production'].includes(v),
        message: 'Should be development or production'
    }
}

let hasErrors = false

for (const [key, config] of Object.entries(checks)) {
    const isValid = config.check(config.value)
    const status = isValid ? '✅' : '❌'

    console.log(`${status} ${key}: ${config.value ? `"${config.value}"` : 'NOT SET'}`)

    if (!isValid) {
        console.log(`   → ${config.message}`)
        hasErrors = true
    }
}

if (hasErrors) {
    console.log('\n❌ Fix the above issues in your .env.local file')
    process.exit(1)
} else {
    console.log('\n✅ All environment variables look good!')
}

// Test JWT creation
console.log('\n🔐 Testing JWT operations...')

try {
    const { SignJWT, jwtVerify } = require('jose')

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    const testPayload = { uid: 'test-user-123', email: 'test@example.com' }

    // Test signing
    const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret)

    console.log('✅ JWT signing works')

    // Test verification
    const { payload } = await jwtVerify(token, secret)
    console.log('✅ JWT verification works')
    console.log(`   Decoded payload: ${JSON.stringify(payload, null, 2)}`)

} catch (error) {
    console.error('❌ JWT test failed:', error.message)
    hasErrors = true
}

if (!hasErrors) {
    console.log('\n🎉 Authentication setup looks healthy!')
}
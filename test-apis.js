// Test script để kiểm tra APIs
const testAPIs = async () => {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing APIs...')
  
  try {
    // Test health check
    console.log('\n1. Testing health check...')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    console.log('Health status:', healthResponse.status)
    
    // Test simple intent classify
    console.log('\n2. Testing simple intent classify...')
    const intentResponse = await fetch(`${baseUrl}/api/intent/classify-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'làm logo cho tôi' })
    })
    const intentData = await intentResponse.json()
    console.log('Intent result:', intentData)
    
    // Test simple chat send
    console.log('\n3. Testing simple chat send...')
    const chatResponse = await fetch(`${baseUrl}/api/chat/send-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        conversationId: 'test-123',
        content: 'Hello world',
        model: 'gpt-4o-mini'
      })
    })
    const chatData = await chatResponse.json()
    console.log('Chat result:', chatData)
    
    console.log('\n✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAPIs()




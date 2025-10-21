// Verify if new code is deployed by checking for the debug endpoint
const AZURE_URL = 'https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net'

console.log('🔍 Checking if new code is deployed...')
console.log('')

async function check() {
  // Test the new debug endpoint - only exists in new code
  console.log('Testing /api/debug/env endpoint (only in new code)...')
  
  try {
    const res = await fetch(`${AZURE_URL}/api/debug/env`)
    console.log('Status:', res.status)
    
    if (res.status === 200) {
      const data = await res.json()
      console.log('✅ NEW CODE IS DEPLOYED!')
      console.log('Response:', JSON.stringify(data, null, 2))
    } else if (res.status === 404) {
      console.log('❌ OLD CODE STILL RUNNING!')
      console.log('The /api/debug/env endpoint does not exist.')
      console.log('This endpoint was added in the new code.')
      console.log('')
      console.log('💡 Solutions:')
      console.log('  1. Wait a few more minutes for deployment')
      console.log('  2. Check Azure deployment logs')
      console.log('  3. Manually trigger redeploy')
      console.log('  4. Restart Azure app service')
    } else {
      console.log('⚠️  Unexpected status:', res.status)
    }
  } catch (error) {
    console.error('❌ Error checking deployment:', error.message)
  }
  
  console.log('')
  console.log('Commands to fix:')
  console.log('  az webapp restart --name firbox-api --resource-group firbox-rg')
  console.log('  az webapp deployment list --name firbox-api --resource-group firbox-rg')
}

check()


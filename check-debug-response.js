// Check debug endpoint for "runtime" field (proves new code deployed)
const url = 'https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/debug/env'

console.log('Checking debug endpoint...')
console.log(url)
console.log('')

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('Full Response:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')
    
    if (data.runtime === 'nodejs') {
      console.log('✅ NEW CODE IS DEPLOYED!')
      console.log('   The "runtime" field exists (added in new code)')
    } else {
      console.log('❌ OLD CODE STILL RUNNING!')
      console.log('   The "runtime" field is missing')
    }
    console.log('')
    
    if (data.environment && data.environment.AUTH_SECRET_SET !== undefined) {
      console.log('✅ AUTH_SECRET_SET field exists (new code)')
    } else {
      console.log('❌ AUTH_SECRET_SET field missing (old code)')
    }
  })
  .catch(err => console.error('Error:', err.message))


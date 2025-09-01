/**
 * Simple Customer System Test
 */

const testCustomerSystem = async () => {
  try {
    console.log('🧪 Testing Customer System...')
    
    // Test 1: Public Menu API
    console.log('\n1. Testing Public Menu API...')
    const menuResponse = await fetch('http://localhost:3000/api/public/menu')
    const menuData = await menuResponse.json()
    
    if (Array.isArray(menuData)) {
      console.log('✅ Public Menu API: Working')
      console.log(`   Found ${menuData.length} categories`)
    } else {
      console.log('❌ Public Menu API: Failed')
      console.log('   Response:', menuData)
    }
    
    // Test 2: Customer Registration
    console.log('\n2. Testing Customer Registration...')
    const customerData = {
      email: 'test-customer-' + Date.now() + '@royalfood.com',
      phone: '+880171' + Math.floor(Math.random() * 1000000),
      name: 'Test Customer',
      address: '123 Test Street, Dhaka'
    }
    
    const customerResponse = await fetch('http://localhost:3000/api/public/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    })
    
    const customerResult = await customerResponse.json()
    
    if (customerResult.success) {
      console.log('✅ Customer Registration: Working')
      console.log(`   Customer ID: ${customerResult.customer.id}`)
    } else {
      console.log('❌ Customer Registration: Failed')
      console.log('   Error:', customerResult.error)
    }
    
    console.log('\n🎉 Customer system basic tests completed!')
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run the test
testCustomerSystem()

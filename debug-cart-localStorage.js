// Debug cart localStorage
console.log('🔍 Current localStorage cart state:');
console.log('localStorage.getItem("royal-food-cart"):', localStorage.getItem('royal-food-cart'));

// Test cart operations
function testCartOperations() {
  console.log('\n🧪 Testing cart localStorage operations...');
  
  // Simulate adding items
  const testCart = [
    { id: 'item1', name: 'Test Item 1', price: 10, quantity: 1 },
    { id: 'item2', name: 'Test Item 2', price: 15, quantity: 2 }
  ];
  
  console.log('1. Setting test cart in localStorage...');
  localStorage.setItem('royal-food-cart', JSON.stringify(testCart));
  console.log('   Stored:', JSON.stringify(testCart));
  
  console.log('2. Reading back from localStorage...');
  const retrieved = localStorage.getItem('royal-food-cart');
  console.log('   Retrieved:', retrieved);
  
  console.log('3. Parsing retrieved data...');
  const parsed = JSON.parse(retrieved);
  console.log('   Parsed:', parsed);
  
  console.log('4. Simulating item removal (remove item1)...');
  const filtered = parsed.filter(item => item.id !== 'item1');
  console.log('   After removal:', filtered);
  
  console.log('5. Saving filtered cart back to localStorage...');
  localStorage.setItem('royal-food-cart', JSON.stringify(filtered));
  
  console.log('6. Final verification...');
  const final = localStorage.getItem('royal-food-cart');
  console.log('   Final localStorage:', final);
  
  // Clean up
  localStorage.removeItem('royal-food-cart');
  console.log('7. Cleaned up test data');
}

testCartOperations();
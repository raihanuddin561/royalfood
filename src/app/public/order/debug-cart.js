// Debug Cart State - Run this in browser console
function debugCartState() {
  console.log('🔍 Cart State Debug Information');
  console.log('================================');
  
  console.log('1. Current localStorage cart:');
  const stored = localStorage.getItem('royal-food-cart');
  console.log('   Raw data:', stored);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('   Parsed data:', parsed);
      console.log('   Item count:', parsed.length);
    } catch (e) {
      console.log('   Error parsing:', e.message);
    }
  } else {
    console.log('   No cart data in localStorage');
  }
  
  console.log('\n2. Session storage check:');
  const reorder = sessionStorage.getItem('reorderItems');
  console.log('   Reorder items:', reorder);
  
  console.log('\n3. URL parameters:');
  const params = new URLSearchParams(window.location.search);
  console.log('   item param:', params.get('item'));
  
  console.log('\n4. Page information:');
  console.log('   Current URL:', window.location.href);
  console.log('   Pathname:', window.location.pathname);
}

function clearAllCartData() {
  console.log('🧹 Clearing all cart data...');
  localStorage.removeItem('royal-food-cart');
  sessionStorage.removeItem('reorderItems');
  console.log('   ✅ All cart data cleared');
}

function testCartPersistence() {
  console.log('🧪 Testing cart persistence...');
  
  // Add test data
  const testData = [
    { id: 'test1', name: 'Test Item 1', price: 10, quantity: 1 },
    { id: 'test2', name: 'Test Item 2', price: 15, quantity: 1 }
  ];
  
  localStorage.setItem('royal-food-cart', JSON.stringify(testData));
  console.log('   ✅ Added test cart data');
  
  // Remove one item
  const filtered = testData.filter(item => item.id !== 'test1');
  localStorage.setItem('royal-food-cart', JSON.stringify(filtered));
  console.log('   ✅ Removed test1, remaining:', filtered);
  
  // Verify
  const verification = JSON.parse(localStorage.getItem('royal-food-cart'));
  console.log('   ✅ Verification:', verification);
  
  return verification;
}

// Export functions for browser console use
window.debugCartState = debugCartState;
window.clearAllCartData = clearAllCartData;
window.testCartPersistence = testCartPersistence;

console.log('🔧 Cart debugging functions loaded!');
console.log('   Run: debugCartState() - to see current state');
console.log('   Run: clearAllCartData() - to clear all cart data');
console.log('   Run: testCartPersistence() - to test persistence');

// Auto-run debug
debugCartState();
const http = require('http');

console.log('🔍 DIAGNOSTIC CHECK - Royal Food Summary System');
console.log('=====================================');

async function runDiagnostics() {
  console.log('📋 Running system diagnostics...\n');

  // Test 1: Check if server is responding
  console.log('1️⃣ Testing server connectivity...');
  try {
    await testEndpoint('http://localhost:3000', 'Main application');
  } catch (e) {
    console.log('❌ Server connectivity test failed');
  }

  // Test 2: Check API endpoint
  console.log('\n2️⃣ Testing Summary API...');
  try {
    await testEndpoint('http://localhost:3000/api/summary?period=today', 'Summary API');
  } catch (e) {
    console.log('❌ Summary API test failed');
  }

  // Test 3: Check navigation access
  console.log('\n3️⃣ Testing Summary Page...');
  try {
    await testEndpoint('http://localhost:3000/summary', 'Summary Page');
  } catch (e) {
    console.log('❌ Summary page test failed');
  }

  console.log('\n🎯 Diagnostic Results Complete');
  console.log('=====================================');
  console.log('If all tests pass but you still see errors:');
  console.log('1. Check browser console (F12 → Console)');
  console.log('2. Clear browser cache and refresh');
  console.log('3. Try incognito/private browsing mode');
  console.log('4. Check for ad blockers or security extensions');
}

function testEndpoint(url, name) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`  ✅ ${name}: Status ${res.statusCode} - OK`);
          resolve(data);
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          console.log(`  ⚠️  ${name}: Status ${res.statusCode} - Redirect`);
          resolve(data);
        } else {
          console.log(`  ❌ ${name}: Status ${res.statusCode} - Error`);
          console.log(`     Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ ${name}: Connection failed - ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`  ❌ ${name}: Request timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

runDiagnostics().catch(console.error);

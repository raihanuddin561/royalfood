// Management System Structure Validation
const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function validateManagementSystem() {
  console.log('🔍 Validating Management System Structure...\n');
  
  const basePath = 'src/app';
  const critical_files = [
    // API Endpoints
    { path: 'src/app/api/profit-analysis/route.ts', desc: 'Profit Analysis API', critical: true },
    { path: 'src/app/api/balance-sheet/route.ts', desc: 'Balance Sheet API', critical: true },
    { path: 'src/app/api/partnership/distribution/route.ts', desc: 'Partnership Distribution API', critical: true },
    { path: 'src/app/api/expenses/analytics/route.ts', desc: 'Expense Analytics API', critical: true },
    { path: 'src/app/api/restaurant-operations/daily-costs/route.ts', desc: 'Daily Costs API', critical: true },
    
    // Management Actions
    { path: 'src/app/actions/sales.ts', desc: 'Sales Actions (getComprehensiveProfitAnalysis)', critical: true },
    { path: 'src/app/actions/partnership.ts', desc: 'Partnership Actions', critical: true },
    
    // Management Pages
    { path: 'src/app/reports/page.tsx', desc: 'Financial Reports Page', critical: true },
    { path: 'src/app/sales/profits/page.tsx', desc: 'Profits Analysis Page', critical: true },
    { path: 'src/app/analytics/page.tsx', desc: 'Analytics Dashboard', critical: true },
    { path: 'src/app/dashboard/financial-dashboard.tsx', desc: 'Financial Dashboard', critical: true }
  ];
  
  let allValid = true;
  let validCount = 0;
  let totalCount = critical_files.length;
  
  critical_files.forEach(file => {
    const exists = checkFileExists(file.path);
    const status = exists ? '✅' : '❌';
    const criticality = file.critical ? '🔥 CRITICAL' : '';
    
    console.log(`${status} ${file.desc} ${criticality}`);
    console.log(`   └── ${file.path}`);
    
    if (exists) {
      validCount++;
    } else {
      allValid = false;
    }
    console.log('');
  });
  
  console.log('📊 MANAGEMENT SYSTEM STRUCTURE SUMMARY:');
  console.log(`✅ Valid: ${validCount}/${totalCount}`);
  console.log(`❌ Missing: ${totalCount - validCount}/${totalCount}`);
  
  if (allValid) {
    console.log('🎉 All management system files are present!');
  } else {
    console.log('⚠️  Some critical management files are missing!');
  }
  
  // Check for calculation functions
  console.log('\n🔍 Checking Critical Calculation Functions...\n');
  
  const salesActionsPath = 'src/app/actions/sales.ts';
  if (checkFileExists(salesActionsPath)) {
    const content = fs.readFileSync(salesActionsPath, 'utf8');
    const functions = [
      'getComprehensiveProfitAnalysis',
      'generateBalanceSheet', 
      'getDailyProfitAnalysis',
      'getMonthlyProfitTrends',
      'getCategoryProfitAnalysis'
    ];
    
    functions.forEach(func => {
      const exists = content.includes(func);
      console.log(`${exists ? '✅' : '❌'} ${func}`);
    });
  }
  
  return allValid;
}

const isValid = validateManagementSystem();
process.exit(isValid ? 0 : 1);

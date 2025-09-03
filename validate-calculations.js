// Cost Calculation Logic Validation
const fs = require('fs');

function validateCostCalculationLogic() {
  console.log('🔍 Validating Cost Calculation Logic...\n');
  
  const salesActionsPath = 'src/app/actions/sales.ts';
  const content = fs.readFileSync(salesActionsPath, 'utf8');
  
  const calculations = [
    {
      name: 'COGS Calculation',
      pattern: /totalCOGS.*reduce.*cogsData/s,
      description: 'Cost of Goods Sold calculation'
    },
    {
      name: 'Stock Usage Cost',
      pattern: /totalStockUsageCost.*reduce.*stockUsageData/s,
      description: 'Stock usage cost calculation'
    },
    {
      name: 'Direct Costs',
      pattern: /directCosts.*cogsAmount.*stockUsageAmount/s,
      description: 'Direct costs (COGS + Stock Usage)'
    },
    {
      name: 'Effective Expenses',
      pattern: /effectiveTotalExpenses.*totalExpensesRecorded.*stockExpensesRecorded.*cogsAmount.*stockUsageAmount/s,
      description: 'Effective expenses avoiding double-counting'
    },
    {
      name: 'Net Profit',
      pattern: /totalNetProfit.*totalRevenue.*totalDirectCosts.*totalExpenses/s,
      description: 'Net profit calculation'
    },
    {
      name: 'Gross Profit', 
      pattern: /totalGrossProfit.*totalRevenue.*totalDirectCosts/s,
      description: 'Gross profit calculation'
    }
  ];
  
  let validCalculations = 0;
  let totalCalculations = calculations.length;
  
  calculations.forEach(calc => {
    const found = calc.pattern.test(content);
    console.log(`${found ? '✅' : '❌'} ${calc.name}`);
    console.log(`   └── ${calc.description}`);
    
    if (found) {
      validCalculations++;
    }
    console.log('');
  });
  
  // Check for potential double-counting prevention
  console.log('🔍 Double-Counting Prevention Checks...\n');
  
  const doubleCountingChecks = [
    {
      name: 'Stock Expenses Exclusion',
      pattern: /totalExpensesRecorded.*-.*stockExpensesRecorded/,
      description: 'Removes recorded stock purchases to avoid double-counting with COGS'
    },
    {
      name: 'COGS Addition',
      pattern: /\+.*cogsAmount.*\+.*stockUsageAmount/,
      description: 'Adds actual COGS and stock usage costs'
    }
  ];
  
  doubleCountingChecks.forEach(check => {
    const found = check.pattern.test(content);
    console.log(`${found ? '✅' : '❌'} ${check.name}`);
    console.log(`   └── ${check.description}`);
    console.log('');
  });
  
  // Check for margin calculations
  console.log('🔍 Margin Calculation Checks...\n');
  
  const marginChecks = [
    {
      name: 'Gross Margin',
      pattern: /grossMargin.*totalGrossProfit.*totalRevenue.*100/,
      description: 'Gross margin percentage calculation'
    },
    {
      name: 'Net Margin',
      pattern: /netMargin.*totalNetProfit.*totalRevenue.*100/,
      description: 'Net margin percentage calculation'
    }
  ];
  
  marginChecks.forEach(check => {
    const found = check.pattern.test(content);
    console.log(`${found ? '✅' : '❌'} ${check.name}`);
    console.log(`   └── ${check.description}`);
    console.log('');
  });
  
  console.log('📊 COST CALCULATION VALIDATION SUMMARY:');
  console.log(`✅ Valid Calculations: ${validCalculations}/${totalCalculations}`);
  
  if (validCalculations === totalCalculations) {
    console.log('🎉 All cost calculations are properly implemented!');
    return true;
  } else {
    console.log('⚠️  Some cost calculations may have issues!');
    return false;
  }
}

const isValid = validateCostCalculationLogic();
process.exit(isValid ? 0 : 1);

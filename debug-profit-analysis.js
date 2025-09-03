const { getComprehensiveProfitAnalysis } = require('./src/app/actions/sales');

async function checkProfitAnalysis() {
  console.log('=== TESTING PROFIT ANALYSIS ===');
  
  try {
    // Test with current month data
    const result = await getComprehensiveProfitAnalysis('this_month');
    
    if (result.success) {
      console.log('\nSummary totals:');
      console.log(`Total Revenue: $${result.summary.totalRevenue}`);
      console.log(`Total Expenses: $${result.summary.totalExpenses}`);
      console.log(`Effective Total Expenses: $${result.summary.effectiveTotalExpenses}`);
      console.log(`Total Recorded Expenses: $${result.summary.totalRecordedExpenses}`);
      console.log(`Net Profit: $${result.summary.totalNetProfit}`);
      
      console.log('\nExpense Breakdown:');
      if (result.summary.breakdown) {
        console.log(`- COGS: $${result.summary.breakdown.totalCOGS}`);
        console.log(`- Stock Usage Cost: $${result.summary.breakdown.totalStockUsageCost}`);
        console.log(`- Stock Purchases: $${result.summary.breakdown.totalRecordedStockPurchases}`);
        console.log(`- Payroll: $${result.summary.breakdown.totalPayrollExpenses}`);
        console.log(`- Utilities: $${result.summary.breakdown.totalUtilitiesExpenses}`);
        console.log(`- Operational: $${result.summary.breakdown.totalOperationalExpenses}`);
        console.log(`- Other: $${result.summary.breakdown.totalOtherExpenses}`);
      }
      
      console.log('\nDaily data sample (first 3 days):');
      result.dailyData.slice(0, 3).forEach(day => {
        console.log(`\nDate: ${day.date}`);
        console.log(`  Revenue: $${day.totalRevenue}`);
        console.log(`  Total Expenses: $${day.totalExpenses}`);
        console.log(`  Recorded Expenses: $${day.totalRecordedExpenses}`);
        console.log(`  Effective Expenses: $${day.effectiveTotalExpenses}`);
        if (day.expenseBreakdown) {
          console.log(`  Expense breakdown:`);
          console.log(`    COGS: $${day.expenseBreakdown.costOfGoods}`);
          console.log(`    Stock Usage: $${day.expenseBreakdown.stockUsageCost}`);
          console.log(`    Stock Purchases: $${day.expenseBreakdown.stockExpenses}`);
          console.log(`    Payroll: $${day.expenseBreakdown.payrollExpenses}`);
          console.log(`    Utilities: $${day.expenseBreakdown.utilitiesExpenses}`);
          console.log(`    Operational: $${day.expenseBreakdown.operationalExpenses}`);
          console.log(`    Other: $${day.expenseBreakdown.otherExpenses}`);
        }
      });
      
    } else {
      console.log('Failed to get profit analysis:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProfitAnalysis();

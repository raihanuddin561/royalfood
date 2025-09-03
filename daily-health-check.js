const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Daily Calculation Health Check System
async function dailyCalculationHealthCheck() {
  console.log('🔍 DAILY CALCULATION HEALTH CHECK');
  console.log('='*40);
  
  const issues = [];
  const today = new Date();
  
  try {
    // 1. Stock Integrity Check
    console.log('\n📦 STOCK INTEGRITY CHECK');
    console.log('-'.repeat(25));
    
    const stockIssues = await prisma.$queryRaw`
      SELECT 
        i.id, i.name, i."currentStock",
        COALESCE(movements.calculated_stock, 0) as should_be
      FROM items i
      LEFT JOIN (
        SELECT 
          il."itemId",
          SUM(CASE WHEN il.type = 'STOCK_IN' THEN il.quantity ELSE 0 END) -
          SUM(CASE WHEN il.type = 'STOCK_OUT' THEN il.quantity ELSE 0 END) +
          SUM(CASE WHEN il.type = 'ADJUSTMENT' THEN il.quantity ELSE 0 END) -
          COALESCE(usage.total_usage, 0) as calculated_stock
        FROM inventory_logs il
        LEFT JOIN (
          SELECT "itemId", SUM(quantity) as total_usage
          FROM stock_usage GROUP BY "itemId"
        ) usage ON usage."itemId" = il."itemId"
        GROUP BY il."itemId"
      ) movements ON movements."itemId" = i.id
      WHERE i."isActive" = true
        AND ABS(COALESCE(i."currentStock", 0) - COALESCE(movements.calculated_stock, 0)) > 0.1
    `;
    
    if (stockIssues.length > 0) {
      issues.push(`${stockIssues.length} stock calculation discrepancies`);
      console.log('❌ Stock discrepancies found:');
      stockIssues.forEach(item => {
        console.log(`   ${item.name}: Current ${item.currentStock}, Should be ${item.should_be}`);
      });
    } else {
      console.log('✅ All stock calculations are accurate');
    }
    
    // 2. Price Validation
    console.log('\n💰 PRICE VALIDATION');
    console.log('-'.repeat(20));
    
    const priceIssues = await prisma.item.count({
      where: {
        isActive: true,
        OR: [
          { sellingPrice: null },
          { sellingPrice: { lte: 0 } },
          { costPrice: { lte: 0 } }
        ]
      }
    });
    
    if (priceIssues > 0) {
      issues.push(`${priceIssues} items have invalid prices`);
      console.log(`❌ ${priceIssues} items with price issues`);
    } else {
      console.log('✅ All prices are valid');
    }
    
    // 3. Profit Margin Alert
    console.log('\n📊 PROFIT MARGIN ALERTS');
    console.log('-'.repeat(25));
    
    const lowMarginItems = await prisma.$queryRaw`
      SELECT name, "costPrice", "sellingPrice",
             (("sellingPrice" - "costPrice") / "sellingPrice" * 100) as margin
      FROM items 
      WHERE "isActive" = true 
        AND "sellingPrice" > 0
        AND (("sellingPrice" - "costPrice") / "sellingPrice" * 100) < 15
    `;
    
    if (lowMarginItems.length > 0) {
      issues.push(`${lowMarginItems.length} items have low profit margins (<15%)`);
      console.log('⚠️ Low margin items:');
      lowMarginItems.forEach(item => {
        console.log(`   ${item.name}: ${item.margin.toFixed(2)}% margin`);
      });
    } else {
      console.log('✅ All items have healthy profit margins');
    }
    
    // 4. Daily Revenue vs Cost Analysis
    console.log('\n💹 DAILY REVENUE VS COST');
    console.log('-'.repeat(25));
    
    const todayRevenue = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        },
        status: 'COMPLETED'
      },
      _sum: { totalAmount: true }
    });
    
    const todayCOGS = await prisma.$queryRaw`
      SELECT SUM(su."totalCost") as daily_cogs
      FROM stock_usage su
      WHERE DATE(su."usageDate") = CURRENT_DATE
    `;
    
    const revenue = todayRevenue._sum.totalAmount || 0;
    const cogs = todayCOGS[0]?.daily_cogs || 0;
    const grossProfit = revenue - cogs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    
    console.log(`Today's Performance:`);
    console.log(`   Revenue: $${revenue.toFixed(2)}`);
    console.log(`   COGS: $${cogs.toFixed(2)}`);
    console.log(`   Gross Profit: $${grossProfit.toFixed(2)}`);
    console.log(`   Margin: ${margin.toFixed(2)}%`);
    
    if (margin < 20) {
      issues.push('Daily profit margin below 20%');
    }
    
    // 5. Generate Daily Report
    console.log('\n' + '='.repeat(40));
    console.log('📋 DAILY CALCULATION HEALTH REPORT');
    console.log('='.repeat(40));
    
    if (issues.length === 0) {
      console.log('🎉 EXCELLENT: No calculation issues found!');
      console.log('   All systems are operating optimally.');
    } else {
      console.log('⚠️ ISSUES DETECTED:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      console.log('\n🔧 Recommendation: Address these issues immediately');
    }
    
    console.log('\n📈 PROFITABILITY STATUS:');
    console.log(`   System Health Score: ${Math.max(0, 100 - (issues.length * 20))}%`);
    console.log(`   Current Margin: ${margin.toFixed(2)}%`);
    console.log(`   Revenue Trend: ${revenue > 1000 ? 'Strong' : 'Moderate'}`);
    
    return {
      healthy: issues.length === 0,
      issues: issues,
      metrics: {
        revenue: revenue,
        cogs: cogs,
        margin: margin,
        healthScore: Math.max(0, 100 - (issues.length * 20))
      }
    };
    
  } catch (error) {
    console.error('Health check error:', error);
    return { healthy: false, issues: ['System error during health check'], metrics: null };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the health check
if (require.main === module) {
  dailyCalculationHealthCheck().then(result => {
    if (!result.healthy) {
      process.exit(1); // Exit with error code if issues found
    }
  }).catch(console.error);
}

module.exports = { dailyCalculationHealthCheck };

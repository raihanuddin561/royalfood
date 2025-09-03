const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleHealthCheck() {
  console.log('🏥 RESTAURANT SYSTEM HEALTH CHECK');
  console.log('='*40);
  
  const healthReport = {
    issues: [],
    warnings: [],
    metrics: {}
  };
  
  try {
    // 1. Check for critical calculation issues
    console.log('\n1. CRITICAL SYSTEM CHECKS');
    console.log('-'.repeat(30));
    
    // Check for negative stock
    const negativeStock = await prisma.item.findMany({
      where: {
        isActive: true,
        currentStock: { lt: 0 }
      },
      select: { name: true, currentStock: true }
    });
    
    if (negativeStock.length > 0) {
      healthReport.issues.push(`${negativeStock.length} items have negative stock`);
      console.log('❌ Negative stock found:');
      negativeStock.forEach(item => {
        console.log(`   ${item.name}: ${item.currentStock}`);
      });
    } else {
      console.log('✅ No negative stock issues');
    }
    
    // Check for missing prices
    const missingPrices = await prisma.item.count({
      where: {
        isActive: true,
        OR: [
          { sellingPrice: null },
          { sellingPrice: { lte: 0 } }
        ]
      }
    });
    
    if (missingPrices > 0) {
      healthReport.issues.push(`${missingPrices} items missing selling prices`);
      console.log(`❌ ${missingPrices} items without selling prices`);
    } else {
      console.log('✅ All items have selling prices');
    }
    
    // Check for zero cost prices
    const zeroCosts = await prisma.item.count({
      where: {
        isActive: true,
        costPrice: { lte: 0 }
      }
    });
    
    if (zeroCosts > 0) {
      healthReport.issues.push(`${zeroCosts} items have zero/negative cost prices`);
      console.log(`❌ ${zeroCosts} items with invalid cost prices`);
    } else {
      console.log('✅ All cost prices are valid');
    }
    
    // 2. Profitability Analysis
    console.log('\n2. PROFITABILITY ANALYSIS');
    console.log('-'.repeat(30));
    
    const profitAnalysis = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_items,
        AVG(CASE 
          WHEN "sellingPrice" > 0 
          THEN (("sellingPrice" - "costPrice") / "sellingPrice" * 100) 
          ELSE NULL 
        END) as avg_margin,
        COUNT(CASE 
          WHEN "sellingPrice" > 0 AND (("sellingPrice" - "costPrice") / "sellingPrice" * 100) < 15 
          THEN 1 
        END) as low_margin_items,
        COUNT(CASE 
          WHEN "sellingPrice" > 0 AND ("sellingPrice" - "costPrice") < 0 
          THEN 1 
        END) as loss_making_items
      FROM items 
      WHERE "isActive" = true
    `;
    
    if (profitAnalysis.length > 0) {
      const analysis = profitAnalysis[0];
      healthReport.metrics.averageMargin = analysis.avg_margin;
      
      console.log(`📊 Profit Analysis:`);
      console.log(`   Average margin: ${analysis.avg_margin?.toFixed(2)}%`);
      console.log(`   Low margin items (<15%): ${analysis.low_margin_items}`);
      console.log(`   Loss-making items: ${analysis.loss_making_items}`);
      
      if (analysis.avg_margin < 20) {
        healthReport.warnings.push('Average profit margin below 20%');
      }
      
      if (analysis.loss_making_items > 0) {
        healthReport.issues.push(`${analysis.loss_making_items} items are losing money`);
      }
    }
    
    // 3. Recent Sales Performance
    console.log('\n3. RECENT SALES PERFORMANCE');
    console.log('-'.repeat(30));
    
    const recentSales = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        status: 'COMPLETED'
      },
      _sum: { totalAmount: true },
      _count: true,
      _avg: { totalAmount: true }
    });
    
    const totalRevenue = recentSales._sum.totalAmount || 0;
    const saleCount = recentSales._count || 0;
    const avgTransaction = recentSales._avg.totalAmount || 0;
    
    healthReport.metrics.weeklyRevenue = totalRevenue;
    healthReport.metrics.transactionCount = saleCount;
    healthReport.metrics.avgTransactionValue = avgTransaction;
    
    console.log(`💰 Last 7 days:`);
    console.log(`   Total revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`   Transactions: ${saleCount}`);
    console.log(`   Avg transaction: $${avgTransaction.toFixed(2)}`);
    
    if (saleCount === 0) {
      healthReport.warnings.push('No sales recorded in the last 7 days');
    } else if (avgTransaction < 50) {
      healthReport.warnings.push('Low average transaction value');
    }
    
    // 4. Inventory Status
    console.log('\n4. INVENTORY STATUS');
    console.log('-'.repeat(20));
    
    const lowStockItems = await prisma.item.findMany({
      where: {
        isActive: true,
        currentStock: { lte: prisma.item.fields.reorderLevel }
      },
      select: { name: true, currentStock: true, reorderLevel: true }
    });
    
    if (lowStockItems.length > 0) {
      healthReport.warnings.push(`${lowStockItems.length} items need reordering`);
      console.log('⚠️ Low stock items:');
      lowStockItems.forEach(item => {
        console.log(`   ${item.name}: ${item.currentStock} (reorder at ${item.reorderLevel})`);
      });
    } else {
      console.log('✅ All items adequately stocked');
    }
    
    // 5. Overall Health Score
    console.log('\n' + '='.repeat(40));
    console.log('🏥 SYSTEM HEALTH REPORT');
    console.log('='.repeat(40));
    
    const criticalIssues = healthReport.issues.length;
    const warningCount = healthReport.warnings.length;
    const healthScore = Math.max(0, 100 - (criticalIssues * 30) - (warningCount * 10));
    
    healthReport.metrics.healthScore = healthScore;
    
    if (healthScore >= 90) {
      console.log('🟢 EXCELLENT HEALTH (90-100%)');
      console.log('   System is operating optimally');
    } else if (healthScore >= 70) {
      console.log('🟡 GOOD HEALTH (70-89%)');
      console.log('   Minor issues that should be addressed');
    } else if (healthScore >= 50) {
      console.log('🟠 FAIR HEALTH (50-69%)');
      console.log('   Several issues need immediate attention');
    } else {
      console.log('🔴 POOR HEALTH (<50%)');
      console.log('   Critical issues require urgent fixing');
    }
    
    console.log(`\n📊 Health Score: ${healthScore}%`);
    
    if (criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      healthReport.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (warningCount > 0) {
      console.log('\n⚠️ WARNINGS:');
      healthReport.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (healthScore >= 90) {
      console.log('  - Continue current practices');
      console.log('  - Monitor daily performance');
      console.log('  - Consider expansion strategies');
    } else {
      console.log('  - Address critical issues immediately');
      console.log('  - Review pricing strategies');
      console.log('  - Optimize inventory management');
      console.log('  - Monitor profit margins closely');
    }
    
    return healthReport;
    
  } catch (error) {
    console.error('Health check error:', error);
    return {
      issues: ['System error during health check'],
      warnings: [],
      metrics: { healthScore: 0 }
    };
  } finally {
    await prisma.$disconnect();
  }
}

simpleHealthCheck().catch(console.error);

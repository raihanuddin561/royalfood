const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criticalCalculationAudit() {
  console.log('🚨 CRITICAL CALCULATION ISSUES FOUND!');
  console.log('='*50);
  
  const criticalIssues = [];
  
  try {
    // 1. Check stock calculation discrepancies
    console.log('\n1. STOCK CALCULATION DISCREPANCIES');
    console.log('-'.repeat(40));
    
    const stockDiscrepancies = await prisma.$queryRaw`
      SELECT 
        i.id, 
        i.name, 
        i."currentStock" as current,
        COALESCE(stock_in.total, 0) as stock_in,
        COALESCE(stock_out.total, 0) as stock_out,
        COALESCE(adjustments.total, 0) as adjustments,
        COALESCE(usage.total, 0) as usage,
        (COALESCE(stock_in.total, 0) - COALESCE(stock_out.total, 0) + COALESCE(adjustments.total, 0) - COALESCE(usage.total, 0)) as calculated,
        ABS(COALESCE(i."currentStock", 0) - (COALESCE(stock_in.total, 0) - COALESCE(stock_out.total, 0) + COALESCE(adjustments.total, 0) - COALESCE(usage.total, 0))) as discrepancy
      FROM items i
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total FROM inventory_logs WHERE type = 'STOCK_IN' GROUP BY "itemId"
      ) stock_in ON stock_in."itemId" = i.id
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total FROM inventory_logs WHERE type = 'STOCK_OUT' GROUP BY "itemId"
      ) stock_out ON stock_out."itemId" = i.id
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total FROM inventory_logs WHERE type = 'ADJUSTMENT' GROUP BY "itemId"
      ) adjustments ON adjustments."itemId" = i.id
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total FROM stock_usage GROUP BY "itemId"
      ) usage ON usage."itemId" = i.id
      WHERE ABS(COALESCE(i."currentStock", 0) - (COALESCE(stock_in.total, 0) - COALESCE(stock_out.total, 0) + COALESCE(adjustments.total, 0) - COALESCE(usage.total, 0))) > 0.01
    `;
    
    if (stockDiscrepancies.length > 0) {
      console.log('❌ CRITICAL: Stock calculation discrepancies detected!');
      stockDiscrepancies.forEach(item => {
        console.log(`   ${item.name}:`);
        console.log(`     Current Stock: ${item.current}`);
        console.log(`     Should Be: ${item.calculated} (In: ${item.stock_in}, Out: ${item.stock_out}, Usage: ${item.usage})`);
        console.log(`     Discrepancy: ${item.discrepancy}`);
        console.log('');
      });
      criticalIssues.push('Stock calculations are incorrect - causing inventory errors');
    }
    
    // 2. Check for missing selling prices
    console.log('\n2. MISSING SELLING PRICES');
    console.log('-'.repeat(30));
    
    const itemsWithoutSellingPrice = await prisma.item.findMany({
      where: {
        OR: [
          { sellingPrice: null },
          { sellingPrice: { lte: 0 } }
        ],
        isActive: true
      },
      select: { name: true, costPrice: true, sellingPrice: true }
    });
    
    if (itemsWithoutSellingPrice.length > 0) {
      console.log('❌ CRITICAL: Items without selling prices detected!');
      itemsWithoutSellingPrice.forEach(item => {
        console.log(`   ${item.name}: Cost $${item.costPrice}, Selling: ${item.sellingPrice || 'NOT SET'}`);
      });
      criticalIssues.push('Items without selling prices will cause incorrect profit calculations');
    }
    
    // 3. Check for zero/negative cost prices
    console.log('\n3. INVALID COST PRICES');
    console.log('-'.repeat(25));
    
    const invalidCostItems = await prisma.item.findMany({
      where: {
        OR: [
          { costPrice: null },
          { costPrice: { lte: 0 } }
        ],
        isActive: true
      },
      select: { name: true, costPrice: true }
    });
    
    if (invalidCostItems.length > 0) {
      console.log('❌ CRITICAL: Items with invalid cost prices!');
      invalidCostItems.forEach(item => {
        console.log(`   ${item.name}: Cost Price $${item.costPrice}`);
      });
      criticalIssues.push('Invalid cost prices will cause incorrect COGS calculations');
    }
    
    // 4. Check for negative profit margins
    console.log('\n4. NEGATIVE PROFIT MARGINS');
    console.log('-'.repeat(30));
    
    const negativeProfitItems = await prisma.$queryRaw`
      SELECT 
        name, 
        "costPrice", 
        "sellingPrice",
        ("sellingPrice" - "costPrice") as profit_per_unit,
        CASE 
          WHEN "sellingPrice" > 0 
          THEN (("sellingPrice" - "costPrice") / "sellingPrice") * 100 
          ELSE 0 
        END as profit_margin_percent
      FROM items 
      WHERE "sellingPrice" IS NOT NULL 
        AND "sellingPrice" > 0 
        AND ("sellingPrice" - "costPrice") < 0
        AND "isActive" = true
    `;
    
    if (negativeProfitItems.length > 0) {
      console.log('❌ CRITICAL: Items with negative profit margins!');
      negativeProfitItems.forEach(item => {
        console.log(`   ${item.name}:`);
        console.log(`     Cost: $${item.costPrice}, Selling: $${item.sellingPrice}`);
        console.log(`     Loss per unit: $${Math.abs(item.profit_per_unit).toFixed(2)}`);
        console.log(`     Margin: ${item.profit_margin_percent.toFixed(2)}%`);
        console.log('');
      });
      criticalIssues.push('Items with negative margins are causing direct losses');
    }
    
    // 5. Check for sales without inventory tracking
    console.log('\n5. UNTRACKED SALES (COGS CALCULATION ERROR)');
    console.log('-'.repeat(45));
    
    const untrackedSales = await prisma.$queryRaw`
      SELECT s.id, s."saleNumber", s."totalAmount", s."saleDate"
      FROM sales s
      LEFT JOIN inventory_logs il ON il.reference = s.id AND il.type = 'STOCK_OUT'
      WHERE s.status = 'COMPLETED'
        AND il.id IS NULL
      ORDER BY s."saleDate" DESC
      LIMIT 5
    `;
    
    if (untrackedSales.length > 0) {
      console.log('❌ CRITICAL: Sales without inventory tracking!');
      untrackedSales.forEach(sale => {
        console.log(`   Sale ${sale.saleNumber}: $${sale.totalAmount} (${sale.saleDate.toISOString().split('T')[0]})`);
      });
      criticalIssues.push('Sales without inventory tracking cause incorrect COGS calculations');
    }
    
    // 6. Calculate overall profit analysis
    console.log('\n6. CURRENT PROFIT ANALYSIS');
    console.log('-'.repeat(30));
    
    const profitAnalysis = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN "sellingPrice" > 0 THEN 1 END) as items_with_price,
        AVG(CASE WHEN "sellingPrice" > 0 THEN (("sellingPrice" - "costPrice") / "sellingPrice") * 100 ELSE NULL END) as avg_margin,
        MIN(CASE WHEN "sellingPrice" > 0 THEN (("sellingPrice" - "costPrice") / "sellingPrice") * 100 ELSE NULL END) as min_margin,
        MAX(CASE WHEN "sellingPrice" > 0 THEN (("sellingPrice" - "costPrice") / "sellingPrice") * 100 ELSE NULL END) as max_margin,
        COUNT(CASE WHEN "sellingPrice" > 0 AND ("sellingPrice" - "costPrice") < 0 THEN 1 END) as loss_making_items
      FROM items 
      WHERE "isActive" = true AND "costPrice" > 0
    `;
    
    if (profitAnalysis.length > 0) {
      const analysis = profitAnalysis[0];
      console.log(`📊 Total active items: ${analysis.total_items}`);
      console.log(`💰 Items with selling prices: ${analysis.items_with_price}/${analysis.total_items}`);
      console.log(`📈 Average profit margin: ${analysis.avg_margin ? analysis.avg_margin.toFixed(2) : 'N/A'}%`);
      console.log(`📉 Loss-making items: ${analysis.loss_making_items}`);
      
      if (analysis.avg_margin < 15) {
        criticalIssues.push(`Low average profit margin (${analysis.avg_margin.toFixed(2)}%) - needs improvement`);
      }
      
      if (analysis.loss_making_items > 0) {
        criticalIssues.push(`${analysis.loss_making_items} items are causing direct losses`);
      }
    }
    
    // Summary and fixes
    console.log('\n' + '='.repeat(60));
    console.log('🚨 CRITICAL ISSUES SUMMARY');
    console.log('='.repeat(60));
    
    if (criticalIssues.length > 0) {
      console.log('❌ URGENT FIXES NEEDED:');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 RECOMMENDED IMMEDIATE ACTIONS:');
      console.log('1. Fix stock calculation discrepancies immediately');
      console.log('2. Set selling prices for all items');
      console.log('3. Review and adjust negative margin items');
      console.log('4. Implement proper COGS tracking for all sales');
      console.log('5. Regular inventory reconciliation');
    } else {
      console.log('✅ No critical calculation issues found!');
    }
    
  } catch (error) {
    console.error('Audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criticalCalculationAudit().catch(console.error);

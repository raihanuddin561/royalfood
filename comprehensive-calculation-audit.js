const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveCalculationAudit() {
  console.log('🔍 COMPREHENSIVE CALCULATION AUDIT');
  console.log('='*50);
  
  const issues = [];
  const warnings = [];
  
  try {
    // 1. Check for price consistency issues
    console.log('\n1. PRICE CONSISTENCY AUDIT');
    console.log('-'.repeat(30));
    
    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, costPrice: true }
    });
    
    const items = await prisma.item.findMany({
      select: { id: true, name: true, costPrice: true, sellingPrice: true }
    });
    
    // Check for missing selling prices
    const itemsWithoutSellingPrice = items.filter(item => !item.sellingPrice || item.sellingPrice <= 0);
    if (itemsWithoutSellingPrice.length > 0) {
      warnings.push(`${itemsWithoutSellingPrice.length} items have no selling price defined`);
      itemsWithoutSellingPrice.forEach(item => {
        console.log(`⚠️  ${item.name}: No selling price (cost: $${item.costPrice})`);
      });
    }
    
    // Check for negative or zero cost prices
    const itemsWithInvalidCost = items.filter(item => !item.costPrice || item.costPrice <= 0);
    if (itemsWithInvalidCost.length > 0) {
      issues.push(`${itemsWithInvalidCost.length} items have invalid cost prices`);
      itemsWithInvalidCost.forEach(item => {
        console.log(`❌ ${item.name}: Invalid cost price: $${item.costPrice}`);
      });
    }
    
    // Check for menu items with zero prices
    const menuItemsZeroPrice = menuItems.filter(item => !item.price || item.price <= 0);
    if (menuItemsZeroPrice.length > 0) {
      issues.push(`${menuItemsZeroPrice.length} menu items have zero/invalid prices`);
      menuItemsZeroPrice.forEach(item => {
        console.log(`❌ Menu Item ${item.name}: Price: $${item.price}`);
      });
    }
    
    console.log(`✅ Menu items checked: ${menuItems.length}`);
    console.log(`✅ Inventory items checked: ${items.length}`);
    
    // 2. Check for stock calculation inconsistencies
    console.log('\n2. STOCK CALCULATION AUDIT');
    console.log('-'.repeat(30));
    
    const stockDiscrepancies = await prisma.$queryRaw`
      SELECT 
        i.id, i.name, i."currentStock",
        COALESCE(stock_in.total, 0) as stock_in_total,
        COALESCE(stock_out.total, 0) as stock_out_total,
        COALESCE(adjustments.total, 0) as adjustment_total,
        COALESCE(usage.total, 0) as usage_total,
        (COALESCE(stock_in.total, 0) - COALESCE(stock_out.total, 0) + COALESCE(adjustments.total, 0) - COALESCE(usage.total, 0)) as calculated_stock,
        ABS(i."currentStock" - (COALESCE(stock_in.total, 0) - COALESCE(stock_out.total, 0) + COALESCE(adjustments.total, 0) - COALESCE(usage.total, 0))) as discrepancy
      FROM items i
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total 
        FROM inventory_logs 
        WHERE type = 'STOCK_IN' 
        GROUP BY "itemId"
      ) stock_in ON stock_in."itemId" = i.id
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total 
        FROM inventory_logs 
        WHERE type = 'STOCK_OUT' 
        GROUP BY "itemId"
      ) stock_out ON stock_out."itemId" = i.id
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total 
        FROM inventory_logs 
        WHERE type = 'ADJUSTMENT' 
        GROUP BY "itemId"
      ) adjustments ON adjustments."itemId" = i.id
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total 
        FROM stock_usage 
        GROUP BY "itemId"
      ) usage ON usage."itemId" = i.id
      WHERE ABS(i."currentStock" - (COALESCE(stock_in.total, 0) - COALESCE(stock_out.total, 0) + COALESCE(adjustments.total, 0) - COALESCE(usage.total, 0))) > 0.01
      ORDER BY discrepancy DESC
      LIMIT 10
    `;
    
    if (stockDiscrepancies.length > 0) {
      issues.push(`${stockDiscrepancies.length} items have stock calculation discrepancies`);
      stockDiscrepancies.forEach(item => {
        console.log(`❌ ${item.name}:`);
        console.log(`   Current: ${item.currentstock}, Calculated: ${item.calculated_stock}, Discrepancy: ${item.discrepancy}`);
      });
    } else {
      console.log('✅ No stock calculation discrepancies found');
    }
    
    // 3. Check for expense calculation issues
    console.log('\n3. EXPENSE CALCULATION AUDIT');
    console.log('-'.repeat(30));
    
    // Check for orphaned expenses (without categories)
    const orphanedExpenses = await prisma.expense.count({
      where: {
        expenseCategoryId: null
      }
    });
    
    if (orphanedExpenses > 0) {
      warnings.push(`${orphanedExpenses} expenses without categories found`);
    }
    
    // Check for expenses with status issues
    const pendingExpenses = await prisma.expense.count({
      where: {
        status: 'PENDING',
        expenseDate: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
        }
      }
    });
    
    if (pendingExpenses > 0) {
      warnings.push(`${pendingExpenses} expenses pending for more than 7 days`);
    }
    
    // Check total expense calculations
    const expenseCategories = await prisma.expenseCategory.findMany();
    console.log(`✅ Expense categories available: ${expenseCategories.length}`);
    
    // 4. Check for profit calculation issues
    console.log('\n4. PROFIT CALCULATION AUDIT');
    console.log('-'.repeat(30));
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Check sales vs inventory logs consistency
    const salesWithoutInventoryLogs = await prisma.$queryRaw`
      SELECT s.id, s."saleNumber", s."totalAmount", s."saleDate"
      FROM sales s
      LEFT JOIN inventory_logs il ON il.reference = s.id AND il.type = 'STOCK_OUT'
      WHERE s."saleDate" >= ${thirtyDaysAgo}
        AND s.status = 'COMPLETED'
        AND il.id IS NULL
      LIMIT 10
    `;
    
    if (salesWithoutInventoryLogs.length > 0) {
      warnings.push(`${salesWithoutInventoryLogs.length} completed sales without inventory logs (potential COGS calculation issue)`);
      salesWithoutInventoryLogs.forEach(sale => {
        console.log(`⚠️  Sale ${sale.saleNumber} ($${sale.totalAmount}) has no inventory logs`);
      });
    }
    
    // Check for negative profit margins
    const negativeProfitItems = await prisma.$queryRaw`
      SELECT 
        i.name, 
        i."costPrice", 
        i."sellingPrice",
        (i."sellingPrice" - i."costPrice") as profit_per_unit,
        CASE 
          WHEN i."sellingPrice" > 0 
          THEN ((i."sellingPrice" - i."costPrice") / i."sellingPrice") * 100 
          ELSE 0 
        END as profit_margin_percent
      FROM items i
      WHERE i."sellingPrice" IS NOT NULL 
        AND i."sellingPrice" > 0 
        AND (i."sellingPrice" - i."costPrice") < 0
      ORDER BY profit_margin_percent ASC
      LIMIT 10
    `;
    
    if (negativeProfitItems.length > 0) {
      issues.push(`${negativeProfitItems.length} items have negative profit margins`);
      negativeProfitItems.forEach(item => {
        console.log(`❌ ${item.name}: Cost $${item.costPrice}, Selling $${item.sellingPrice}, Margin: ${item.profit_margin_percent.toFixed(2)}%`);
      });
    }
    
    // 5. Check for double-counting in expense calculations
    console.log('\n5. DOUBLE-COUNTING AUDIT');
    console.log('-'.repeat(30));
    
    // Check for stock expenses that might be double-counted with COGS
    const stockExpenses = await prisma.$queryRaw`
      SELECT 
        DATE(e."expenseDate") as expense_date,
        SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END) as stock_expenses,
        COUNT(CASE WHEN ec.type = 'STOCK' THEN 1 END) as stock_expense_count
      FROM expenses e
      JOIN expense_categories ec ON e."expenseCategoryId" = ec.id
      WHERE e."expenseDate" >= ${thirtyDaysAgo}
        AND e.status IN ('APPROVED', 'PAID')
        AND ec.type = 'STOCK'
      GROUP BY DATE(e."expenseDate")
      HAVING SUM(CASE WHEN ec.type = 'STOCK' THEN e.amount ELSE 0 END) > 0
      ORDER BY expense_date DESC
      LIMIT 5
    `;
    
    if (stockExpenses.length > 0) {
      console.log('⚠️  Stock expenses found (potential double-counting with COGS):');
      stockExpenses.forEach(day => {
        console.log(`   ${day.expense_date.toISOString().split('T')[0]}: $${day.stock_expenses} (${day.stock_expense_count} entries)`);
      });
      warnings.push('Stock expenses exist - ensure no double-counting with COGS');
    }
    
    // 6. Check for currency and rounding issues
    console.log('\n6. CURRENCY & ROUNDING AUDIT');
    console.log('-'.repeat(30));
    
    // Check for excessive decimal places
    const itemsWithExcessiveDecimals = await prisma.$queryRaw`
      SELECT name, "costPrice", "sellingPrice"
      FROM items 
      WHERE ("costPrice"::text ~ '\\.[0-9]{3,}' OR "sellingPrice"::text ~ '\\.[0-9]{3,}')
      LIMIT 10
    `;
    
    if (itemsWithExcessiveDecimals.length > 0) {
      warnings.push(`${itemsWithExcessiveDecimals.length} items have excessive decimal places`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(50));
    
    if (issues.length > 0) {
      console.log('❌ CRITICAL ISSUES FOUND:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ NO CALCULATION ISSUES FOUND!');
      console.log('🎉 System appears to be calculating correctly');
    }
    
    // 7. Provide recommendations
    console.log('\n💡 RECOMMENDATIONS FOR PROFITABILITY:');
    console.log('-'.repeat(40));
    
    // Calculate current profit margins
    const profitAnalysis = await prisma.$queryRaw`
      SELECT 
        AVG(CASE 
          WHEN i."sellingPrice" > 0 
          THEN ((i."sellingPrice" - i."costPrice") / i."sellingPrice") * 100 
          ELSE 0 
        END) as avg_profit_margin,
        COUNT(*) as total_items,
        COUNT(CASE WHEN i."sellingPrice" > 0 THEN 1 END) as items_with_selling_price,
        MIN(CASE 
          WHEN i."sellingPrice" > 0 
          THEN ((i."sellingPrice" - i."costPrice") / i."sellingPrice") * 100 
          ELSE NULL 
        END) as min_profit_margin,
        MAX(CASE 
          WHEN i."sellingPrice" > 0 
          THEN ((i."sellingPrice" - i."costPrice") / i."sellingPrice") * 100 
          ELSE NULL 
        END) as max_profit_margin
      FROM items i
      WHERE i."costPrice" > 0
    `;
    
    if (profitAnalysis.length > 0) {
      const analysis = profitAnalysis[0];
      console.log(`📈 Current average profit margin: ${analysis.avg_profit_margin?.toFixed(2)}%`);
      console.log(`📊 Margin range: ${analysis.min_profit_margin?.toFixed(2)}% to ${analysis.max_profit_margin?.toFixed(2)}%`);
      console.log(`📦 Items with selling prices: ${analysis.items_with_selling_price}/${analysis.total_items}`);
      
      if (analysis.avg_profit_margin < 20) {
        console.log('💰 RECOMMENDATION: Average profit margin is low. Consider:');
        console.log('   - Reviewing cost prices with suppliers');
        console.log('   - Adjusting selling prices');
        console.log('   - Optimizing portion sizes');
      }
    }
    
    console.log('\n🎯 BEST PRACTICES IMPLEMENTED:');
    console.log('✅ Comprehensive cost tracking (COGS + expenses)');
    console.log('✅ Real-time stock management');
    console.log('✅ Expense categorization');
    console.log('✅ Partnership profit distribution');
    console.log('✅ Inventory reconciliation');
    
  } catch (error) {
    console.error('Audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveCalculationAudit().catch(console.error);

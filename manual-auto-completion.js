const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSalesRecordFromOrder(order) {
  console.log(`\n📝 Creating sales record for order ${order.orderNumber}...`);
  
  try {
    // Get any existing user as the sales user
    let systemUser = await prisma.user.findFirst();

    if (!systemUser) {
      console.log('🤖 Creating system user...');
      systemUser = await prisma.user.create({
        data: {
          name: 'System',
          email: 'system@royalfood.com',
          password: 'system-generated', // Dummy password for system user
          role: 'ADMIN'
        }
      });
    }

    // Create sales record
    const saleData = {
      orderId: order.id,
      saleNumber: `SAL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString().slice(2,8)}`,
      totalAmount: order.totalAmount,
      finalAmount: order.totalAmount,
      subtotal: order.totalAmount, 
      saleDate: order.createdAt,
      paymentMethod: 'CASH', // Default payment method
      userId: systemUser.id,
      customerId: order.customerId,
      createdAt: order.createdAt,
      updatedAt: new Date()
    };

    const sale = await prisma.sale.create({
      data: saleData
    });

    // Create menu item sales
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        const unitCost = item.menuItem?.cost || 0; // Use menu item cost or 0
        const totalCost = item.quantity * unitCost;
        const grossProfit = item.totalPrice - totalCost;
        const profitMargin = item.totalPrice > 0 ? (grossProfit / item.totalPrice) * 100 : 0;

        await prisma.menuItemSale.create({
          data: {
            saleId: sale.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
            unitCost: unitCost,
            totalCost: totalCost,
            grossProfit: grossProfit,
            profitMargin: profitMargin,
            saleDate: order.createdAt
          }
        });
      }
    }

    console.log(`✅ Sales record created: $${order.totalAmount}`);
    return sale;
  } catch (error) {
    console.error(`❌ Error creating sales record for ${order.orderNumber}:`, error);
    throw error;
  }
}

async function processAutoCompletion() {
  console.log('🔍 Finding served orders without sales records...\n');
  
  try {
    // Find orders that already have sales records
    const existingSales = await prisma.sale.findMany({
      select: { orderId: true },
      where: { orderId: { not: null } }
    });
    const orderIdsWithSales = existingSales.map(s => s.orderId).filter(Boolean);

    // Find served orders without sales records
    const servedOrdersWithoutSales = await prisma.order.findMany({
      where: {
        status: 'SERVED',
        id: {
          notIn: orderIdsWithSales
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    console.log(`📊 Found ${servedOrdersWithoutSales.length} served orders without sales records`);

    if (servedOrdersWithoutSales.length === 0) {
      console.log('✅ No orders need processing!');
      return;
    }

    // Process each order
    let successCount = 0;
    for (const order of servedOrdersWithoutSales) {
      try {
        await createSalesRecordFromOrder(order);
        successCount++;
      } catch (error) {
        console.error(`Failed to process order ${order.orderNumber}:`, error);
      }
    }

    console.log(`\n🎉 Successfully processed ${successCount}/${servedOrdersWithoutSales.length} orders`);

    // Verify results
    const finalOrderCount = await prisma.order.count({ where: { status: 'SERVED' } });
    const finalSalesCount = await prisma.sale.count();
    
    console.log(`\n📈 Final Status:`);
    console.log(`   • Total Served Orders: ${finalOrderCount}`);
    console.log(`   • Total Sales Records: ${finalSalesCount}`);
    console.log(`   • Sales Records Added: ${successCount}`);

  } catch (error) {
    console.error('❌ Error in auto-completion process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the process
processAutoCompletion();
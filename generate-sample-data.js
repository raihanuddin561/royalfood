const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generateComprehensiveData() {
  try {
    console.log('🔄 Generating comprehensive sample data...')

    // 1. Clear existing test data (optional - commented out to preserve existing data)
    // await prisma.saleItems.deleteMany({})
    // await prisma.sales.deleteMany({})
    // await prisma.purchaseItems.deleteMany({})
    // await prisma.purchases.deleteMany({})
    // await prisma.stockUsage.deleteMany({})
    // await prisma.expenses.deleteMany({})

    // 2. Ensure we have required entities
    let category = await prisma.category.findFirst()
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Food Items',
          description: 'Main food category'
        }
      })
    }

    let supplier = await prisma.supplier.findFirst()
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: 'Metro Suppliers Ltd',
          contactPerson: 'Ahmed Hassan',
          phone: '+880-1234-567890',
          email: 'ahmed@metrosuppliers.com',
          address: 'Gulshan, Dhaka'
        }
      })
    }

    let item = await prisma.item.findFirst()
    if (!item) {
      item = await prisma.item.create({
        data: {
          name: 'Chicken Breast (Fresh)',
          categoryId: category.id,
          unit: 'kg',
          costPrice: 420.00, // BDT
          sellingPrice: 680.00, // BDT
          currentStock: 25.5,
          reorderLevel: 5.0,
          isActive: true
        }
      })
    }

    let expenseCategory = await prisma.expenseCategory.findFirst()
    if (!expenseCategory) {
      expenseCategory = await prisma.expenseCategory.create({
        data: {
          name: 'Electricity Bill',
          type: 'UTILITIES',
          description: 'Monthly electricity expenses'
        }
      })
    }

    // 3. Generate data for the last 10 days
    const today = new Date()
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      date.setHours(10, 0, 0, 0) // Set consistent time

      console.log(`📅 Generating data for ${date.toDateString()}`)

      // Generate 2-4 sales per day
      const salesCount = 2 + Math.floor(Math.random() * 3)
      for (let j = 0; j < salesCount; j++) {
        const saleAmount = 850 + Math.floor(Math.random() * 1200) // BDT 850-2050
        const discountAmount = Math.floor(saleAmount * 0.05) // 5% discount
        const finalAmount = saleAmount - discountAmount

        const saleDate = new Date(date)
        saleDate.setHours(12 + j, 30, 0, 0) // Different times

        await prisma.sale.create({
          data: {
            customerName: `Customer ${i}-${j}`,
            customerPhone: `01700${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
            totalAmount: saleAmount,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            paymentMethod: j % 3 === 0 ? 'CASH' : j % 3 === 1 ? 'CARD' : 'DIGITAL_WALLET',
            status: 'COMPLETED',
            saleDate: saleDate,
            notes: `Sale on ${date.toDateString()}`
          }
        })
      }

      // Generate purchases (every 2-3 days)
      if (i % 2 === 0) {
        const purchaseAmount = 12000 + Math.floor(Math.random() * 8000) // BDT 12000-20000
        
        await prisma.purchase.create({
          data: {
            supplierId: supplier.id,
            totalAmount: purchaseAmount,
            status: Math.random() > 0.2 ? 'RECEIVED' : 'PENDING',
            purchaseDate: new Date(date.setHours(9, 0, 0, 0)),
            notes: `Purchase order for ${date.toDateString()}`
          }
        })
      }

      // Generate stock usage (every day)
      const usageQuantity = 2 + Math.random() * 4 // 2-6 kg used
      await prisma.stockUsage.create({
        data: {
          itemId: item.id,
          quantity: usageQuantity,
          unitCost: item.costPrice,
          totalCost: usageQuantity * item.costPrice,
          reason: Math.random() > 0.8 ? 'WASTE' : Math.random() > 0.9 ? 'SAMPLE' : 'PRODUCTION',
          description: `Daily kitchen usage - ${date.toDateString()}`,
          usageDate: new Date(date.setHours(15, 0, 0, 0))
        }
      })

      // Generate expenses (daily)
      const dailyExpenses = [
        { name: 'Electricity', amount: 450 + Math.random() * 200, type: 'UTILITIES' },
        { name: 'Staff Salary', amount: 2800 + Math.random() * 500, type: 'PAYROLL' },
        { name: 'Rent', amount: 15000, type: 'RENT' },
        { name: 'Gas Bill', amount: 280 + Math.random() * 100, type: 'UTILITIES' }
      ]

      // Add 1-2 expenses per day
      for (let k = 0; k < Math.min(2, dailyExpenses.length); k++) {
        const expense = dailyExpenses[k]
        
        // Find or create expense category
        let expCat = await prisma.expenseCategory.findFirst({
          where: { type: expense.type }
        })
        
        if (!expCat) {
          expCat = await prisma.expenseCategory.create({
            data: {
              name: expense.name,
              type: expense.type,
              description: `${expense.type} expenses`
            }
          })
        }

        await prisma.expense.create({
          data: {
            description: `${expense.name} - ${date.toDateString()}`,
            amount: expense.amount,
            expenseCategoryId: expCat.id,
            status: Math.random() > 0.1 ? 'PAID' : 'APPROVED',
            expenseDate: new Date(date.setHours(16, 0, 0, 0))
          }
        })
      }
    }

    console.log('✅ Sample data generation completed!')
    console.log('📊 Data summary:')
    
    const salesCount = await prisma.sale.count()
    const purchasesCount = await prisma.purchases.count()
    const stockUsageCount = await prisma.stockUsage.count()
    const expensesCount = await prisma.expenses.count()
    const itemsCount = await prisma.items.count()
    
    console.log(`- Sales: ${salesCount} records`)
    console.log(`- Purchases: ${purchasesCount} records`)
    console.log(`- Stock Usage: ${stockUsageCount} records`)
    console.log(`- Expenses: ${expensesCount} records`)
    console.log(`- Items: ${itemsCount} records`)
    
    console.log('\n🎉 Ready to test the summary dashboard!')

  } catch (error) {
    console.error('❌ Error generating sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateComprehensiveData()

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create all remaining tables for the Royal Food restaurant system
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting complete database schema creation...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    try {
      // Create all enum types first
      console.log('📋 Creating enum types...')
      
      const enums = [
        'CREATE TYPE "PayrollStatus" AS ENUM (\'PENDING\', \'APPROVED\', \'PAID\');',
        'CREATE TYPE "InventoryLogType" AS ENUM (\'STOCK_IN\', \'STOCK_OUT\', \'ADJUSTMENT\', \'WASTE\', \'TRANSFER\');',
        'CREATE TYPE "PurchaseStatus" AS ENUM (\'PENDING\', \'RECEIVED\', \'CANCELLED\');',
        'CREATE TYPE "OrderType" AS ENUM (\'DINE_IN\', \'TAKEAWAY\', \'DELIVERY\');',
        'CREATE TYPE "OrderStatus" AS ENUM (\'PENDING\', \'CONFIRMED\', \'PREPARING\', \'READY\', \'SERVED\', \'COMPLETED\', \'CANCELLED\');',
        'CREATE TYPE "PaymentMethod" AS ENUM (\'CASH\', \'CARD\', \'DIGITAL_WALLET\', \'BANK_TRANSFER\');',
        'CREATE TYPE "SaleStatus" AS ENUM (\'COMPLETED\', \'REFUNDED\', \'CANCELLED\');',
        'CREATE TYPE "ExpenseType" AS ENUM (\'OPERATIONAL\', \'STOCK\', \'PAYROLL\', \'UTILITIES\', \'RENT\', \'MARKETING\', \'MAINTENANCE\', \'INSURANCE\', \'TAXES\', \'OTHER\');',
        'CREATE TYPE "ExpenseStatus" AS ENUM (\'PENDING\', \'APPROVED\', \'REJECTED\', \'PAID\');',
        'CREATE TYPE "RecurringPeriod" AS ENUM (\'DAILY\', \'WEEKLY\', \'MONTHLY\', \'QUARTERLY\', \'YEARLY\');',
        'CREATE TYPE "ReportType" AS ENUM (\'DAILY\', \'WEEKLY\', \'MONTHLY\', \'QUARTERLY\', \'YEARLY\', \'CUSTOM\');'
      ]
      
      for (const enumSql of enums) {
        await prisma.$executeRaw`
          DO $$ BEGIN
            ${enumSql}
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `
      }
      
      console.log('✅ Enum types created')
      
      // Create core tables
      console.log('🏗️ Creating core business tables...')
      
      // Partners table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "partners" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "sharePercent" DOUBLE PRECISION NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT,
          "address" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "partners_email_key" ON "partners"("email");
      `)
      
      // Categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
      `)
      
      // Suppliers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "suppliers" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "contactName" TEXT,
          "email" TEXT,
          "phone" TEXT,
          "address" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
        );
      `)
      
      // Employees table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "employees" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "employeeId" TEXT NOT NULL,
          "position" TEXT NOT NULL,
          "department" TEXT NOT NULL,
          "salary" DOUBLE PRECISION NOT NULL,
          "hourlyRate" DOUBLE PRECISION,
          "hireDate" TIMESTAMP(3) NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "employees_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "employees_userId_key" ON "employees"("userId");
        CREATE UNIQUE INDEX IF NOT EXISTS "employees_employeeId_key" ON "employees"("employeeId");
      `)
      
      // Items (Inventory) table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "items" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "categoryId" TEXT NOT NULL,
          "supplierId" TEXT,
          "sku" TEXT NOT NULL,
          "description" TEXT,
          "specification" TEXT,
          "brand" TEXT,
          "grade" TEXT,
          "unit" TEXT NOT NULL,
          "packSize" TEXT,
          "costPrice" DOUBLE PRECISION NOT NULL,
          "sellingPrice" DOUBLE PRECISION,
          "reorderLevel" DOUBLE PRECISION NOT NULL,
          "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "items_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "items_sku_key" ON "items"("sku");
      `)
      
      // Menu Items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "menu_items" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "categoryId" TEXT NOT NULL,
          "description" TEXT,
          "price" DOUBLE PRECISION NOT NULL,
          "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "isAvailable" BOOLEAN NOT NULL DEFAULT true,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "image" TEXT,
          "prepTime" INTEGER,
          "servingSize" INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `)
      
      // Orders table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "orders" (
          "id" TEXT NOT NULL,
          "orderNumber" TEXT NOT NULL,
          "customerId" TEXT,
          "userId" TEXT NOT NULL,
          "orderType" "OrderType" NOT NULL,
          "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
          "tableNumber" TEXT,
          "totalAmount" DOUBLE PRECISION NOT NULL,
          "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "finalAmount" DOUBLE PRECISION NOT NULL,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");
      `)
      
      // Expense Categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "expense_categories" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "type" "ExpenseType" NOT NULL DEFAULT 'OPERATIONAL',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "expense_categories_name_key" ON "expense_categories"("name");
      `)
      
      console.log('✅ Core business tables created')
      
      // Create some essential sample data
      console.log('🌱 Creating sample data...')
      
      // Sample categories
      const sampleCategories = [
        { id: 'cat_appetizers', name: 'Appetizers', description: 'Starters and small plates' },
        { id: 'cat_main_course', name: 'Main Course', description: 'Main dishes and entrees' },
        { id: 'cat_beverages', name: 'Beverages', description: 'Drinks and beverages' },
        { id: 'cat_desserts', name: 'Desserts', description: 'Sweet treats and desserts' },
        { id: 'cat_ingredients', name: 'Ingredients', description: 'Raw materials and ingredients' }
      ]
      
      for (const cat of sampleCategories) {
        await client.query(`
          INSERT INTO categories (id, name, description) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (name) DO NOTHING
        `, [cat.id, cat.name, cat.description])
      }
      
      // Sample expense categories
      const expenseCategories = [
        { id: 'exp_stock', name: 'Stock Purchase', type: 'STOCK' },
        { id: 'exp_salary', name: 'Employee Salaries', type: 'PAYROLL' },
        { id: 'exp_utilities', name: 'Utilities', type: 'UTILITIES' },
        { id: 'exp_rent', name: 'Rent', type: 'RENT' },
        { id: 'exp_marketing', name: 'Marketing', type: 'MARKETING' },
        { id: 'exp_maintenance', name: 'Maintenance', type: 'MAINTENANCE' },
        { id: 'exp_other', name: 'Other Expenses', type: 'OTHER' }
      ]
      
      for (const expCat of expenseCategories) {
        await client.query(`
          INSERT INTO expense_categories (id, name, type) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (name) DO NOTHING
        `, [expCat.id, expCat.name, expCat.type])
      }
      
      console.log('✅ Sample data created')
      
      // Get table counts for verification
      const tableChecks = [
        'users', 'partners', 'categories', 'suppliers', 'employees', 
        'items', 'menu_items', 'orders', 'expense_categories'
      ]
      
      const tableCounts: { [key: string]: number } = {}
      for (const table of tableChecks) {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`)
        tableCounts[table] = parseInt(result.rows[0].count)
      }
      
      return NextResponse.json({
        success: true,
        message: '🎉 Complete database schema created successfully!',
        tablesCreated: [
          '✅ partners (Partnership management)',
          '✅ categories (Menu & inventory categories)', 
          '✅ suppliers (Supplier management)',
          '✅ employees (Employee profiles)',
          '✅ items (Inventory management)',
          '✅ menu_items (Menu management)',
          '✅ orders (Order processing)',
          '✅ expense_categories (Expense tracking)'
        ],
        tableCounts,
        sampleDataAdded: [
          '🍽️ 5 menu categories (Appetizers, Main Course, etc.)',
          '💰 7 expense categories (Stock Purchase, Salaries, etc.)'
        ],
        nextSteps: [
          '1. Your restaurant management system is now ready!',
          '2. Start adding suppliers, inventory items, and menu items',
          '3. Set up employee profiles and start processing orders',
          '4. Delete this /api/create-tables endpoint for security'
        ],
        warning: '⚠️ Delete this endpoint after use for security!'
      })
      
    } finally {
      client.release()
      await pool.end()
    }
    
  } catch (error) {
    console.error('❌ Database schema creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create complete database schema',
      troubleshooting: [
        'Check Vercel function logs for detailed errors',
        'Verify DATABASE_URL_NEW is properly set',
        'Ensure database has sufficient permissions'
      ]
    }, { status: 500 })
  }
}

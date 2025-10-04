import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiRequest } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Only ADMIN can run migrations
    try {
      await validateApiRequest(request, [UserRole.ADMIN])
    } catch (err: any) {
      console.error('Migration auth error:', err)
      return NextResponse.json({ success: false, error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    console.log('🔄 Starting customer system migration...')
    
    // Check if customers table exists and has password column
    const tableCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' AND table_schema = 'public'
    ` as Array<{column_name: string}>
    
    const hasCustomersTable = tableCheck.length > 0
    const hasPasswordColumn = tableCheck.some(col => col.column_name === 'password')
    
    console.log('📊 Current state:', { hasCustomersTable, hasPasswordColumn })
    
    if (hasCustomersTable && hasPasswordColumn) {
      return NextResponse.json({
        success: true,
        message: 'Customer system is already properly configured',
        status: 'already_applied'
      })
    }
    
    // Use updated migration SQL that includes password field
    const migrationSQL = `
      -- Customer system migration with password support
      
      -- Create customers table with password field
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "city" TEXT,
        "zipCode" TEXT,
        "dateOfBirth" TIMESTAMP(3),
        "preferences" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
      );
      
      -- Add missing columns if table exists but columns are missing
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "password" TEXT NOT NULL DEFAULT 'temp_password_change_required';
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
      ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "preferences" TEXT;
      
      -- Create unique indexes
      CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_key" ON "customers"("email");
      CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");
      
      -- Create delivery addresses table
      CREATE TABLE IF NOT EXISTS "delivery_addresses" (
        "id" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "city" TEXT,
        "zipCode" TEXT,
        "landmark" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
      );
      
      -- Update orders table for customer support
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryAddressId" TEXT;
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestPhone" TEXT;
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestAddress" TEXT;
    `
    
    // Execute the migration using raw SQL
    console.log('📋 Executing migration SQL...')
    const results = []
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.includes('SELECT') && statement.includes('as status')) {
        // Skip the final status message
        continue
      }
      
      try {
        console.log(`Executing: ${statement.substring(0, 100)}...`)
        const result = await prisma.$executeRawUnsafe(statement + ';')
        results.push({ statement: statement.substring(0, 100), success: true, result })
      } catch (error: any) {
        console.error(`Error executing statement: ${statement}`, error)
        // Continue with other statements even if one fails (some may be duplicate checks)
        results.push({ statement: statement.substring(0, 100), success: false, error: error.message })
      }
    }
    
    // Verify the migration worked by checking for customer tables
    console.log('🔍 Verifying migration results...')
    
    try {
      // Test customer table exists and is accessible
      const customerCount = await prisma.customer.count()
      const deliveryAddressCount = await prisma.deliveryAddress.count()
      
      console.log(`✅ Migration verification successful:`)
      console.log(`   - Customers table: ${customerCount} records`)
      console.log(`   - Delivery addresses table: ${deliveryAddressCount} records`)
      
      // Verify password column exists
      const finalCheck = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'customers' AND table_schema = 'public'
        ORDER BY ordinal_position
      ` as Array<{column_name: string}>
      
      const hasPasswordAfterMigration = finalCheck.some(col => col.column_name === 'password')
      
      if (!hasPasswordAfterMigration) {
        throw new Error('Password column was not created properly')
      }
      
      // Test a simple customer creation to ensure everything works including password
      await prisma.customer.upsert({
        where: { email: 'migration-test@royalfood.com' },
        update: { updatedAt: new Date() },
        create: {
          email: 'migration-test@royalfood.com',
          phone: '+8801999999999',
          name: 'Migration Test Customer',
          password: 'test_password_123',
          address: 'Migration Test Address',
          city: 'Dhaka'
        }
      })
      
      console.log('✅ Customer creation test with password successful')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Customer system migration completed successfully',
        results: {
          customersTable: `${customerCount} records`,
          deliveryAddressesTable: `${deliveryAddressCount} records`,
          statementsExecuted: results.length,
          successfulStatements: results.filter(r => r.success).length,
          migrationTestPassed: true
        },
        details: results
      })
      
    } catch (verifyError: any) {
      console.error('❌ Migration verification failed:', verifyError)
      return NextResponse.json({ 
        success: false, 
        error: 'Migration may have failed - verification error: ' + verifyError.message,
        results 
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed: ' + error.message 
    }, { status: 500 })
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    // Only ADMIN can check migration status
    try {
      await validateApiRequest(request, [UserRole.ADMIN])
    } catch (err: any) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if customer system tables exist and have expected structure
    const checks = []
    
    // Check customers table and password column
    try {
      const customerCount = await prisma.customer.count()
      
      // Check if password column exists
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'customers' AND table_schema = 'public'
      ` as Array<{column_name: string}>
      
      const hasPasswordColumn = columns.some(col => col.column_name === 'password')
      
      checks.push({ 
        table: 'customers', 
        exists: true, 
        recordCount: customerCount,
        hasPasswordColumn,
        columns: columns.map(c => c.column_name)
      })
    } catch (error: any) {
      checks.push({ 
        table: 'customers', 
        exists: false, 
        recordCount: 0,
        hasPasswordColumn: false,
        error: error.message
      })
    }
    
    try {
      const deliveryAddressCount = await prisma.deliveryAddress.count()
      checks.push({ table: 'delivery_addresses', exists: true, recordCount: deliveryAddressCount })
    } catch {
      checks.push({ table: 'delivery_addresses', exists: false, recordCount: 0 })
    }
    
    // Check if orders table has customer columns
    try {
      const ordersWithCustomers = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "orders" 
        WHERE "customerId" IS NOT NULL
      `
      checks.push({ table: 'orders_with_customers', exists: true, recordCount: Number((ordersWithCustomers as any)[0]?.count || 0) })
    } catch {
      checks.push({ table: 'orders_with_customers', exists: false, recordCount: 0 })
    }
    
    const allTablesExist = checks.every(check => check.exists)
    const hasPasswordColumn = (checks[0] as any)?.hasPasswordColumn || false
    const isFullyMigrated = allTablesExist && hasPasswordColumn
    
    return NextResponse.json({
      success: true,
      migrationStatus: isFullyMigrated ? 'COMPLETED' : 'INCOMPLETE',
      checks,
      message: isFullyMigrated
        ? 'Customer system is fully migrated and operational'
        : hasPasswordColumn 
        ? 'Customer system tables exist but may be missing some features. Run POST /api/admin/migrate/customer-system to ensure completeness.'
        : 'Customer system is missing the password column. Run POST /api/admin/migrate/customer-system to fix.'
    })
    
  } catch (error: any) {
    console.error('Migration status check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check migration status: ' + error.message 
    }, { status: 500 })
  }
}

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
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', '2025_09_01_customer_system_migration.sql')
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Migration file not found. Please ensure the migration SQL file exists.' 
      }, { status: 404 })
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
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
      
      // Test a simple customer creation to ensure everything works
      await prisma.customer.upsert({
        where: { email: 'migration-test@royalfood.com' },
        update: { updatedAt: new Date() },
        create: {
          email: 'migration-test@royalfood.com',
          phone: '+8801999999999',
          name: 'Migration Test Customer',
          address: 'Migration Test Address',
          city: 'Dhaka'
        }
      })
      
      console.log('✅ Customer creation test successful')
      
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
    
    try {
      const customerCount = await prisma.customer.count()
      checks.push({ table: 'customers', exists: true, recordCount: customerCount })
    } catch {
      checks.push({ table: 'customers', exists: false, recordCount: 0 })
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
    
    return NextResponse.json({
      success: true,
      migrationStatus: allTablesExist ? 'COMPLETED' : 'INCOMPLETE',
      checks,
      message: allTablesExist 
        ? 'Customer system is fully migrated and operational'
        : 'Customer system migration is incomplete. Run POST /api/admin/migrate/customer-system to complete.'
    })
    
  } catch (error: any) {
    console.error('Migration status check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check migration status: ' + error.message 
    }, { status: 500 })
  }
}

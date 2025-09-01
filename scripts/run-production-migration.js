#!/usr/bin/env node

/**
 * 🔄 VERCEL PRODUCTION MIGRATION RUNNER
 * Safely runs customer system migration on Vercel production database
 */

require('dotenv').config()

async function runProductionMigration() {
  console.log('🚀 VERCEL PRODUCTION MIGRATION RUNNER')
  console.log('=' * 50)
  
  const productionUrl = process.env.VERCEL_URL || process.env.PRODUCTION_URL
  
  if (!productionUrl) {
    console.error('❌ Error: No production URL configured')
    console.error('   Set VERCEL_URL or PRODUCTION_URL environment variable')
    process.exit(1)
  }
  
  console.log(`📍 Target: ${productionUrl}`)
  console.log('🔍 Checking current migration status...')
  
  try {
    // Check migration status first
    const statusResponse = await fetch(`${productionUrl}/api/admin/migrate/customer-system`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const statusData = await statusResponse.json()
    
    if (statusData.success) {
      console.log(`✅ Current Status: ${statusData.migrationStatus}`)
      
      if (statusData.migrationStatus === 'COMPLETED') {
        console.log('🎉 Migration already completed! Customer system is operational.')
        
        // Show current state
        console.log('\n📊 Current Database State:')
        statusData.checks.forEach(check => {
          console.log(`   ${check.table}: ${check.exists ? '✅' : '❌'} (${check.recordCount} records)`)
        })
        
        return
      }
    }
    
    console.log('🔄 Running customer system migration...')
    
    // Run the migration
    const migrationResponse = await fetch(`${productionUrl}/api/admin/migrate/customer-system`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const migrationData = await migrationResponse.json()
    
    if (migrationData.success) {
      console.log('🎉 MIGRATION SUCCESSFUL!')
      console.log('\n📊 Migration Results:')
      console.log(`   Customers table: ${migrationData.results.customersTable}`)
      console.log(`   Delivery addresses: ${migrationData.results.deliveryAddressesTable}`)
      console.log(`   Statements executed: ${migrationData.results.statementsExecuted}`)
      console.log(`   Successful statements: ${migrationData.results.successfulStatements}`)
      console.log(`   Migration test: ${migrationData.results.migrationTestPassed ? '✅ PASSED' : '❌ FAILED'}`)
      
      console.log('\n🎯 Next Steps:')
      console.log('   1. ✅ Customer system is now operational')
      console.log('   2. 🍽️ Add menu items if none exist')
      console.log('   3. 🧪 Test the public menu at /public-menu')
      console.log('   4. 👨‍💼 Monitor orders at /admin/customer-orders')
      
    } else {
      console.log('❌ MIGRATION FAILED!')
      console.log(`   Error: ${migrationData.error}`)
      console.log('\n🔍 Migration Details:')
      if (migrationData.results) {
        migrationData.results.forEach(result => {
          console.log(`   ${result.success ? '✅' : '❌'} ${result.statement}`)
          if (!result.success) console.log(`      Error: ${result.error}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Migration runner error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Check your VERCEL_URL environment variable')
    console.error('   2. Ensure your production app is deployed and accessible')
    console.error('   3. Verify database connection in production')
    console.error('   4. Check Vercel logs for detailed error information')
  }
}

// Run if called directly
if (require.main === module) {
  runProductionMigration()
}

module.exports = { runProductionMigration }

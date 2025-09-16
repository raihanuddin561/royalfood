#!/usr/bin/env node

/**
 * 🔄 PRODUCTION MIGRATION APPLIER FOR VERCEL
 * Applies pending Prisma migrations to production database via API
 */

require('dotenv').config()

async function applyProductionMigrations() {
  console.log('🚀 VERCEL PRODUCTION PRISMA MIGRATION APPLIER')
  console.log('=' * 50)
  
  const productionUrl = process.env.VERCEL_URL || process.env.PRODUCTION_URL || 'https://royal-food-rs.vercel.app'
  
  console.log(`📍 Target: ${productionUrl}`)
  console.log('🔍 Checking current Prisma migration status...')
  
  try {
    // Check current migration status
    const statusResponse = await fetch(`${productionUrl}/api/admin/prisma-migrate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (process.env.ADMIN_TOKEN || ''),
        'x-migration-token': process.env.MIGRATION_ADMIN_TOKEN || ''
      }
    })
    
    if (!statusResponse.ok) {
      throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`)
    }
    
    const statusData = await statusResponse.json()
    
    if (statusData.success) {
      console.log(`✅ Current Status: ${statusData.status}`)
      console.log(`📝 Output: ${statusData.output}`)
      
      if (statusData.status === 'up-to-date' && !statusData.hasPendingMigrations) {
        console.log('🎉 All migrations are already applied! Database is up to date.')
        return
      }
      
      if (statusData.hasPendingMigrations) {
        console.log('⚠️ Pending migrations detected!')
        console.log('🔄 Applying pending migrations...')
        
        // Apply pending migrations
        const deployResponse = await fetch(`${productionUrl}/api/admin/prisma-migrate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (process.env.ADMIN_TOKEN || ''),
            'x-migration-token': process.env.MIGRATION_ADMIN_TOKEN || ''
          },
          body: JSON.stringify({
            action: 'deploy',
            force: false
          })
        })
        
        if (!deployResponse.ok) {
          throw new Error(`Migration deployment failed: HTTP ${deployResponse.status}`)
        }
        
        const deployData = await deployResponse.json()
        
        if (deployData.success) {
          console.log('🎉 MIGRATIONS APPLIED SUCCESSFULLY!')
          console.log('\n📊 Migration Results:')
          console.log(`   Action: ${deployData.action}`)
          console.log(`   Message: ${deployData.message}`)
          console.log(`   Output: ${deployData.output}`)
          if (deployData.generateOutput) {
            console.log(`   Client Generation: ${deployData.generateOutput}`)
          }
          
          console.log('\n🎯 Next Steps:')
          console.log('   1. ✅ Database schema is now up to date')
          console.log('   2. 🍽️ Test order submission functionality')
          console.log('   3. 🧪 Verify at /public/cart')
          console.log('   4. 👨‍💼 Monitor orders at /admin/orders')
          
        } else {
          console.log('❌ MIGRATION DEPLOYMENT FAILED!')
          console.log(`   Error: ${deployData.error}`)
          
          // Suggest solutions
          console.log('\n🔧 Troubleshooting:')
          console.log('   1. Check if DATABASE_URL_NEW is properly set in Vercel')
          console.log('   2. Verify database connectivity')
          console.log('   3. Check for conflicting database changes')
          console.log('   4. Consider manual migration resolution')
        }
      }
    } else {
      console.log('❌ STATUS CHECK FAILED!')
      console.log(`   Error: ${statusData.error}`)
    }
    
  } catch (error) {
    console.error('❌ Migration applier error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Check your production URL is accessible')
    console.error('   2. Verify admin authentication is working')
    console.error('   3. Ensure DATABASE_URL_NEW is set in Vercel')
    console.error('   4. Check Vercel function logs for detailed errors')
    console.error('   5. Try manual migration via Vercel dashboard')
    
    // Show manual migration option
    console.error('\n📋 Manual Migration Option:')
    console.error('   Visit: ' + productionUrl + '/api/admin/prisma-migrate')
    console.error('   POST: {"action": "deploy"}')
  }
}

// Run if called directly
if (require.main === module) {
  applyProductionMigrations()
}

module.exports = { applyProductionMigrations }
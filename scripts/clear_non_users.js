const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const tables = [
  'partners',
  'profit_shares',
  'employees',
  'attendance',
  'payrolls',
  'categories',
  'suppliers',
  'items',
  'inventory_logs',
  'stock_usage',
  'menu_item_sales',
  'purchases',
  'purchase_items',
  'menu_items',
  'recipe_items',
  'orders',
  'order_items',
  'sales',
  'expense_categories',
  'expenses',
  'financial_reports',
  'security_logs'
]

async function run() {
  const auto = process.argv.includes('--yes') || process.env.CLEAR_DB_FORCE === '1'
  console.log('This script will TRUNCATE the following tables (users table will be preserved):')
  console.log(tables.join(', '))
  if (!auto) {
    console.log('\nTo proceed, re-run with the --yes flag or set CLEAR_DB_FORCE=1 in the environment.')
    process.exit(0)
  }

  try {
    const fq = tables.map(t => `public."${t}"`).join(', ')
    const sql = `TRUNCATE TABLE ${fq} RESTART IDENTITY CASCADE;`
    console.log('\nExecuting truncate...')
    console.log(sql)
    const res = await prisma.$executeRawUnsafe(sql)
    console.log('Truncate executed. Result:', res)
    console.log('\nDatabase cleared for listed tables. `users` table preserved.')
  } catch (err) {
    console.error('Failed to truncate tables:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

run()

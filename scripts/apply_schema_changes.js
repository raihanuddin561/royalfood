// Safe schema changes for adding receivedQuantity and PARTIALLY_RECEIVED enum value
// Run with: node scripts/apply_schema_changes.js

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Applying schema changes...')

    // Add enum value PARTIALLY_RECEIVED if missing
    // We use a DO block to conditionally add the enum value
    await prisma.$executeRawUnsafe(`DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'PurchaseStatus' AND e.enumlabel = 'PARTIALLY_RECEIVED') THEN\n    ALTER TYPE "PurchaseStatus" ADD VALUE 'PARTIALLY_RECEIVED';\n  END IF;\nEND$$;`)

    // Add columns if missing
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "purchase_items" ADD COLUMN IF NOT EXISTS "receivedQuantity" double precision DEFAULT 0;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "purchase_items" ADD COLUMN IF NOT EXISTS "lastReceivedAt" timestamptz;`)

    console.log('Schema changes applied (if they were missing)')
  } catch (e) {
    console.error('Failed to apply schema changes:', e)
    process.exitCode = 1
  } finally {
    try { await prisma.$disconnect() } catch {}
  }
}

main()

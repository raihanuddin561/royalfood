import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json().catch(() => ({}))
    
    if (secret !== 'quick-fix-schema-2024') {
      return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 })
    }

    const fixes = []
    const errors = []

    // Fix 1: Add message column to order_tracking
    try {
      await prisma.$executeRaw`ALTER TABLE "order_tracking" ADD COLUMN IF NOT EXISTS "message" TEXT`
      fixes.push('Added message column to order_tracking')
    } catch (error) {
      errors.push(`order_tracking.message: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Fix 2: Add finalAmount column to orders
    try {
      await prisma.$executeRaw`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`
      await prisma.$executeRaw`UPDATE "orders" SET "finalAmount" = "totalAmount" WHERE "finalAmount" = 0`
      fixes.push('Added finalAmount column to orders and updated existing records')
    } catch (error) {
      errors.push(`orders.finalAmount: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Fix 3: Create tax_settings if missing
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "tax_settings" (
          "id" TEXT NOT NULL,
          "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "isTaxActive" BOOLEAN NOT NULL DEFAULT false,
          "taxLabel" TEXT NOT NULL DEFAULT 'Tax',
          "includeInPrice" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
        )
      `
      await prisma.$executeRaw`
        INSERT INTO "tax_settings" (id, "taxRate", "isTaxActive", "taxLabel", "includeInPrice")
        VALUES ('default', 0.0, false, 'Tax', false)
        ON CONFLICT (id) DO NOTHING
      `
      fixes.push('Created tax_settings table with default values')
    } catch (error) {
      errors.push(`tax_settings: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Fix 4: Create delivery_settings if missing
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "delivery_settings" (
          "id" TEXT NOT NULL,
          "globalDeliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "freeDeliveryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "isGlobalChargeActive" BOOLEAN NOT NULL DEFAULT false,
          "maxDeliveryDistance" DOUBLE PRECISION NOT NULL DEFAULT 10,
          "deliveryTimeSlots" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "delivery_settings_pkey" PRIMARY KEY ("id")
        )
      `
      await prisma.$executeRaw`
        INSERT INTO "delivery_settings" (id, "globalDeliveryCharge", "freeDeliveryThreshold", "isGlobalChargeActive", "maxDeliveryDistance")
        VALUES ('default', 0.0, 0.0, false, 10.0)
        ON CONFLICT (id) DO NOTHING
      `
      fixes.push('Created delivery_settings table with default values')
    } catch (error) {
      errors.push(`delivery_settings: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Applied ${fixes.length} fixes with ${errors.length} errors`,
      fixes,
      errors,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Quick fix failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
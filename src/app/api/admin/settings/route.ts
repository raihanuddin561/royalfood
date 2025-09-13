import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get or create default tax settings
    let taxSettings = await prisma.taxSettings.findFirst()
    
    if (!taxSettings) {
      taxSettings = await prisma.taxSettings.create({
        data: {
          taxRate: 0,
          isTaxActive: false,
          taxLabel: 'Tax',
          includeInPrice: false
        }
      })
    }

    // Get or create default delivery settings
    let deliverySettings = await prisma.deliverySettings.findFirst()
    
    if (!deliverySettings) {
      deliverySettings = await prisma.deliverySettings.create({
        data: {
          globalDeliveryCharge: 0,
          freeDeliveryThreshold: 0,
          isGlobalChargeActive: false,
          maxDeliveryDistance: 10
        }
      })
    }

    return NextResponse.json({
      success: true,
      taxSettings,
      deliverySettings
    })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get settings'
    }, { status: 500 })
  }
}
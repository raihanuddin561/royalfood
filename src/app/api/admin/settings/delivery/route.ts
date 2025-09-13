import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, globalDeliveryCharge, freeDeliveryThreshold, isGlobalChargeActive, maxDeliveryDistance } = body

    const updatedSettings = await prisma.deliverySettings.update({
      where: { id },
      data: {
        globalDeliveryCharge: parseFloat(globalDeliveryCharge) || 0,
        freeDeliveryThreshold: parseFloat(freeDeliveryThreshold) || 0,
        isGlobalChargeActive: Boolean(isGlobalChargeActive),
        maxDeliveryDistance: parseFloat(maxDeliveryDistance) || 10
      }
    })

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    })
  } catch (error) {
    console.error('Delivery settings update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update delivery settings'
    }, { status: 500 })
  }
}
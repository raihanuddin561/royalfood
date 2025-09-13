import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, taxRate, isTaxActive, taxLabel, includeInPrice } = body

    const updatedSettings = await prisma.taxSettings.update({
      where: { id },
      data: {
        taxRate: parseFloat(taxRate) || 0,
        isTaxActive: Boolean(isTaxActive),
        taxLabel: taxLabel || 'Tax',
        includeInPrice: Boolean(includeInPrice)
      }
    })

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    })
  } catch (error) {
    console.error('Tax settings update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update tax settings'
    }, { status: 500 })
  }
}
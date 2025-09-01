import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get recent adjustments and waste records
    const recentAdjustments = await prisma.inventoryLog.findMany({
      where: {
        type: {
          in: ['ADJUSTMENT', 'WASTE']
        }
      },
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            costPrice: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // Calculate statistics
    const totalWasteValue = recentAdjustments
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * (log.item.costPrice || 0)), 0)
    
    const totalAdjustmentValue = recentAdjustments
      .filter(log => log.type === 'ADJUSTMENT')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * (log.item.costPrice || 0)), 0)

    const stats = {
      totalWasteValue,
      totalAdjustmentValue,
      totalRecords: recentAdjustments.length,
      wasteRecords: recentAdjustments.filter(log => log.type === 'WASTE').length
    }

    return NextResponse.json({
      success: true,
      adjustments: recentAdjustments,
      stats
    })

  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch adjustments' },
      { status: 500 }
    )
  }
}

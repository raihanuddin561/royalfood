import AdjustmentPageClient from './AdjustmentPageClient'
import { prisma } from '@/lib/prisma'

// Get data for stock adjustments
async function getAdjustmentData() {
  try {
    const [items, recentAdjustments] = await Promise.all([
      // Get all active inventory items
      prisma.item.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          }
        },
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      
      // Get recent adjustments and waste records
      prisma.inventoryLog.findMany({
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
    ])

    // Calculate total waste and adjustment values
    const totalWasteValue = recentAdjustments
      .filter(log => log.type === 'WASTE')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * (log.item.costPrice || 0)), 0)
    
    const totalAdjustmentValue = recentAdjustments
      .filter(log => log.type === 'ADJUSTMENT')
      .reduce((sum, log) => sum + (Math.abs(log.quantity) * (log.item.costPrice || 0)), 0)

    return {
      items,
      recentAdjustments,
      stats: {
        totalWasteValue,
        totalAdjustmentValue,
        totalRecords: recentAdjustments.length,
        wasteRecords: recentAdjustments.filter(log => log.type === 'WASTE').length
      }
    }
  } catch (error) {
    console.error('Adjustment data fetch error:', error)
    return {
      items: [],
      recentAdjustments: [],
      stats: {
        totalWasteValue: 0,
        totalAdjustmentValue: 0,
        totalRecords: 0,
        wasteRecords: 0
      }
    }
  }
}

export default async function StockAdjustmentPage() {
  const { items, recentAdjustments, stats } = await getAdjustmentData()

  return (
    <AdjustmentPageClient 
      initialItems={items}
      initialRecentAdjustments={recentAdjustments}
      initialStats={stats}
    />
  )
}

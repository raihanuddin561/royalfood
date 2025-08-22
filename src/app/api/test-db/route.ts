import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const itemCount = await prisma.item.count()
    console.log(`Total items in database: ${itemCount}`)
    
    // Get all items (not just ones with stock > 0)
    const allItems = await prisma.item.findMany({
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('All items:', allItems)
    
    // Get items with stock > 0
    const itemsWithStock = await prisma.item.findMany({
      where: {
        currentStock: {
          gt: 0
        },
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log('Items with stock:', itemsWithStock)
    
    return NextResponse.json({
      totalItems: itemCount,
      allItems,
      itemsWithStock,
      message: 'Database test completed'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { error: 'Database connection failed', details: error.message },
      { status: 500 }
    )
  }
}

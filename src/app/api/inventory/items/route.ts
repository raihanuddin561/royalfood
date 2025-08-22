import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Fetching inventory items...')
    
    const items = await prisma.item.findMany({
      where: {
        isActive: true // Only active items (removed stock > 0 restriction for debugging)
      },
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

    console.log('Found items:', items.length)

    // Transform the data to match the expected format
    const transformedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      currentStock: item.currentStock,
      unit: item.unit,
      costPrice: item.costPrice,
      category: item.category
    }))

    console.log('Transformed items:', transformedItems)

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory items' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    console.log('Fetching inventory items...')

    const url = new URL(req.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'

    // Build find options conditionally so we can include inactive items for debugging
    const findOptions: any = {
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
    }

    if (!includeInactive) {
      findOptions.where = { isActive: true }
    }

    const items = await prisma.item.findMany(findOptions)

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

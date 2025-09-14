import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('🔍 [DEBUG_MENU_IMAGES] Checking menu items with image data...')
  
  try {
    const menuItems = await prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 [DEBUG_MENU_IMAGES] Found ${menuItems.length} menu items`)
    
    const imageStats = {
      total: menuItems.length,
      withImages: menuItems.filter(item => item.image && item.image.trim() !== '').length,
      withoutImages: menuItems.filter(item => !item.image || item.image.trim() === '').length,
      items: menuItems.map(item => ({
        id: item.id,
        name: item.name,
        hasImage: !!(item.image && item.image.trim() !== ''),
        imageUrl: item.image,
        imageUrlLength: item.image ? item.image.length : 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    }

    console.log('📈 [DEBUG_MENU_IMAGES] Image statistics:', {
      total: imageStats.total,
      withImages: imageStats.withImages,
      withoutImages: imageStats.withoutImages
    })

    // Log details for items with images
    imageStats.items.filter(item => item.hasImage).forEach(item => {
      console.log(`🖼️ [DEBUG_MENU_IMAGES] Item "${item.name}" has image:`, {
        url: item.imageUrl,
        length: item.imageUrlLength,
        startsWithHttp: item.imageUrl?.startsWith('http'),
        containsBlob: item.imageUrl?.includes('blob.vercel-storage.com')
      })
    })

    return NextResponse.json({
      success: true,
      stats: imageStats,
      debugInfo: {
        timestamp: new Date().toISOString(),
        totalItems: menuItems.length,
        itemsWithImages: imageStats.withImages,
        itemsWithoutImages: imageStats.withoutImages
      }
    })

  } catch (error) {
    console.error('💥 [DEBUG_MENU_IMAGES] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to debug menu images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
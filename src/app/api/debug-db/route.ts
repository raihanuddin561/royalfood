import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// SECURITY WARNING: Delete this endpoint after debugging!
// This exposes database information and should not be in production

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$connect()
    
    // Get basic database info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    const categories = await prisma.category.count()
    const menuItems = await prisma.menuItem.count()
    const items = await prisma.item.count()
    const orders = await prisma.order.count()

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@royalfood.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        counts: {
          users: users.length,
          categories,
          menuItems,
          items,
          orders
        }
      },
      users: users,
      adminUser: adminUser,
      message: "⚠️ SECURITY WARNING: Delete /api/debug-db endpoint after debugging!"
    })

  } catch (error) {
    console.error('Database debug error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

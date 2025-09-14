import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      dateFilter.lte = endDateTime
    }

    // Build filters
    const where: any = {}
    if (Object.keys(dateFilter).length > 0) {
      where.saleDate = dateFilter
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    // Fetch sales data for export
    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            name: true,
            phone: true
          }
        },
        order: {
          select: {
            orderNumber: true,
            orderType: true
          }
        },
        menuItemSales: {
          include: {
            menuItem: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      }
    })

    // Generate CSV content
    const csvHeaders = [
      'Sale Number',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Order Number',
      'Order Type',
      'Items',
      'Payment Method',
      'Total Amount',
      'Status',
      'Staff',
      'Gross Profit'
    ]

    const csvRows = sales.map(sale => {
      const saleDate = new Date(sale.saleDate)
      const items = sale.menuItemSales.map(item => 
        `${item.quantity}x ${item.menuItem.name}`
      ).join('; ')
      const totalProfit = sale.menuItemSales.reduce((sum, item) => sum + item.grossProfit, 0)

      return [
        sale.saleNumber,
        saleDate.toLocaleDateString(),
        saleDate.toLocaleTimeString(),
        sale.customer?.name || 'Guest',
        sale.customer?.phone || '',
        sale.order?.orderNumber || '',
        sale.order?.orderType?.replace('_', ' ') || 'Direct Sale',
        items,
        sale.paymentMethod.replace('_', ' '),
        sale.totalAmount.toFixed(2),
        sale.status,
        sale.user.name,
        totalProfit.toFixed(2)
      ]
    })

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Sales export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export sales data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
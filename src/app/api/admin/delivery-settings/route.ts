import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const deliverySettingsSchema = z.object({
  globalDeliveryCharge: z.number().min(0),
  freeDeliveryThreshold: z.number().min(0),
  isGlobalChargeActive: z.boolean(),
  maxDeliveryDistance: z.number().min(0),
  deliveryTimeSlots: z.array(z.string()).optional()
})

// GET /api/admin/delivery-settings - Get current delivery settings
export async function GET() {
  try {
    let settings = await prisma.deliverySettings.findFirst()
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.deliverySettings.create({
        data: {
          globalDeliveryCharge: 50,
          freeDeliveryThreshold: 500,
          isGlobalChargeActive: true,
          maxDeliveryDistance: 10,
          deliveryTimeSlots: ['9:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00']
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error fetching delivery settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch delivery settings'
    }, { status: 500 })
  }
}

// PUT /api/admin/delivery-settings - Update delivery settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = deliverySettingsSchema.parse(body)
    
    // Get existing settings or create new one
    let settings = await prisma.deliverySettings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await prisma.deliverySettings.update({
        where: { id: settings.id },
        data: {
          ...validatedData,
          deliveryTimeSlots: validatedData.deliveryTimeSlots || []
        }
      })
    } else {
      // Create new settings
      settings = await prisma.deliverySettings.create({
        data: {
          ...validatedData,
          deliveryTimeSlots: validatedData.deliveryTimeSlots || []
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Delivery settings updated successfully',
      settings
    })
  } catch (error) {
    console.error('Error updating delivery settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update delivery settings'
    }, { status: 500 })
  }
}
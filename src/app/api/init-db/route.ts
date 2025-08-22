import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// This endpoint should only be used ONCE after deployment
// Delete this file after running it once for security
export async function GET(request: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@royalfood.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Database already initialized. Delete this API endpoint for security.',
        success: false
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@royalfood.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    })

    // Create basic expense categories
    const expenseCategories = [
      { name: 'Stock Purchase', type: 'STOCK' },
      { name: 'Employee Salaries', type: 'PAYROLL' },
      { name: 'Utilities', type: 'UTILITIES' },
      { name: 'Rent', type: 'RENT' },
      { name: 'Marketing', type: 'MARKETING' },
      { name: 'Maintenance', type: 'MAINTENANCE' },
      { name: 'Other Expenses', type: 'OTHER' }
    ]

    await prisma.expenseCategory.createMany({
      data: expenseCategories,
      skipDuplicates: true
    })

    // Create basic inventory categories
    const categories = [
      { name: 'Meat & Poultry', description: 'Fresh and frozen meat products' },
      { name: 'Vegetables', description: 'Fresh vegetables and herbs' },
      { name: 'Rice & Grains', description: 'Rice, wheat, and other grains' },
      { name: 'Spices & Seasonings', description: 'All types of spices and seasonings' },
      { name: 'Beverages', description: 'Drinks and beverages' },
      { name: 'Dairy Products', description: 'Milk, cheese, yogurt, etc.' }
    ]

    await prisma.category.createMany({
      data: categories,
      skipDuplicates: true
    })

    return NextResponse.json({ 
      message: 'Database initialized successfully! Admin user created. IMPORTANT: Delete this API endpoint now for security.',
      success: true,
      adminEmail: 'admin@royalfood.com',
      adminPassword: 'admin123',
      warning: 'Change the admin password immediately after first login!'
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({ 
      message: 'Failed to initialize database',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

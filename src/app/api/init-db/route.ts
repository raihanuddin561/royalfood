import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// This endpoint should only be used ONCE after deployment
// Delete this file after running it once for security
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting database initialization...')
    
    // First, try to apply database migrations to create tables
    console.log('📋 Creating database schema...')
    
    // Since we can't run prisma migrate in serverless, we'll create tables manually
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `
    
    console.log('✅ Basic users table created')

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@royalfood.com' }
    }).catch(() => null) // Ignore errors if table doesn't exist yet

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Database already initialized. Admin user exists. Delete this API endpoint for security.',
        success: false,
        adminEmail: 'admin@royalfood.com'
      })
    }

    // Create admin user
    console.log('👤 Creating admin user...')
    const hashedPassword = await bcrypt.hash('11food22', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin-' + Date.now(),
        email: 'admin@royalfood.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Admin user created successfully')

    return NextResponse.json({ 
      message: '🎉 Database initialized successfully! Basic schema and admin user created.',
      success: true,
      adminEmail: 'admin@royalfood.com',
      adminPassword: '11food22',
      userId: adminUser.id,
      warning: '⚠️ IMPORTANT: Delete this API endpoint now for security! Change admin password after first login.',
      nextSteps: [
        '1. Login with admin@royalfood.com / 11food22',
        '2. Change the admin password immediately',
        '3. Delete this /api/init-db endpoint',
        '4. Set up your restaurant data'
      ]
    })

  } catch (error) {
    console.error('❌ Database initialization error:', error)
    return NextResponse.json({ 
      message: 'Failed to initialize database',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      troubleshooting: [
        'Ensure DATABASE_URL_NEW is set in Vercel environment variables',
        'Verify Neon database is active and accessible',
        'Check Vercel function logs for detailed error information'
      ]
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// This endpoint should only be used ONCE after deployment
// Delete this file after running it once for security
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting database initialization...')
    
    // Test basic connection first
    console.log('🔗 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Create all tables using raw SQL that matches your Prisma schema
    console.log('📋 Creating database schema...')
    
    // Drop existing tables if they exist (for fresh start)
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE;`
    await prisma.$executeRaw`CREATE SCHEMA public;`
    
    // Create enums first
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    
    // Create users table
    await prisma.$executeRaw`
      CREATE TABLE "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
    `
    
    console.log('✅ Users table created')
    
    // Try to create admin user
    console.log('👤 Creating admin user...')
    const hashedPassword = await bcrypt.hash('11food22', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@royalfood.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Admin user created successfully')

    return NextResponse.json({ 
      message: '🎉 Database initialized successfully! Schema created and admin user added.',
      success: true,
      adminEmail: 'admin@royalfood.com',
      adminPassword: '11food22',
      userId: adminUser.id,
      warning: '⚠️ CRITICAL: Delete this /api/init-db endpoint immediately for security!',
      nextSteps: [
        '1. Try logging in with admin@royalfood.com / 11food22',
        '2. Change the admin password immediately after login',
        '3. Delete this /api/init-db endpoint from your codebase',
        '4. Run full Prisma migrations later to create remaining tables'
      ],
      note: 'Only basic user table created. You may need to create additional tables for full functionality.'
    })

  } catch (error) {
    console.error('❌ Database initialization error:', error)
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isConnectionError = errorMessage.includes('connect') || errorMessage.includes('timeout')
    const isPermissionError = errorMessage.includes('permission') || errorMessage.includes('access')
    
    return NextResponse.json({ 
      message: 'Failed to initialize database',
      error: errorMessage,
      success: false,
      troubleshooting: [
        isConnectionError ? '🔌 Database connection failed - check DATABASE_URL_NEW in Vercel' : '',
        isPermissionError ? '🔐 Database permission denied - verify user privileges' : '',
        '📋 Check Vercel function logs for detailed error information',
        '🔄 Try visiting /api/check-env to verify environment variables',
        '💾 Ensure your Neon database is active and not suspended'
      ].filter(Boolean),
      environment: {
        DATABASE_URL_NEW_EXISTS: !!process.env.DATABASE_URL_NEW,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL
      }
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

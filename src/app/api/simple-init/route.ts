import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Simple database setup using direct SQL
export async function GET(request: NextRequest) {
  try {
    const { Pool } = require('pg')
    
    // Get database URL
    const databaseUrl = process.env.DATABASE_URL_NEW
    if (!databaseUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL_NEW not found in environment variables',
        success: false 
      }, { status: 500 })
    }
    
    // Create connection pool
    const pool = new Pool({ connectionString: databaseUrl })
    
    console.log('🔗 Testing database connection...')
    const client = await pool.connect()
    
    try {
      // Create users table with enum
      console.log('📋 Creating database schema...')
      
      // Create enum type
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "users" (
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
      `)
      
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
      `)
      
      console.log('✅ Users table created')
      
      // Check if admin already exists
      const existingAdmin = await client.query(
        'SELECT id FROM users WHERE email = $1',
        ['admin@royalfood.com']
      )
      
      if (existingAdmin.rows.length > 0) {
        return NextResponse.json({ 
          message: 'Admin user already exists. You can now login!',
          success: true,
          adminEmail: 'admin@royalfood.com',
          note: 'Database already initialized'
        })
      }
      
      // Create admin user
      console.log('👤 Creating admin user...')
      const hashedPassword = await bcrypt.hash('11food22', 12)
      const adminId = 'admin_' + Date.now()
      
      await client.query(`
        INSERT INTO users (id, email, password, name, role, "isActive")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [adminId, 'admin@royalfood.com', hashedPassword, 'System Administrator', 'ADMIN', true])
      
      console.log('✅ Admin user created successfully')
      
      return NextResponse.json({ 
        message: '🎉 Database initialized successfully!',
        success: true,
        adminEmail: 'admin@royalfood.com',
        adminPassword: '11food22',
        userId: adminId,
        warning: '⚠️ CRITICAL: Delete this endpoint and change password after login!',
        nextSteps: [
          '1. Login at /auth/login with admin@royalfood.com / 11food22',
          '2. Change your password immediately',
          '3. Delete this /api/simple-init endpoint'
        ]
      })
      
    } finally {
      client.release()
      await pool.end()
    }
    
  } catch (error) {
    console.error('❌ Database setup error:', error)
    return NextResponse.json({ 
      message: 'Failed to setup database',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

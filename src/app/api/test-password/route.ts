import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// SECURITY WARNING: Delete this endpoint after debugging!
// This is only for password verification testing

export async function GET(request: NextRequest) {
  try {
    const testPasswords = ['11food22', 'admin123', 'password123']
    const results = []
    
    for (const password of testPasswords) {
      const hash = await bcrypt.hash(password, 12)
      results.push({
        password,
        hash,
        // Test if they match
        matches: await bcrypt.compare(password, hash)
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Password hashing test results",
      results,
      warning: "⚠️ DELETE THIS ENDPOINT AFTER DEBUGGING!"
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Environment variable validation utility
export function validateEnvironment() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  }

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return requiredVars
}

// Load environment with fallbacks
export function loadEnvironment() {
  // For development, try to load .env files
  if (process.env.NODE_ENV !== 'production') {
    try {
      require('dotenv').config()
    } catch (error) {
      console.warn('dotenv not available, using system environment variables')
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || (
      process.env.NODE_ENV === 'production' 
        ? 'https://royal-food-rs.vercel.app' 
        : 'http://localhost:3000'
    ),
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
}

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Always fetch fresh user data from database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.isActive) {
            console.log('User not found or inactive:', credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          console.log('User authenticated successfully:', credentials.email, 'Role:', user.role)

          // Return fresh user data with unique identifier for session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            employee: null,
            loginTimestamp: Date.now() // Add unique timestamp
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (shorter for testing)
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours (shorter for testing)
    secret: process.env.NEXTAUTH_SECRET,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      // If this is a fresh login (user object exists), completely replace the token
      if (user) {
        console.log('🔐 Fresh login detected, creating new token for:', user.email, user.role)
        const uniqueSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        console.log('🆔 Generated unique session ID:', uniqueSessionId)
        
        // Return completely new token, not merging with old one
        return {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          employee: user.employee,
          sessionId: uniqueSessionId, // Unique session identifier
          sessionTimestamp: Date.now(),
          loginTimestamp: (user as any).loginTimestamp || Date.now(),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }
      }
      
      // Handle session update
      if (trigger === 'update' && session) {
        console.log('🔄 Session update triggered')
        token = { ...token, ...session }
        token.sessionTimestamp = Date.now()
      }
      
      console.log('🎫 JWT callback returning token for:', token.email, token.role, 'Session ID:', token.sessionId)
      return token
    },
    async session({ session, token }) {
      if (token) {
        console.log('📊 Session callback - creating session for:', token.email, token.role, 'Session ID:', token.sessionId)
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.isActive = token.isActive as boolean
        session.user.employee = token.employee as any
        // Add timestamp and unique session ID for cache busting
        ;(session as any).sessionTimestamp = token.sessionTimestamp as number
        ;(session as any).sessionId = token.sessionId as string
        console.log('✅ Session created for user:', session.user.email, 'with role:', session.user.role)
      } else {
        console.log('❌ No token found in session callback')
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback called:', { url, baseUrl })
      
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`
        console.log('📍 Redirecting to relative URL:', fullUrl)
        return fullUrl
      }
      
      // If it's the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        console.log('📍 Redirecting to same origin:', url)
        return url
      }
      
      // Default to dashboard for successful logins
      console.log('📍 Default redirect to dashboard')
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user.email)
    },
    async signOut(message) {
      console.log('User signed out:', message.token?.email)
      // Clear any server-side session data if needed
    },
    async session(message) {
      console.log('Session accessed:', message.session.user.email)
    }
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error: (code, metadata) => {
      console.error('NextAuth Error:', code, metadata)
    },
    warn: (code) => {
      console.warn('NextAuth Warning:', code)
    },
    debug: (code, metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', code, metadata)
      }
    }
  }
}

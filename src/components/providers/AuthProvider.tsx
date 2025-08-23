'use client'

import { createContext, useContext, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'

interface AuthContextType {
  // Add any additional auth-related context here if needed
}

const AuthContext = createContext<AuthContextType>({})

export function AuthProvider({ 
  children, 
  session 
}: { 
  children: ReactNode
  session: Session | null 
}) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when offline
    >
      <AuthContext.Provider value={{}}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export const useAuth = () => useContext(AuthContext)

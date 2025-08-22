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
    <SessionProvider session={session}>
      <AuthContext.Provider value={{}}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export const useAuth = () => useContext(AuthContext)

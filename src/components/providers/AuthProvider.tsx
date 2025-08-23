'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
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
  // Expose the server-provided session on window so client-only components
  // (Sidebar, RoleGuard, etc.) can fall back to it while next-auth client rehydrates.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ;(window as any).__royal_food_server_session = session ?? null
      }
    } catch (e) {
      // ignore
    }

    return () => {
      try {
        if (typeof window !== 'undefined') (window as any).__royal_food_server_session = null
      } catch (e) {
        // ignore
      }
    }
  }, [session])

  return (
    <SessionProvider 
      session={session}
      refetchInterval={0} // Disable automatic refetching to prevent refresh issues
      refetchOnWindowFocus={false} // Don't refetch on window focus to prevent interruptions
      refetchWhenOffline={false} // Don't refetch when offline
    >
      <AuthContext.Provider value={{}}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export const useAuth = () => useContext(AuthContext)

'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Enhanced session hook with better persistence handling
 */
export function useSessionRefresh() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    // Only try to refresh session if we're authenticated
    if (status !== 'authenticated') return

    const handleVisibilityChange = () => {
      // When tab becomes visible, refresh session to ensure it's still valid
      if (!document.hidden) {
        update().catch(console.error)
      }
    }

    const handleFocus = () => {
      // When window gains focus, refresh session
      update().catch(console.error)
    }

    const handleStorage = (e: StorageEvent) => {
      // If session was cleared in another tab, refresh
      if (e.key === 'royal-food-session' && !e.newValue) {
        update().catch(console.error)
      }
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
    }
  }, [status, update])

  return { session, status }
}

/**
 * Simple session persistence indicators
 */
export const sessionStorage = {
  setSessionActive: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal-food-session', Date.now().toString())
    }
  },
  
  clearSessionActive: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('royal-food-session')
    }
  },
  
  wasSessionActive: () => {
    if (typeof window !== 'undefined') {
  const lastSession: string | null = localStorage.getItem('royal-food-session')
  // expose for quick debugging
  ;(window as any).__royal_food_last_session = lastSession
      if (!lastSession) return false
      
      // Check if session was active within last 30 days
      const lastTime = parseInt(lastSession)
      const now = Date.now()
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      
      return (now - lastTime) < thirtyDays
    }
    return false
  }
}

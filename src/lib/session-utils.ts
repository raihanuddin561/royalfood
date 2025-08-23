'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Hook to improve session persistence by refreshing session data
 * when the browser tab becomes visible again
 */
export function useSessionRefresh() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    const handleVisibilityChange = () => {
      // When tab becomes visible, refresh session to ensure it's still valid
      if (!document.hidden && status === 'authenticated') {
        update()
      }
    }

    const handleFocus = () => {
      // When window gains focus, refresh session
      if (status === 'authenticated') {
        update()
      }
    }

    const handleOnline = () => {
      // When coming back online, refresh session
      if (status === 'authenticated') {
        update()
      }
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
    }
  }, [status, update])

  // Periodically refresh session (every 10 minutes)
  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(() => {
        update()
      }, 10 * 60 * 1000) // 10 minutes

      return () => clearInterval(interval)
    }
  }, [status, update])

  return { session, status }
}

/**
 * Client-side session storage utilities
 */
export const sessionStorage = {
  // Store session indicator in localStorage for persistence check
  setSessionActive: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('royal-food-session', 'active')
    }
  },
  
  // Remove session indicator
  clearSessionActive: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('royal-food-session')
    }
  },
  
  // Check if session was previously active
  wasSessionActive: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('royal-food-session') === 'active'
    }
    return false
  }
}

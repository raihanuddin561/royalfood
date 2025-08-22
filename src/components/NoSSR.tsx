'use client'

import { useEffect, useState, ReactNode } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * NoSSR component prevents server-side rendering of its children.
 * This is useful for components that have hydration issues due to:
 * - Browser extensions modifying DOM
 * - Client-specific state
 * - Dynamic content that differs between server and client
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

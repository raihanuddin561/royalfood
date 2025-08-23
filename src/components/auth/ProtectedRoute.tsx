'use client'

import { useSession, getSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { sessionStorage as localSessionStorage } from '@/lib/session-utils'

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [allowServerSession, setAllowServerSession] = useState(false)
  const [serverSession, setServerSession] = useState<any | null>(null)

  // If NextAuth reports unauthenticated, try a short wait when we recently had a session
  useEffect(() => {
    if (status !== 'unauthenticated') return

    // If localStorage indicates we recently had a session, wait briefly for NextAuth to restore it
    if (typeof window !== 'undefined' && localSessionStorage.wasSessionActive()) {
  let mounted = true
      let redirected = false
  console.debug('[ProtectedRoute] detected recent local session marker; attempting restore')

      ;(async () => {
        const maxAttempts = 8
        const delayMs = 200

        // safety fallback: after ~4s force navigation if nothing restored
        const fallbackTimeout = setTimeout(() => {
          if (mounted && !redirected) {
            redirected = true
            // prefer router.push but fallback to full navigation if it doesn't run
            try {
              router.push('/auth/signin')
            } catch {
              window.location.href = '/auth/signin'
            }
          }
        }, (maxAttempts * delayMs) + 1500)

        try {
          // quick server-side check: if server sees the session, ask SessionProvider to update
          try {
            console.debug('[ProtectedRoute] calling /api/debug-session')
            const resp = await fetch('/api/debug-session')
            console.debug('[ProtectedRoute] /api/debug-session status', resp.status)
            if (resp.ok) {
              const json = await resp.json()
              console.debug('[ProtectedRoute] /api/debug-session json', json)
              if (json?.sessionExists) {
                console.debug('[ProtectedRoute] server reports sessionExists -> calling update()')
                setAllowServerSession(true)
                // capture server session payload so useSession() works for children while client rehydrates
                // construct a full session-like object for SessionProvider
                const sess = json.sessionData ?? null
                if (sess) {
                  const exp = json.tokenData?.exp
                  const expires = exp ? new Date(exp * 1000).toISOString() : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
                  setServerSession({ user: sess.user, expires })
                } else {
                  setServerSession(null)
                }
                try { await update?.() } catch (err) { console.debug('[ProtectedRoute] update() error', err) }
                // give the provider a short moment to update
                await new Promise((r) => setTimeout(r, 300))
                // attempt a direct client fetch to NextAuth session endpoint to coax client hydration
                try {
                  console.debug('[ProtectedRoute] fetching /api/auth/session directly')
                  const sessResp = await fetch('/api/auth/session', { credentials: 'include' })
                  console.debug('[ProtectedRoute] /api/auth/session status', sessResp.status)
                  if (sessResp.ok) {
                    const sessJson = await sessResp.json()
                    console.debug('[ProtectedRoute] /api/auth/session json', sessJson)
                    if (sessJson?.user) {
                      try { await update?.() } catch (err) { console.debug('[ProtectedRoute] update() error', err) }
                      clearTimeout(fallbackTimeout)
                      return
                    }
                  }
                } catch (err) {
                  console.debug('[ProtectedRoute] fetch /api/auth/session failed', err)
                }

                // if still unauthenticated, attempt a guarded full reload (short skip window)
                try {
                  const RELOAD_KEY = '__royal_food_reload_ts'
                  const last = localStorage.getItem(RELOAD_KEY)
                  const now = Date.now()
                  const skipWindow = 5 * 1000 // 5 seconds
                  if (!last || (now - parseInt(last)) > skipWindow) {
                    localStorage.setItem(RELOAD_KEY, now.toString())
                    console.debug('[ProtectedRoute] forcing full reload to let server rehydrate session')
                    window.location.reload()
                    return
                  } else {
                    console.debug('[ProtectedRoute] reload attempted recently; skipping reload')
                  }
                } catch (err) {
                  console.debug('[ProtectedRoute] reload attempt failed', err)
                }
                  clearTimeout(fallbackTimeout)
                  // clear allowServerSession after a longer grace window if update didn't set session
                      setTimeout(() => setAllowServerSession(false), 6000)
                  try {
                    if (typeof window !== 'undefined') (window as any).__royal_food_server_session = serverSession
                  } catch (e) {
                    // ignore
                  }
                  return
              }
            }
          } catch (e) {
            console.debug('[ProtectedRoute] /api/debug-session fetch error', e)
          }

          for (let i = 0; i < maxAttempts && mounted && !redirected; i++) {
            try {
              const s = await getSession()
              console.debug('[ProtectedRoute] getSession() ->', !!s)
              if (s) {
                console.debug('[ProtectedRoute] getSession returned session -> calling update()')
                // session restored — ask SessionProvider to update and allow the app to render
                try {
                  await update?.()
                } catch (e) {
                  console.debug('[ProtectedRoute] update() error', e)
                }
                clearTimeout(fallbackTimeout)
                return
              }
            } catch (e) {
              console.debug('[ProtectedRoute] getSession() threw', e)
            }
            await new Promise((r) => setTimeout(r, delayMs))
          }

          if (mounted && !redirected) {
            redirected = true
            router.push('/auth/signin')
          }
        } finally {
          clearTimeout(fallbackTimeout)
        }
      })()

      return () => {
        mounted = false
      }
    }

    // No local marker — redirect right away
    router.push('/auth/signin')
  }, [status, router]);

  // When authenticated, perform role checks
  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    // client session has rehydrated — clear any temporary serverSession overlay
    if (serverSession) {
      setServerSession(null)
      setAllowServerSession(false)
    }

    // clear any temporary global overlay
    try {
      if (typeof window !== 'undefined') (window as any).__royal_food_server_session = null
    } catch (e) {
      // ignore
    }

    if (requiredRole && session.user.role !== requiredRole) {
      const roleHierarchy: { [key: string]: number } = {
        EMPLOYEE: 1,
        MANAGER: 2,
        ADMIN: 3
      };

      const userRoleLevel = roleHierarchy[session.user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        router.push('/unauthorized');
      }
    }
  }, [status, session, requiredRole, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
  // If server reported a session recently, allow rendering while client rehydrates
  if (allowServerSession) {
    if (serverSession) {
      return (
        <SessionProvider session={serverSession}>
          {children}
        </SessionProvider>
      )
    }
    return <>{children}</>
  }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

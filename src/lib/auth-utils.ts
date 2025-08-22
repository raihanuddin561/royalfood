import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

// Permission levels for different routes
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin only routes
  '/admin': [UserRole.ADMIN],
  '/users': [UserRole.ADMIN],
  '/partners': [UserRole.ADMIN],
  '/reports': [UserRole.ADMIN, UserRole.MANAGER],
  
  // Manager and above routes  
  '/employees': [UserRole.ADMIN, UserRole.MANAGER],
  '/expenses': [UserRole.ADMIN, UserRole.MANAGER],
  '/partnership': [UserRole.ADMIN, UserRole.MANAGER],
  '/settings': [UserRole.ADMIN, UserRole.MANAGER],
  '/inventory/adjustment': [UserRole.ADMIN, UserRole.MANAGER],
  '/inventory/reports': [UserRole.ADMIN, UserRole.MANAGER],
  
  // Employee and above routes (most operational tasks)
  '/dashboard': [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
  '/inventory': [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
  '/menu': [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
  '/orders': [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
  '/sales': [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
  '/operations': [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]
}

// Get current user session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

// Check if user can access a specific route
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Find the most specific route match
  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter(routePattern => route.startsWith(routePattern))
    .sort((a, b) => b.length - a.length) // Sort by specificity (longest first)
  
  if (matchingRoutes.length === 0) {
    // Default: employees and above can access unspecified routes
    return hasRole(userRole, [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE])
  }
  
  const requiredRoles = ROUTE_PERMISSIONS[matchingRoutes[0]]
  return hasRole(userRole, requiredRoles)
}

// Server-side route protection
export async function requireAuth(requiredRoles?: UserRole[]) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  if (!user.isActive) {
    redirect('/auth/unauthorized')
  }
  
  if (requiredRoles && !hasRole(user.role, requiredRoles)) {
    redirect('/auth/unauthorized')
  }
  
  return user
}

// API route protection
export async function requireApiAuth(
  request: NextRequest, 
  requiredRoles?: UserRole[]
): Promise<{ user: any; response?: NextResponse }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  }
  
  if (!session.user.isActive) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
    }
  }
  
  if (requiredRoles && !hasRole(session.user.role, requiredRoles)) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  }
  
  return { user: session.user }
}

// Role hierarchy helper
export function getRoleHierarchy(role: UserRole): number {
  switch (role) {
    case UserRole.ADMIN:
      return 3
    case UserRole.MANAGER:
      return 2
    case UserRole.EMPLOYEE:
      return 1
    case UserRole.CUSTOMER:
      return 0
    default:
      return 0
  }
}

// Check if user has higher or equal role
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return getRoleHierarchy(userRole) >= getRoleHierarchy(minimumRole)
}

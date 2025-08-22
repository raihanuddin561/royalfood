import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

/**
 * Extract authenticated user from request headers (set by middleware)
 */
export function getUserFromHeaders(request: NextRequest): AuthenticatedUser | null {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role') as UserRole
  const userActive = request.headers.get('x-user-active')
  const userEmail = request.headers.get('x-user-email')

  if (!userId || !userRole || !userEmail) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    name: '', // Name would need to be added to headers if needed
    role: userRole,
    isActive: userActive === 'true'
  }
}

/**
 * Require authentication for API route
 */
export async function requireApiAuth(
  requiredRoles?: UserRole[]
): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }

  if (!session.user.isActive) {
    throw new Error('Account is deactivated')
  }

  if (requiredRoles && !requiredRoles.includes(session.user.role)) {
    throw new Error('Insufficient permissions')
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    role: session.user.role,
    isActive: session.user.isActive
  }
}

/**
 * Check if user has permission for specific action
 */
export function hasPermission(userRole: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['create', 'read', 'update', 'delete', 'manage_users', 'system_settings'],
    MANAGER: ['create', 'read', 'update', 'delete', 'manage_inventory', 'view_reports'],
    EMPLOYEE: ['create', 'read', 'update'],
    CUSTOMER: ['read'] // Customers have read-only access
  }

  return permissions[userRole]?.includes(action) || false
}

/**
 * Validate request with role-based access control
 */
export async function validateApiRequest(
  request: NextRequest,
  requiredRoles?: UserRole[],
  requiredPermissions?: string[]
): Promise<AuthenticatedUser> {
  try {
    const user = await requireApiAuth(requiredRoles)
    
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        hasPermission(user.role, permission)
      )
      
      if (!hasAllPermissions) {
        throw new Error('Insufficient permissions for this action')
      }
    }
    
    return user
  } catch (error) {
    throw error
  }
}

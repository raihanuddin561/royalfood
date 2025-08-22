'use client'

import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { ReactNode } from 'react'
import { hasRole, hasMinimumRole } from '@/lib/auth-utils'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  minimumRole?: UserRole
  fallback?: ReactNode
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  minimumRole, 
  fallback = null 
}: RoleGuardProps) {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (!session?.user) {
    return <>{fallback}</>
  }
  
  const userRole = session.user.role
  
  // Check allowed roles
  if (allowedRoles && !hasRole(userRole, allowedRoles)) {
    return <>{fallback}</>
  }
  
  // Check minimum role
  if (minimumRole && !hasMinimumRole(userRole, minimumRole)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function ManagerAndAbove({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function EmployeeAndAbove({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

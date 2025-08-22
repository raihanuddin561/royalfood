'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      // Check role hierarchy - ADMIN can access everything, MANAGER can access EMPLOYEE routes
      const roleHierarchy: { [key: string]: number } = {
        EMPLOYEE: 1,
        MANAGER: 2,
        ADMIN: 3
      };

      const userRoleLevel = roleHierarchy[session.user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [session, status, router, requiredRole]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting to signin
  }

  return <>{children}</>;
}

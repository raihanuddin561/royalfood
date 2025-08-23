'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession(); // Use standard NextAuth session
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute - Session status:', status);
    console.log('ProtectedRoute - Session data:', session);
    
    if (status === 'loading') return; // Still loading

    if (!session) {
      console.log('No session found, redirecting to signin');
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
        console.log('Insufficient role, redirecting to unauthorized');
        router.push('/unauthorized');
        return;
      }
    }

    console.log('ProtectedRoute - Access granted for user:', session.user.email, 'Role:', session.user.role);
  }, [session, status, router, requiredRole]);

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

  if (!session) {
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

'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Add a small delay to allow NextAuth to restore session on page refresh
    const checkSession = setTimeout(() => {
      setSessionChecked(true);
    }, 100); // 100ms should be enough for session restoration

    return () => clearTimeout(checkSession);
  }, []);

  useEffect(() => {
    if (!sessionChecked || status === 'loading') return; // Wait for session check

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
  }, [session, status, router, requiredRole, sessionChecked]);

  if (!sessionChecked || status === 'loading') {
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

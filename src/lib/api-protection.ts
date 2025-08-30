import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
  email: string | null | undefined;
    role: UserRole;
    employee?: {
      id: string;
      name: string;
      position: string;
      department: string;
    };
  };
}

type RouteHandler = (
  request: AuthenticatedRequest,
  context?: { params: any }
) => Promise<NextResponse> | NextResponse;

interface AuthOptions {
  requiredRoles?: UserRole[];
  allowSelf?: boolean; // Allow access to own data even without role permission
}

export function withAuth(
  handler: RouteHandler,
  options: AuthOptions = {}
) {
  return async function (
    request: NextRequest,
    context?: { params: any }
  ): Promise<NextResponse> {
    try {
      const session = await getServerSession(authOptions);

      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }

      // Check role permissions if specified
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const roleHierarchy: { [key in UserRole]: number } = {
          EMPLOYEE: 1,
          MANAGER: 2,
          ADMIN: 3,
          CUSTOMER: 0
        };

        const userRoleLevel = roleHierarchy[session.user.role] || 0;
        const hasRequiredRole = options.requiredRoles.some(
          role => userRoleLevel >= roleHierarchy[role]
        );

        if (!hasRequiredRole) {
          // Check if user is accessing their own data
          if (options.allowSelf && context?.params?.id === session.user.id) {
            // Allow access to own data
          } else {
            return NextResponse.json(
              { error: 'Forbidden - Insufficient permissions' },
              { status: 403 }
            );
          }
        }
      }

      // Add user data to request (map to AuthenticatedRequest shape)
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email ?? null,
        role: session.user.role,
        employee: session.user.employee ? {
          id: session.user.employee.id,
          name: (session.user.employee as any).name ?? (session.user.employee as any).employeeId ?? '',
          position: session.user.employee.position ?? '',
          department: session.user.employee.department ?? ''
        } : undefined
      }

      // Call the actual handler
      return await handler(authenticatedRequest, context);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      );
    }
  };
}

// Helper function for role checking
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
      const roleHierarchy: { [key in UserRole]: number } = {
        EMPLOYEE: 1,
        MANAGER: 2,
        ADMIN: 3,
        CUSTOMER: 0
      };

  const userRoleLevel = roleHierarchy[userRole] || 0;
  return requiredRoles.some(role => userRoleLevel >= roleHierarchy[role]);
}

// Specific role checkers for convenience
export const requireAdmin = (handler: RouteHandler) =>
  withAuth(handler, { requiredRoles: ['ADMIN'] });

export const requireManager = (handler: RouteHandler) =>
  withAuth(handler, { requiredRoles: ['MANAGER', 'ADMIN'] });

// Explicit alias for routes that should allow managers or admins
export const requireManagerOrAdmin = (handler: RouteHandler) =>
  withAuth(handler, { requiredRoles: ['MANAGER', 'ADMIN'] });

export const requireEmployee = (handler: RouteHandler) =>
  withAuth(handler, { requiredRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] });

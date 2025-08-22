'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Shield, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-6">
              <Shield className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-lg text-gray-600 mb-6">
            You don't have permission to access this resource.
          </p>
          {session && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                Signed in as: <span className="font-medium">{session.user.email}</span>
              </p>
              <p className="text-sm text-gray-700">
                Role: <span className="font-medium">{session.user.role}</span>
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Link>
          
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

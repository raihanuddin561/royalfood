'use client'

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Debug logging for development
  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [session, status]);

  return <>{children}</>;
}

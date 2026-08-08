"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from '@/context/AuthContext';
import { AuthOverlay } from '@/components/AuthOverlay';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { currentProfile, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!currentProfile) {
      // Save intended destination
      sessionStorage.setItem('rater_auth_redirect', pathname || '/');
      setShowAuth(true);
    }
    
    setHasChecked(true);
  }, [isLoading, currentProfile, pathname]);

  // Don't render children until we've confirmed auth and finished loading
  if (isLoading || !hasChecked || !currentProfile) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {showAuth && (
           <AuthOverlay 
              initialTab="login" 
              onClose={() => {
                setShowAuth(false);
                router.push('/');
              }} 
           />
        )}
      </>
    );
  }

  return <>{children}</>;
}

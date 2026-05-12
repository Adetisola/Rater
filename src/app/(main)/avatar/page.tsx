"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /avatar → Redirect to /@username if logged in, else show identity required
 */
export default function MyAvatarRedirect() {
  const { currentAvatar, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentAvatar) {
      router.replace(`/@${currentAvatar.username}`);
    }
  }, [currentAvatar, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentAvatar) {
    // Redirect to browse - user should use /@username route for profiles
    router.replace('/browse');
    return null;
  }

  return null;
}

"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicAvatarPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect all legacy /app/avatar/[username] to the new canonical /@[username]
    router.replace(`/@${resolvedParams.username}`);
  }, [resolvedParams.username, router]);

  return null;
}

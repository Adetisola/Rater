"use client";

import { use, Suspense } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { ProfileView } from '../../components/ProfileView';
import { FloatingPostButton } from '../../components/FloatingPostButton';
import { TopLoadingBar } from '../../components/TopLoadingBar';
import { Footer } from '../../components/Footer';

/**
 * Reserved route segments that cannot be used as usernames.
 * These match top-level app routes to prevent conflicts.
 */
const RESERVED_ROUTES = new Set([
  'browse',
  'submit',
  'settings',
  'post',
  'login',
  'signup',
  'search',
  'notifications',
  'profile',
  'api',
  'avatar',
  'app',
  'admin',
  'about',
  'help',
  'terms',
  'privacy',
  'feed',
  'explore',
  'discover',
  'home',
]);

export default function PremiumAvatarPage({ params }: { params: Promise<{ alias: string }> }) {
  const resolvedParams = use(params);
  const { allAvatars, isLoading } = useAuth();
  const router = useRouter();

  // Decode just in case
  const decodedAlias = decodeURIComponent(resolvedParams.alias);

  // We only handle paths starting with '@'
  if (!decodedAlias.startsWith('@')) {
    notFound();
  }

  const slug = decodedAlias.slice(1).toLowerCase();

  // Guard: reject reserved route names used as usernames
  if (RESERVED_ROUTES.has(slug)) {
    notFound();
  }

  // 1. Find by current username
  const targetAvatar = Object.values(allAvatars).find(
    a => a.username.toLowerCase() === slug
  );

  // 2. If not found, search previousUsernames for a redirect
  const redirectAvatar = !targetAvatar
    ? Object.values(allAvatars).find(
        a => a.previousUsernames?.some(prev => prev.toLowerCase() === slug)
      )
    : null;

  useEffect(() => {
    if (!targetAvatar && redirectAvatar) {
      // Redirect old username slugs to current premium URL
      router.replace(`/@${redirectAvatar.username}`);
    }
  }, [targetAvatar, redirectAvatar, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!targetAvatar && !redirectAvatar) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white">
        <h2 className="text-2xl font-semibold mb-3 text-black">This profile doesn’t exist.</h2>
        <p className="text-gray-500">Omo bro, you don lost 😂</p>
      </div>
    );
  }

  if (!targetAvatar) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans text-black">
      <Suspense fallback={null}>
        <TopLoadingBar />
      </Suspense>

      <div className="flex-1 w-full pt-4">
        <ProfileView avatarId={targetAvatar.id} />
      </div>

      <Footer />
      <FloatingPostButton />
    </div>
  );
}

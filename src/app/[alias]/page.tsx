"use client";

import { use, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import type { Avatar } from '../../types';
import { ProfileView } from '../../components/ProfileView';
import { FloatingPostButton } from '../../components/FloatingPostButton';
import { Footer } from '../../components/Footer';
import { RESERVED_ROUTES } from '../../lib/constants';



export default function PremiumAvatarPage({ params }: { params: Promise<{ alias: string }> }) {
  const resolvedParams = use(params);
  const { profileMap, isLoading } = useAuth();
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

  const [targetAvatar, setTargetAvatar] = useState<Avatar | null | undefined>(undefined);
  const [redirectAvatar, setRedirectAvatar] = useState<Avatar | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      // 1. Find by current username
      const { getProfileByUsername } = await import('../../lib/profiles');
      const profile = await getProfileByUsername(slug);
      
      if (profile && mounted) {
        setTargetAvatar(profile);
        return;
      }
      
      // 2. If not found, search previous_usernames for a redirect
      const { supabase } = await import('../../lib/supabase/client');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .contains('previous_usernames', [slug])
        .single();
        
      if (data && mounted) {
        setTargetAvatar(null);
        setRedirectAvatar(data as Avatar);
      } else if (mounted) {
        setTargetAvatar(null);
      }
    }

    fetchProfile();
    
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    if (targetAvatar === null && redirectAvatar) {
      // Redirect old username slugs to current premium URL
      router.replace(`/@${redirectAvatar.username}`);
    }
  }, [targetAvatar, redirectAvatar, router]);

  // Handle both auth context loading and our profile fetch loading
  if (isLoading || targetAvatar === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="flex-1 w-full pt-4">
        <ProfileView avatarId={targetAvatar.id} />
      </div>

      <Footer />
      <FloatingPostButton />
    </div>
  );
}

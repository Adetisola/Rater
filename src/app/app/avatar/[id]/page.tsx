"use client";

import { use } from 'react';
import { ProfileView } from '@/components/ProfileView';

export default function PublicAvatarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return <ProfileView avatarId={resolvedParams.id} />;
}

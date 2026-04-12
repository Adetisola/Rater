"use client";

import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { useState } from 'react';
import Link from 'next/link';
import { AuthOverlay } from '../../../components/AuthOverlay';
import { ProfileView } from '../../../components/ProfileView';

export default function MyAvatarPage() {
  const { currentAvatar, isLoading } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentAvatar) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
          <img src="/icons/logo-rater.svg" alt="" className="w-10 h-10 opacity-20" />
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-[#111111]">Identity required</h2>
        <p className="text-gray-500 mb-10 max-w-[280px]">Access your personal profile, posts, and saved favorites by signing in.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[400px]">
            <Button 
                onClick={() => setShowAuthOverlay(true)} 
                className='h-12 flex-1 rounded-full text-lg font-bold text-white' 
                variant="primary"
            >
                Login/Sign up
            </Button>
            <Link href="/app/browse" className="flex-1">
              <Button className='h-12 w-full rounded-full text-lg font-bold' variant="outline">Browse Gallery</Button>
            </Link>
        </div>
        {showAuthOverlay && <AuthOverlay initialTab="login" onClose={() => setShowAuthOverlay(false)} />}
      </div>
    );
  }

  return <ProfileView avatarId={currentAvatar.id} isOwnProfile={true} />;
}

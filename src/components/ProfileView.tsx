"use client";

import { useAuth } from '../context/AuthContext';
import { MOCK_POSTS, MOCK_AVATARS, calculatePostMetrics } from '../logic/mockData';
import { Button } from './ui/Button';
import { MasonryGrid } from './MasonryGrid';
import { computeBadges } from '../logic/badgeUtils';
import { computeHotPosts } from '../logic/hotPostUtils';
import { LogOut, Settings, Grid, Heart, MessageSquare, ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthOverlay } from './AuthOverlay';
import { useRouter } from 'next/navigation';

interface ProfileViewProps {
  avatarId: string;
  isOwnProfile?: boolean;
}

export function ProfileView({ avatarId, isOwnProfile = false }: ProfileViewProps) {
  const { currentAvatar: me, logout } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const router = useRouter();

  // Find the avatar to display
  const targetAvatar = useMemo(() => MOCK_AVATARS[avatarId], [avatarId]);

  // Compute badges and hot status for the grid
  const badgeMap = useMemo(() => computeBadges(MOCK_POSTS), []);
  const hotPostIds = useMemo(() => computeHotPosts(MOCK_POSTS), []);
  
  const avatarPosts = useMemo(() => (
    targetAvatar ? MOCK_POSTS.filter(p => p.avatarId === targetAvatar.id) : []
  ), [targetAvatar]);

  // Compute stats dynamically
  const stats = useMemo(() => {
    let totalReviews = 0;
    let totalScore = 0;
    let ratedPosts = 0;

    avatarPosts.forEach(post => {
      const metrics = calculatePostMetrics(post.id);
      totalReviews += metrics.reviewCount;
      if (metrics.ratingUnlocked) {
        totalScore += metrics.averageScore;
        ratedPosts++;
      }
    });

    return {
      totalReviews,
      avgRating: ratedPosts > 0 ? (totalScore / ratedPosts).toFixed(1) : '—'
    };
  }, [avatarPosts]);

  const signUpDate = targetAvatar ? new Date(targetAvatar.createdAt).getFullYear() : null;
  const isMe = me?.id === avatarId;

  if (!targetAvatar) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-semibold mb-4">Avatar not found</h2>
        <p className="text-gray-500 mb-8">The avatar you're looking for doesn't exist.</p>
        <Link href="/app/browse">
          <Button variant="outline" className="h-11 rounded-full px-8">Back to Browse</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 xs:px-6 py-8 md:py-12 w-full min-h-[60vh]">
      {/* Back Button for non-own profile */}
      {!isOwnProfile && (
        <div className="mb-8">
            <Button 
                variant="secondary" 
                onClick={() => router.back()}
                className="rounded-full gap-2 pl-3 pr-5 border-2 border-gray-100 font-semibold hover:bg-gray-50"
            >
                <ArrowLeft className="w-5 h-5 text-black" />
                Back
            </Button>
        </div>
      )}

      {/* Avatar Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 mb-16 px-4">
        {/* Avatar */}
        <div className="relative group">
          <div 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-white overflow-hidden"
            style={{ backgroundColor: targetAvatar.bgColor }}
          >
            {targetAvatar.avatarUrl ? (
              <img src={targetAvatar.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              targetAvatar.name.charAt(0).toUpperCase()
            )}
          </div>
          {isMe && (
            <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left pt-4 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-3xl font-semibold text-[#111111]">{targetAvatar.name}</h1>
            <div className="flex gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-[#FEC312]/10 text-[#FEC312] text-xs font-semibold uppercase tracking-widest">
                Avatar
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-widest">
                Member since {signUpDate}
              </span>
            </div>
          </div>

          <p className="text-gray-500 max-w-lg mb-8 leading-relaxed">
            {targetAvatar.bio || "Passionately critiquing and creating design work. Looking for honest feedback to level up."}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="text-center md:text-left pr-8 border-r border-gray-100">
               <span className="block text-2xl text-[#111111]">{avatarPosts.length}</span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Posts</span>
            </div>
            <div className="text-center md:text-left pr-8 border-r border-gray-100">
               <span className="block text-2xl text-[#111111]">
                 {stats.totalReviews}
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reviews</span>
            </div>
            <div className="text-center md:text-left">
               <span className="block text-2xl text-[#111111]">
                 {stats.avgRating}
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Avg Rating</span>
            </div>
          </div>
        </div>

        {/* Desktop Actions - Only for self */}
        {isMe && (
          <div className="hidden md:flex gap-3">
            <Button variant="outline" className="h-11 rounded-full px-6 flex items-center gap-2 hover:bg-[#ff4848] hover:border-[#ff4848] hover:text-white transition-all" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* Avatar Content Tabs */}
      <div className="border-b border-gray-100 mb-12 flex justify-center md:justify-start gap-8">
        <button className="flex items-center gap-2 py-4 border-b-2 border-[#111111] text-sm font-semibold uppercase tracking-wider text-[#111111]">
          <Grid className="w-4 h-4" />
          {isMe ? "My Posts" : "Posts"}
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600">
          <MessageSquare className="w-4 h-4" />
          {isMe ? "My Reviews" : "Reviews"}
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600">
          <Heart className="w-4 h-4" />
          Saved
        </button>
      </div>

      {/* Posts Grid */}
      {avatarPosts.length > 0 ? (
        <div className="-mx-2 xs:mx-0">
            <MasonryGrid 
                posts={avatarPosts} 
                badgeMap={badgeMap} 
                hotPostIds={hotPostIds} 
            />
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
          <Grid className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-500 mb-8">{isMe ? "Start your journey by posting your first design!" : "This avatar hasn't posted anything yet."}</p>
          {isMe && (
            <Link href="/app/submit">
              <Button variant="primary" className="h-12 px-8 rounded-full">Post your work</Button>
            </Link>
          )}
        </div>
      )}

      {/* Mobile Logout (visible on small screens) - Only for self */}
      {isMe && (
        <div className="md:hidden mt-12 pt-12 border-t border-gray-100">
          <Button variant="outline" className="w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all font-sans" onClick={logout}>
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      )}

      {showAuthOverlay && <AuthOverlay initialTab="login" onClose={() => setShowAuthOverlay(false)} />}
    </div>
  );
}

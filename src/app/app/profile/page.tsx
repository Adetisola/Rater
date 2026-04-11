"use client";

import { useAuth } from '../../../context/AuthContext';
import { MOCK_POSTS } from '../../../logic/mockData';
import { Button } from '../../../components/ui/Button';
import { MasonryGrid } from '../../../components/MasonryGrid';
import { computeBadges } from '../../../logic/badgeUtils';
import { computeHotPosts } from '../../../logic/hotPostUtils';
import { LogOut, Settings, Grid, Heart, MessageSquare } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const { currentUser, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold mb-4">You are not logged in</h2>
        <p className="text-gray-500 mb-8">Login to view your designer profile.</p>
        <Link href="/app/browse">
          <Button className='rounded-full text-[18px]' variant="outline">Back to Browse</Button>
        </Link>
      </div>
    );
  }

  const myPosts = MOCK_POSTS.filter(p => p.designerId === currentUser.id);

  // Compute badges and hot status for the grid
  const badgeMap = useMemo(() => computeBadges(MOCK_POSTS), []);
  const hotPostIds = useMemo(() => computeHotPosts(MOCK_POSTS), []);

  return (
    <div className="max-w-6xl mx-auto px-2 xs:px-6 py-12 w-full">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 mb-16 px-4">
        {/* Avatar */}
        <div className="relative group">
          <div 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-white"
            style={{ backgroundColor: currentUser.bgColor }}
          >
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              currentUser.name.charAt(0).toUpperCase()
            )}
          </div>
          <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left pt-4 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-3xl font-semibold text-[#111111]">{currentUser.name}</h1>
            <div className="flex gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-[#FEC312]/10 text-[#FEC312] text-xs font-semibold uppercase tracking-widest">
                Designer
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-widest">
                Member since 2024
              </span>
            </div>
          </div>

          <p className="text-gray-500 max-w-lg mb-8 leading-relaxed">
            {currentUser.bio || "Passionately critiquing and creating design work. Looking for honest feedback to level up."}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="text-center md:text-left pr-8 border-r border-gray-100">
               <span className="block text-2xl text-[#111111]">{myPosts.length}</span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Posts</span>
            </div>
            <div className="text-center md:text-left pr-8 border-r border-gray-100">
               <span className="block text-2xl text-[#111111]">
                 {myPosts.reduce((acc, p) => acc + p.rating.reviewCount, 0)}
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reviews</span>
            </div>
            <div className="text-center md:text-left">
               <span className="block text-2xl text-[#111111]">
                 {myPosts.length > 0 ? (myPosts.reduce((acc, p) => acc + p.rating.average, 0) / myPosts.length).toFixed(1) : '—'}
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Avg Rating</span>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-3">
          <Button variant="outline" className="h-11 rounded-full px-6 flex items-center gap-2 hover:bg-[#ff4848] hover:border-[#ff4848]" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Profile Content Tabs */}
      <div className="border-b border-gray-100 mb-12 flex justify-center md:justify-start gap-8">
        <button className="flex items-center gap-2 py-4 border-b-2 border-[#111111] text-sm font-semibold uppercase tracking-wider text-[#111111]">
          <Grid className="w-4 h-4" />
          My Posts
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600">
          <MessageSquare className="w-4 h-4" />
          My Reviews
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600">
          <Heart className="w-4 h-4" />
          Saved
        </button>
      </div>

      {/* Posts Grid */}
      {myPosts.length > 0 ? (
        <div className="-mx-2 xs:mx-0">
            <MasonryGrid 
                posts={myPosts} 
                badgeMap={badgeMap} 
                hotPostIds={hotPostIds} 
            />
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
          <Grid className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-500 mb-8">Start your journey by posting your first design!</p>
          <Link href="/app/submit">
            <Button variant="primary" className="h-12 px-8 rounded-full">Post your work</Button>
          </Link>
        </div>
      )}

      {/* Mobile Logout (visible on small screens) */}
      <div className="md:hidden mt-12 pt-12 border-t border-gray-100">
        <Button variant="outline" className="w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:border-red-100" onClick={logout}>
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}

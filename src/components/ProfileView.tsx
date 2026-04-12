"use client";

import { useAuth } from '../context/AuthContext';
import { MOCK_POSTS, MOCK_AVATARS, calculatePostMetrics } from '../logic/mockData';
import { Button } from './ui/Button';
import { MasonryGrid } from './MasonryGrid';
import { computeBadges } from '../logic/badgeUtils';
import { computeHotPosts } from '../logic/hotPostUtils';
import { LogOut, Grid, Heart, MessageSquare, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthOverlay } from './AuthOverlay';
import { useRouter } from 'next/navigation';
import { Check, Edit2 } from 'lucide-react';

interface ProfileViewProps {
  avatarId: string;
  isOwnProfile?: boolean;
}

export function ProfileView({ avatarId, isOwnProfile = false }: ProfileViewProps) {
  // Merge static mock avatars with newly created session avatars
  const { currentAvatar: me, allAvatars, logout, updateProfile } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const router = useRouter();

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Find the avatar to display (using the centralized allAvatars map)
  const targetAvatar = allAvatars[avatarId];

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

  // Initialize edit fields
  const startEditing = () => {
    if (!targetAvatar) return;
    setEditRole(targetAvatar.role || 'Designer');
    setEditBio(targetAvatar.bio || '');
    setEditAvatarUrl(targetAvatar.avatarUrl || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!targetAvatar) return;
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Update global state via AuthContext
    await updateProfile({
      role: editRole.trim() || 'Designer',
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl.trim() || undefined
    });

    setIsSaving(false);
    setIsEditing(false);
  };

  if (!targetAvatar) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-semibold mb-4">Avatar not found</h2>
        <p className="text-gray-500 mb-8">The avatar you're looking for doesn't exist.</p>
        <Link href="/app/browse">
          <Button variant="outline" className="h-12 rounded-full px-8 text-lg">Back to Browse</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 xs:px-6 py-8 md:py-12 w-full min-h-[60vh] relative">
      {/* Mobile Floating Action Button - Only for own profile */}
      {isMe && (
        <div className="md:hidden absolute top-8 right-4 z-40">
            <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-11 h-11 flex items-center justify-center rounded-full border-2 border-[#FEC312] bg-white hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
                <MoreHorizontal className="w-6 h-6 text-black" />
            </button>

            {/* Dropdown Menu */}
            {showMobileMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMobileMenu(false)}
                    />
                    <div className="absolute top-13 right-0 w-44 bg-white rounded-[20px] shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => {
                                logout();
                                setShowMobileMenu(false);
                            }}
                            className="w-full px-5 py-3.5 flex items-center gap-3 text-red-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-bold text-[15px]">Logout</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      )}
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
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5 lg:gap-8 mb-16 px-4">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div 
            className="w-30 h-30 md:w-34 md:h-34 -mb-2 rounded-full flex items-center justify-center text-white text-5xl font-semibold overflow-hidden bg-gray-100 transition-all"
            style={{ backgroundColor: targetAvatar.bgColor }}
          >
            {/* Live Preview during edit */}
            {(isEditing ? editAvatarUrl : targetAvatar.avatarUrl) ? (
              <img 
                src={isEditing ? editAvatarUrl : targetAvatar.avatarUrl} 
                alt="" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if URL is invalid during edit
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
                <span className="animate-in fade-in duration-300">
                    {targetAvatar.name.charAt(0).toUpperCase()}
                </span>
            )}
          </div>
          
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left pt-2 min-w-0">
          {isEditing ? (
            <div className="space-y-4 max-w-md animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
                <input 
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value.slice(0, 40))}
                  placeholder="e.g. Designer, Developer"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#FEC312] focus:ring-4 focus:ring-[#FEC312]/10 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Avatar Image URL</label>
                <input 
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#FEC312] focus:ring-4 focus:ring-[#FEC312]/10 outline-none transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                  Bio
                  <span className={editBio.length > 200 ? 'text-red-500' : ''}>{editBio.length}/200</span>
                </label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 201))}
                  placeholder="Tell us about yourself..."
                  className="w-full h-24 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#FEC312] focus:ring-4 focus:ring-[#FEC312]/10 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pb-8">
                <Button 
                    variant="primary" 
                    className="h-11 rounded-full gap-2 font-medium text-white text-[15px]"
                    onClick={handleSave}
                    disabled={isSaving || editBio.length > 200}
                >
                  {isSaving ? 'Saving...' : <><Check className="stroke-4 w-4 h-4" /> Save Changes</>}
                </Button>
                <Button 
                    variant="outline"
                    className="h-11 rounded-full px-6 font-medium text-[15px]"
                    onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-4 mb-3">
                <h1 className="text-2xl font-medium text-[#111111] tracking-tight truncate">
                  @{targetAvatar.name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-[16px] font-medium text-gray-400">
                    {targetAvatar.role || 'Designer'}
                  </span>
                  {isMe && !isEditing && (
                    <button 
                      onClick={startEditing}
                      className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110 active:scale-95 text-[#FEC312]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-center md:justify-start mb-6">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                  Member since {signUpDate}
                </span>
              </div>

              <p className="text-gray-500 max-w-lg mb-8 leading-relaxed text-[15px]">
                {targetAvatar.bio || "Passionately critiquing and creating design work. Looking for honest feedback to level up."}
              </p>
            </>
          )}

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
        <div className="-mx-2 xs:-mx-4 md:-mx-6 lg:-mx-8">
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


      {showAuthOverlay && <AuthOverlay initialTab="login" onClose={() => setShowAuthOverlay(false)} />}
    </div>
  );
}

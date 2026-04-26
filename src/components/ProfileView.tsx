"use client";

import { useAuth } from '../context/AuthContext';
import { MOCK_POSTS, calculatePostMetrics } from '../logic/mockData';
import { Button } from './ui/Button';
import { MasonryGrid } from './MasonryGrid';
import { useBadges } from '../hooks/useBadges';
import { useHotPosts } from '../hooks/useHotPosts';
import { LogOut, Grid, Heart, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AuthOverlay } from './AuthOverlay';
import { useRouter } from 'next/navigation';
import { Check, Edit2, Camera, Trash2, X, AtSign, AlertCircle, QrCode } from 'lucide-react';
import { LogoutConfirmOverlay } from './LogoutConfirmOverlay';
import { QRCodeOverlay } from './QRCodeOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { FullscreenAvatarOverlay } from './FullscreenAvatarOverlay';

const AnimatedMetric = ({ value, isFloat = false }: { value: number | string; isFloat?: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const prevValue = useRef(value);

  useEffect(() => {
    // If it has already fully animated, apply any future value updates immediately
    if (hasAnimated.current && prevValue.current !== value) {
      if (ref.current) ref.current.textContent = value.toString();
      prevValue.current = value;
      return;
    }

    const endNum = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(endNum) || endNum <= 0) {
      if (ref.current) ref.current.textContent = value.toString();
      prevValue.current = value;
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        observer.unobserve(element);

        const duration = endNum < 5 ? 600 : 1000;
        const startTime = performance.now();
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        
        const update = (currentTime: number) => {
          const elapsed = Math.max(0, currentTime - startTime);
          const progress = Math.min(elapsed / duration, 1);
          const currentVal = endNum * easeOut(progress);
          
          if (element) {
            element.textContent = isFloat ? currentVal.toFixed(1) : Math.round(currentVal).toString();
          }
          
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
             if (element) element.textContent = value.toString();
          }
        };
        requestAnimationFrame(update);
      }
    }, { threshold: 0.1 });

    observer.observe(element);
    return () => observer.disconnect();
  }, [value, isFloat]);

  return <span ref={ref}>{value === '—' ? '—' : '0'}</span>;
};

interface ProfileViewProps {
  avatarId: string;
  isOwnProfile?: boolean;
}

export function ProfileView({ avatarId, isOwnProfile = false }: ProfileViewProps) {
  const { currentAvatar: me, allAvatars, logout, updateProfile, checkUsernameAvailable } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const router = useRouter();

  // Edit State
  type EditState = 'idle' | 'editing' | 'saving' | 'error';
  const [editState, setEditState] = useState<EditState>('idle');
  const [saveError, setSaveError] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [editRole, setEditRole] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showFullscreenAvatar, setShowFullscreenAvatar] = useState(false);

  const [stats, setStats] = useState({ totalReviews: 0, avgRating: '—' });

  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Find the avatar to display
  const targetAvatar = allAvatars[avatarId];

  // Username validation hook (wired to checkUsernameAvailable from AuthContext)
  const memoizedCheckAvailability = useCallback(
    (username: string) => checkUsernameAvailable(username, avatarId),
    [checkUsernameAvailable, avatarId]
  );

  const { 
    input: editUsername, 
    handleChange: handleUsernameChange, 
    result: usernameValidation 
  } = useUsernameValidation({
    currentUsername: targetAvatar?.username ?? '',
    usernameLastChangedAt: targetAvatar?.usernameLastChangedAt,
    checkAvailability: memoizedCheckAvailability,
  });

  // External Metadata (Badges, Hot Status)
  const { badgeMap } = useBadges(MOCK_POSTS);
  const { hotPostIds } = useHotPosts(MOCK_POSTS);
  
  const avatarPosts = useMemo(() => {
    if (!targetAvatar) return [];
    return MOCK_POSTS
      .filter(p => p.avatar_id === targetAvatar.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [targetAvatar]);

  // Async stats calculation
  useEffect(() => {
    let isMounted = true;
    
    const computeStats = async () => {
        let totalReviews = 0;
        let totalScore = 0;
        let ratedPosts = 0;

        const metricsList = await Promise.all(avatarPosts.map(p => calculatePostMetrics(p.id)));
        
        metricsList.forEach(metrics => {
            totalReviews += metrics.review_count;
            if (metrics.rating_unlocked) {
                totalScore += metrics.average_score;
                ratedPosts++;
            }
        });

        if (isMounted) {
            setStats({
                totalReviews,
                avgRating: ratedPosts > 0 ? (totalScore / ratedPosts).toFixed(1) : '—'
            });
        }
    };

    computeStats();
    return () => { isMounted = false; };
  }, [avatarPosts]);

  const signUpDate = targetAvatar ? new Date(targetAvatar.created_at).getFullYear() : null;
  const isMe = me?.id === avatarId;

  const startEditing = () => {
    if (!targetAvatar) return;
    setEditRole(targetAvatar.role || 'Designer');
    setEditBio(targetAvatar.bio || '');
    setEditName(targetAvatar.name);
    handleUsernameChange(targetAvatar.username); // reset to current
    setSaveError('');
    setEditState('editing');
    setTimeout(() => usernameInputRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setSaveError('');
    setEditState('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && !e.shiftKey && editState === 'editing') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!targetAvatar) return;
    
    const isRoleInvalid = editRole.length > 50;
    const isBioInvalid = editBio.length > 200;
    const isNameInvalid = editName.trim().length === 0 || editName.length > 50;
    // Block save if username is currently being checked or is invalid
    const isUsernameBlocking = ['checking', 'taken', 'invalid_format', 'cooldown'].includes(usernameValidation.status);
    if (isRoleInvalid || isBioInvalid || isNameInvalid || isUsernameBlocking) return;

    setSaveError('');
    setEditState('saving');
    
    const usernameChanged = editUsername.toLowerCase().trim() !== targetAvatar.username.toLowerCase();

    const result = await updateProfile({
      role: editRole.trim() || 'Designer',
      bio: editBio.trim(),
      name: editName,
      ...(usernameChanged ? { username: editUsername } : {}),
    });
      
    if (result.ok) {
      setEditState('idle');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2500);
      // Reroute to new username slug if it changed
      if (usernameChanged) {
        router.replace(`/app/avatar/${editUsername.toLowerCase().trim()}`);
      }
    } else {
      setSaveError(result.error);
      setEditState('error');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Image too large (Max 5MB)");
      const reader = new FileReader();
      reader.onloadend = () => updateProfile({ avatar_url: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingRemove) {
      updateProfile({ avatar_url: undefined });
      setIsConfirmingRemove(false);
    } else {
      setIsConfirmingRemove(true);
    }
  };

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

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
    <div className="max-w-6xl mx-auto px-2 xs:px-6 pt-1 pb-16 md:pt-4 md:pb-24 w-full min-h-[60vh] relative">
      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium tracking-wide">Profile saved</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isMe && (
        <div className="md:hidden absolute top-8 right-4 z-40">
            <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
                <MoreHorizontal className="w-6 h-6 text-black" />
            </button>

            {showMobileMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                    <div className="absolute top-13 right-0 w-44 bg-white rounded-[20px] shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => { startEditing(); setShowMobileMenu(false); }}
                            className="w-full px-5 py-3.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50"
                        >
                            <Edit2 className="w-5 h-5" />
                            <span className="font-semibold text-[15px]">Edit Avatar</span>
                        </button>
                        <button 
                            onClick={() => { setShowQrCode(true); setShowMobileMenu(false); }}
                            className="w-full px-5 py-3.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50"
                        >
                            <QrCode className="w-5 h-5" />
                            <span className="font-semibold text-[15px]">Share Profile</span>
                        </button>
                        <button 
                            onClick={() => { setShowLogoutConfirm(true); setShowMobileMenu(false); }}
                            className="w-full px-5 py-3.5 flex items-center gap-3 text-red-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-semibold text-[15px]">Logout</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      )}

      {/* Share Button for Mobile (Non-Owners) */}
      {!isMe && (
        <div className="md:hidden absolute top-8 right-4 z-40">
            <button 
                onClick={() => setShowQrCode(true)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-all active:scale-95 text-gray-700"
            >
                <QrCode className="w-5 h-5" />
            </button>
        </div>
      )}

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
        <div className="relative group shrink-0 flex flex-col items-center">
          <div 
            className="w-30 h-30 md:w-34 md:h-34 -mb-2 rounded-full flex items-center justify-center text-white text-5xl font-semibold overflow-hidden bg-gray-100 transition-all shadow-sm relative"
            style={{ backgroundColor: targetAvatar.bg_color }}
          >
            {targetAvatar.avatar_url ? (
              <button 
                onClick={() => setShowFullscreenAvatar(true)}
                className="w-full h-full cursor-zoom-in group/avatar"
              >
                <img 
                  src={targetAvatar.avatar_url} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </button>
            ) : (
                <span className="animate-in fade-in duration-300">
                    {targetAvatar.name.charAt(0).toUpperCase()}
                </span>
            )}
            
            {isMe && (
              <motion.div 
                onMouseLeave={() => setIsConfirmingRemove(false)}
                className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-4 rounded-full z-10"
              >
                {!isConfirmingRemove ? (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-full bg-white/20 hover:bg-[#FEC312] text-white transition-all transform hover:scale-110"
                      title="Change Avatar"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    {targetAvatar.avatar_url && (
                      <button 
                        onClick={handleAvatarRemove}
                        className="p-2 rounded-full bg-white/20 hover:bg-red-500 text-white transition-all transform hover:scale-110"
                        title="Remove Avatar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 bg-white/10 p-1.5 px-3 rounded-full backdrop-blur-sm"
                  >
                    <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Are you sure?</span>
                    <div className="flex gap-2">
                       <button 
                        onClick={handleAvatarRemove}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 text-white hover:scale-110 transition-transform"
                        title="Yes, remove"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsConfirmingRemove(false); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:scale-110 transition-transform"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
          {isMe && editState === 'idle' && (
            <button
               onClick={() => fileInputRef.current?.click()}
               className="md:hidden absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 text-gray-700 z-10 active:scale-95 transition-transform"
            >
               <Camera className="w-4 h-4" />
            </button>
          )}
          {isMe && editState !== 'idle' && (
            <div className="flex md:hidden items-center justify-center gap-2 mt-5 mb-1 z-10">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Change
              </button>
              {targetAvatar.avatar_url && (
                <button 
                  onClick={(e) => {
                      e.preventDefault();
                      if (isConfirmingRemove) {
                          updateProfile({ avatar_url: undefined });
                          setIsConfirmingRemove(false);
                      } else {
                          setIsConfirmingRemove(true);
                      }
                  }}
                  className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                      isConfirmingRemove ? "bg-red-500 text-white" : "text-red-500 bg-red-50 hover:bg-red-100"
                  )}
                >
                  {isConfirmingRemove ? (
                    <>
                        <Check className="w-3.5 h-3.5" /> Confirm
                    </>
                  ) : (
                    <>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {isMe && (
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left pt-2 min-w-0">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-2 md:gap-3.5 mb-3 min-w-0">
            {/* USERNAME + DISPLAY NAME */}
            <div className="min-w-0">
              {editState !== 'idle' ? (
                <div className="flex flex-col gap-1.5 mb-2">
                  {/* Display Name */}
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={editState === 'saving'}
                    placeholder="Display Name"
                    maxLength={50}
                    className={cn(
                      "text-3xl font-medium bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-all text-[#111111] w-full placeholder:text-gray-300",
                      editName.length > 50 && "text-red-500 border-red-300"
                    )}
                  />
                  {/* Username */}
                  <div className="relative flex items-center gap-1.5 mt-1">
                    <AtSign className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      ref={usernameInputRef}
                      type="text"
                      value={editUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={handleKeyDown}
                      disabled={editState === 'saving'}
                      placeholder="username"
                      maxLength={20}
                      className={cn(
                        "text-[15px] font-medium bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-all text-gray-600 placeholder:text-gray-300 flex-1",
                        usernameValidation.status === 'taken' && "text-red-500 border-red-300 focus:border-red-400",
                        usernameValidation.status === 'valid' && "border-green-300 focus:border-green-400",
                        usernameValidation.status === 'cooldown' && "text-amber-600 border-amber-300"
                      )}
                    />
                    {/* Validation indicator */}
                    {usernameValidation.status === 'checking' && (
                      <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
                    )}
                    {usernameValidation.status === 'valid' && (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                    {(usernameValidation.status === 'taken' || usernameValidation.status === 'invalid_format') && (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </div>
                  {/* Validation message */}
                  {usernameValidation.message && usernameValidation.status !== 'unchanged' && (
                    <p className={cn(
                      "text-xs mt-0.5 ml-6",
                      usernameValidation.status === 'valid' && "text-green-600",
                      usernameValidation.status === 'taken' && "text-red-500",
                      usernameValidation.status === 'invalid_format' && "text-red-500",
                      usernameValidation.status === 'cooldown' && "text-amber-600",
                      usernameValidation.status === 'checking' && "text-gray-400"
                    )}>
                      {usernameValidation.message}
                    </p>
                  )}
                  {/* Smart suggestions when taken */}
                  {usernameValidation.status === 'taken' && usernameValidation.suggestions.length > 0 && (
                    <div className="flex gap-2 mt-1 ml-6 flex-wrap">
                      {usernameValidation.suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => handleUsernameChange(s)}
                          className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-[#FEC312]/20 hover:text-[#b38a00] border border-gray-200 transition-all font-medium text-gray-600"
                        >
                          @{s}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Helper text */}
                  {(!usernameValidation.message || usernameValidation.status === 'unchanged' || usernameValidation.status === 'idle') && (
                    <p className="text-[11px] text-gray-400 ml-6 mt-0.5">
                      Usernames are unique and used in your profile link. You can change this every 14 days.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-medium text-[#111111] tracking-tight truncate">
                    {targetAvatar.name}
                  </h1>
                  <p className="text-[15px] text-gray-400 font-medium mt-0.5">@{targetAvatar.username}</p>
                </>
              )}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 md:mt-[6px]">
              {editState !== 'idle' ? (
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={editState === 'saving'}
                  placeholder="Role"
                  className={cn(
                    "text-[16px] font-medium bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-all text-gray-900 max-w-[140px] placeholder:text-gray-300",
                    editRole.length > 50 && "text-red-500 border-red-300 focus:border-red-400"
                  )}
                />
              ) : (
                <span className="text-[16px] font-medium text-gray-400">
                  {targetAvatar.role || 'Designer'}
                </span>
              )}
              {isMe && editState === 'idle' && (
                <button 
                  onClick={startEditing}
                  className="hidden md:flex p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110 active:scale-95 text-gray-400 hover:text-[#FEC312]"
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

          <div className="max-w-lg mb-8 text-center md:text-left text-[15px]">
            {editState !== 'idle' ? (
              <textarea
                value={editBio}
                onChange={(e) => {
                  setEditBio(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                disabled={editState === 'saving'}
                placeholder="Tell us about yourself..."
                className={cn(
                  "w-full bg-transparent leading-relaxed resize-none outline-none border border-transparent rounded-lg p-3 -ml-3 -mt-3 transition-all text-gray-900 overflow-hidden",
                  "focus:bg-gray-50",
                  editBio.length > 200 && "text-red-500 focus:border-red-300 focus:bg-red-50",
                  editState === 'saving' && "opacity-70 pointer-events-none"
                )}
                rows={Math.max(3, editBio.split('\n').length)}
              />
            ) : (
               <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">
                 {targetAvatar.bio || "Enter your Bio"}
               </p>
            )}

            <AnimatePresence>
              {editState !== 'idle' && (
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="flex items-center justify-start md:justify-start gap-3 mt-4"
                >
                  <Button 
                      variant="primary" 
                      className="h-9 px-5 rounded-full text-sm font-medium"
                      onClick={handleSave}
                      disabled={editState === 'saving' || editBio.length > 200 || editRole.length > 50 || ['checking', 'taken', 'invalid_format', 'cooldown'].includes(usernameValidation.status)}
                  >
                    {editState === 'saving' ? (
                       <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-white/30 animate-spin mr-1" /> Saving...</>
                    ) : 'Save'}
                  </Button>
                  <Button 
                      variant="ghost"
                      className="h-9 px-5 rounded-full text-sm font-medium text-gray-500"
                      onClick={handleCancel}
                      disabled={editState === 'saving'}
                  >
                    Cancel
                  </Button>
                  
                  {editState === 'error' && saveError && (
                    <span className="text-red-500 text-sm font-medium pl-2">{saveError}</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="text-center md:text-left pr-8 border-r border-gray-100">
               <span className="block text-2xl text-[#111111]">
                 <AnimatedMetric value={avatarPosts.length} />
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Posts</span>
            </div>
            <div className="text-center md:text-left pr-8 border-r border-gray-100">
               <span className="block text-2xl text-[#111111]">
                 <AnimatedMetric value={stats.totalReviews} />
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reviews</span>
            </div>
            <div className="text-center md:text-left">
               <span className="block text-2xl text-[#111111]">
                 <AnimatedMetric value={stats.avgRating} isFloat />
               </span>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Avg Rating</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-3 ml-auto shrink-0 mt-2">
          <Button 
            variant="ghost" 
            className="h-11 rounded-full px-5 flex items-center gap-2 font-semibold text-black" 
            onClick={() => setShowQrCode(true)}
          >
            <QrCode className="w-4 h-4" />
            Share Profile
          </Button>
          {isMe && (
            <Button variant="ghost" className="h-11 rounded-full px-5 flex items-center gap-2 hover:bg-[#ff4848] hover:text-white transition-all text-gray-500 font-semibold" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 mb-12 flex justify-center md:justify-start gap-8">
        <button 
          onClick={() => setActiveTab('posts')}
          className={cn(
            "flex items-center gap-2 py-4 border-b-2 text-sm font-semibold uppercase tracking-wider transition-all",
            activeTab === 'posts' 
              ? "border-[#111111] text-[#111111]" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Grid className="w-4 h-4" />
          {isMe ? "My Posts" : "Posts"}
        </button>
        {isMe && (
          <button 
            onClick={() => setActiveTab('saved')}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-sm font-semibold uppercase tracking-wider transition-all",
              activeTab === 'saved' 
                ? "border-[#111111] text-[#111111]" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <Heart className="w-4 h-4" />
            Saved
          </button>
        )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {(activeTab === 'posts' || !isMe) ? (
          <motion.div 
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
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
          </motion.div>
        ) : (
          <motion.div 
            key="saved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="py-24 text-center bg-white rounded-[40px] border-2 border-[#FEC312] border-dashed shadow-xl shadow-[#FEC312]/5 max-w-2xl mx-auto px-8"
          >
            <div className="w-20 h-20 bg-[#FFF6DD] rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-[#FEC312] fill-[#FEC312]" />
            </div>
            <h3 className="text-3xl font-semibold mb-4 text-[#111111]">Coming Soon!</h3>
            <p className="text-gray-500 text-[16px] leading-relaxed max-w-sm mx-auto">
                You'll soon be able to save your favorite designs on the platform to build your own inspiration board.
            </p>
            <div className="mt-10 inline-flex items-center gap-2 px-6 py-2 bg-gray-100 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#FEC312] animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Development in Progress</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAuthOverlay && <AuthOverlay initialTab="login" onClose={() => setShowAuthOverlay(false)} />}
      {showLogoutConfirm && (
        <LogoutConfirmOverlay 
            onClose={() => setShowLogoutConfirm(false)} 
            onConfirm={() => {
                logout();
                setShowLogoutConfirm(false);
            }} 
        />
      )}
      {showQrCode && targetAvatar && (
        <QRCodeOverlay
          isOpen={showQrCode}
          onClose={() => setShowQrCode(false)}
          username={targetAvatar.username}
          avatarUrl={targetAvatar.avatar_url}
        />
      )}

      {showFullscreenAvatar && targetAvatar.avatar_url && (
        <FullscreenAvatarOverlay
          isOpen={showFullscreenAvatar}
          onClose={() => setShowFullscreenAvatar(false)}
          avatarUrl={targetAvatar.avatar_url}
          name={targetAvatar.name}
        />
      )}
    </div>
  );
}

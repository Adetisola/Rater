"use client";

import { useAuthState, useAuthActions } from '../context/AuthContext';
import { getProfilePosts } from '@/lib/posts';
import { usePostStore } from '@/store/postStore';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { MasonryGrid } from './MasonryGrid';
import { Grid, Heart, Check, Edit2, Camera, Trash2, X, AtSign, AlertCircle, QrCode, User, Loader2 } from 'lucide-react';
import { RichTextarea } from '@/components/ui/RichTextarea';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AuthOverlay } from './AuthOverlay';
import { UserMenu } from './UserMenu';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeOverlay } from './QRCodeOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { FullscreenAvatarOverlay } from './FullscreenAvatarOverlay';
import { SocialLinksRow } from './SocialLinksRow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeMarkdownComponents } from '@/lib/markdownComponents';
import { type SocialLink } from '../utils/socialLinksUtils';
import { showToast } from './GlobalOverlays';
import { uploadMedia } from '@/lib/cloudinary/uploads';
import { optimizeAvatarUrl } from '@/lib/cloudinary/transforms';

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
  initialProfile?: import('@/types').Avatar;
}

export function ProfileView({ avatarId, initialProfile }: ProfileViewProps) {
  const { currentProfile: me, profileMap } = useAuthState();
  const { updateProfile, checkUsernameAvailable } = useAuthActions();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const router = useRouter();

  const [avatarPostIds, setAvatarPostIds] = useState<string[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Edit State
  type EditState = 'idle' | 'editing' | 'saving' | 'error';
  const [editState, setEditState] = useState<EditState>('idle');
  const [saveError, setSaveError] = useState<string>('');

  const [editRole, setEditRole] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [showFullscreenAvatar, setShowFullscreenAvatar] = useState(false);

  // Smart Bio Links state
  const [editSocialLinks, setEditSocialLinks] = useState<SocialLink[]>([]);
  const [editShowEmail, setEditShowEmail] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [stats, setStats] = useState({ totalReviews: 0, avgRating: '—' });

  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);

  // Find the avatar to display — prefer initialProfile (SSR), then cache, then fetch
  const cachedAvatar = profileMap[avatarId];
  const [fetchedAvatar, setFetchedAvatar] = useState<import('@/types').Avatar | null>(null);

  useEffect(() => {
    // If SSR provided the profile, nothing to do
    if (initialProfile) return;
    // If the cache already has complete data, nothing to do
    if (cachedAvatar?.created_at) return;
    // If we already have a fetched result, nothing to do
    if (fetchedAvatar) return;

    let mounted = true;
    import('@/lib/profiles').then(({ getProfileById }) => {
      getProfileById(avatarId).then(profile => {
        if (mounted && profile) setFetchedAvatar(profile);
      });
    });
    return () => { mounted = false; };
  }, [avatarId, cachedAvatar?.created_at, fetchedAvatar, initialProfile]);

  // Use initialProfile when provided via SSR, otherwise cache, then fetched
  const targetAvatar = initialProfile ?? (cachedAvatar?.created_at ? cachedAvatar : fetchedAvatar) ?? cachedAvatar;

  // Compute optimized avatar URL for the main profile header
  const optimizedAvatarUrl = useMemo(() => {
    return optimizeAvatarUrl(targetAvatar?.avatar_url, 'lg');
  }, [targetAvatar?.avatar_url]);

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
    username_last_changed_at: targetAvatar?.username_last_changed_at,
    checkAvailability: memoizedCheckAvailability,
  });

  // Fetch Profile Posts
  useEffect(() => {
    let mounted = true;
    setIsLoadingPosts(true);
    getProfilePosts(avatarId, { limit: 100 }).then(posts => {
      if (mounted) {
        usePostStore.getState().addOrUpdatePosts(posts);
        setAvatarPostIds(posts.map(p => p.id));
        setIsLoadingPosts(false);
      }
    });
    return () => { mounted = false; };
  }, [avatarId]);

  const avatarPosts = useMemo(() => {
    const posts = avatarPostIds.map(id => usePostStore.getState().posts[id]).filter(Boolean);
    return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [avatarPostIds]);

  // Synchronous stats calculation
  useEffect(() => {
    let totalReviews = 0;
    let totalScore = 0;
    let ratedPosts = 0;

    avatarPosts.forEach(post => {
      totalReviews += post.review_count || 0;
      // We assume rating_unlocked is true if review_count >= 3, which is the current logic in metrics.ts
      if ((post.review_count || 0) >= 3 && post.average_score) {
        totalScore += post.average_score;
        ratedPosts++;
      }
    });

    setStats({
      totalReviews,
      avgRating: ratedPosts > 0 ? (totalScore / ratedPosts).toFixed(1) : '—'
    });
  }, [avatarPosts]);

  const joinedDate = useMemo(() => {
    if (!targetAvatar) return null;
    const date = new Date(targetAvatar.created_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [targetAvatar]);
  const isMe = me?.id === avatarId;

  const startEditing = (focusTarget: 'username' | 'bio' | 'role' = 'username') => {
    if (!targetAvatar) return;
    setEditRole(targetAvatar.role || '');
    setEditBio(targetAvatar.bio || '');
    setEditName(targetAvatar.name);
    setEditSocialLinks(targetAvatar.social_links ? [...targetAvatar.social_links] : []);
    setEditShowEmail(targetAvatar.show_email ?? false);
    handleUsernameChange(targetAvatar.username); // reset to current
    setSaveError('');
    setEditState('editing');
    setTimeout(() => {
      if (focusTarget === 'bio') {
        bioInputRef.current?.focus();
      } else if (focusTarget === 'role') {
        roleInputRef.current?.focus();
      } else {
        usernameInputRef.current?.focus();
      }
    }, 50);
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    if (isMe && editState === 'idle' && searchParams?.get('edit') === 'true') {
      startEditing();
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url);
    }
  }, [isMe, editState, searchParams]);

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
      role: editRole.trim() || null,
      bio: editBio.trim(),
      name: editName,
      social_links: editSocialLinks,
      show_email: editShowEmail,
      ...(usernameChanged ? { username: editUsername } : {}),
    });

    if (result.ok) {
      setEditState('idle');
      showToast("Profile updated successfully", "success");
      // Reroute to new username slug if it changed
      if (usernameChanged) {
        router.replace(`/@${editUsername.toLowerCase().trim()}`);
      }
    } else {
      const normalized = await import('@/lib/errors/normalizeError').then(m => m.normalizeError(new Error(result.error), {
        fallbackCode: 'RATER_PROFILE_002',
        fallbackMessage: 'Failed to update profile.'
      }));
      setSaveError(normalized.userMessage);
      setEditState('error');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showToast("Image too large (Max 5MB)", "error");
      
      setIsUploadingAvatar(true);
      try {
        const asset = await uploadMedia(file, 'avatars');
        const result = await updateProfile({ avatar_url: asset.url });
        if (result.ok) {
          showToast("Profile picture updated", "success");
        } else {
          const normalized = await import('@/lib/errors/normalizeError').then(m => m.normalizeError(new Error(result.error), {
            fallbackCode: 'RATER_PROFILE_001',
            fallbackMessage: 'Failed to update profile.'
          }));
          showToast(normalized.userMessage, "error");
        }
      } catch (err: any) {
        const normalized = await import('@/lib/errors/normalizeError').then(m => m.normalizeError(err, {
          fallbackCode: 'RATER_UPLOAD_002',
          fallbackMessage: 'Failed to upload image.'
        }));
        showToast(normalized.userMessage, "error");
      } finally {
        setIsUploadingAvatar(false);
        // Reset input value so the same file can be selected again if needed
        if (e.target) e.target.value = '';
      }
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
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">This profile doesn't exist.</h2>
        <p className="text-text-muted mb-8">The creative you're looking for could not be found or may have changed their @username.</p>
        <Link href="/browse" scroll={false}>
          <Button variant="outline" className="h-12 rounded-full px-8 text-lg">Return to Browse</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 xs:px-6 pt-1 pb-16 md:pt-4 md:pb-24 w-full min-h-[60vh] relative">

      {/* Mobile Menu / Share Actions */}
      {isMe && (
        <div className="md:hidden flex justify-end mb-4">
          <UserMenu variant="profile" align="right" onEditProfile={startEditing} />
        </div>
      )}

      {!isMe && (
        <div className="md:hidden flex justify-end mb-4">
          <button
            onClick={() => setShowQrCode(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-primary border border-border-default shadow-sm hover:bg-surface-hover transition-all active:scale-95 text-text-primary"
            aria-label="Share profile"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>
      )}


      {/* Avatar Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5 lg:gap-8 mb-16 px-4">
        <div className="relative group shrink-0 flex flex-col items-center">
          <div
            className={cn(
              "w-30 h-30 md:w-34 md:h-34 -mb-2 rounded-full flex items-center justify-center text-white text-5xl font-semibold overflow-hidden transition-all shadow-sm relative",
              !targetAvatar.avatar_url && "bg-surface-subtle border border-border-default"
            )}
          >
            {targetAvatar.avatar_url ? (
              <button
                onClick={() => setShowFullscreenAvatar(true)}
                aria-label={`View ${targetAvatar.name || 'user'} profile picture`}
                className="w-full h-full cursor-zoom-in group/avatar"
                disabled={isUploadingAvatar}
              >
                <img
                  src={optimizedAvatarUrl || targetAvatar.avatar_url}
                  width={136}
                  height={136}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-500",
                    !isUploadingAvatar && "group-hover/avatar:scale-110",
                    isUploadingAvatar && "opacity-50 blur-sm"
                  )}
                  alt={targetAvatar.name || "Profile avatar"}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </button>
            ) : (
              <User className={cn("w-1/2 h-1/2 text-text-muted", isUploadingAvatar && "opacity-50")} strokeWidth={2.5} />
            )}
            
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow-md" />
              </div>
            )}

            {isMe && !isUploadingAvatar && (
              <motion.div
                onMouseLeave={() => setIsConfirmingRemove(false)}
                className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-4 rounded-full z-10"
              >
                {!isConfirmingRemove ? (
                  <>
                    <Tooltip content="Change Profile Picture" position="top">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Change profile picture"
                        className="p-2 rounded-full bg-white/20 hover:bg-primary text-white transition-all transform hover:scale-110"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    {targetAvatar.avatar_url && (
                      <Tooltip content="Remove Profile Picture" position="top">
                        <button
                          onClick={handleAvatarRemove}
                          aria-label="Remove profile picture"
                          className="p-2 rounded-full bg-white/20 hover:bg-red-500 text-white transition-all transform hover:scale-110"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </Tooltip>
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
                      <Tooltip content="Yes, remove" position="top">
                        <button
                          onClick={handleAvatarRemove}
                          aria-label="Confirm profile picture removal"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 text-white hover:scale-110 transition-transform"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Cancel" position="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsConfirmingRemove(false); }}
                          aria-label="Cancel profile picture removal"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:scale-110 transition-transform"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
          {isMe && editState === 'idle' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
              className="md:hidden absolute bottom-0 right-0 w-9 h-9 bg-surface-elevated rounded-full flex items-center justify-center shadow border border-border-default text-text-primary z-10 active:scale-95 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
          {isMe && editState !== 'idle' && (
            <div className="flex md:hidden items-center justify-center gap-2 mt-5 mb-1 z-10">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-primary bg-surface-interactive hover:bg-surface-hover px-3 py-1.5 rounded-full transition-colors"
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
                    isConfirmingRemove ? "bg-status-error-bg text-status-error-fg border border-status-error-border" : "text-status-error-fg bg-status-error-bg hover:opacity-90"
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
        <div className="flex-1 text-center md:text-left pt-2 min-w-0 w-full">
          <div className="flex flex-col items-center md:items-start gap-1 mb-3 min-w-0 w-full">
            {/* USERNAME + DISPLAY NAME */}
            <div className="min-w-0 w-full">
              {editState !== 'idle' ? (
                <div className="flex flex-col gap-1.5 mb-2">
                  {/* Display Name */}
                  <div className="relative group">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={editState === 'saving'}
                      placeholder="Display Name"
                      maxLength={50}
                      className={cn(
                        "text-xl font-medium bg-transparent outline-none border-b border-transparent focus:border-border-default transition-all text-text-primary w-full placeholder:text-text-disabled pr-12",
                        editName.length > 50 && "text-status-error-fg border-status-error-border"
                      )}
                    />
                    <span className="absolute right-0 bottom-1 text-[10px] font-medium text-text-muted opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                      {editName.length}/50
                    </span>
                  </div>
                  {/* Username */}
                  <div className="relative flex items-center gap-1.5 mt-1 group">
                    <AtSign className="w-4 h-4 text-text-muted shrink-0" />
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
                        "text-[15px] font-medium bg-transparent outline-none border-b border-transparent focus:border-border-default transition-all text-text-secondary placeholder:text-text-disabled flex-1 pr-12",
                        usernameValidation.status === 'taken' && "text-status-error-fg border-status-error-border focus:border-status-error-border",
                        usernameValidation.status === 'valid' && "border-green-300 focus:border-green-400",
                        usernameValidation.status === 'cooldown' && "text-amber-500 border-amber-300"
                      )}
                    />
                    <span className="absolute right-0 bottom-1 text-[10px] font-medium text-text-muted opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                      {editUsername.length}/20
                    </span>
                    {/* Validation indicator */}
                    {usernameValidation.status === 'checking' && (
                      <div className="w-3.5 h-3.5 border-2 border-border-default border-t-text-muted rounded-full animate-spin shrink-0" />
                    )}
                    {usernameValidation.status === 'valid' && (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                    {(usernameValidation.status === 'taken' || usernameValidation.status === 'invalid_format') && (
                      <AlertCircle className="w-4 h-4 text-status-error-fg shrink-0" />
                    )}
                  </div>
                  {/* Validation message */}
                  {usernameValidation.message && usernameValidation.status !== 'unchanged' && (
                    <p className={cn(
                      "text-xs mt-0.5 ml-6",
                      usernameValidation.status === 'valid' && "text-green-500",
                      usernameValidation.status === 'taken' && "text-status-error-fg",
                      usernameValidation.status === 'invalid_format' && "text-status-error-fg",
                      usernameValidation.status === 'cooldown' && "text-amber-500",
                      usernameValidation.status === 'checking' && "text-text-muted"
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
                          className="text-xs px-2.5 py-1 rounded-full bg-surface-interactive hover:bg-primary/20 hover:text-text-primary border border-border-default transition-all font-medium text-text-secondary"
                        >
                          @{s}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Helper text */}
                  {(!usernameValidation.message || usernameValidation.status === 'unchanged' || usernameValidation.status === 'idle') && (
                    <p className="text-[11px] text-text-muted ml-6 mt-0.5">
                      Usernames are unique and used in your profile link. You can change your @username every 14 days.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center md:flex-row md:items-baseline md:gap-2 w-full">
                  <h1 className="text-xl md:text-2xl font-medium text-text-primary tracking-tight break-all w-full md:w-auto px-4 md:px-0">
                    {targetAvatar.name}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                    <p className="text-[15px] text-text-muted font-medium break-all px-4 md:px-0">@{targetAvatar.username}</p>
                    {isMe && editState === 'idle' && (
                      <button
                        onClick={() => startEditing()}
                        className="hidden md:flex p-2 rounded-full hover:bg-surface-hover transition-all hover:scale-110 active:scale-95 text-text-muted hover:text-primary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 w-full">
              {editState !== 'idle' ? (
                <div className="relative w-full max-w-md group">
                  <input
                    ref={roleInputRef}
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={editState === 'saving'}
                    placeholder="Role"
                    maxLength={50}
                    className={cn(
                      "text-[16px] font-medium bg-transparent outline-none border-b border-transparent focus:border-border-default transition-all text-text-primary w-full placeholder:text-input-placeholder pr-12",
                      editRole.length > 50 && "text-red-500 border-red-300 focus:border-red-400"
                    )}
                  />
                  <span className="absolute right-0 bottom-1 text-[10px] font-medium text-text-muted opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                    {editRole.length}/50
                  </span>
                </div>
              ) : targetAvatar.role || isMe ? (
                targetAvatar.role ? (
                  <span className="text-[16px] font-medium text-text-muted">
                    {targetAvatar.role}
                  </span>
                ) : (
                  <button
                    onClick={() => startEditing('role')}
                    className="text-[16px] font-base text-text-muted hover:text-primary transition-colors focus:outline-none"
                  >
                    Tell us your creative role
                  </button>
                )
              ) : null}
              {/* Joined badge - Desktop only here */}
              {editState === 'idle' && (
                <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-surface-subtle text-text-muted text-[10px] font-semibold tracking-wider ml-1 self-center">
                  Joined {joinedDate}
                </span>
              )}
            </div>
          </div>

          {editState === 'idle' && (
            <div className="flex gap-2 justify-center md:hidden mb-6">
              <span className="px-3 py-1 rounded-full bg-surface-subtle text-text-muted text-[10px] font-semibold tracking-wider">
                Joined {joinedDate}
              </span>
            </div>
          )}

          <div className="max-w-lg mb-8 text-center md:text-left text-[15px] mx-auto md:mx-0 px-4 md:px-0">
            {editState !== 'idle' ? (
              <div className="relative group">
                <RichTextarea
                  ref={bioInputRef as any}
                  value={editBio}
                  onChange={(e) => {
                    setEditBio(e.target.value);
                  }}
                  disabled={editState === 'saving'}
                  placeholder="Tell people what you create..."
                  maxLength={200}
                  className={cn(
                    "w-full bg-transparent leading-relaxed resize-none outline-none border border-transparent rounded-lg p-3 -ml-3 transition-all text-text-primary overflow-hidden pb-8",
                    "focus:bg-surface-subtle",
                    editBio.length > 200 && "text-status-error-fg focus:border-status-error-border focus:bg-status-error-bg",
                    editState === 'saving' && "opacity-70 pointer-events-none"
                  )}
                />
              </div>
            ) : targetAvatar.bio || isMe ? (
              <div className="text-text-secondary leading-relaxed markdown-content [&_p]:my-1">
                {targetAvatar.bio ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={safeMarkdownComponents}>
                    {targetAvatar.bio}
                  </ReactMarkdown>
                ) : (
                  <button
                    onClick={() => startEditing('bio')}
                    className="text-text-muted hover:text-primary transition-colors"
                  >
                    Say a little about yourself...
                  </button>
                )}
              </div>
            ) : null}

            {/* Smart Bio Links — Social Icon Row + Suggestion */}
            <SocialLinksRow
              links={editState !== 'idle' ? editSocialLinks : (targetAvatar.social_links || [])}
              email={targetAvatar.show_email ? targetAvatar.email : undefined}
              isEditing={editState !== 'idle'}
              bioText={editBio}
              onLinksChange={setEditSocialLinks}
              onBioChange={setEditBio}
            />

            <AnimatePresence mode="wait">
              {editState !== 'idle' && (
                <motion.div
                  key="edit-email"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex items-center justify-center md:justify-start overflow-hidden"
                >
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={editShowEmail}
                      onChange={(e) => setEditShowEmail(e.target.checked)}
                      disabled={editState === 'saving'}
                      className="w-4 h-4 rounded-sm border-border-default text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-[13px] font-medium text-text-muted group-hover:text-text-primary transition-colors">Show email on profile</span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint for Social Links */}
            <AnimatePresence>
              {editState !== 'idle' && editSocialLinks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex items-start gap-1.5 justify-center md:justify-start overflow-hidden"
                >
                  <div className="flex items-center md:mt-2 gap-1.5 px-3 py-1.5 bg-surface-subtle border border-border-subtle rounded-lg text-[11px] font-medium text-text-muted">
                    <span className="text-sm leading-none">💡</span>
                    <span>Tip: Paste links in your bio to display them on your profile (e.g. www.instagram.com/username)</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {editState !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center md:justify-start gap-2 mt-4"
                >
                  <Button
                    variant="outline"
                    className="h-10 px-6 rounded-full text-sm font-medium transition-all"
                    onClick={handleSave}
                    disabled={editState === 'saving' || editBio.length > 200 || editRole.length > 50 || ['checking', 'taken', 'invalid_format', 'cooldown'].includes(usernameValidation.status)}
                    isLoading={editState === 'saving'}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-10 px-6 rounded-full text-sm font-medium transition-all"
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
            <div className="text-center md:text-left pr-8 border-r border-border-subtle">
              <span className="block text-2xl text-text-primary">
                <AnimatedMetric value={avatarPosts.length} />
              </span>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Works</span>
            </div>
            <div className="text-center md:text-left pr-8 border-r border-border-subtle">
              <span className="block text-2xl text-text-primary">
                <AnimatedMetric value={stats.totalReviews} />
              </span>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Critiques</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-2xl text-text-primary">
                <AnimatedMetric value={stats.avgRating} isFloat />
              </span>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Overall Score</span>
            </div>
          </div>
        </div>

        {!isMe && (
          <div className="hidden md:flex flex-col gap-3 ml-auto shrink-0 mt-2">
            <Button
              variant="ghost"
              className="h-11 rounded-full px-5 flex items-center gap-2 font-semibold text-text-primary"
              onClick={() => setShowQrCode(true)}
            >
              <QrCode className="w-4 h-4" />
              Share Profile
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border-subtle mb-12 flex justify-center md:justify-start gap-8">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            "flex items-center gap-2 py-4 border-b-2 text-sm font-semibold uppercase tracking-wider transition-all",
            activeTab === 'posts'
              ? "border-primary text-text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <Grid className="w-4 h-4" />
          {isMe ? "My Works" : "Works"}
        </button>
        {isMe && (
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-sm font-semibold uppercase tracking-wider transition-all",
              activeTab === 'saved'
                ? "border-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-primary"
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
                  postIds={avatarPostIds} 
                  isLoading={isLoadingPosts}
                />
              </div>
            ) : (
              <div className="py-20 text-center bg-surface-subtle rounded-4xl border-2 border-dashed border-border-default">
                <Grid className="w-12 h-12 text-border-default mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2 text-text-primary">No works published yet</h3>
                <p className="text-text-secondary mb-8">{isMe ? "Publish your first creative work to receive structured critique." : "This creative hasn't published any work yet."}</p>
                {isMe && (
                  <Link href="/submit" scroll={false}>
                    <Button variant="primary" className="text-lg rounded-full">Publish Work</Button>
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
            className="py-24 text-center bg-surface-primary rounded-3xl border-2 border-primary border-dashed shadow-xl shadow-primary/5 max-w-2xl mx-auto px-8"
          >
            <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-primary fill-primary" />
            </div>
            <h3 className="text-3xl font-semibold mb-4 text-text-primary">Coming Soon!</h3>
            <p className="text-text-muted text-[16px] leading-relaxed max-w-sm mx-auto">
              You'll soon be able to bookmark your favorite works to build your personal inspiration board.
            </p>
            <div className="mt-10 inline-flex items-center gap-2 px-6 py-2 bg-surface-interactive rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Development in Progress</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAuthOverlay && <AuthOverlay initialTab="login" onClose={() => setShowAuthOverlay(false)} />}
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

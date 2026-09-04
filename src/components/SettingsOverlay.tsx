"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sliders, 
  User, 
  Bell,
  HelpCircle, 
  ExternalLink, 
  Mail, 
  MessageSquarePlus, 
  Bug, 
  BookOpen, 
  ShieldCheck, 
  KeyRound, 
  Loader2,
  CheckCircle2,
  Edit2,
  Sparkles,
  Download,
  Smartphone,
  FileText,
  Lock,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare
} from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { supabase } from '@/lib/supabase/client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { UserAvatar } from './UserAvatar';
import { ConnectedAccounts } from './ConnectedAccounts';
import { showToast, showInviteModal, showInstallAppModal } from './GlobalOverlays';
import { useOverlayStore } from '@/store/overlayStore';
import { deleteOwnAccount } from '@/lib/account/server';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences, 
  registerPushSubscription, 
  unregisterPushSubscription, 
  isPushSubscribedOnDevice 
} from '@/lib/notifications/client';
import type { NotificationPreferences } from '@/types';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export type SettingsTab = 'general' | 'account' | 'notifications' | 'help' | 'about';

interface SettingsOverlayProps {
  isOpen: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
}

export function SettingsOverlay({ isOpen, initialTab = 'general', onClose }: SettingsOverlayProps) {
  const { currentProfile } = useAuthState();
  const searchParams = useSearchParams();
  const { preference, setPreference, isHydrated } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [expandedChangelog, setExpandedChangelog] = useState<string | null>('replies');

  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // PWA Install State
  const { isInstalled, installApp } = usePWAInstall();

  const handleInstallApp = async () => {
    const res = await installApp();
    if (res.outcome === 'accepted') {
      showToast('Rater app installed successfully!', 'success');
    } else if (res.outcome === 'guide' || res.outcome === 'unavailable') {
      showInstallAppModal();
    }
  };

  // Notification Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  // Platform detection for push guidance
  const [platformInfo] = useState(() => {
    if (typeof window === 'undefined') return { isIOS: false, isStandalone: false, isAndroid: false, isSamsung: false, isDesktop: true, supportsPush: true };
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    const isSamsung = /SamsungBrowser/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const isDesktop = !isIOS && !isAndroid;
    const supportsPush = 'PushManager' in window && 'serviceWorker' in navigator;
    return { isIOS, isStandalone, isAndroid, isSamsung, isDesktop, supportsPush };
  });

  const [isPushTroubleshootOpen, setIsPushTroubleshootOpen] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // Load notification preferences
  useEffect(() => {
    if (isOpen && currentProfile?.id) {
      getNotificationPreferences(currentProfile.id).then((prefs) => {
        if (prefs) setPreferences(prefs);
      });
      isPushSubscribedOnDevice().then((status) => {
        setIsPushSubscribed(status);
      });
    }
  }, [isOpen, currentProfile?.id]);

  const handlePreferenceToggle = async (key: keyof Omit<NotificationPreferences, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (!currentProfile || !preferences) return;
    const updatedValue = !preferences[key];
    const newPrefs = { ...preferences, [key]: updatedValue };
    setPreferences(newPrefs);
    await updateNotificationPreferences(currentProfile.id, { [key]: updatedValue });
    showToast('Preference saved', 'info');
  };

  const handlePushToggle = async () => {
    if (!currentProfile) return;
    setIsPushLoading(true);
    try {
      if (isPushSubscribed) {
        await unregisterPushSubscription(currentProfile.id);
        setIsPushSubscribed(false);
        showToast('Push notifications disabled on this device', 'info');
      } else {
        const res = await registerPushSubscription(currentProfile.id);
        if (res.ok) {
          setIsPushSubscribed(true);
          showToast('Push notifications enabled for this device!', 'success');
        } else {
          showToast(res.error || 'Failed to enable push notifications', 'error');
        }
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  // Sync with searchParams on open
  useEffect(() => {
    if (isOpen) {
      const tabParam = searchParams.get('tab') as SettingsTab;
      if (tabParam && ['general', 'account', 'notifications', 'help'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, searchParams, initialTab]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('settings', 'true');
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordError(error.message || 'Failed to update password.');
      } else {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password updated successfully', 'success');
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'An unexpected error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentProfile) return;
    if (deleteConfirmationText.trim().toLowerCase() !== currentProfile.username.toLowerCase()) {
      setDeleteError(`Please type @${currentProfile.username} exactly to confirm.`);
      return;
    }

    try {
      setIsDeletingAccount(true);
      setDeleteError(null);

      const res = await deleteOwnAccount();
      if (!res.ok) {
        setDeleteError(res.error || 'Failed to delete account.');
        setIsDeletingAccount(false);
        return;
      }

      showToast('Your account has been deleted', 'info');
      onClose();
      window.location.href = '/browse';
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  if (!isOpen) return null;

  const TABS = [
    { id: 'general' as const, label: 'General', icon: Sliders },
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'help' as const, label: 'Help', icon: HelpCircle },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-3xl bg-surface-primary sm:rounded-[28px] shadow-2xl border border-border-default flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
            <h2 className="text-lg font-medium text-text-primary tracking-tight">Settings</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-interactive hover:bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close settings"
            >
              <X size={17} />
            </button>
          </div>

          {/* Mobile Top Segmented Tab Switcher */}
          <div className="sm:hidden px-3 py-2 bg-surface-subtle border-b border-border-subtle flex gap-1 shrink-0 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap",
                    isActive 
                      ? "bg-surface-primary text-text-primary shadow-2xs border border-border-default" 
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-text-primary" : "text-text-muted"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body: Two-Column layout on desktop */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
            {/* Desktop Left Sidebar */}
            <div className="hidden sm:flex flex-col w-48 border-r border-border-subtle p-2.5 gap-1 bg-surface-subtle shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left",
                      isActive
                        ? "bg-surface-interactive text-text-primary font-semibold"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <Icon size={16} className={isActive ? "text-text-primary" : "text-text-muted"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-5 sm:p-7 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {/* ─── GENERAL TAB ────────────────────────────────────────────── */}
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Appearance Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Appearance</p>
                      
                      <div className="rounded-2xl border border-border-default bg-surface-primary p-4 space-y-3.5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Interface Theme</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              Switch between Light, Dark, or System themes.
                            </p>
                          </div>
                        </div>

                        {/* Theme Segmented Switcher */}
                        {!isHydrated ? (
                          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-interactive rounded-full animate-pulse">
                            <div className="h-8 rounded-full bg-surface-subtle" />
                            <div className="h-8 rounded-full bg-surface-subtle" />
                            <div className="h-8 rounded-full bg-surface-subtle" />
                          </div>
                        ) : (
                          <div
                            role="radiogroup"
                            aria-label="Interface Theme"
                            className="grid grid-cols-3 gap-1.5 p-1 bg-surface-interactive rounded-full"
                          >
                            {(['system', 'light', 'dark'] as const).map((mode) => {
                              const label = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';
                              const isSelected = preference === mode;
                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  tabIndex={isSelected ? 0 : -1}
                                  onClick={() => setPreference(mode)}
                                  onKeyDown={(e) => {
                                    const modes: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
                                    const currentIndex = modes.indexOf(preference);
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      const nextMode = modes[(currentIndex + 1) % modes.length];
                                      setPreference(nextMode);
                                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      const prevMode = modes[(currentIndex - 1 + modes.length) % modes.length];
                                      setPreference(prevMode);
                                    }
                                  }}
                                  className={cn(
                                    "py-2 px-3 rounded-full text-center select-none text-xs sm:text-[13px] font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none",
                                    isSelected
                                      ? "bg-surface-primary text-text-primary shadow-sm"
                                      : "text-text-muted hover:text-text-primary"
                                  )}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* App & Experience Section (PWA) */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">App & Experience</p>

                      <div className="rounded-2xl border border-border-default bg-surface-primary p-4 space-y-3.5">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center text-text-primary shrink-0 mt-0.5">
                              <Smartphone size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-text-primary">Install Rater App</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                                Fast launch from your home screen or desktop dock with full-screen view.
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isInstalled ? (
                              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs sm:text-[13px] font-medium whitespace-nowrap shrink-0">
                                <CheckCircle2 size={14} />
                                <span>Installed</span>
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                onClick={handleInstallApp}
                                className="h-9 px-4 rounded-full text-xs sm:text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0"
                              >
                                <Download size={14} />
                                <span>Install App</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── ACCOUNT TAB ────────────────────────────────────────────── */}
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Profile & Security Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Profile & Security</p>

                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        {/* Profile Row */}
                        {currentProfile && (
                          <div className="p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <UserAvatar
                                avatarUrl={currentProfile.avatar_url}
                                size="xs"
                                className="w-11 h-11 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-text-primary truncate">{currentProfile.name}</p>
                                <p className="text-xs text-text-secondary truncate">@{currentProfile.username}</p>
                              </div>
                            </div>

                            <Link
                              href={`/@${currentProfile.username}?edit=true`}
                              onClick={onClose}
                              className="shrink-0"
                            >
                              <Button
                                variant="outline"
                                className="h-9 px-3.5 text-xs sm:text-[13px] font-medium rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0"
                              >
                                <Edit2 size={13} className="text-text-muted" />
                                <span>Edit Profile</span>
                              </Button>
                            </Link>
                          </div>
                        )}

                        {/* Verified Email Row */}
                        {currentProfile?.email && (
                          <div className="p-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-text-primary">Email Address</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-1">{currentProfile.email}</p>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <ShieldCheck size={13} />
                              <span>Verified</span>
                            </div>
                          </div>
                        )}

                        {/* Password / Passkey Row */}
                        <div className="p-4 space-y-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                                <KeyRound size={15} className="text-text-muted shrink-0" />
                                <span>Password</span>
                              </p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-1">Set or update your account password.</p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsChangingPassword(!isChangingPassword);
                                setPasswordError(null);
                                setPasswordSuccess(false);
                              }}
                              className="h-9 px-3.5 text-xs sm:text-[13px] font-medium rounded-full whitespace-nowrap shrink-0"
                            >
                              {isChangingPassword ? 'Cancel' : 'Change'}
                            </Button>
                          </div>

                          {isChangingPassword && (
                            <form onSubmit={handlePasswordChange} className="pt-3.5 border-t border-border-default space-y-3">
                              {passwordError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-[13px] text-red-400">
                                  {passwordError}
                                </div>
                              )}
                              {passwordSuccess && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs sm:text-[13px] text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 size={14} />
                                  <span>Password updated successfully!</span>
                                </div>
                              )}

                              <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">New Password</label>
                                <Input
                                  type="password"
                                  placeholder="Minimum 8 characters"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="h-10 text-xs sm:text-[13px] rounded-xl"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Confirm New Password</label>
                                <Input
                                  type="password"
                                  placeholder="Re-type new password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="h-10 text-xs sm:text-[13px] rounded-xl"
                                  required
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  type="submit"
                                  variant="primary"
                                  disabled={passwordLoading || !newPassword}
                                  className="h-9 px-4 text-xs sm:text-[13px] font-semibold rounded-full flex items-center gap-1.5"
                                >
                                  {passwordLoading && <Loader2 size={13} className="animate-spin" />}
                                  <span>Save Password</span>
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Personal Referral Invite Link Section */}
                    {currentProfile && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Referrals & Growth</p>

                        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                                <Users size={15} className="text-text-muted shrink-0" />
                                <span>Personal Invite Link</span>
                              </p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                                Invite fellow designers to join and earn referral attribution.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                onClose();
                                showInviteModal();
                              }}
                              className="h-8 px-3.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0"
                            >
                              Open Card
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <input
                              type="text"
                              readOnly
                              value={typeof window !== 'undefined' ? `${window.location.origin}/invite/@${currentProfile.username}` : ''}
                              className="flex-1 min-w-0 bg-input-bg border border-border-strong rounded-xl px-3.5 py-2 text-xs sm:text-[13px] font-medium text-text-primary select-all focus:outline-none"
                            />
                            <Button
                              variant="primary"
                              onClick={async () => {
                                if (typeof window !== 'undefined') {
                                  const url = `${window.location.origin}/invite/@${currentProfile.username}`;
                                  await navigator.clipboard.writeText(url);
                                  showToast('Invite link copied to clipboard!', 'success');
                                }
                              }}
                              className="h-9 px-4 rounded-full text-xs sm:text-[13px] font-medium shrink-0 whitespace-nowrap"
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Connected Accounts Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Connected Accounts</p>
                      <ConnectedAccounts />
                    </div>

                    {/* Danger Zone: Delete Account */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-xs font-bold text-red-500 tracking-wider px-1">Danger Zone</p>
                      
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-3.5">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-red-400">Delete Account</p>
                            <p className="text-xs sm:text-[13px] text-red-300/80 mt-1">
                              Permanently delete your profile, creative works, and reviews.
                            </p>
                          </div>
                          {!showDeleteConfirm && (
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="h-9 px-3.5 text-xs sm:text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 shrink-0 rounded-full whitespace-nowrap"
                            >
                              Delete
                            </Button>
                          )}
                        </div>

                        {showDeleteConfirm && currentProfile && (
                          <div className="pt-3.5 border-t border-red-500/20 space-y-3">
                            {deleteError && (
                              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-[13px] text-red-400 font-medium">
                                {deleteError}
                              </div>
                            )}

                            <p className="text-xs sm:text-[13px] text-red-300 font-medium">
                              Type <strong className="font-bold underline">@{currentProfile.username}</strong> below to confirm deletion:
                            </p>

                            <Input
                              type="text"
                              placeholder={`@${currentProfile.username}`}
                              value={deleteConfirmationText}
                              onChange={(e) => setDeleteConfirmationText(e.target.value)}
                              className="h-10 text-xs sm:text-[13px] rounded-xl border-red-500/30 focus:border-red-500 bg-input-bg text-text-primary"
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteConfirmationText('');
                                  setDeleteError(null);
                                }}
                                className="h-9 px-3.5 text-xs sm:text-[13px] rounded-full"
                              >
                                Cancel
                              </Button>

                              <Button
                                variant="primary"
                                disabled={
                                  isDeletingAccount ||
                                  deleteConfirmationText.trim().toLowerCase() !== currentProfile.username.toLowerCase()
                                }
                                onClick={handleDeleteAccount}
                                className="h-9 px-4 text-xs sm:text-[13px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center gap-1.5"
                              >
                                {isDeletingAccount && <Loader2 size={13} className="animate-spin" />}
                                <span>Permanently Delete</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── NOTIFICATIONS TAB ──────────────────────────────────────── */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Delivery Channels Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Delivery Channels</p>
                      
                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        {/* Web Push Notifications */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-text-primary">Web Push Notifications</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                                Instant browser alerts even when Rater isn&apos;t actively focused.
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={preferences?.push_enabled ?? true}
                              onClick={() => handlePreferenceToggle('push_enabled')}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                (preferences?.push_enabled ?? true) ? "bg-primary" : "bg-surface-interactive"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                  (preferences?.push_enabled ?? true) ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>

                          {/* Device Registration Trigger */}
                          {/* iOS — not installed as PWA: show Home Screen install guidance */}
                          {platformInfo.isIOS && !platformInfo.isStandalone ? (
                            <div className="pt-3 border-t border-border-default">
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <Smartphone size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-amber-300">Install Rater to enable push</p>
                                  <p className="text-xs text-amber-400/90 mt-0.5 leading-relaxed">
                                    iOS requires Rater to be added to your Home Screen before push notifications can be enabled. Tap the share icon in Safari, then tap &ldquo;Add to Home Screen&rdquo;.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => showInstallAppModal()}
                                    className="mt-2 text-xs font-semibold text-amber-300 underline underline-offset-2 focus:outline-none"
                                  >
                                    How to install Rater on iOS
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-3 border-t border-border-default flex items-center justify-between gap-3">
                              <span className="text-xs sm:text-[13px] text-text-secondary min-w-0 flex-1">
                                Device status: <span className={cn("font-semibold", isPushSubscribed ? "text-emerald-400" : "text-amber-400")}>
                                  {isPushSubscribed ? "Active on this device" : "Not enabled on this device"}
                                </span>
                              </span>
                              <Button
                                variant="outline"
                                disabled={isPushLoading}
                                onClick={handlePushToggle}
                                className="h-8 px-3.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0"
                              >
                                {isPushLoading && <Loader2 size={12} className="animate-spin mr-1" />}
                                <span>{isPushSubscribed ? "Disable on Device" : "Enable on Device"}</span>
                              </Button>
                            </div>
                          )}

                          {/* Background Notification Troubleshooting Accordion */}
                          <div className="pt-1.5">
                            <button
                              type="button"
                              onClick={() => setIsPushTroubleshootOpen(prev => !prev)}
                              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors focus:outline-none group text-left"
                            >
                              <HelpCircle size={13} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
                              <span className="underline underline-offset-2 decoration-border-default group-hover:decoration-text-primary transition-colors">
                                Why don&apos;t push notifications arrive when the app is closed?
                              </span>
                              {isPushTroubleshootOpen ? (
                                <ChevronUp size={13} className="text-text-muted group-hover:text-text-primary transition-transform shrink-0" />
                              ) : (
                                <ChevronDown size={13} className="text-text-muted group-hover:text-text-primary transition-transform shrink-0" />
                              )}
                            </button>

                            <AnimatePresence>
                              {isPushTroubleshootOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2.5 p-3.5 rounded-xl bg-surface-subtle border border-border-default text-xs space-y-3">
                                    <p className="text-text-secondary leading-relaxed">
                                      Web browsers rely on device background services to deliver alerts. When your browser is completely closed or inactive, mobile operating systems often suspend background processes to preserve battery.
                                    </p>

                                    {/* Priority Platform Tip */}
                                    {platformInfo.isSamsung && (
                                      <div className="p-3 rounded-lg bg-surface-primary border border-border-default space-y-1.5">
                                        <div className="font-semibold text-text-primary flex items-center justify-between gap-2">
                                          <span>Samsung Internet &amp; Galaxy Devices</span>
                                          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold tracking-wide uppercase">Your Browser</span>
                                        </div>
                                        <p className="text-text-secondary leading-relaxed text-[11.5px]">
                                          Samsung OneUI aggressively puts background browser daemons to sleep. Push messages are securely queued by Google FCM and deliver as soon as the browser wakes.
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px] leading-relaxed pt-0.5">
                                          <li><strong className="text-text-primary">Unrestricted battery:</strong> Go to phone <span className="font-medium text-text-primary">Settings → Apps → Samsung Internet → Battery</span> and select <span className="font-medium text-text-primary">Unrestricted</span>.</li>
                                          <li><strong className="text-text-primary">Install as App:</strong> Tap the browser menu (☰) → <span className="font-medium text-text-primary">Install app</span> for elevated background push priority.</li>
                                        </ul>
                                      </div>
                                    )}

                                    {platformInfo.isAndroid && !platformInfo.isSamsung && (
                                      <div className="p-3 rounded-lg bg-surface-primary border border-border-default space-y-1.5">
                                        <div className="font-semibold text-text-primary flex items-center justify-between gap-2">
                                          <span>Android &amp; Chrome</span>
                                          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold tracking-wide uppercase">Your Browser</span>
                                        </div>
                                        <p className="text-text-secondary leading-relaxed text-[11.5px]">
                                          Android may pause background web-push when battery saver or adaptive battery is active.
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px] leading-relaxed pt-0.5">
                                          <li><strong className="text-text-primary">Unrestricted battery:</strong> In Android <span className="font-medium text-text-primary">Settings → Apps → Chrome → App battery usage</span>, choose <span className="font-medium text-text-primary">Unrestricted</span>.</li>
                                          <li><strong className="text-text-primary">Install Rater:</strong> Tap the browser menu (⋮) → <span className="font-medium text-text-primary">Install app</span> for highest delivery reliability.</li>
                                        </ul>
                                      </div>
                                    )}

                                    {platformInfo.isIOS && (
                                      <div className="p-3 rounded-lg bg-surface-primary border border-border-default space-y-1.5">
                                        <div className="font-semibold text-text-primary flex items-center justify-between gap-2">
                                          <span>Apple iOS (iPhone &amp; iPad)</span>
                                          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold tracking-wide uppercase">Your Device</span>
                                        </div>
                                        <p className="text-text-secondary leading-relaxed text-[11.5px]">
                                          Apple requires iOS 16.4+ and only permits Web Push for websites saved to the Home Screen. Regular Safari tabs cannot receive notifications when closed.
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px] leading-relaxed pt-0.5">
                                          <li>Tap the <span className="font-medium text-text-primary">Share</span> icon in Safari → select <span className="font-medium text-text-primary">&ldquo;Add to Home Screen&rdquo;</span>.</li>
                                          <li>Launch Rater from your Home Screen to enable push.</li>
                                        </ul>
                                      </div>
                                    )}

                                    {platformInfo.isDesktop && (
                                      <div className="p-3 rounded-lg bg-surface-primary border border-border-default space-y-1.5">
                                        <div className="font-semibold text-text-primary flex items-center justify-between gap-2">
                                          <span>Desktop Browsers (Chrome, Edge, Brave, Firefox)</span>
                                          <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold tracking-wide uppercase">Your Device</span>
                                        </div>
                                        <p className="text-text-secondary leading-relaxed text-[11.5px]">
                                          Desktop browsers can deliver alerts with all tabs closed if background processing is allowed in browser settings.
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px] leading-relaxed pt-0.5">
                                          <li>In browser settings (e.g. Chrome <span className="font-medium text-text-primary">Settings → System</span>), ensure <span className="font-medium text-text-primary">&ldquo;Continue running background apps when closed&rdquo;</span> is enabled.</li>
                                          <li>Ensure your OS settings (Windows Notifications / macOS Focus) allow notifications for your browser.</li>
                                        </ul>
                                      </div>
                                    )}

                                    {/* Universal toggle to see guidelines for all platforms */}
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setShowAllPlatforms(prev => !prev)}
                                        className="text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors focus:outline-none flex items-center gap-1"
                                      >
                                        <span>{showAllPlatforms ? 'Hide other operating systems' : 'View guidelines for other operating systems'}</span>
                                        <ChevronDown size={11} className={cn("transition-transform duration-200", showAllPlatforms && "rotate-180")} />
                                      </button>

                                      {showAllPlatforms && (
                                        <div className="mt-2.5 pt-2.5 border-t border-border-default space-y-2.5 text-[11px]">
                                          {!platformInfo.isSamsung && (
                                            <div className="space-y-0.5">
                                              <p className="font-semibold text-text-primary">Samsung Internet (Galaxy):</p>
                                              <p className="text-text-secondary">Android Settings → Apps → Samsung Internet → Battery → set to &ldquo;Unrestricted&rdquo;.</p>
                                            </div>
                                          )}
                                          {(!platformInfo.isAndroid || platformInfo.isSamsung) && (
                                            <div className="space-y-0.5">
                                              <p className="font-semibold text-text-primary">Android Chrome:</p>
                                              <p className="text-text-secondary">Android Settings → Apps → Chrome → App battery usage → set to &ldquo;Unrestricted&rdquo;.</p>
                                            </div>
                                          )}
                                          {!platformInfo.isIOS && (
                                            <div className="space-y-0.5">
                                              <p className="font-semibold text-text-primary">iOS (iPhone &amp; iPad):</p>
                                              <p className="text-text-secondary">Requires iOS 16.4+. Safari Share menu → &ldquo;Add to Home Screen&rdquo;.</p>
                                            </div>
                                          )}
                                          {!platformInfo.isDesktop && (
                                            <div className="space-y-0.5">
                                              <p className="font-semibold text-text-primary">Desktop (Windows &amp; macOS):</p>
                                              <p className="text-text-secondary">Ensure browser system settings permit running background apps when closed.</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Android browser (not installed): gentle PWA install hint for reliability */}
                          {platformInfo.isAndroid && !isInstalled && isPushSubscribed && (
                            <div className="pt-0">
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Download size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-blue-300">Install for more reliable push</p>
                                  <p className="text-xs text-blue-300/80 mt-0.5 leading-relaxed">
                                    Installing Rater to your home screen improves push delivery reliability, especially when your browser is in the background.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleInstallApp}
                                    className="mt-2 text-xs font-semibold text-blue-300 underline underline-offset-2 focus:outline-none"
                                  >
                                    Install Rater
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* In-App Notifications */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">In-App Notifications</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              Realtime bell alerts and unread counters in the app header.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.in_app_enabled ?? true}
                            onClick={() => handlePreferenceToggle('in_app_enabled')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.in_app_enabled ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.in_app_enabled ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Email Notifications */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Milestone Emails</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              High-signal emails for score unlocks, insights synthesis, and badges.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.email_enabled ?? true}
                            onClick={() => handlePreferenceToggle('email_enabled')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.email_enabled ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.email_enabled ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Activity Alerts Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Activity Alerts</p>
                      
                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        {/* Critiques */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Critiques on your Work</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              When a creative shares feedback and scores on your published Work.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_critiques ?? true}
                            onClick={() => handlePreferenceToggle('notify_critiques')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_critiques ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_critiques ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Replies & Mentions */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Critique Replies & @Mentions</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              When creatives reply to your critiques, respond to your comments, or mention you.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_replies ?? true}
                            onClick={() => handlePreferenceToggle('notify_replies')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_replies ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_replies ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Milestones */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Score Unlocks & Badges</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              When your Work unlocks its Overall Score (3 Critiques) or earns Top Rated.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_milestones ?? true}
                            onClick={() => handlePreferenceToggle('notify_milestones')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_milestones ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_milestones ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Insights */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Insights Syntheses</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              When AI-driven pattern summaries and perception insights are synthesized.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_insights ?? true}
                            onClick={() => handlePreferenceToggle('notify_insights')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_insights ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_insights ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* New Work on Rater */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">New work on Rater</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              Get notified when new work is published on Rater.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_new_work ?? true}
                            onClick={() => handlePreferenceToggle('notify_new_work')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_new_work ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_new_work ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Feedback & Community Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Feedback & Community</p>
                      
                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        {/* Status Updates & Official Responses */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Status Updates & Official Responses</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              When followed feature requests change status or receive official team responses.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_feedback_status ?? true}
                            onClick={() => handlePreferenceToggle('notify_feedback_status')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_feedback_status ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_feedback_status ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Discussion Comments */}
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Discussion Comments</p>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 leading-relaxed">
                              When community members share comments on feedback requests you follow or authored.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_feedback_comments ?? true}
                            onClick={() => handlePreferenceToggle('notify_feedback_comments')}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_feedback_comments ?? true) ? "bg-primary" : "bg-surface-interactive"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_feedback_comments ?? true) ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* System Bypass Notice */}
                    <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-default flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Security notices, password resets, and critical account moderation alerts always bypass preferences to protect your profile.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ─── HELP & LEGAL TAB ───────────────────────────────────────── */}
                {activeTab === 'help' && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Community & Feedback Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Community & Feedback</p>

                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        <Link
                          href="/legal/community-guidelines"
                          onClick={onClose}
                          className="p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">Community Guidelines</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">Read our rating standards and creative code of conduct.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            useOverlayStore.getState().openFeedbackDrawer({ defaultType: 'Feature Request' });
                          }}
                          className="w-full p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <MessageSquarePlus size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">Feature Requests & Ideas</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">Suggest new features and vote on community ideas.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            useOverlayStore.getState().openFeedbackDrawer({ defaultType: 'Bug Report' });
                          }}
                          className="w-full p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Bug size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">Report a Bug</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">Let our team know about technical issues or glitches.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </button>

                        <a
                          href="mailto:support@raterapp.site?subject=Rater%20Support%20Inquiry"
                          className="p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Mail size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">Contact Support</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">Get direct assistance from the Rater core team.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Legal Policies Section */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Legal Policies</p>

                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        <Link
                          href="/legal/terms"
                          onClick={onClose}
                          className="p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">Terms of Service</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">Terms of use, service agreements, and creator rights.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/privacy"
                          onClick={onClose}
                          className="p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Lock size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">Privacy Policy</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">How we process, store, and protect your data.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/ai-insights"
                          onClick={onClose}
                          className="p-4 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles size={17} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-text-primary">AI Insights Disclosure</p>
                              <p className="text-xs sm:text-[13px] text-text-secondary mt-0.5">Transparent details on AI synthesis and perception modeling.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── ABOUT TAB ───────────────────────────────────────── */}
                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* 1. App Identity Hero */}
                    <div className="p-5 rounded-3xl bg-surface-subtle border border-border-default flex items-center gap-3.5">
                      <div className="w-11 h-11 overflow-hidden shrink-0">
                        <img
                          src="/icons/rater-logo-white-bg-stroked.svg"
                          alt="Rater Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium text-text-primary tracking-tight">Rater</h3>
                          <span className="text-xs text-text-muted font-normal">
                            v1.2.2
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                          Real-time design critique and creative discovery platform.
                        </p>
                      </div>
                    </div>

                    {/* 2. What's New in v1.2.0 (Compact Expandable Accordion) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-xs font-semibold text-text-muted tracking-wider">What&apos;s New in v1.2</p>
                        <span className="text-xs text-text-muted font-normal">Release Highlights</span>
                      </div>

                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        {/* Item 1: Threaded Critique Replies & @Mentions */}
                        <div className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedChangelog(expandedChangelog === 'replies' ? null : 'replies')}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                <MessageSquare size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Threaded Critique Replies &amp; @Mentions</p>
                                <p className="text-xs text-text-secondary mt-0.5">Engage in conversations directly beneath feedback.</p>
                              </div>
                            </div>
                            {expandedChangelog === 'replies' ? (
                              <ChevronUp size={16} className="text-text-muted shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-text-muted shrink-0" />
                            )}
                          </button>
                          {expandedChangelog === 'replies' && (
                            <div className="px-4 pb-4 pt-1 text-xs text-text-secondary space-y-1.5 bg-surface-subtle border-t border-border-default">
                              <p>• <strong className="text-text-primary">Shallow-Threaded Discussions:</strong> Clean conversational replies under critiques without messy visual staircase nesting.</p>
                              <p>• <strong className="text-text-primary">Smart @Mentions &amp; Autocomplete:</strong> Type @ to tag creators with clickable profiles and auto-suggested participants.</p>
                              <p>• <strong className="text-text-primary">Unread Tracking &amp; Deep Linking:</strong> &quot;New replies&quot; badges and instant URL navigation jump straight into active threads.</p>
                            </div>
                          )}
                        </div>

                        {/* Item 2: Instant Search & Creator Discovery */}
                        <div className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedChangelog(expandedChangelog === 'search' ? null : 'search')}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                                <Search size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Instant Search & Creator Discovery</p>
                                <p className="text-xs text-text-secondary mt-0.5">Find designers by name, username, or creative works.</p>
                              </div>
                            </div>
                            {expandedChangelog === 'search' ? (
                              <ChevronUp size={16} className="text-text-muted shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-text-muted shrink-0" />
                            )}
                          </button>
                          {expandedChangelog === 'search' && (
                            <div className="px-4 pb-4 pt-1 text-xs text-text-secondary space-y-1.5 bg-surface-subtle border-t border-border-default">
                              <p>• <strong className="text-text-primary">Name & Username Discovery:</strong> Search for creators directly to see matching profiles and works.</p>
                              <p>• <strong className="text-text-primary">Dynamic 4-Signal Autocomplete:</strong> Suggestions derived from trending queries, live creator names, and design taxonomy.</p>
                              <p>• <strong className="text-text-primary">Dual-Action Predictions (↗):</strong> Tap arrow icons to populate query strings or jump straight to results.</p>
                            </div>
                          )}
                        </div>

                        {/* Item 3: Real-Time Notifications & Web Push */}
                        <div className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedChangelog(expandedChangelog === 'push' ? null : 'push')}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                <Bell size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Real-Time Notifications & Web Push</p>
                                <p className="text-xs text-text-secondary mt-0.5">Instant critique alerts on phone and desktop.</p>
                              </div>
                            </div>
                            {expandedChangelog === 'push' ? (
                              <ChevronUp size={16} className="text-text-muted shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-text-muted shrink-0" />
                            )}
                          </button>
                          {expandedChangelog === 'push' && (
                            <div className="px-4 pb-4 pt-1 text-xs text-text-secondary space-y-1.5 bg-surface-subtle border-t border-border-default">
                              <p>• <strong className="text-text-primary">Browser Web Push (VAPID):</strong> Receive notifications even when Rater is closed in your browser.</p>
                              <p>• <strong className="text-text-primary">Granular Channel Controls:</strong> Customize in-app, push, and email preferences per category.</p>
                              <p>• <strong className="text-text-primary">Actionable Alerts:</strong> Tap directly to view reviews, comments, and new portfolio works.</p>
                            </div>
                          )}
                        </div>

                        {/* Item 4: Community Feedback Hub */}
                        <div className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedChangelog(expandedChangelog === 'feedback' ? null : 'feedback')}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                                <MessageSquarePlus size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Community Feedback & Roadmap Hub</p>
                                <p className="text-xs text-text-secondary mt-0.5">Upvote feature requests and shape Rater&apos;s future.</p>
                              </div>
                            </div>
                            {expandedChangelog === 'feedback' ? (
                              <ChevronUp size={16} className="text-text-muted shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-text-muted shrink-0" />
                            )}
                          </button>
                          {expandedChangelog === 'feedback' && (
                            <div className="px-4 pb-4 pt-1 text-xs text-text-secondary space-y-1.5 bg-surface-subtle border-t border-border-default">
                              <p>• <strong className="text-text-primary">Interactive Roadmap (/feedback):</strong> Community voting and real-time status stages (Planned, In Progress, Completed).</p>
                              <p>• <strong className="text-text-primary">Discussion Drawer:</strong> Threaded creator conversations and official team responses.</p>
                            </div>
                          )}
                        </div>

                        {/* Item 5: Progressive Web App (PWA) Installation */}
                        <div className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedChangelog(expandedChangelog === 'pwa' ? null : 'pwa')}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                <Smartphone size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Native App Installation (PWA)</p>
                                <p className="text-xs text-text-secondary mt-0.5">Install on home screen with full-screen experience.</p>
                              </div>
                            </div>
                            {expandedChangelog === 'pwa' ? (
                              <ChevronUp size={16} className="text-text-muted shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-text-muted shrink-0" />
                            )}
                          </button>
                          {expandedChangelog === 'pwa' && (
                            <div className="px-4 pb-4 pt-1 text-xs text-text-secondary space-y-1.5 bg-surface-subtle border-t border-border-default">
                              <p>• <strong className="text-text-primary">1-Click Install:</strong> Fast native installation on Android, Chrome, and iOS Safari Home Screen.</p>
                              <p>• <strong className="text-text-primary">Offline Resilience:</strong> View recently browsed posts and cached search indexes with zero connectivity.</p>
                            </div>
                          )}
                        </div>

                        {/* Item 6: Unified Settings & Privacy */}
                        <div className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedChangelog(expandedChangelog === 'settings' ? null : 'settings')}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-surface-interactive text-text-primary flex items-center justify-center shrink-0">
                                <Sliders size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Refined Settings & Privacy Controls</p>
                                <p className="text-xs text-text-secondary mt-0.5">Unified sliding overlay for profile, accounts, and security.</p>
                              </div>
                            </div>
                            {expandedChangelog === 'settings' ? (
                              <ChevronUp size={16} className="text-text-muted shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-text-muted shrink-0" />
                            )}
                          </button>
                          {expandedChangelog === 'settings' && (
                            <div className="px-4 pb-4 pt-1 text-xs text-text-secondary space-y-1.5 bg-surface-subtle border-t border-border-default">
                              <p>• <strong className="text-text-primary">Consolidated Navigation:</strong> Instant access to account details, password updates, and notification channels.</p>
                              <p>• <strong className="text-text-primary">Privacy & Security:</strong> Multi-tier moderation safeguards and immediate account controls.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Platform Policies & Resources */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-text-muted tracking-wider px-1">Legal & Platform Ethics</p>

                      <div className="rounded-2xl border border-border-default bg-surface-primary divide-y divide-border-default overflow-hidden">
                        <Link
                          href="/legal/community-guidelines"
                          onClick={onClose}
                          className="p-3.5 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-text-primary">Community Guidelines</p>
                              <p className="text-[11px] sm:text-xs text-text-secondary">Rating standards and critique code of conduct.</p>
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/ai-insights"
                          onClick={onClose}
                          className="p-3.5 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-text-primary">AI Insights & Synthesis Ethics</p>
                              <p className="text-[11px] sm:text-xs text-text-secondary">Perception modeling and creator IP protections.</p>
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/terms"
                          onClick={onClose}
                          className="p-3.5 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-text-primary">Terms of Service</p>
                              <p className="text-[11px] sm:text-xs text-text-secondary">Creator copyright ownership and platform rules.</p>
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/privacy"
                          onClick={onClose}
                          className="p-3.5 hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Lock size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-text-primary">Privacy Policy</p>
                              <p className="text-[11px] sm:text-xs text-text-secondary">How we store, process, and protect your data.</p>
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
                        </Link>
                      </div>
                    </div>

                    {/* 4. Footer & Copyright */}
                    <div className="pt-2 pb-4 text-center space-y-1 text-xs text-text-muted">
                      <p className="font-medium text-text-secondary">Rater &copy; {new Date().getFullYear()} &bull; All Rights Reserved.</p>
                      <p className="text-[11px]">Crafted for the global design community.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

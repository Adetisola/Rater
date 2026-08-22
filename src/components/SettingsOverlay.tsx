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
  Share2,
  FileText,
  Lock
} from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { supabase } from '@/lib/supabase/client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { UserAvatar } from './UserAvatar';
import { ConnectedAccounts } from './ConnectedAccounts';
import { showToast, showInviteModal } from './GlobalOverlays';
import { deleteOwnAccount } from '@/lib/account/server';
import { cn } from '@/lib/utils';
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

export type SettingsTab = 'general' | 'account' | 'notifications' | 'help';

interface SettingsOverlayProps {
  isOpen: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
}

export function SettingsOverlay({ isOpen, initialTab = 'general', onClose }: SettingsOverlayProps) {
  const { currentProfile } = useAuthState();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

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
  const { isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleInstallApp = async () => {
    const res = await installApp();
    if (res.outcome === 'accepted') {
      showToast('Rater app installed successfully!', 'success');
    } else if (res.outcome === 'ios' || isIOS) {
      setShowIOSGuide(prev => !prev);
    } else if (res.outcome === 'unsupported') {
      showToast('Use your browser menu to "Install Rater" or "Add to Home Screen"', 'info');
    }
  };

  // Notification Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

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
          className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-3xl bg-white sm:rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
              aria-label="Close settings"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mobile Top Segmented Tab Switcher */}
          <div className="sm:hidden px-3 py-2 bg-gray-50/70 border-b border-gray-100 flex gap-1 shrink-0 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                    isActive 
                      ? "bg-white text-gray-900 shadow-2xs border border-gray-200/70" 
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-black" : "text-gray-400"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body: Two-Column layout on desktop */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
            {/* Desktop Left Sidebar */}
            <div className="hidden sm:flex flex-col w-48 border-r border-gray-100 p-2.5 gap-0.5 bg-gray-50/40 shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left",
                      isActive
                        ? "bg-gray-100/90 text-gray-900 font-semibold"
                        : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-black" : "text-gray-400"} />
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
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Appearance</p>
                      
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-gray-900">Interface Theme</p>
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/50 uppercase tracking-wider">
                                Coming soon
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">Switch between Light, Dark, or System themes.</p>
                          </div>
                        </div>

                        {/* Theme Segmented Switcher */}
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100/70 rounded-xl border border-gray-200/40">
                          {['System', 'Light', 'Dark'].map((theme, i) => (
                            <div
                              key={theme}
                              className={cn(
                                "py-1.5 px-3 rounded-lg text-center select-none text-xs font-semibold transition-all cursor-not-allowed opacity-60",
                                i === 0 ? "bg-white text-gray-900 shadow-2xs border border-gray-200/50 opacity-90" : "text-gray-500"
                              )}
                            >
                              {theme}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* App & Experience Section (PWA) */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">App & Experience</p>

                      <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-700 shrink-0 mt-0.5">
                              <Smartphone size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">Install Rater App</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Fast launch from your home screen or desktop dock with full-screen view.
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isInstalled ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-semibold">
                                <CheckCircle2 size={13} />
                                <span>Installed</span>
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                onClick={handleInstallApp}
                                className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                              >
                                <Download size={13} />
                                <span>{isIOS ? "How to Install" : "Install App"}</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* iOS Safari Installation Guide Expander */}
                        {showIOSGuide && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3 border-t border-gray-100"
                          >
                            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/50 text-[11px] text-gray-700 space-y-1.5">
                              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                <Share2 size={13} className="text-primary" />
                                <span>Installing on iOS (Safari):</span>
                              </p>
                              <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-1">
                                <li>Tap the <strong className="text-gray-900">Share</strong> button at the bottom of Safari.</li>
                                <li>Scroll down and tap <strong className="text-gray-900">&quot;Add to Home Screen&quot;</strong>.</li>
                                <li>Tap <strong className="text-gray-900">Add</strong> in the top right to complete.</li>
                              </ol>
                            </div>
                          </motion.div>
                        )}
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
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Profile & Security</p>

                      <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
                        {/* Profile Row */}
                        {currentProfile && (
                          <div className="p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar
                                avatarUrl={currentProfile.avatar_url}
                                size="xs"
                                className="w-10 h-10 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-gray-900 truncate">{currentProfile.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">@{currentProfile.username}</p>
                              </div>
                            </div>

                            <Link
                              href={`/@${currentProfile.username}?edit=true`}
                              onClick={onClose}
                            >
                              <Button
                                variant="outline"
                                className="h-8 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                              >
                                <Edit2 size={12} className="text-gray-400" />
                                <span>Edit Profile</span>
                              </Button>
                            </Link>
                          </div>
                        )}

                        {/* Verified Email Row */}
                        {currentProfile?.email && (
                          <div className="p-3.5 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-900">Email Address</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{currentProfile.email}</p>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <ShieldCheck size={12} />
                              <span>Verified</span>
                            </div>
                          </div>
                        )}

                        {/* Password / Passkey Row */}
                        <div className="p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                <KeyRound size={14} className="text-gray-400" />
                                <span>Passkey / Password</span>
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">Set or update your account password.</p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsChangingPassword(!isChangingPassword);
                                setPasswordError(null);
                                setPasswordSuccess(false);
                              }}
                              className="h-8 px-3 text-xs font-semibold rounded-xl"
                            >
                              {isChangingPassword ? 'Cancel' : 'Change'}
                            </Button>
                          </div>

                          {isChangingPassword && (
                            <form onSubmit={handlePasswordChange} className="pt-3 border-t border-gray-100 space-y-2.5">
                              {passwordError && (
                                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                                  {passwordError}
                                </div>
                              )}
                              {passwordSuccess && (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5">
                                  <CheckCircle2 size={13} />
                                  <span>Password updated successfully!</span>
                                </div>
                              )}

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-700">New Password</label>
                                <Input
                                  type="password"
                                  placeholder="Minimum 8 characters"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="h-9 text-xs rounded-xl"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-700">Confirm New Password</label>
                                <Input
                                  type="password"
                                  placeholder="Re-type new password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="h-9 text-xs rounded-xl"
                                  required
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  type="submit"
                                  variant="primary"
                                  disabled={passwordLoading || !newPassword}
                                  className="h-8 px-3.5 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                                >
                                  {passwordLoading && <Loader2 size={12} className="animate-spin" />}
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
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Referrals & Growth</p>

                        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-primary" />
                                <span>Personal Invite Link</span>
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Invite fellow designers to join and earn referral attribution.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                onClose();
                                showInviteModal();
                              }}
                              className="h-7 px-2.5 text-[11px] font-semibold rounded-lg"
                            >
                              Open Card
                            </Button>
                          </div>

                          <div className="flex items-center gap-1.5 pt-0.5">
                            <input
                              type="text"
                              readOnly
                              value={typeof window !== 'undefined' ? `${window.location.origin}/invite/@${currentProfile.username}` : ''}
                              className="flex-1 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-1.5 text-xs font-mono text-gray-800 select-all focus:outline-none"
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
                              className="h-8 px-3 rounded-xl text-xs font-semibold shrink-0"
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Connected Accounts Section */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Connected Accounts</p>
                      <ConnectedAccounts />
                    </div>

                    {/* Danger Zone: Delete Account */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider px-1">Danger Zone</p>
                      
                      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-3.5 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-900">Delete Account</p>
                            <p className="text-[11px] text-red-700/80 mt-0.5">
                              Permanently delete your profile, creative works, and reviews.
                            </p>
                          </div>
                          {!showDeleteConfirm && (
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="h-8 px-3 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0 rounded-xl"
                            >
                              Delete
                            </Button>
                          )}
                        </div>

                        {showDeleteConfirm && currentProfile && (
                          <div className="pt-3 border-t border-red-100 space-y-2.5">
                            {deleteError && (
                              <div className="p-2 bg-red-100/80 rounded-xl text-xs text-red-700 font-medium">
                                {deleteError}
                              </div>
                            )}

                            <p className="text-[11px] text-red-800 font-medium">
                              Type <strong className="font-bold underline">@{currentProfile.username}</strong> below to confirm deletion:
                            </p>

                            <Input
                              type="text"
                              placeholder={`@${currentProfile.username}`}
                              value={deleteConfirmationText}
                              onChange={(e) => setDeleteConfirmationText(e.target.value)}
                              className="h-9 text-xs rounded-xl border-red-200 focus:border-red-500 bg-white"
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteConfirmationText('');
                                  setDeleteError(null);
                                }}
                                className="h-8 px-3 text-xs rounded-xl"
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
                                className="h-8 px-3.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-1.5"
                              >
                                {isDeletingAccount && <Loader2 size={12} className="animate-spin" />}
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
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Delivery Channels</p>
                      
                      <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
                        {/* In-App Notifications */}
                        <div className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">In-App Notifications</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
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
                              (preferences?.in_app_enabled ?? true) ? "bg-primary" : "bg-gray-200"
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

                        {/* Web Push Notifications */}
                        <div className="p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-900">Web Push Notifications</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
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
                                (preferences?.push_enabled ?? true) ? "bg-primary" : "bg-gray-200"
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
                          <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-gray-500">
                              Device status: <span className={cn("font-semibold", isPushSubscribed ? "text-emerald-700" : "text-amber-700")}>
                                {isPushSubscribed ? "Active on this device" : "Not enabled on this device"}
                              </span>
                            </span>
                            <Button
                              variant="outline"
                              disabled={isPushLoading}
                              onClick={handlePushToggle}
                              className="h-7 px-2.5 text-[11px] font-semibold rounded-lg"
                            >
                              {isPushLoading && <Loader2 size={11} className="animate-spin mr-1" />}
                              <span>{isPushSubscribed ? "Disable on Device" : "Enable on Device"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Email Notifications */}
                        <div className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Milestone Emails</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
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
                              (preferences?.email_enabled ?? true) ? "bg-primary" : "bg-gray-200"
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
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Activity Alerts</p>
                      
                      <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
                        {/* Critiques */}
                        <div className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Critiques on your Work</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
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
                              (preferences?.notify_critiques ?? true) ? "bg-primary" : "bg-gray-200"
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

                        {/* Milestones */}
                        <div className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Score Unlocks & Badges</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
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
                              (preferences?.notify_milestones ?? true) ? "bg-primary" : "bg-gray-200"
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
                        <div className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Insights Syntheses</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
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
                              (preferences?.notify_insights ?? true) ? "bg-primary" : "bg-gray-200"
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
                      </div>
                    </div>

                    {/* System Bypass Notice */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/60 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-500 leading-relaxed">
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
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Community & Feedback</p>

                      <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
                        <Link
                          href="/legal/community-guidelines"
                          onClick={onClose}
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">Community Guidelines</p>
                              <p className="text-[11px] text-gray-500">Read our rating standards and creative code of conduct.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/feedback"
                          onClick={onClose}
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <MessageSquarePlus size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">Feature Requests & Ideas</p>
                              <p className="text-[11px] text-gray-500">Suggest new features and vote on community ideas.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/feedback?type=bug"
                          onClick={onClose}
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Bug size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">Report a Bug</p>
                              <p className="text-[11px] text-gray-500">Let our team know about technical issues or glitches.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </Link>

                        <a
                          href="mailto:support@raterapp.site?subject=Rater%20Support%20Inquiry"
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Mail size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">Contact Support</p>
                              <p className="text-[11px] text-gray-500">Get direct assistance from the Rater core team.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Legal Policies Section */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Legal Policies</p>

                      <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
                        <Link
                          href="/legal/terms"
                          onClick={onClose}
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">Terms of Service</p>
                              <p className="text-[11px] text-gray-500">Terms of use, service agreements, and creator rights.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/privacy"
                          onClick={onClose}
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Lock size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">Privacy Policy</p>
                              <p className="text-[11px] text-gray-500">How we process, store, and protect your data.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </Link>

                        <Link
                          href="/legal/ai-insights"
                          onClick={onClose}
                          className="p-3.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles size={16} className="text-gray-400 group-hover:text-black transition-colors shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-black">AI Insights Disclosure</p>
                              <p className="text-[11px] text-gray-500">Transparent details on AI synthesis and perception modeling.</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                        </Link>
                      </div>
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

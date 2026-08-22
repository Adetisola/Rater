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
  Sparkles
} from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
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
    // Update shallow URL query without full reload
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
      setPasswordError('Passkey / Password must be at least 8 characters.');
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Settings</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mobile Top Segmented Tab Switcher */}
          <div className="sm:hidden px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex gap-1.5 shrink-0">
            {[
              { id: 'general', label: 'General', icon: Sliders },
              { id: 'account', label: 'Account', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'help', label: 'Help', icon: HelpCircle },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as SettingsTab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body: Two-Column layout on desktop */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
            {/* Desktop Left Sidebar */}
            <div className="hidden sm:flex flex-col w-52 border-r border-gray-100 p-3 gap-1 bg-gray-50/50 shrink-0">
              {[
                { id: 'general', label: 'General', icon: Sliders },
                { id: 'account', label: 'Account', icon: User },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'help', label: 'Help', icon: HelpCircle },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as SettingsTab)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Appearance</h3>
                      <p className="text-xs text-gray-500">Customize how Rater looks on your device.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">Interface Theme</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                              Coming soon
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">Switch between Light, Dark, or System themes.</p>
                        </div>
                      </div>

                      {/* Theme selection preview pills (disabled) */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {['System', 'Light', 'Dark'].map((theme, i) => (
                          <div
                            key={theme}
                            className={`p-3 rounded-xl border text-center select-none cursor-not-allowed opacity-50 ${
                              i === 0 ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100/60 border-gray-200/50'
                            }`}
                          >
                            <span className="text-xs font-semibold text-gray-600">{theme}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Profile Shortcut */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Account & Security</h3>
                      <p className="text-xs text-gray-500">Manage your profile identity, security, and sign-in methods.</p>
                    </div>

                    {currentProfile ? (
                      <div className="p-4.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <UserAvatar
                            avatarUrl={currentProfile.avatar_url}
                            className="w-12 h-12 shrink-0 shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{currentProfile.name}</p>
                            <p className="text-xs text-gray-500 truncate">@{currentProfile.username}</p>
                          </div>
                        </div>

                        <Link
                          href={`/@${currentProfile.username}?edit=true`}
                          onClick={onClose}
                        >
                          <Button
                            variant="outline"
                            className="h-9 px-3.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-white"
                          >
                            <Edit2 size={13} />
                            <span>Edit Profile</span>
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                        Please sign in to manage account settings.
                      </div>
                    )}

                    {/* Personal Referral Invite Link */}
                    {currentProfile && (
                      <div className="p-4.5 rounded-2xl bg-white border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <Sparkles size={16} className="text-primary" />
                              Personal Invite Link
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Invite fellow designers and friends to join Rater.
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              onClose();
                              showInviteModal();
                            }}
                            className="h-8 px-3 text-xs font-semibold rounded-xl"
                          >
                            Open Card
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            readOnly
                            value={typeof window !== 'undefined' ? `${window.location.origin}/invite/@${currentProfile.username}` : ''}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-800 select-all focus:outline-none"
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
                            className="h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 bg-black text-white hover:bg-gray-800"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Email Display */}
                    {currentProfile?.email && (
                      <div className="p-4.5 rounded-2xl bg-white border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Primary Email</p>
                          <p className="text-sm font-medium text-gray-900">{currentProfile.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <ShieldCheck size={14} />
                          <span>Verified</span>
                        </div>
                      </div>
                    )}

                    {/* Passkey / Password Section */}
                    <div className="p-4.5 rounded-2xl bg-white border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <KeyRound size={16} className="text-primary" />
                            Passkey / Password
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Set or change your account password.</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChangingPassword(!isChangingPassword);
                            setPasswordError(null);
                            setPasswordSuccess(false);
                          }}
                          className="h-9 px-3.5 text-xs font-semibold rounded-xl"
                        >
                          {isChangingPassword ? 'Cancel' : 'Change'}
                        </Button>
                      </div>

                      {isChangingPassword && (
                        <form onSubmit={handlePasswordChange} className="pt-3 border-t border-gray-100 space-y-3">
                          {passwordError && (
                            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                              {passwordError}
                            </div>
                          )}
                          {passwordSuccess && (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 size={14} />
                              <span>Password updated successfully!</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700">New Password</label>
                            <Input
                              type="password"
                              placeholder="Minimum 8 characters"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="h-10 text-sm rounded-xl"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700">Confirm New Password</label>
                            <Input
                              type="password"
                              placeholder="Re-type new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="h-10 text-sm rounded-xl"
                              required
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={passwordLoading || !newPassword}
                              className="h-9 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                            >
                              {passwordLoading && <Loader2 size={13} className="animate-spin" />}
                              <span>Save Password</span>
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Connected Accounts */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Connected Accounts</p>
                      <ConnectedAccounts />
                    </div>

                    {/* Danger Zone: Delete Account */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Danger Zone</p>
                      
                      <div className="p-4.5 rounded-2xl border border-red-100 bg-red-50/40 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-red-900">Delete Account</p>
                            <p className="text-xs text-red-700/80 mt-0.5">
                              Permanently delete your profile, creative works, and reviews. This action cannot be undone.
                            </p>
                          </div>
                          {!showDeleteConfirm && (
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="h-9 px-3.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0 rounded-xl"
                            >
                              Delete
                            </Button>
                          )}
                        </div>

                        {showDeleteConfirm && currentProfile && (
                          <div className="pt-3 border-t border-red-100 space-y-3">
                            {deleteError && (
                              <div className="p-2.5 bg-red-100/70 rounded-xl text-xs text-red-700 font-medium">
                                {deleteError}
                              </div>
                            )}

                            <p className="text-xs text-red-800 font-medium">
                              Type <strong className="font-bold underline">@{currentProfile.username}</strong> below to confirm deletion:
                            </p>

                            <Input
                              type="text"
                              placeholder={`@${currentProfile.username}`}
                              value={deleteConfirmationText}
                              onChange={(e) => setDeleteConfirmationText(e.target.value)}
                              className="h-10 text-sm rounded-xl border-red-200 focus:border-red-500 bg-white"
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteConfirmationText('');
                                  setDeleteError(null);
                                }}
                                className="h-9 px-3.5 text-xs rounded-xl"
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
                                className="h-9 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-1.5"
                              >
                                {isDeletingAccount && <Loader2 size={13} className="animate-spin" />}
                                <span>Permanently Delete Account</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Notification Preferences</h3>
                      <p className="text-xs text-gray-500">
                        Choose how and when Rater notifies you about critiques, scores, and milestones.
                      </p>
                    </div>

                    {/* Delivery Channels */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Channels</p>
                      
                      <div className="space-y-2.5">
                        {/* In-App Notifications */}
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between gap-4 shadow-2xs">
                          <div>
                            <p className="text-sm font-bold text-gray-900">In-App Notifications</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Realtime bell alerts and unread counters in the app header.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.in_app_enabled ?? true}
                            onClick={() => handlePreferenceToggle('in_app_enabled')}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.in_app_enabled ?? true) ? "bg-primary" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.in_app_enabled ?? true) ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Web Push Notifications */}
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-gray-900">Web Push Notifications</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Instant browser alerts even when Rater isn&apos;t actively focused.
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={preferences?.push_enabled ?? true}
                              onClick={() => handlePreferenceToggle('push_enabled')}
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                                (preferences?.push_enabled ?? true) ? "bg-primary" : "bg-gray-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                  (preferences?.push_enabled ?? true) ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>

                          {/* Device Registration Trigger */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-600 font-medium">
                              Device status: <span className={cn("font-bold", isPushSubscribed ? "text-green-600" : "text-amber-600")}>
                                {isPushSubscribed ? "Active on this device" : "Not enabled on this device"}
                              </span>
                            </span>
                            <Button
                              variant="outline"
                              disabled={isPushLoading}
                              onClick={handlePushToggle}
                              className="h-8 px-3 text-xs font-bold rounded-xl"
                            >
                              {isPushLoading && <Loader2 size={12} className="animate-spin mr-1.5" />}
                              <span>{isPushSubscribed ? "Disable on Device" : "Enable on Device"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Email Notifications */}
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between gap-4 shadow-2xs">
                          <div>
                            <p className="text-sm font-bold text-gray-900">Milestone Emails</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              High-signal emails for score unlocks, insights synthesis, and badges.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.email_enabled ?? true}
                            onClick={() => handlePreferenceToggle('email_enabled')}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.email_enabled ?? true) ? "bg-primary" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.email_enabled ?? true) ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notification Types */}
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activity Alerts</p>
                      
                      <div className="space-y-2.5">
                        {/* Critiques & Reviews */}
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between gap-4 shadow-2xs">
                          <div>
                            <p className="text-sm font-bold text-gray-900">Critiques on your Work</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              When a creative shares feedback and scores on your published Work.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_critiques ?? true}
                            onClick={() => handlePreferenceToggle('notify_critiques')}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_critiques ?? true) ? "bg-primary" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_critiques ?? true) ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Milestones & Unlocks */}
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between gap-4 shadow-2xs">
                          <div>
                            <p className="text-sm font-bold text-gray-900">Score Unlocks & Badges</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              When your Work unlocks its Overall Score (3 Critiques) or earns Top Rated.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_milestones ?? true}
                            onClick={() => handlePreferenceToggle('notify_milestones')}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_milestones ?? true) ? "bg-primary" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_milestones ?? true) ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Insights */}
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between gap-4 shadow-2xs">
                          <div>
                            <p className="text-sm font-bold text-gray-900">Insights Syntheses</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              When AI-driven pattern summaries and perception insights are synthesized.
                            </p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preferences?.notify_insights ?? true}
                            onClick={() => handlePreferenceToggle('notify_insights')}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                              (preferences?.notify_insights ?? true) ? "bg-primary" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                (preferences?.notify_insights ?? true) ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* System Bypass Notice */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/60 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Security notices, password resets, and critical account moderation alerts always bypass preferences to protect your profile.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'help' && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Help & Resources</h3>
                      <p className="text-xs text-gray-500">Guidelines, feedback, and support channels for the Rater community.</p>
                    </div>

                    {/* Community Guidelines */}
                    <Link
                      href="/legal/community-guidelines"
                      onClick={onClose}
                      className="p-4.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all flex items-center justify-between group block"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-black">Community Guidelines</p>
                          <p className="text-xs text-gray-500">Read our rating standards and creative code of conduct.</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </Link>

                    {/* Give Feedback */}
                    <Link
                      href="/feedback"
                      onClick={onClose}
                      className="p-4.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all flex items-center justify-between group block"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                          <MessageSquarePlus size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-black">Feature Requests & Ideas</p>
                          <p className="text-xs text-gray-500">Suggest new features and vote on community ideas.</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </Link>

                    {/* Report a Bug */}
                    <Link
                      href="/feedback?type=bug"
                      onClick={onClose}
                      className="p-4.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all flex items-center justify-between group block"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                          <Bug size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-black">Report a Bug</p>
                          <p className="text-xs text-gray-500">Let our team know about technical issues or glitches.</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </Link>

                    {/* Contact Support */}
                    <a
                      href="mailto:support@raterapp.site?subject=Rater%20Support%20Inquiry"
                      className="p-4.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all flex items-center justify-between group block"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-black">Contact Support</p>
                          <p className="text-xs text-gray-500">Get direct assistance from the Rater core team.</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </a>
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

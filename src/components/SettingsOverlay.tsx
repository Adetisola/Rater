"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sliders, 
  User, 
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
  Edit2
} from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { UserAvatar } from './UserAvatar';
import { ConnectedAccounts } from './ConnectedAccounts';
import { showToast } from './GlobalOverlays';
import { deleteOwnAccount } from '@/lib/account/server';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export type SettingsTab = 'general' | 'account' | 'help';

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

  // Sync with searchParams on open
  useEffect(() => {
    if (isOpen) {
      const tabParam = searchParams.get('tab') as SettingsTab;
      if (tabParam && ['general', 'account', 'help'].includes(tabParam)) {
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
            <div className="hidden sm:flex flex-col w-48 border-r border-gray-100 p-3 gap-1 bg-gray-50/50 shrink-0">
              {[
                { id: 'general', label: 'General', icon: Sliders },
                { id: 'account', label: 'Account', icon: User },
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

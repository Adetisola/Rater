"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { EditPostOverlay } from './EditPostOverlay';
import { DeletePostOverlay } from './DeletePostOverlay';
import { SuspendedAccountOverlay } from './SuspendedAccountOverlay';
import { SettingsOverlay, type SettingsTab } from './SettingsOverlay';
import { InviteModal } from './InviteModal';
import { InstallAppModal } from './InstallAppModal';
import { WhatsNewModal } from './WhatsNewModal';
import { FeedbackDrawer } from './feedback/FeedbackDrawer';
import { useOverlayStore } from '@/store/overlayStore';
import { usePosts } from '../context/PostContext';
import { useAuthState, useAuthActions } from '../context/AuthContext';
import { InstallPromptUI } from './InstallPromptUI';
import { OfflineStatus } from './OfflineStatus';
import { useSearchParams } from 'next/navigation';
import type { FeedbackType } from '@/types';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

/**
 * Programmatically opens the global Feedback Drawer.
 */
export function openFeedbackDrawer(options?: { defaultType?: FeedbackType }) {
  useOverlayStore.getState().openFeedbackDrawer(options);
}

/**
 * Global singleton-like mechanism to trigger the delete confirmation overlay from anywhere in the app.
 * This function reference is updated when the GlobalOverlays component mounts.
 */
let triggerDelete: (postId: string) => void = () => {};

/**
 * Programmatically opens the delete post confirmation overlay.
 * @param postId - The ID of the post to be deleted.
 */
export function showDeleteConfirmation(postId: string) {
  triggerDelete(postId);
}

/**
 * Global singleton-like mechanism to trigger the Invite Designers overlay.
 */
let triggerInvite: () => void = () => {};

/**
 * Programmatically opens the Invite Designers overlay.
 */
export function showInviteModal() {
  triggerInvite();
}

/**
 * Global singleton-like mechanism to trigger the Install App modal overlay.
 */
let triggerInstallModal: () => void = () => {};

/**
 * Programmatically opens the Install App modal overlay.
 */
export function showInstallAppModal() {
  triggerInstallModal();
}

/**
 * Global singleton-like mechanism to trigger the undo toast notification.
 */
let triggerUndoToast: (postId: string) => void = () => {};

/**
 * Programmatically shows a toast notification offering an option to undo a post deletion.
 * @param postId - The ID of the recently deleted post.
 */
export function showUndoToast(postId: string) {
  triggerUndoToast(postId);
}

/**
 * Global singleton-like mechanism to trigger the Settings overlay.
 */
let triggerSettings: (tab?: SettingsTab) => void = () => {};

/**
 * Programmatically opens the Settings overlay to a specific tab.
 * @param tab - The tab to open ('general' | 'account' | 'help'). Defaults to 'general'.
 */
export function showSettings(tab: SettingsTab = 'general') {
  triggerSettings(tab);
}

/**
 * Global singleton-like mechanism to trigger a generic toast notification.
 */
let triggerToast: (message: string, type: ToastType) => void = () => {};

/**
 * Programmatically shows a toast notification.
 * @param message - The text to display.
 * @param type - The style of the toast ('success', 'error', 'info').
 */
export function showToast(message: string, type: ToastType = 'info') {
  triggerToast(message, type);
}

/**
 * Sub-component wrapped in Suspense to synchronize URL query parameters (?settings=true)
 */
function SettingsUrlSync({ onOpen }: { onOpen: (tab: SettingsTab) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('settings') === 'true') {
      const tab = (searchParams.get('tab') as SettingsTab) || 'general';
      onOpen(tab);
    }
  }, [searchParams, onOpen]);

  return null;
}

const CURRENT_WHATS_NEW_VERSION = '1.2.2';
const WHATS_NEW_STORAGE_KEY = 'rater_whats_new_seen_version';

/**
 * A root-level component responsible for rendering globally accessible UI overlays.
 * Includes modals (Edit/Delete post, Settings), install prompts, offline status indicators, 
 * and floating toast notifications (like Undo delete and generic messages).
 * Needs to be rendered near the top of the application tree.
 */
export function GlobalOverlays() {
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [undoPostId, setUndoPostId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { undoDelete } = usePosts();
  const { isSuspended } = useAuthState();
  const { dismissSuspendedNotice } = useAuthActions();

  // Check if browser has not yet dismissed What's New for current version
  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
      if (seenVersion !== CURRENT_WHATS_NEW_VERSION) {
        const timer = setTimeout(() => {
          setIsWhatsNewOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } catch {
      // Gracefully handle restricted storage environments
    }
  }, []);

  const handleDismissWhatsNew = useCallback(() => {
    setIsWhatsNewOpen(false);
    try {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_WHATS_NEW_VERSION);
    } catch {}
  }, []);

  const handleLearnMoreWhatsNew = useCallback(() => {
    handleDismissWhatsNew();
    triggerSettings('about');
  }, [handleDismissWhatsNew]);

  const handleOpenSettings = useCallback((tab: SettingsTab = 'general') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('settings')) {
        url.searchParams.delete('settings');
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  useEffect(() => {
    triggerDelete = (id: string) => setDeletePostId(id);
    triggerInvite = () => setIsInviteOpen(true);
    triggerInstallModal = () => setIsInstallOpen(true);
    
    triggerUndoToast = (id: string) => {
      setUndoPostId(id);
      // Auto hide after 8 seconds
      setTimeout(() => setUndoPostId(prev => prev === id ? null : prev), 8000);
    };

    triggerSettings = (tab: SettingsTab = 'general') => {
      handleOpenSettings(tab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('settings', 'true');
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      }
    };

    triggerToast = (message: string, type: ToastType) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      
      // Auto hide generic toasts after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
  }, [handleOpenSettings]);

  const handleUndo = async () => {
    if (undoPostId) {
      try {
        await undoDelete(undoPostId);
      } catch (err: any) {
        showToast(err.userMessage || err.message || "Failed to undo delete", "error");
      }
      setUndoPostId(null);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <Suspense fallback={null}>
        <SettingsUrlSync onOpen={handleOpenSettings} />
      </Suspense>

      <EditPostOverlay />
      <DeletePostOverlay postId={deletePostId} onClose={() => setDeletePostId(null)} />
      <SuspendedAccountOverlay isOpen={isSuspended} onClose={dismissSuspendedNotice} />
      <SettingsOverlay isOpen={isSettingsOpen} initialTab={settingsTab} onClose={handleCloseSettings} />
      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <InstallAppModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={handleDismissWhatsNew}
        onLearnMore={handleLearnMoreWhatsNew}
      />
      <FeedbackDrawer />
      <InstallPromptUI />
      <OfflineStatus />
      
      {/* Toast Notifications Container */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 flex flex-col items-center gap-3 pointer-events-none w-[calc(100vw-2rem)] sm:w-auto max-w-md">
        <AnimatePresence mode="popLayout">
          {/* Undo Toast */}
          {undoPostId && (
            <motion.div
              key={`undo-${undoPostId}`}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="flex items-center gap-4 px-6 py-4 bg-surface-elevated text-text-primary rounded-2xl shadow-elevated border border-border-default pointer-events-auto w-max max-w-full"
            >
              <span className="text-sm font-medium">Work removed</span>
              <div className="w-px h-4 bg-border-subtle" />
              <button 
                onClick={handleUndo}
                className="text-sm font-bold text-primary hover:text-[#FFD342] transition-colors"
              >
                Undo
              </button>
              <button 
                onClick={() => setUndoPostId(null)}
                className="p-1 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Generic Toasts */}
          {toasts.map((toast) => {
            const isError = toast.type === 'error';
            const isSuccess = toast.type === 'success';
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-elevated pointer-events-auto w-max max-w-full
                  ${isError ? 'bg-red-500 text-white' : isSuccess ? 'bg-emerald-600 text-white' : 'bg-surface-elevated text-text-primary border border-border-default'}`}
              >
                {isError && <AlertCircle className="w-5 h-5 shrink-0" />}
                {isSuccess && <CheckCircle className="w-5 h-5 shrink-0" />}
                {!isError && !isSuccess && <Info className="w-5 h-5 shrink-0" />}
                
                <span className="text-sm font-medium">{toast.message}</span>
                
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="p-1 ml-2 hover:bg-surface-hover rounded-full transition-colors opacity-80 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}


"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { EditPostOverlay } from './EditPostOverlay';
import { DeletePostOverlay } from './DeletePostOverlay';
import { SuspendedAccountOverlay } from './SuspendedAccountOverlay';
import { usePosts } from '../context/PostContext';
import { useAuthState, useAuthActions } from '../context/AuthContext';
import { InstallPromptUI } from './InstallPromptUI';
import { OfflineStatus } from './OfflineStatus';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
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
 * A root-level component responsible for rendering globally accessible UI overlays.
 * Includes modals (Edit/Delete post), install prompts, offline status indicators, 
 * and floating toast notifications (like Undo delete and generic messages).
 * Needs to be rendered near the top of the application tree.
 */
export function GlobalOverlays() {
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [undoPostId, setUndoPostId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { undoDelete } = usePosts();
  const { isSuspended } = useAuthState();
  const { dismissSuspendedNotice } = useAuthActions();

  useEffect(() => {
    triggerDelete = (id: string) => setDeletePostId(id);
    
    triggerUndoToast = (id: string) => {
      setUndoPostId(id);
      // Auto hide after 8 seconds
      setTimeout(() => setUndoPostId(prev => prev === id ? null : prev), 8000);
    };

    triggerToast = (message: string, type: ToastType) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      
      // Auto hide generic toasts after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
  }, []);

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
      <EditPostOverlay />
      <DeletePostOverlay postId={deletePostId} onClose={() => setDeletePostId(null)} />
      <SuspendedAccountOverlay isOpen={isSuspended} onClose={dismissSuspendedNotice} />
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
              className="flex items-center gap-4 px-6 py-4 bg-[#111111] text-white rounded-2xl shadow-2xl border border-white/10 pointer-events-auto w-max max-w-full"
            >
              <span className="text-sm font-medium">Work removed</span>
              <div className="w-px h-4 bg-white/20" />
              <button 
                onClick={handleUndo}
                className="text-sm font-bold text-primary hover:text-[#FFD342] transition-colors"
              >
                Undo
              </button>
              <button 
                onClick={() => setUndoPostId(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 opacity-50" />
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
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl pointer-events-auto text-white w-max max-w-full
                  ${isError ? 'bg-red-500' : isSuccess ? 'bg-green-500' : 'bg-[#111111]'}`}
              >
                {isError && <AlertCircle className="w-5 h-5 shrink-0" />}
                {isSuccess && <CheckCircle className="w-5 h-5 shrink-0" />}
                {!isError && !isSuccess && <Info className="w-5 h-5 shrink-0" />}
                
                <span className="text-sm font-medium">{toast.message}</span>
                
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="p-1 ml-2 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 opacity-80" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}


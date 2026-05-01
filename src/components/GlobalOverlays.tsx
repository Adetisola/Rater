"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { EditPostOverlay } from './EditPostOverlay';
import { DeletePostOverlay } from './DeletePostOverlay';
import { usePosts } from '../context/PostContext';

// Global singleton-like mechanism to trigger delete overlay from anywhere
let triggerDelete: (postId: string) => void = () => {};

export function showDeleteConfirmation(postId: string) {
  triggerDelete(postId);
}

let triggerUndoToast: (postId: string) => void = () => {};

export function showUndoToast(postId: string) {
  triggerUndoToast(postId);
}

export function GlobalOverlays() {
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [undoPostId, setUndoPostId] = useState<string | null>(null);
  const { undoDelete } = usePosts();

  useEffect(() => {
    triggerDelete = (id: string) => setDeletePostId(id);
    triggerUndoToast = (id: string) => {
      setUndoPostId(id);
      // Auto hide after 8 seconds
      setTimeout(() => setUndoPostId(prev => prev === id ? null : prev), 8000);
    };
  }, []);

  const handleUndo = async () => {
    if (undoPostId) {
      await undoDelete(undoPostId);
      setUndoPostId(null);
    }
  };

  return (
    <>
      <EditPostOverlay />
      <DeletePostOverlay postId={deletePostId} onClose={() => setDeletePostId(null)} />
      
      {/* Undo Toast */}
      <AnimatePresence>
        {undoPostId && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 flex items-center gap-4 px-6 py-4 bg-[#111111] text-white rounded-2xl shadow-2xl border border-white/10"
          >
            <span className="text-sm font-medium">Post deleted</span>
            <div className="w-px h-4 bg-white/20" />
            <button 
              onClick={handleUndo}
              className="text-sm font-bold text-[#FEC312] hover:text-[#FFD342] transition-colors"
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
      </AnimatePresence>
    </>
  );
}

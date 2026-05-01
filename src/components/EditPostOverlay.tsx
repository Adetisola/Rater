"use client";

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PostForm } from './PostForm';
import { usePosts } from '../context/PostContext';
import { useEffect, useState } from 'react';

export function EditPostOverlay() {
  const { editingPost, setEditingPost } = usePosts();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safety guard: reject deleted posts from being edited
  useEffect(() => {
    if (editingPost?.is_deleted) {
      setEditingPost(null);
    }
  }, [editingPost, setEditingPost]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {editingPost && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop */}
          <div
            onClick={() => setEditingPost(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 md:p-12">
                <PostForm 
                  initialPost={editingPost} 
                  isOverlay 
                  onSuccess={() => setEditingPost(null)} 
                  onCancel={() => setEditingPost(null)} 
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

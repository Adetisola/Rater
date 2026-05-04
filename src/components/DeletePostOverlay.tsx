"use client";

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Trash2, X } from 'lucide-react';
import { usePosts } from '../context/PostContext';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { showUndoToast } from './GlobalOverlays';

interface DeletePostOverlayProps {
  postId: string | null;
  onClose: () => void;
}

export function DeletePostOverlay({ postId, onClose }: DeletePostOverlayProps) {
  const { deletePost } = usePosts();
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset deleting state when overlay opens with a new/same postId
  useEffect(() => {
    if (postId) {
      setIsDeleting(false);
    }
  }, [postId]);

  if (!mounted) return null;

  const handleDelete = async () => {
    if (!postId) return;
    setIsDeleting(true);
    const success = await deletePost(postId);
    if (success) {
      // If we are on the post detail page, redirect to browse
      if (pathname.includes(`/app/post/${postId}`)) {
        window.dispatchEvent(new Event('app-navigation-start'));
        router.push('/app/browse', { scroll: false });
      }
      onClose();
      showUndoToast(postId);
    } else {
      setIsDeleting(false);
      alert("Failed to delete post.");
    }
  };

  return createPortal(
    <AnimatePresence>
      {postId && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-semibold text-[#111111] mb-2">Delete this Post?</h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                This action can be undone briefly from the notification that appears after deletion.
              </p>

              <div className="flex flex-col gap-3">
                <Button 
                  variant="primary" 
                  className="h-12 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-all active:scale-95"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Post"}
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-12 rounded-full text-gray-500 font-semibold"
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

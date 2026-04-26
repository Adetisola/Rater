"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

interface FullscreenAvatarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  name: string;
}

export function FullscreenAvatarOverlay({ isOpen, onClose, avatarUrl, name }: FullscreenAvatarOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-avatar.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(avatarUrl, '_blank');
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          {/* Backdrop - Matching SharePostOverlay style */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Main Content Overlay - Pure Image without border/name */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg aspect-square rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
                src={avatarUrl} 
                className="w-full h-full object-cover select-none"
                alt={name}
            />
            
            {/* Action Button - Matching Post Detail Page style */}
            <div className="absolute top-6 right-6 z-20">
                <button 
                    onClick={handleDownload}
                    className="w-11 h-11 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all group"
                    title="Download Avatar"
                >
                    <Download className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#111111]" />
                </button>
            </div>
            
            {/* Subtle Overlay gradient to make the button pop if image is light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-black/10 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

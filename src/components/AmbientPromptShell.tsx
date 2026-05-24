'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AmbientPromptShellProps {
  isVisible: boolean;
  onDismiss: () => void;
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  className?: string;
}

export function AmbientPromptShell({
  isVisible,
  onDismiss,
  icon,
  title,
  description,
  actionButton,
  className = '',
}: AmbientPromptShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed bottom-4 left-4 right-4 bg-zinc-900 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-4 z-100 ${className}`}
        >
          <div className="flex items-center gap-3.5">
            {icon && (
              <div className="shrink-0">
                {icon}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-[15px] sm:text-base leading-snug">{title}</span>
              <span className="text-zinc-400 text-[12px] sm:text-[13px] mt-0.5 leading-normal">{description}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 sm:gap-2">
            {actionButton}
            <button 
              onClick={onDismiss}
              className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center shrink-0"
              aria-label="Dismiss prompt"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

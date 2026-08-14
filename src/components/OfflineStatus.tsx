"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

/**
 * Global component that listens to network connection changes
 * and displays an animated toast notification when the user goes offline.
 */
export function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 flex flex-row items-center gap-4 px-6 py-4 bg-[#111111] text-white rounded-2xl shadow-2xl border border-white/10 w-max max-w-[400px]"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 shrink-0">
            <WifiOff className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-base font-semibold">No internet connection</span>
            <span className="text-sm font-medium text-white/60">Changes will sync when reconnected.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

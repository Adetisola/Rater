"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState } from '@/context/AuthContext';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationPopover } from './NotificationPopover';
import { NotificationSheet } from './NotificationSheet';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { currentProfile } = useAuthState();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    activeFilter,
    fetchInitial,
    setActiveFilter,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
  } = useNotificationStore();

  // Screen width detector
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch initial notifications and subscribe to Supabase Realtime channel
  useEffect(() => {
    if (!currentProfile?.id) return;

    fetchInitial(currentProfile.id);
    const unsubscribe = subscribeToRealtime(currentProfile.id);

    return () => {
      unsubscribe();
    };
  }, [currentProfile?.id, fetchInitial, subscribeToRealtime]);

  if (!currentProfile) return null;

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          "relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 ease-out shrink-0",
          isOpen
            ? "bg-surface-interactive text-text-primary"
            : "bg-surface-primary border border-border-default hover:bg-surface-hover text-text-secondary hover:text-text-primary"
        )}
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105 active:scale-95" />

        {/* Pulsing Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-canvas shadow-xs leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Desktop Popover */}
      {!isMobile && (
        <NotificationPopover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={() => markAllAsRead(currentProfile.id)}
        />
      )}

      {/* Mobile Drawer Sheet */}
      {isMobile && (
        <NotificationSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={() => markAllAsRead(currentProfile.id)}
        />
      )}
    </div>
  );
}

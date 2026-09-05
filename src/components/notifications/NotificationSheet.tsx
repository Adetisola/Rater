"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Settings, ExternalLink, Loader2 } from 'lucide-react';
import type { Notification } from '@/types';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { showSettings } from '../GlobalOverlays';
import { cn } from '@/lib/utils';

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  activeFilter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationSheet({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  activeFilter,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-150 md:hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Sheet Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-surface-elevated rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden z-10 border-t border-border-default"
        >
          {/* Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-border-strong rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg text-text-primary tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="p-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors flex items-center gap-1 font-semibold"
                >
                  <CheckCheck size={16} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  showSettings('notifications');
                }}
                className="w-9 h-9 rounded-full bg-surface-interactive hover:bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Notification settings"
              >
                <Settings size={17} />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-surface-interactive hover:bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-6 py-3 bg-surface-elevated border-b border-border-subtle shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200",
                activeFilter === 'all'
                  ? "bg-primary/10 border-primary/40 text-text-primary font-semibold"
                  : "bg-surface-primary border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('unread')}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5",
                activeFilter === 'unread'
                  ? "bg-primary/10 border-primary/40 text-text-primary font-semibold"
                  : "bg-surface-primary border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
              )}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Scrollable Notification List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 min-h-[220px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <Loader2 className="w-7 h-7 animate-spin mb-2 text-primary" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <NotificationEmptyState filter={activeFilter} onCloseParent={onClose} />
            ) : (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onRead={onMarkAsRead}
                  onCloseParent={onClose}
                />
              ))
            )}
          </div>

          {/* Footer Link to Full Page */}
          <div className="p-4 border-t border-border-subtle bg-surface-subtle text-center shrink-0">
            <Link
              href="/notifications"
              onClick={onClose}
              className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-surface-interactive hover:bg-surface-hover border border-border-default text-xs font-semibold text-text-primary gap-1.5 transition-colors"
            >
              <span>View full notification history</span>
              <ExternalLink size={13} className="opacity-60" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

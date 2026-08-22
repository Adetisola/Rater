"use client";

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, Settings, ExternalLink, Loader2 } from 'lucide-react';
import type { Notification } from '@/types';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { showSettings } from '../GlobalOverlays';
import { cn } from '@/lib/utils';

interface NotificationPopoverProps {
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

export function NotificationPopover({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  activeFilter,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-0 top-full mt-2.5 w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100/90 overflow-hidden z-100 flex flex-col max-h-[540px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-gray-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-primary/20 text-gray-900">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1 font-medium"
                title="Mark all as read"
              >
                <CheckCheck size={15} />
                <span className="text-[11px]">Mark read</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                showSettings('notifications');
              }}
              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors"
              title="Notification settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 py-2 bg-gray-50/60 border-b border-gray-100 shrink-0 gap-1.5">
          <button
            onClick={() => onFilterChange('all')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all",
              activeFilter === 'all'
                ? "bg-white text-gray-900 shadow-2xs border border-gray-200/60 font-bold"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('unread')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
              activeFilter === 'unread'
                ? "bg-white text-gray-900 shadow-2xs border border-gray-200/60 font-bold"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-[160px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState filter={activeFilter} onCloseParent={onClose} />
          ) : (
            notifications.slice(0, 10).map((item) => (
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
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center shrink-0">
          <Link
            href="/notifications"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black transition-colors"
          >
            <span>View all notifications</span>
            <ExternalLink size={12} className="opacity-60" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

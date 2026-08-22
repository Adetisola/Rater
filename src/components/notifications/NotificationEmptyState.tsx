"use client";

import { BellOff, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

interface NotificationEmptyStateProps {
  filter?: 'all' | 'unread';
  onCloseParent?: () => void;
}

export function NotificationEmptyState({ filter = 'all', onCloseParent }: NotificationEmptyStateProps) {
  const isUnreadFilter = filter === 'unread';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-3xl bg-amber-50/60 border border-primary/20 flex items-center justify-center mb-4 shadow-sm">
        {isUnreadFilter ? (
          <Sparkles className="w-6 h-6 text-primary" />
        ) : (
          <BellOff className="w-6 h-6 text-gray-400" />
        )}
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-1">
        {isUnreadFilter ? 'All caught up!' : 'No notifications yet'}
      </h4>

      <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed mb-5">
        {isUnreadFilter
          ? 'You have read all your notifications. New critiques and score updates will appear here.'
          : 'Publish your craft or critique works by other creatives to start receiving feedback.'}
      </p>

      {!isUnreadFilter && (
        <div className="flex items-center gap-2">
          <Link href="/browse" onClick={onCloseParent}>
            <Button variant="outline" className="h-8 px-3 rounded-full text-xs font-semibold">
              Browse Work
            </Button>
          </Link>
          <Link href="/submit" onClick={onCloseParent}>
            <Button variant="primary" className="h-8 px-3.5 rounded-full text-xs font-semibold text-white">
              Publish Work
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

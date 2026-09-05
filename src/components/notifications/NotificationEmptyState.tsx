"use client";

import { BellOff } from 'lucide-react';
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
      {isUnreadFilter ? (
        <div className="relative w-10 h-10 mb-3.5">
          <img 
            src="/icons/rater-logo-transparent-bg-stroked.svg" 
            alt="Rater" 
            className="w-10 h-10 object-contain dark:hidden" 
          />
          <img 
            src="/icons/rater-logo-black-bg-stroked.svg" 
            alt="Rater" 
            className="w-10 h-10 object-contain hidden dark:block" 
          />
        </div>
      ) : (
        <div className="w-10 h-10 flex items-center justify-center mb-3.5">
          <BellOff className="w-6 h-6 text-text-muted" />
        </div>
      )}

      <h4 className="text-sm font-bold text-text-primary mb-1">
        {isUnreadFilter ? 'All caught up!' : 'No notifications yet'}
      </h4>

      <p className="text-xs text-text-secondary max-w-[240px] leading-relaxed mb-5">
        {isUnreadFilter
          ? 'You have read all your notifications. New critiques and score updates will appear here.'
          : 'Publish your craft or critique works by other creatives to start receiving feedback.'}
      </p>

      {!isUnreadFilter && (
        <div className="flex items-center gap-2">
          <Link href="/browse" onClick={onCloseParent}>
            <Button variant="outline" className="h-8 px-3 rounded-full text-xs font-semibold bg-surface-primary border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary">
              Browse Work
            </Button>
          </Link>
          <Link href="/submit" onClick={onCloseParent}>
            <Button variant="primary" className="h-8 px-3.5 rounded-full text-xs font-semibold text-black">
              Publish Work
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

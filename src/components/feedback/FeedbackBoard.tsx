"use client";

import { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  ChevronUp, 
  Search, 
  X, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Compass, 
  User, 
  Pin, 
  Loader2, 
  Lock, 
  MessageCircle
} from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import { useOverlayStore } from '@/store/overlayStore';
import { useAuthState } from '@/context/AuthContext';
import { Button } from '../ui/Button';
import { SelectDropdown } from '../ui/SelectDropdown';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

const VIEW_TABS = [
  { id: 'all', label: 'All Requests', icon: MessageSquare },
  { id: 'roadmap', label: 'Roadmap', icon: Compass },
  { id: 'following', label: 'Following', icon: BookmarkCheck },
  { id: 'my_feedback', label: 'My Feedback', icon: User },
] as const;

const TYPE_FILTERS = [
  'All',
  'Feature Request',
  'Improvement',
  'Bug Report',
  'General Feedback',
];

const ROADMAP_STATUSES = [
  'All',
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
  'Resolved Duplicate',
];

const SORT_OPTIONS = [
  { value: 'Most Upvoted', label: 'Most Upvoted' },
  { value: 'Newest', label: 'Newest' },
  { value: 'Recently Active', label: 'Recently Active' },
] as const;

export function FeedbackBoard() {
  const { currentProfile } = useAuthState();
  const { openFeedbackDrawer } = useOverlayStore();

  const [activeView, setActiveView] = useState<'all' | 'roadmap' | 'following' | 'my_feedback'>('all');
  const [activeType, setActiveType] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'Most Upvoted' | 'Newest' | 'Recently Active'>('Most Upvoted');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    feedback,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    toggleVote,
    toggleFollow,
  } = useFeedback({
    type: activeType,
    status: activeStatus,
    category: 'All',
    searchQuery: debouncedSearch,
    sortBy,
    view: activeView,
  });

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = parseISO(isoString);
      if (!isValid(date)) return '';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Primary Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-950 tracking-tight flex items-center gap-2">
            <span>Product Feedback & Roadmap</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
            Help shape Rater. Submit ideas, upvote community requests, and follow development.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => openFeedbackDrawer()}
          className="h-8 sm:h-10 px-3 sm:px-4 rounded-full text-xs sm:text-[13px] font-medium flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus size={15} />
          <span>Share Feedback</span>
        </Button>
      </div>

      {/* 2. Primary Navigation Views */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/70 rounded-full overflow-x-auto scrollbar-hide flex-nowrap shrink-0">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveView(tab.id);
                if (tab.id === 'roadmap' && activeStatus === 'All') {
                  setActiveStatus('Planned');
                } else if (tab.id !== 'roadmap' && activeStatus !== 'All') {
                  setActiveStatus('All');
                }
              }}
              className={cn(
                "flex-1 py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-full text-xs sm:text-[13px] font-medium md:font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap shrink-0",
                isActive
                  ? "bg-white text-black"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon size={14} className={isActive ? "text-primary" : "text-gray-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex items-center gap-2 bg-white p-2.5 sm:p-3.5 rounded-2xl border border-gray-100">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback ideas..."
            className="w-full h-8 sm:h-9 bg-gray-50/80 border border-gray-200/70 rounded-xl pl-8 pr-7 text-xs sm:text-[13px] font-medium text-gray-950 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <SelectDropdown
          label="Sort:"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(val) => setSortBy(val as any)}
          size="sm"
        />
      </div>

      {/* 4. Secondary Filter Pills (Type & Roadmap Status) */}
      <div className="flex flex-col gap-2.5">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_FILTERS.map((t) => {
            const isSelected = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                  isSelected
                    ? "bg-primary/10 border-primary/40 text-black"
                    : "bg-white border-gray-200/70 text-gray-500 hover:border-gray-300 hover:text-black"
                )}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Roadmap Status Pills (Visible in Roadmap view or when filtering statuses) */}
        {activeView === 'roadmap' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Status:</span>
            {ROADMAP_STATUSES.map((s) => {
              const isSelected = activeStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveStatus(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                    isSelected
                      ? "bg-black text-white border-black"
                      : "bg-white border-gray-200/70 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Main Feed Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-gray-100 flex items-start gap-4 animate-pulse"
            >
              <div className="w-12 h-14 bg-gray-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="flex gap-2 pt-1">
                  <div className="h-5 w-16 bg-gray-100 rounded" />
                  <div className="h-5 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeView === 'following' && !currentProfile ? (
        /* Logged out Following state */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <BookmarkCheck size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-gray-950">Sign in to view followed requests</h3>
            <p className="text-xs sm:text-[13px] text-gray-500 max-w-sm mx-auto">
              Follow feature requests to receive instant notifications when the team changes their status or posts official responses.
            </p>
          </div>
          <Link href="/auth">
            <Button variant="primary" className="h-9 px-4 rounded-xl text-xs font-bold shadow-2xs">
              Sign In
            </Button>
          </Link>
        </div>
      ) : activeView === 'my_feedback' && !currentProfile ? (
        /* Logged out My Feedback state */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <User size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-gray-950">Sign in to view your feedback</h3>
            <p className="text-xs sm:text-[13px] text-gray-500 max-w-sm mx-auto">
              Track the ideas and bug reports you&apos;ve shared with the Rater community.
            </p>
          </div>
          <Link href="/auth">
            <Button variant="primary" className="h-9 px-4 rounded-xl text-xs font-bold shadow-2xs">
              Sign In
            </Button>
          </Link>
        </div>
      ) : feedback.length === 0 ? (
        /* Empty Results state */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <MessageSquare size={26} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-medium text-gray-950">No feedback requests found</h3>
            <p className="text-xs sm:text-[13px] text-gray-500 max-w-sm mx-auto">
              {debouncedSearch
                ? `No requests matching "${debouncedSearch}". Try a different keyword.`
                : activeView === 'following'
                ? "You haven't followed any requests yet. Click the follow button on any request to stay updated."
                : activeView === 'my_feedback'
                ? "You haven't submitted any feedback requests yet."
                : "Be the first to share an idea in this category!"}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => openFeedbackDrawer()}
            className="h-9 px-4 rounded-full text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Share Feedback</span>
          </Button>
        </div>
      ) : (
        /* Feedback Card List */
        <div className="space-y-3">
          {feedback.map((item) => {
            const isCompleted = item.status === 'Completed';
            const isPlanned = item.status === 'Planned';
            const isInProgress = item.status === 'In Progress';
            const isUnderReview = item.status === 'Under Review';
            const isDuplicate = item.status === 'Resolved Duplicate';
            const isDeclined = item.status === 'Declined';

            return (
              <div
                key={item.id}
                className={cn(
                  "p-3.5 sm:p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200/90 transition-all shadow-2xs flex items-start gap-3 sm:gap-4.5 group",
                  item.is_pinned && "border-amber-200/80 bg-amber-50/20"
                )}
              >
                {/* Upvote Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.id) toggleVote(item.id);
                  }}
                  className={cn(
                    "w-9 sm:w-12 py-1.5 sm:py-2 rounded-xl flex flex-col items-center justify-center border transition-all shrink-0 select-none",
                    item.has_voted
                      ? "bg-amber-50 border-primary/50 text-black font-bold shadow-2xs"
                      : "bg-white border-gray-200/70 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  )}
                  aria-label={`Upvote request (${item.upvote_count || 0} votes)`}
                >
                  <ChevronUp
                    size={15}
                    strokeWidth={3}
                    className={cn("transition-transform group-hover:-translate-y-0.5", item.has_voted ? "text-primary" : "")}
                  />
                  <span className="text-[11px] sm:text-xs font-bold mt-0.5">{item.upvote_count || 0}</span>
                </button>

                {/* Main Card Content */}
                <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                      <Link
                        href={`/feedback/${item.slug}`}
                        className="text-xs sm:text-base font-semibold text-gray-950 hover:text-black hover:underline transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs sm:text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Follow / Unfollow Action */}
                    <button
                      type="button"
                      onClick={() => {
                        if (item.id) toggleFollow(item.id);
                      }}
                      className={cn(
                        "h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all shrink-0",
                        item.is_following
                          ? "bg-amber-50 border-amber-200/70 text-amber-900"
                          : "bg-white border-gray-200/70 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      title={item.is_following ? "Following (click to unfollow)" : "Follow request"}
                    >
                      {item.is_following ? (
                        <>
                          <BookmarkCheck size={12} className="text-primary" />
                          <span className="hidden sm:inline">Following</span>
                        </>
                      ) : (
                        <>
                          <Bookmark size={12} />
                          <span className="hidden sm:inline">Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {/* Pinned Badge */}
                    {item.is_pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                        <Pin size={10} />
                        <span>Pinned</span>
                      </span>
                    )}

                    {/* Locked Badge */}
                    {item.is_locked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                        <Lock size={10} />
                        <span>Locked</span>
                      </span>
                    )}

                    {/* Status Pill */}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        isPlanned && "bg-blue-50 text-blue-700 border-blue-200/60",
                        isInProgress && "bg-purple-50 text-purple-700 border-purple-200/60",
                        isCompleted && "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                        isUnderReview && "bg-amber-50 text-amber-800 border-amber-200/60",
                        isDeclined && "bg-red-50 text-red-700 border-red-200/60",
                        isDuplicate && "bg-gray-100 text-gray-600 border-gray-200/60",
                        (!item.status || item.status === 'New') && "bg-gray-50 text-gray-600 border-gray-200/60"
                      )}
                    >
                      {item.status || 'New'}
                    </span>

                    {/* Category Chip */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                      {item.category}
                    </span>

                    {/* Official Response Indicator */}
                    {item.official_response && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-primary/20">
                        <Sparkles size={11} className="text-primary" />
                        <span>Team Response</span>
                      </span>
                    )}

                    {/* Author Metadata */}
                    {item.author && (
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        by <span className="font-semibold text-gray-600">{item.author.name}</span>
                      </span>
                    )}

                    {/* Relative Timestamp */}
                    <span className="text-[11px] text-gray-400">
                      {formatRelativeTime(item.created_at)}
                    </span>

                    {/* Comment Count */}
                    <Link
                      href={`/feedback/${item.slug}#comments`}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>{item.comment_count || 0}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 6. Cursor-Based Load More */}
          {hasMore && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                disabled={isLoadingMore}
                onClick={loadMore}
                className="h-10 px-6 rounded-xl text-xs sm:text-[13px] font-semibold flex items-center gap-2 shadow-2xs"
              >
                {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
                <span>{isLoadingMore ? "Loading more requests..." : "Load More Requests"}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

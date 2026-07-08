"use client";

import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../hooks/useBadges';
import { useHotPosts } from '../hooks/useHotPosts';
import { MasonryGrid } from './MasonryGrid';
import type { Post } from '@/types';
import { cn } from '../lib/utils';
import { Grid, User } from 'lucide-react';

interface RelatedSectionProps {
  currentPost: Post;
}

type TabType = 'related' | 'creator';

export function RelatedSection({ currentPost }: RelatedSectionProps) {
  const { posts } = usePosts();
  const { profileMap } = useAuth();

  const creator = profileMap[currentPost.avatar_id];
  const creatorName = creator?.name || 'Creator';

  // 1. Compute Category-based related posts (Tab 1)
  const relatedPosts = useMemo(() => {
    return posts
      .filter((p) => p.category === currentPost.category && p.id !== currentPost.id && !p.is_deleted)
      .sort((a, b) => {
        // Prioritize same creator within the same category
        const aIsCreator = a.avatar_id === currentPost.avatar_id ? 1 : 0;
        const bIsCreator = b.avatar_id === currentPost.avatar_id ? 1 : 0;
        if (bIsCreator !== aIsCreator) {
          return bIsCreator - aIsCreator;
        }
        // Tie-breaker: Newer designs first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 12);
  }, [posts, currentPost]);

  // 2. Compute Creator-based portfolio posts (Tab 2)
  const creatorPosts = useMemo(() => {
    return posts
      .filter((p) => p.avatar_id === currentPost.avatar_id && p.id !== currentPost.id && !p.is_deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12);
  }, [posts, currentPost]);

  // State to hold the active tab
  const [activeTab, setActiveTab] = useState<TabType>('related');

  // Sync state if category changes dynamically (e.g. on swiping or route nav)
  useEffect(() => {
    if (relatedPosts.length > 0) {
      setActiveTab('related');
    } else if (creatorPosts.length > 0) {
      setActiveTab('creator');
    }
  }, [currentPost.id, relatedPosts.length, creatorPosts.length]);

  const hasRelated = relatedPosts.length > 0;
  const hasCreator = creatorPosts.length > 0;

  // Clean fallback: If both streams are empty, keep the UI minimal by hiding the section
  if (!hasRelated && !hasCreator) {
    return null;
  }

  // Determine active posts for the selected view
  const activePosts = activeTab === 'related' ? relatedPosts : creatorPosts;

  // Compute badges and hot status map globally based on all available posts
  const { badgeMap } = useBadges(posts);
  const { hotPostIds } = useHotPosts(posts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pt-10 mt-10"
    >
      {/* Interactive Tabs / Fallback Header */}
      {hasRelated && hasCreator ? (
        // Both feeds exist: Render interactive tactile tabs matching profile tabs style
        <div className="border-b border-gray-100 mb-12 flex justify-center md:justify-start gap-8 px-2 xs:px-2 md:px-4">
          <button
            onClick={() => setActiveTab('related')}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-sm font-medium tracking-wider transition-all cursor-pointer select-none",
              activeTab === 'related'
                ? "border-[#111111] text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <Grid className="w-4 h-4" />
            Related
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-sm font-medium tracking-wider transition-all cursor-pointer select-none",
              activeTab === 'creator'
                ? "border-[#111111] text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <User className="w-4 h-4" />
            More from {creatorName}
          </button>
        </div>
      ) : hasRelated ? (
        // Only category posts exist: Render static "More Like This" header
        <h2 className="text-xl font-semibold text-black mb-8 px-2 xs:px-2 md:px-4 select-none">
          Related
        </h2>
      ) : (
        // Only creator posts exist: Render static "More from Creator" header
        <h2 className="text-xl font-semibold text-black mb-8 px-2 xs:px-2 md:px-4 select-none">
          More from {creatorName}
        </h2>
      )}

      {/* Smooth AnimatePresence cross-fade as the user toggles tabs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + '_' + currentPost.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <MasonryGrid
            posts={activePosts}
            badgeMap={badgeMap}
            hotPostIds={hotPostIds}
            maxColumns={4}
          />
        </motion.div>
      </AnimatePresence>

      {/* Feed termination indicator matching Browse page style */}
      <div className="w-full flex flex-col items-center justify-center py-12 border-t border-gray-50 mt-10">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mb-4" />
        <p className="text-[12px] font-semibold text-gray-400 tracking-wider select-none">
          You've reached the end of the feed
        </p>
      </div>
    </motion.div>
  );
}

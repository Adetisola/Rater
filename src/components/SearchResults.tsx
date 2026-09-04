"use client";

import type { Avatar, Category, Post } from '@/types';
import type { SectionedSearchResults, HighlightSegment, PostSearchResult } from '../logic/searchUtils';
import { highlightMatches } from '../logic/searchUtils';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowUpRight, Folder } from 'lucide-react';
import { useAuthState } from '../context/AuthContext';
import { usePostStore } from '../store/postStore';
import type { RecentItemData } from '../hooks/useRecentSearches';
import { UserAvatar } from './UserAvatar';
import { PostThumbnail } from './PostThumbnail';
import Link from 'next/link';

export interface SearchResultsProps {
  results: SectionedSearchResults;
  suggestions?: string[];
  searchQuery?: string;
  isVisible: boolean;
  onAvatarClick: (avatar: Avatar) => void;
  onPostClick: (post: Post) => void;
  onCategoryClick: (category: Category) => void;
  onClose: () => void;
  onSoftClose?: () => void;
  recentMode?: boolean;
  recentItems?: RecentItemData[];
  onRecentSearchClick?: (query: string) => void;
  onPopulateSearch?: (query: string) => void;
  onRemoveRecentItem?: (index: number) => void;
  onClearRecent?: () => void;
}

// Curated exploration chips for empty state & no-result recovery
const POPULAR_EXPLORE_CATEGORIES: Category[] = [
  'Web Design',
  'Mobile App Design',
  'Brand Identity Design',
  'Logo Design',
  'Typography Design',
  'Poster Design',
  'Illustration',
  '3D Design',
];

const TRENDING_FEEDBACK_TOPICS = [
  'Landing page feedback',
  'Mobile app UX audit',
  'Brand identity review',
  'Clean minimal typography',
  'SaaS dashboard design',
  'Portfolio review',
];

export function SearchResults({ 
  results, 
  suggestions = [],
  searchQuery = '',
  isVisible, 
  onAvatarClick,
  onPostClick,
  onCategoryClick,
  onClose,
  onSoftClose,
  recentMode = false,
  recentItems = [],
  onRecentSearchClick,
  onPopulateSearch,
  onRemoveRecentItem,
  onClearRecent,
}: SearchResultsProps) {
  const { profileMap } = useAuthState();
  const allPosts = usePostStore(state => state.posts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasEntityResults = results.avatars.length > 0 || results.posts.length > 0 || results.categories.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const isNoResults = !recentMode && searchQuery.trim().length >= 2 && !hasEntityResults && !hasSuggestions;

  if (!isVisible || !mounted) {
    return null;
  }

  return (
    <>
      {/* Backdrop for page-wide clicks - soft close */}
      {createPortal(
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            (onSoftClose || onClose)();
          }}
          aria-hidden="true"
        />,
        document.body
      )}
      
      {/* Results Dropdown Container */}
      <div 
        className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-elevated rounded-2xl sm:rounded-3xl shadow-2xl border border-border-default overflow-hidden max-h-[75vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* [ 1. EMPTY STATE / HYBRID HUB ]                                           */}
        {/* ========================================================================= */}
        {recentMode ? (
          <div className="divide-y divide-border-subtle">
            {/* Recent Searches Section */}
            {recentItems.length > 0 && (
              <div>
                <div className="px-4 sm:px-5 py-3 bg-surface-subtle flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary tracking-wider">Recent Searches</span>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onClearRecent?.();
                    }}
                    className="text-xs font-semibold text-text-muted hover:text-red-500 transition-colors px-2 py-1 rounded-full hover:bg-red-500/10"
                  >
                    Clear all
                  </button>
                </div>
                <div className="p-2 sm:p-2.5">
                  {recentItems.map((item, index) => {
                    const removeBtn = (
                      <button
                        onMouseDown={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          onRemoveRecentItem?.(index); 
                        }}
                        className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0 ml-1"
                        aria-label="Remove search item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    );

                    if (item.type === 'search') {
                      return (
                        <div key={`rec-search-${item.query}`} className="flex items-center group rounded-xl hover:bg-surface-hover transition-colors">
                          <div
                            onMouseDown={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              onRecentSearchClick?.(item.query); 
                            }}
                            className="flex-1 min-w-0 p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-surface-interactive flex items-center justify-center shrink-0 text-text-muted">
                              <Search className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <span className="font-medium text-sm text-text-primary truncate">{item.query}</span>
                              <span className="text-[11px] font-semibold text-text-muted">Search</span>
                            </div>
                          </div>
                          {removeBtn}
                        </div>
                      );
                    }

                    if (item.type === 'avatar') {
                      const avatar = profileMap[item.avatarId];
                      if (!avatar) return null;
                      return (
                        <div key={`rec-av-${item.avatarId}`} className="flex items-center group rounded-xl hover:bg-surface-hover transition-colors">
                          <div className="flex-1 min-w-0" onMouseDown={() => onAvatarClick(avatar)}>
                            <AvatarResultItem avatar={avatar} onClick={() => onAvatarClick(avatar)} />
                          </div>
                          {removeBtn}
                        </div>
                      );
                    }

                    if (item.type === 'post') {
                      const postObj = allPosts[item.postId];
                      if (!postObj) return null;
                      return (
                        <div key={`rec-post-${item.postId}`} className="flex items-center group rounded-xl hover:bg-surface-hover transition-colors">
                          <div className="flex-1 min-w-0" onMouseDown={() => onPostClick(postObj)}>
                            <PostResultItem result={{ post: postObj, matches: [], score: 1 }} onClick={() => onPostClick(postObj)} />
                          </div>
                          {removeBtn}
                        </div>
                      );
                    }

                    if (item.type === 'category') {
                      return (
                        <div key={`rec-cat-${item.category}`} className="flex items-center group rounded-xl hover:bg-surface-hover transition-colors">
                          <div className="flex-1 min-w-0" onMouseDown={() => onCategoryClick(item.category)}>
                            <CategoryResultItem category={item.category} onClick={() => onCategoryClick(item.category)} />
                          </div>
                          {removeBtn}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Keyword Suggestions with gray pill style and no section header */}
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                {TRENDING_FEEDBACK_TOPICS.map(topic => (
                  <button
                    key={topic}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRecentSearchClick?.(topic);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-surface-interactive hover:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : isNoResults ? (
          /* ========================================================================= */
          /* [ 2. NO RESULTS RECOVERY STATE ]                                          */
          /* ========================================================================= */
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-interactive flex items-center justify-center mx-auto mb-3 text-text-muted">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-base text-text-primary mb-1">No results for "{searchQuery}"</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mb-5">
              Try searching for a different keyword or creator name, or explore these popular categories:
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {POPULAR_EXPLORE_CATEGORIES.slice(0, 6).map(cat => (
                <button
                  key={cat}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCategoryClick(cat);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-surface-interactive hover:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* [ 3. ACTIVE SEARCH RESULTS (SUGGESTIONS + CREATIVES + WORKS + CATEGORIES)]*/
          /* ========================================================================= */
          <div className="divide-y divide-border-subtle">
            {/* Top Section: Query Suggestions with Dual-Action (44px touch targets) */}
            {suggestions.length > 0 && (
              <div className="p-2 sm:p-2.5">
                {suggestions.map((sug) => (
                  <div 
                    key={`sug-${sug}`} 
                    className="flex items-center rounded-xl hover:bg-surface-hover transition-colors group"
                  >
                    {/* Primary Action: Execute Search */}
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRecentSearchClick?.(sug);
                      }}
                      className="flex-1 min-w-0 p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-text-muted shrink-0 transition-colors" />
                      <span className="font-medium text-sm text-text-primary truncate">{sug}</span>
                    </div>

                    {/* Secondary Action: Populate Input without Submitting (44px min hit area) */}
                    {onPopulateSearch && (
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onPopulateSearch(sug);
                        }}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-interactive rounded-full transition-colors shrink-0 mr-1"
                        aria-label={`Complete search with "${sug}"`}
                        title="Fill search input"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Creatives Section */}
            {results.avatars.length > 0 && (
              <div>
                <div className="px-4 sm:px-5 py-2.5 bg-surface-subtle flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary tracking-wider">Creatives</span>
                  <span className="text-[11px] font-semibold text-text-muted">{results.avatars.length} matching</span>
                </div>
                <div className="p-2 sm:p-2.5">
                  {results.avatars.map(({ avatar }) => (
                    <AvatarResultItem 
                      key={avatar.id}
                      avatar={avatar}
                      onClick={() => onAvatarClick(avatar)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Works Section */}
            {results.posts.length > 0 && (
              <div>
                <div className="px-4 sm:px-5 py-2.5 bg-surface-subtle flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary tracking-wider">Works</span>
                  <span className="text-[11px] font-semibold text-text-muted">{results.posts.length} matching</span>
                </div>
                <div className="p-2 sm:p-2.5">
                  {results.posts.map((result) => (
                    <PostResultItem 
                      key={result.post.id}
                      result={result}
                      onClick={() => onPostClick(result.post)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Categories Section */}
            {results.categories.length > 0 && (
              <div>
                <div className="px-4 sm:px-5 py-2.5 bg-surface-subtle">
                  <span className="text-xs font-semibold text-text-secondary tracking-wider">Categories</span>
                </div>
                <div className="p-2 sm:p-2.5">
                  {results.categories.map(({ category }) => (
                    <CategoryResultItem 
                      key={category}
                      category={category}
                      onClick={() => onCategoryClick(category)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// PROFILE RESULT ITEM (CREATIVES)
// ============================================================================

interface AvatarResultItemProps {
  avatar: Avatar;
  onClick: () => void;
}

function AvatarResultItem({ avatar, onClick }: AvatarResultItemProps) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-surface-hover transition-colors flex gap-3 items-center cursor-pointer"
    >
      <UserAvatar avatarUrl={avatar.avatar_url} size="xs" alt={avatar.name || avatar.username || "Creator avatar"} className="w-10 h-10 border border-border-default shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm text-text-primary">
            {avatar.name}
          </span>
          {avatar.role && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-interactive text-text-secondary">
              {avatar.role}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate mt-0.5">@{avatar.username}</p>
      </div>
    </div>
  );
}

// ============================================================================
// WORK RESULT ITEM (POSTS)
// ============================================================================

interface PostResultItemProps {
  result: PostSearchResult;
  onClick: () => void;
}

function PostResultItem({ result, onClick }: PostResultItemProps) {
  const { post, matches } = result;
  const titleSegments = highlightMatches(post.title, matches, 'title');
  const descriptionSegments = highlightMatches(post.description, matches, 'description');

  return (
    <Link
      href={`/post/${post.id}`}
      scroll={false}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-surface-hover transition-colors flex gap-3 sm:gap-4 items-center cursor-pointer"
    >
      <PostThumbnail
        imageUrl={post.image_url}
        preset="POST_SEARCH_THUMB"
        className="rounded-lg shrink-0 border border-border-default"
        alt={post.title}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-text-primary truncate">
          <HighlightedText segments={titleSegments} />
        </h4>
        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
          <HighlightedText segments={descriptionSegments} />
        </p>
      </div>
    </Link>
  );
}

// ============================================================================
// CATEGORY RESULT ITEM
// ============================================================================

interface CategoryResultItemProps {
  category: Category;
  onClick: () => void;
}

function CategoryResultItem({ category, onClick }: CategoryResultItemProps) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left p-2.5 sm:p-3 rounded-xl hover:bg-surface-hover transition-colors flex gap-3 items-center cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        <Folder className="w-4 h-4" />
      </div>
      <span className="font-semibold text-sm text-text-primary">{category}</span>
    </div>
  );
}

// ============================================================================
// HIGHLIGHTED TEXT
// ============================================================================

interface HighlightedTextProps {
  segments: HighlightSegment[];
}

function HighlightedText({ segments }: HighlightedTextProps) {
  return (
    <>
      {segments.map((segment, index) => (
        segment.isMatch ? (
          <mark 
            key={index} 
            className="bg-primary/25 text-inherit rounded-sm px-0.5 font-bold"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </>
  );
}


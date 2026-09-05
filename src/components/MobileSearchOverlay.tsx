"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ListFilter, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MobileFilterPanel } from './MobileFilterPanel';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, getQuerySuggestions, type SearchIndexes, type SectionedSearchResults } from '@/lib/algolia/search';
import type { Post, Avatar, Category } from '@/types';
import { useAuthState } from '../context/AuthContext';
import { usePostStore } from '../store/postStore';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useNavigationStore } from '../store/navigationStore';
import { Search } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { PostThumbnail } from './PostThumbnail';

// Maps internal sort keys → display labels for active filter pills
const SORT_OPTION_LABELS: Record<string, string> = {
  balanced: '✨Balanced',
  highest_rated: 'Top',
  most_reviewed: 'Hot',
  newest: 'Recent',
};

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

function MobileSearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M34.3135 0C53.2246 0.000142146 68.626 15.4024 68.626 34.3135C68.6259 42.213 65.9295 49.4921 61.4229 55.2979L80.6826 74.5576C81.0918 74.954 81.4184 75.4271 81.6445 75.9502C81.873 76.479 81.9941 77.048 82 77.624C82.0059 78.2003 81.8965 78.7722 81.6787 79.3057C81.4609 79.8392 81.1389 80.324 80.7314 80.7314C80.324 81.1389 79.8392 81.4609 79.3057 81.6787C78.7722 81.8965 78.2003 82.0059 77.624 82C77.048 81.9941 76.479 81.873 75.9502 81.6445C75.4271 81.4184 74.954 81.0908 74.5576 80.6816L55.2979 61.4229C49.4921 65.9295 42.213 68.6259 34.3135 68.626C15.4024 68.626 0.000142138 53.2246 0 34.3135C0 15.4023 15.4023 0 34.3135 0ZM34.3135 8.66309C20.1076 8.66309 8.66309 20.1076 8.66309 34.3135C8.66323 48.5192 20.1077 59.9639 34.3135 59.9639C48.5191 59.9637 59.9637 48.5191 59.9639 34.3135C59.9639 20.1077 48.5192 8.66323 34.3135 8.66309Z" fill="currentColor"/>
    </svg>
  );
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onPostSelect?: (post: Post) => void;
  onAvatarSelect?: (avatar: Avatar) => void;
  onReset?: () => void;
  searchIndexes: SearchIndexes;
  activeLayoutId?: string;
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryChange,
  onPostSelect,
  onAvatarSelect,
  onReset,
  searchIndexes,
  activeLayoutId
}: MobileSearchOverlayProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { currentProfile, profileMap } = useAuthState();
  const allPosts = usePostStore(state => state.posts);
  
  const { recentItems, addSearch, addAvatar, addPost, addCategory, removeItem, clearAll } = useRecentSearches();

  // Data state
  const [searchResults, setSearchResults] = useState<SectionedSearchResults>({ avatars: [], posts: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 200);
  const isRecentMode = debouncedQuery.trim() === '';

  // Query suggestions computation
  const recentQueryStrings = useMemo(() => {
    return recentItems.filter(i => i.type === 'search').map(i => i.query);
  }, [recentItems]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const creatorNames = searchResults.avatars.map(a => a.avatar.name);
    const postTitles = searchResults.posts.map(p => p.post.title);
    return getQuerySuggestions(searchQuery, recentQueryStrings, [], { creatorNames, postTitles }, 5);
  }, [searchQuery, recentQueryStrings, searchResults]);

  // Perform async search
  useEffect(() => {
    let isMounted = true;
    
    const doSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setSearchResults({ avatars: [], posts: [], categories: [] });
        return;
      }

      setIsSearching(true);
      const results = await searchAll(searchIndexes, debouncedQuery, {
        avatars: 5,
        posts: 10,
        categories: 5
      });

      if (isMounted) {
        setSearchResults(results);
        setIsSearching(false);
      }
    };

    doSearch();
    return () => { isMounted = false; };
  }, [debouncedQuery, searchIndexes]);

  const hasEntityResults = searchResults.avatars.length > 0 || 
                           searchResults.posts.length > 0 || 
                           searchResults.categories.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const isNoResults = !isRecentMode && debouncedQuery.trim().length >= 2 && !hasEntityResults && !hasSuggestions;

  // Lock body scroll and handle Android back button
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);

      const handlePopState = () => {
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  // Handle avatar click
  const handleAvatarClick = (avatar: Avatar) => {
    addAvatar(avatar.id);
    onClose();
    if (onAvatarSelect) {
      onAvatarSelect(avatar);
    } else {
      const href = currentProfile && avatar.id === currentProfile.id 
        ? `/@${currentProfile.username}` 
        : `/@${avatar.username}`;
      window.dispatchEvent(new Event('app-navigation-start'));
      router.push(href, { scroll: false });
    }
  };

  // Handle post click
  const handlePostClick = (post: Post, contextIds?: string[]) => {
    addPost(post.id);
    useNavigationStore.getState().setNavigationContext(contextIds || [post.id]);
    onClose();
    onPostSelect?.(post);
  };

  // Handle category click
  const handleCategoryClick = (category: Category) => {
    addCategory(category);
    onClose();
    if (!selectedCategories.includes(category)) {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (query: string) => {
    addSearch(query);
    onSearchChange(query);
    onSearchSubmit?.(query);
    onClose();
  };

  // Handle fill input (↗ arrow)
  const handlePopulateSearch = (query: string) => {
    onSearchChange(query);
    searchInputRef.current?.focus();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim().length > 0) addSearch(searchQuery.trim());
      onSearchSubmit?.(searchQuery.trim());
      searchInputRef.current?.blur();
      onClose();
    } else if (e.key === 'Escape') {
      onSearchChange('');
      onClose();
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-60 bg-surface-elevated flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 px-3 py-3 border-b border-border-default flex items-center gap-3 bg-surface-elevated z-10 shrink-0">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors shrink-0"
              aria-label="Close search"
            >
              <X size={20} className="text-current" />
            </button>

            <motion.div 
              layoutId={activeLayoutId}
              className="flex-1 relative flex items-center bg-surface-interactive rounded-full border-2 border-primary overflow-hidden focus-within:ring-4 focus-within:ring-primary/10"
              style={{ borderRadius: 9999 }}
            >
              <MobileSearchIcon 
                className={`absolute left-4 h-5 w-5 z-10 shrink-0 pointer-events-none transition-opacity text-text-muted ${isSearching ? 'opacity-30' : 'opacity-70'}`} 
              />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing to search..." 
                className="w-full h-11 pl-12 pr-10 bg-transparent font-sans text-base text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary active:bg-surface-hover transition-colors"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <button 
              onClick={() => setIsFilterOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors shrink-0"
              aria-label="Open filter settings"
            >
              <ListFilter className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {(sortBy !== 'balanced' || selectedCategories.length > 0) && (
              <div className="px-4 py-3 border-b border-border-default flex flex-wrap items-center gap-2 bg-surface-subtle">
                {sortBy !== 'balanced' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary rounded-full">
                    <span className="text-xs font-medium text-text-primary">{SORT_OPTION_LABELS[sortBy] ?? sortBy}</span>
                    <button 
                      onClick={() => onSortChange('balanced')}
                      className="w-4 h-4 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors"
                    >
                      <X className="w-2.5 h-2.5 text-black" />
                    </button>
                  </div>
                )}
                
                {selectedCategories.map(cat => (
                  <div key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-interactive border border-border-default rounded-full">
                    <span className="text-xs font-medium text-text-primary">{cat}</span>
                    <button 
                      onClick={() => {
                        const newCats = selectedCategories.filter(c => c !== cat);
                        onCategoryChange(newCats);
                      }}
                      className="w-4 h-4 flex items-center justify-center rounded-full bg-surface-hover hover:bg-border-strong transition-colors"
                    >
                      <X className="w-2.5 h-2.5 text-text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isSearching ? (
              <div className="flex items-center justify-center h-40 text-text-muted text-sm">Searching...</div>
            ) : isRecentMode ? (
              /* HYBRID HUB EMPTY STATE */
              <div className="divide-y divide-border-subtle">
                {recentItems.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-surface-subtle flex items-center justify-between">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Recent Searches</span>
                      <button 
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearAll?.();
                        }}
                        className="text-xs font-semibold text-text-muted hover:text-red-500 transition-colors px-2 py-0.5 rounded-full hover:bg-red-500/10"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="p-2">
                      {recentItems.map((item, index) => {
                        const removeBtn = (
                          <button
                            onMouseDown={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              removeItem(index); 
                            }}
                            className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all shrink-0 ml-1"
                            aria-label="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        );

                        if (item.type === 'search') {
                          return (
                            <div key={`rec-search-${item.query}`} className="flex items-center group rounded-xl hover:bg-surface-hover transition-colors">
                              <div
                                onMouseDown={(e) => { 
                                   e.preventDefault(); e.stopPropagation(); 
                                  handleSuggestionClick(item.query);
                                }}
                                className="flex-1 min-w-0 p-3 flex gap-3 items-center cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-lg bg-surface-interactive border border-border-subtle flex items-center justify-center shrink-0 text-text-muted">
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
                              <div className="flex-1 min-w-0">
                                <AvatarResultItem avatar={avatar} onClick={() => handleAvatarClick(avatar)} />
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
                              <div className="flex-1 min-w-0">
                                <PostResultItem post={postObj} onClick={() => handlePostClick(postObj, recentItems.filter(i => i.type === 'post').map(i => i.postId as string))} />
                              </div>
                              {removeBtn}
                            </div>
                          );
                        }

                        if (item.type === 'category') {
                          return (
                            <div key={`rec-cat-${item.category}`} className="flex items-center group rounded-xl hover:bg-surface-hover transition-colors">
                              <div className="flex-1 min-w-0">
                                <CategoryResultItem category={item.category} onClick={() => handleCategoryClick(item.category)} />
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
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_FEEDBACK_TOPICS.map(topic => (
                      <button
                        key={topic}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(topic);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-surface-interactive border border-border-default active:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isNoResults ? (
              /* NO RESULTS STATE */
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-interactive border border-border-default flex items-center justify-center mx-auto mb-3 text-text-muted">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-base text-text-primary mb-1">No results for "{debouncedQuery}"</h4>
                <p className="text-xs text-text-muted max-w-xs mx-auto mb-5">
                  Try searching for another keyword or creator name, or explore these categories:
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                  {POPULAR_EXPLORE_CATEGORIES.slice(0, 6).map(cat => (
                    <button
                      key={cat}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCategoryClick(cat);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-surface-interactive border border-border-default active:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors active:scale-95"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ACTIVE SUGGESTIONS & RESULTS */
              <div className="divide-y divide-border-subtle">
                {/* Query Suggestions with 44px Dual-Action */}
                {suggestions.length > 0 && (
                  <div className="p-2">
                    {suggestions.map((sug) => (
                      <div key={`m-sug-${sug}`} className="flex items-center rounded-xl hover:bg-surface-hover transition-colors group">
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSuggestionClick(sug);
                          }}
                          className="flex-1 min-w-0 p-3 flex items-center gap-3 cursor-pointer"
                        >
                          <Search className="w-4 h-4 text-text-muted shrink-0" />
                          <span className="font-medium text-sm text-text-primary truncate">{sug}</span>
                        </div>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePopulateSearch(sug);
                          }}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted active:text-text-primary hover:text-text-primary active:bg-surface-hover rounded-full transition-colors shrink-0 mr-1"
                          aria-label={`Complete search with "${sug}"`}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.categories.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-surface-subtle border-y border-border-subtle">
                      <span className="text-xs font-medium text-text-muted tracking-wide">Categories</span>
                    </div>
                    <div className="p-2">
                      {searchResults.categories.map(({ category }) => (
                        <CategoryResultItem 
                          key={category}
                          category={category}
                          onClick={() => handleCategoryClick(category)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.avatars.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-surface-subtle border-y border-border-subtle">
                      <span className="text-xs font-medium text-text-muted tracking-wide">Creatives</span>
                    </div>
                    <div className="p-2">
                      {searchResults.avatars.map(({ avatar }) => (
                        <AvatarResultItem 
                          key={avatar.id}
                          avatar={avatar}
                          onClick={() => handleAvatarClick(avatar)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.posts.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-surface-subtle border-y border-border-subtle">
                      <span className="text-xs font-medium text-text-muted tracking-wide">Works</span>
                    </div>
                    <div className="p-2">
                      {searchResults.posts.map((result) => (
                        <PostResultItem 
                          key={result.post.id}
                          post={result.post}
                          onClick={() => handlePostClick(result.post, searchResults.posts.map(r => r.post.id))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <MobileFilterPanel
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={() => setIsFilterOpen(false)} 
            sortBy={sortBy}
            onSortChange={onSortChange}
            selectedCategories={selectedCategories}
            onCategoryChange={onCategoryChange}
            onReset={onReset}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// RESULT ITEM COMPONENTS
// ============================================================================

interface AvatarResultItemProps {
  avatar: Avatar;
  onClick: () => void;
}

function AvatarResultItem({ avatar, onClick }: AvatarResultItemProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="w-full text-left p-3 rounded-xl hover:bg-surface-hover transition-colors flex gap-3 items-center cursor-pointer"
    >
      <UserAvatar avatarUrl={avatar.avatar_url} size="xs" className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm text-text-primary">{avatar.name}</span>
        <p className="text-xs text-text-muted">{avatar.role || 'Creative'}</p>
      </div>
    </button>
  );
}

interface PostResultItemProps {
  post: Post;
  onClick: () => void;
}

function PostResultItem({ post, onClick }: PostResultItemProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full text-left p-3 rounded-xl hover:bg-surface-hover transition-colors flex gap-4 items-start"
    >
      <PostThumbnail
        imageUrl={post.image_url}
        preset="POST_SEARCH_THUMB"
        className="rounded-lg"
        alt={post.title}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-text-primary truncate">{post.title}</h4>
        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{post.description}</p>
      </div>
    </button>
  );
}

interface CategoryResultItemProps {
  category: Category;
  onClick: () => void;
}

function CategoryResultItem({ category, onClick }: CategoryResultItemProps) {
  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="w-full text-left p-3 rounded-xl hover:bg-surface-hover transition-colors flex gap-3 items-center cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-primary text-sm">📁</span>
      </div>
      <span className="font-medium text-sm text-text-primary">{category}</span>
    </div>
  );
}

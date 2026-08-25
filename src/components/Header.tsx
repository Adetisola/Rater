"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Button } from './ui/Button';
import { FilterDropdown } from './FilterDropdown';
import { SearchResults } from './SearchResults';
import { Tooltip } from './ui/Tooltip';
import { useDebounce } from '../hooks/useDebounce';
import { type SearchIndexes, type SectionedSearchResults } from '../logic/searchUtils';
import { searchAll, buildSearchIndexes, getQuerySuggestions } from '../lib/algolia/search';
import type { Post, Avatar, Category } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { ListFilter, Search, X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { useAuthState } from '../context/AuthContext';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useAmbientPlaceholder } from '../hooks/useAmbientPlaceholder';
import { useNavigationHistory } from '../hooks/useNavigationHistory';
import { useNavigationStore } from '../store/navigationStore';
import { usePostStore } from '../store/postStore';
import { AmbientPlaceholder } from './AmbientPlaceholder';
import { AuthOverlay } from './AuthOverlay';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './notifications/NotificationBell';
import { MobileSearchOverlay } from './MobileSearchOverlay';

/**
 * Optional props for the Header component when used with custom handlers.
 */
export interface HeaderProps {
  onPostClick?: () => void;
  onLogoClick?: () => void;
  onBack?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  selectedCategories?: string[];
  onCategoryChange?: (categories: string[]) => void;
  hideControls?: boolean;
  onPostSelect?: (post: Post) => void;
  onAvatarSelect?: (avatar: Avatar) => void;
  onReset?: () => void;
  searchIndexes?: SearchIndexes;
  onMobileSearchOpen?: (activeId: string) => void;
}

function HeaderContent({
  onPostClick: _onPostClick,
  onLogoClick,
  onBack,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  onSearchSubmit: externalOnSearchSubmit,
  sortBy: externalSortBy,
  onSortChange: externalOnSortChange,
  selectedCategories: externalSelectedCategories,
  onCategoryChange: externalOnCategoryChange,
  hideControls = false,
  onPostSelect,
  onAvatarSelect,
  onReset,
  searchIndexes: externalSearchIndexes,
  onMobileSearchOpen,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const params = useParams();

  const isBrowsePage = pathname === '/browse' || pathname === '/browse/';
  const isPostPage = pathname.startsWith('/post/');

  const { currentProfile, profileMap, isLoading } = useAuthState();
  const { hasMeaningfulHistory, goBack } = useNavigationHistory();

  // Internal Navigation Store for Post Page Prev/Next navigation
  const currentPostId = isPostPage ? (params?.id as string) || pathname.replace('/post/', '').split('/')[0] : '';
  const nextPostId = useNavigationStore(state => currentPostId ? state.getNextPostId(currentPostId) : null);
  const prevPostId = useNavigationStore(state => currentPostId ? state.getPrevPostId(currentPostId) : null);
  const hasPostNavigation = Boolean(prevPostId || nextPostId);

  // Search & Filter State (synced with URL / internal state if external props not provided)
  const urlQuery = searchParams?.get('q') || '';
  const urlSort = searchParams?.get('sort') || 'balanced';
  const urlCatString = searchParams?.getAll('cat').join(',') || '';
  const urlCategories = useMemo(() => urlCatString ? urlCatString.split(',') : [], [urlCatString]);

  const [internalSearchQuery, setInternalSearchQuery] = useState(urlQuery);
  const [internalSortBy, setInternalSortBy] = useState(urlSort);
  const [internalSelectedCategories, setInternalSelectedCategories] = useState<string[]>(urlCategories);

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const sortBy = externalSortBy !== undefined ? externalSortBy : internalSortBy;
  const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : internalSelectedCategories;

  // Sync internal search state when URL changes on Browse
  useEffect(() => {
    if (isBrowsePage) {
      setInternalSearchQuery(urlQuery);
      setInternalSortBy(urlSort);
      setInternalSelectedCategories(urlCategories);
    }
  }, [urlQuery, urlSort, urlCategories, isBrowsePage]);

  // URL sync helper when navigating from other pages or updating browse filters
  const updateUrlParams = (updates: Record<string, string | string[] | null>) => {
    const p = new URLSearchParams(searchParams?.toString() || '');
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0) || value === '') {
        p.delete(key);
      } else if (Array.isArray(value)) {
        p.delete(key);
        value.forEach(v => p.append(key, v));
      } else {
        p.set(key, value);
      }
    });
    const newQuery = p.toString();
    const targetUrl = newQuery ? `/browse?${newQuery}` : '/browse';
    
    if (isBrowsePage) {
      const isOnlyQueryUpdate = Object.keys(updates).length === 1 && 'q' in updates;
      if (isOnlyQueryUpdate) {
        router.replace(targetUrl, { scroll: false });
      } else {
        router.push(targetUrl, { scroll: false });
      }
    } else {
      window.dispatchEvent(new Event('app-navigation-start'));
      router.push(targetUrl, { scroll: false });
    }
  };

  const handleSearchChange = (query: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(query);
    } else {
      setInternalSearchQuery(query);
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (externalOnSearchSubmit) {
      externalOnSearchSubmit(query);
    } else {
      updateUrlParams({ q: query || null });
    }
  };

  const handleSortChange = (sort: string) => {
    if (externalOnSortChange) {
      externalOnSortChange(sort);
    } else {
      setInternalSortBy(sort);
      if (isBrowsePage) {
        updateUrlParams({ sort: sort === 'balanced' ? null : sort });
      }
    }
  };

  const handleCategoryChange = (categories: string[]) => {
    if (externalOnCategoryChange) {
      externalOnCategoryChange(categories);
    } else {
      setInternalSelectedCategories(categories);
      if (isBrowsePage) {
        updateUrlParams({ cat: categories });
      } else {
        updateUrlParams({ cat: categories });
      }
    }
  };

  const handleResetFilters = () => {
    if (onReset) {
      onReset();
    } else {
      setInternalSearchQuery('');
      setInternalSortBy('balanced');
      setInternalSelectedCategories([]);
      updateUrlParams({ q: null, sort: null, cat: [] });
    }
  };

  // Search Indexes
  const allPosts = usePostStore(state => state.posts);
  const searchIndexes = useMemo(() => {
    if (externalSearchIndexes) return externalSearchIndexes;
    const postList = Object.values(allPosts);
    return buildSearchIndexes(postList, profileMap, CATEGORIES);
  }, [externalSearchIndexes, allPosts, profileMap]);

  // UI state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchLayoutId, setMobileSearchLayoutId] = useState<string>('tablet-search-pill');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { recentItems, addSearch, addAvatar, addPost, addCategory, removeItem, clearAll } = useRecentSearches();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ambient rotating placeholder (desktop only)
  const ambientPlaceholder = useAmbientPlaceholder({
    isFocused: isSearchFocused,
    inputValue: searchQuery,
    hasCategories: selectedCategories.length > 0,
    enabled: true,
  });

  // Data state for search
  const [searchResults, setSearchResults] = useState<SectionedSearchResults>({ avatars: [], posts: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 200);

  // Query suggestions computation
  const recentQueryStrings = useMemo(() => {
    return recentItems.filter(i => i.type === 'search').map(i => i.query);
  }, [recentItems]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return getQuerySuggestions(searchQuery, recentQueryStrings, 5);
  }, [searchQuery, recentQueryStrings]);

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
        avatars: 4,
        posts: 6,
        categories: 3
      });

      if (isMounted) {
        setSearchResults(results);
        setIsSearching(false);
      }
    };

    doSearch();
    return () => { isMounted = false; };
  }, [searchIndexes, debouncedQuery]);

  const isRecentMode = isSearchFocused && debouncedQuery.trim() === '';

  useEffect(() => {
    if (!isSearchFocused) {
      setShowSearchResults(false);
      return;
    }

    if (isRecentMode) {
      setShowSearchResults(true);
    } else if (debouncedQuery.trim().length >= 1) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [debouncedQuery, isRecentMode, isSearchFocused]);

  // In-place Clear Search handler
  const handleClearSearch = () => {
    handleSearchChange('');
    if (isBrowsePage) {
      updateUrlParams({ q: null });
    }
    searchInputRef.current?.focus();
  };

  // Autocomplete fill handler (tap ↗ arrow)
  const handlePopulateSearch = (term: string) => {
    handleSearchChange(term);
    searchInputRef.current?.focus();
  };

  // Handle avatar click in search results
  const handleAvatarClick = (avatar: Avatar) => {
    addAvatar(avatar.id);
    setShowSearchResults(false);
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

  // Handle post click in search results
  const handlePostClick = (post: Post) => {
    addPost(post.id);
    setShowSearchResults(false);
    searchInputRef.current?.blur();
    if (onPostSelect) {
      onPostSelect(post);
    } else {
      window.dispatchEvent(new Event('app-navigation-start'));
      router.push(`/post/${post.id}`, { scroll: false });
    }
  };

  // Handle category click in search results
  const handleCategoryClick = (category: Category) => {
    addCategory(category);
    setShowSearchResults(false);
    const newCats = !selectedCategories.includes(category)
      ? [...selectedCategories, category]
      : selectedCategories;
    handleCategoryChange(newCats);
  };

  const handleCloseSearch = () => {
    if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
    setIsSearchFocused(false);
    setShowSearchResults(false);
    searchInputRef.current?.blur();
  };

  const handleSoftCloseSearch = () => {
    setShowSearchResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim().length > 0) addSearch(searchQuery.trim());
      handleSearchSubmit(searchQuery.trim());
      setShowSearchResults(false);
      searchInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSearchResults(false);
      searchInputRef.current?.blur();
    }
  };

  // Prev / Next Navigation Handlers
  const handlePrevPost = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (prevPostId) {
      window.dispatchEvent(new Event('app-navigation-start'));
      router.replace(`/post/${prevPostId}`, { scroll: false });
    }
  };

  const handleNextPost = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (nextPostId) {
      window.dispatchEvent(new Event('app-navigation-start'));
      router.replace(`/post/${nextPostId}`, { scroll: false });
    }
  };

  // Left Section Handlers
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else if (isBrowsePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  // Dynamic Left Zone Decision:
  // - Browse page: ALWAYS Rater logo
  // - Other pages: Back button if meaningful internal navigation context exists, otherwise Rater logo
  const showBackButton = !isBrowsePage && hasMeaningfulHistory;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl py-2 md:py-4 border-b border-white/20 rounded-bl-[20px] rounded-br-[20px] md:rounded-bl-[30px] md:rounded-br-[30px]">
      <div className={`relative max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 flex items-center gap-2 sm:gap-3 md:gap-6 min-h-[48px] ${hideControls ? 'justify-center' : 'justify-between'}`}>

        {/* ========================================================================= */}
        {/* [ ZONE 1: LEFT ] - Logo or Back Button                                     */}
        {/* ========================================================================= */}
        <div className="flex items-center shrink-0 z-10">
          {showBackButton ? (
            <Button
              variant="secondary"
              onClick={handleBackClick}
              className="rounded-full gap-2 pl-3 pr-5 bg-white border-2 border-gray-100 font-semibold hover:bg-gray-50 h-10 sm:h-12 shrink-0 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
              Back
            </Button>
          ) : (
            <Link
              href="/browse"
              scroll={false}
              onClick={handleLogoClick}
              className="w-[44px] h-[44px] sm:w-12 sm:h-12 rounded-xl flex items-center justify-center cursor-pointer group relative shrink-0"
              aria-label="Rater Home"
            >
              <img
                src="/icons/rater-logo-transparent-bg-stroked.svg"
                alt="Rater Logo"
                className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0"
              />
              <img
                src="/icons/rater-logo-black-bg.svg"
                alt="Rater Logo Hover"
                className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              />
            </Link>
          )}
        </div>

        {/* ========================================================================= */}
        {/* [ ZONE 2: CENTER ] - Desktop Search Bar (Exact Canonical Browse Style)     */}
        {/* ========================================================================= */}
        {!hideControls && (
          <div className="hidden min-[769px]:flex flex-1 min-w-0 max-w-3xl relative z-50 transition-opacity duration-500 opacity-100">
            <div className="relative w-full group">
              <div className={`relative w-full transition-opacity duration-200 ${isFilterOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 z-10 transition-opacity pointer-events-none ${isSearching ? 'opacity-20' : 'opacity-40 group-focus-within:opacity-100'}`} />

                <div
                  className="w-full min-h-[48px] pl-12 pr-16 py-1.5 rounded-full border-2 border-primary bg-white flex items-center flex-wrap gap-2 transition-all group-focus-within:ring-4 group-focus-within:ring-primary/10"
                  onClick={() => searchInputRef.current?.focus()}
                >
                  {selectedCategories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-bold text-black whitespace-nowrap animate-in fade-in zoom-in duration-200">
                      {cat}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newCats = selectedCategories.filter(c => c !== cat);
                          handleCategoryChange(newCats);
                        }}
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <X size={12} className="text-gray-500" />
                      </button>
                    </span>
                  ))}

                  <div className="relative flex-1 min-w-[120px] h-8">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => {
                        if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
                        setIsSearchFocused(true);
                      }}
                      onBlur={() => {
                        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = setTimeout(() => { setIsSearchFocused(false); }, 150);
                      }}
                      onKeyDown={(e) => {
                        handleKeyDown(e);
                        if (e.key === 'Backspace' && searchQuery === '' && selectedCategories.length > 0) {
                          const newCats = [...selectedCategories];
                          newCats.pop();
                          handleCategoryChange(newCats);
                        }
                      }}
                      placeholder=""
                      className="w-full h-full bg-transparent border-none outline-none focus:ring-0 p-0 font-sans text-base placeholder:text-gray-400 relative z-1"
                    />
                    <AmbientPlaceholder
                      text={ambientPlaceholder.currentText}
                      transitionKey={ambientPlaceholder.transitionKey}
                      visible={searchQuery === '' && selectedCategories.length === 0}
                    />
                  </div>
                </div>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5">
                  <AnimatePresence>
                    {searchQuery && (
                      <Tooltip content="Clear search" position="bottom">
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSearch();
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </motion.button>
                      </Tooltip>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-gray-100"
                    aria-label="Filter options"
                  >
                    <ListFilter className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <SearchResults
                results={searchResults}
                suggestions={suggestions}
                searchQuery={searchQuery}
                isVisible={showSearchResults && !isFilterOpen}
                onAvatarClick={handleAvatarClick}
                onPostClick={handlePostClick}
                onCategoryClick={handleCategoryClick}
                onClose={handleCloseSearch}
                onSoftClose={handleSoftCloseSearch}
                recentMode={isRecentMode}
                recentItems={recentItems}
                onRecentSearchClick={(q) => {
                  addSearch(q);
                  handleSearchChange(q);
                  handleSearchSubmit(q);
                  handleCloseSearch();
                }}
                onPopulateSearch={handlePopulateSearch}
                onRemoveRecentItem={removeItem}
                onClearRecent={clearAll}
              />

              <FilterDropdown
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                onReset={handleResetFilters}
                onSearchSubmit={handleSearchSubmit}
                className="top-0 left-0 w-full shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* [ ZONE 3: RIGHT ] - Contextual Controls & Auth                             */}
        {/* ========================================================================= */}
        {!hideControls && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10">

            {/* Mobile Search Circle Trigger (< 480px) */}
            <motion.button
              layoutId="mobile-search-circle"
              onClick={() => {
                if (onMobileSearchOpen) {
                  onMobileSearchOpen('mobile-search-circle');
                } else {
                  setMobileSearchLayoutId('mobile-search-circle');
                  setIsMobileSearchOpen(true);
                }
              }}
              className="flex xs:hidden w-[44px] h-[44px] items-center justify-center rounded-full border-2 border-primary bg-white hover:bg-primary transition-all shrink-0 group overflow-hidden"
              style={{ borderRadius: 9999 }}
              aria-label="Open mobile search"
            >
              <img src="/icons/search.svg" alt="Search" className="w-6 h-6 opacity-70 group-hover:brightness-0 group-hover:invert transition-all duration-300" />
            </motion.button>

            {/* Tablet Search Pill Trigger (480px - 768px) */}
            <div className="hidden xs:flex min-[769px]:hidden items-center">
              <motion.button
                layoutId="tablet-search-pill"
                onClick={() => {
                  if (onMobileSearchOpen) {
                    onMobileSearchOpen('tablet-search-pill');
                  } else {
                    setMobileSearchLayoutId('tablet-search-pill');
                    setIsMobileSearchOpen(true);
                  }
                }}
                className="w-full max-w-[180px] sm:max-w-[200px] flex items-center justify-between min-h-[44px] sm:min-h-[48px] pl-4 pr-4 rounded-full border-2 border-primary bg-white hover:bg-gray-50 transition-colors group overflow-hidden"
                style={{ borderRadius: 9999 }}
                aria-label="Open tablet search"
              >
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden w-full">
                  <img src="/icons/search.svg" alt="Search" className="h-4 w-4 sm:h-5 sm:w-5 opacity-40 shrink-0" />
                  <div className="flex flex-1 items-center gap-1.5 overflow-hidden pr-2">
                    {selectedCategories.length > 0 ? (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 text-[10px] sm:text-xs font-bold text-black whitespace-nowrap overflow-hidden">
                        <span className="truncate max-w-[80px] sm:max-w-[120px]">{selectedCategories[0]}</span>
                        {selectedCategories.length > 1 && <span className="ml-1 text-gray-500 shrink-0">+{selectedCategories.length - 1}</span>}
                      </span>
                    ) : (
                      <span className="text-sm font-sans text-gray-400 truncate w-full text-left">
                        {searchQuery || "Search..."}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Contextual Prev / Next Controls on Post Page */}
            {isPostPage && hasPostNavigation && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handlePrevPost}
                  disabled={!prevPostId}
                  className="w-10 h-10 sm:w-11 sm:h-11 p-0 rounded-full bg-white border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center disabled:opacity-20 transition-all shrink-0 active:scale-95"
                  aria-label="Previous post"
                >
                  <ChevronLeft className="w-5 h-5 text-black" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleNextPost}
                  disabled={!nextPostId}
                  className="w-10 h-10 sm:w-11 sm:h-11 p-0 rounded-full bg-white border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center disabled:opacity-20 transition-all shrink-0 active:scale-95"
                  aria-label="Next post"
                >
                  <ChevronRight className="w-5 h-5 text-black" />
                </Button>
              </div>
            )}

            {/* Profile & Notification Controls (Logged in / Loading / Logged out) */}
            {currentProfile ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                <UserMenu variant="nav" align="right" />
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 h-10 sm:h-12 px-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100/70 animate-pulse" />
              </div>
            ) : (
              /* Auth Buttons (Logged out - shown on all pages or when prev/next navigation is hidden on post page) */
              (!isPostPage || !hasPostNavigation) && (
                <div className="flex items-center gap-2">
                  <Button
                    variant='outline'
                    onClick={() => { setAuthTab('login'); setShowAuthOverlay(true); }}
                    className="hidden sm:flex items-center justify-center h-10 sm:h-12 px-5 sm:px-6 rounded-full font-medium text-[16px] sm:text-[17px] text-black hover:bg-primary hover:text-white transition-all"
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => { setAuthTab('signup'); setShowAuthOverlay(true); }}
                    className="h-10 sm:h-12 rounded-full px-4 sm:px-6 text-white font-medium text-[16px] sm:text-[17px]"
                  >
                    Sign Up
                  </Button>
                </div>
              )
            )}

          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthOverlay && <AuthOverlay initialTab={authTab} onClose={() => setShowAuthOverlay(false)} />}
      </AnimatePresence>

      {/* Mobile Search Overlay */}
      {!onMobileSearchOpen && (
        <MobileSearchOverlay
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          onReset={handleResetFilters}
          searchIndexes={searchIndexes}
          activeLayoutId={mobileSearchLayoutId}
        />
      )}
    </header>
  );
}

/**
 * Universal Header Component wrapped in Suspense for Next.js App Router searchParams stability.
 */
export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl py-2 md:py-4 border-b border-white/20 rounded-bl-[20px] rounded-br-[20px] md:rounded-bl-[30px] md:rounded-br-[30px]">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between min-h-[48px]">
          <div className="w-[44px] h-[44px] sm:w-12 sm:h-12 rounded-xl" />
        </div>
      </header>
    }>
      <HeaderContent {...props} />
    </Suspense>
  );
}
export default Header;

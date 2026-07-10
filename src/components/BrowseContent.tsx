"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { MasonryGrid } from '@/components/MasonryGrid';
import { MobileSearchOverlay } from '@/components/MobileSearchOverlay';
import type { Post, Avatar } from '@/types';
import { CATEGORIES } from '@/constants/categories';

import { buildSearchIndexes, searchPosts } from '@/lib/algolia/search';
import { curatedFreshnessSort } from '@/logic/curatedSort';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFeedPosts } from '@/lib/posts';
import { usePostStore } from '@/store/postStore';

const SORT_LABELS: Record<string, string> = {
  balanced: '✨Balanced',
  highest_rated: 'Top',
  most_reviewed: 'Hot',
  newest: 'Recent',
};


export default function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { currentProfile, profileMap } = useAuth();
  
  // Data State
  const [feedPostIds, setFeedPostIds] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingPage, setIsFetchingPage] = useState(true);

  // Initial Fetch
  useEffect(() => {
    let mounted = true;
    setIsFetchingPage(true);
    getFeedPosts({ limit: 20 }).then(newPosts => {
      if (mounted) {
        usePostStore.getState().addOrUpdatePosts(newPosts);
        setFeedPostIds(newPosts.map(p => p.id));
        setHasMore(newPosts.length === 20);
        setIsFetchingPage(false);
      }
    }).catch(err => {
      console.error('Initial fetch failed:', err);
      if (mounted) {
        setIsFetchingPage(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleLoadMore = async () => {
    if (isFetchingPage || !hasMore || feedPostIds.length === 0) return;
    setIsFetchingPage(true);
    
    // Use the created_at of the last fetched post as cursor
    const lastPostId = feedPostIds[feedPostIds.length - 1];
    const lastPost = usePostStore.getState().posts[lastPostId];
    const cursor = lastPost ? lastPost.created_at : undefined;

    try {
      const newPosts = await getFeedPosts({ limit: 20, cursor });
      usePostStore.getState().addOrUpdatePosts(newPosts);
      setFeedPostIds(prev => {
        const newIds = newPosts.map(p => p.id).filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
      setHasMore(newPosts.length === 20);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setIsFetchingPage(false);
    }
  };


  // Read URL params
  const urlQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'balanced';
  const selectedCategories = useMemo(() => searchParams.getAll('cat'), [searchParams]);
  const avatarId = searchParams.get('avatar');

  // Local state for fast typing in search
  const [searchQuery, setSearchQuery] = useState(urlQuery);

  // Results state
  const [sortedPostIds, setSortedPostIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  // Handle search submission (only on Enter)
  const handleSearchSubmit = (query: string) => {
    updateUrl({ q: query || null });
  };

  const selectedAvatar = useMemo(() => {
    if (!avatarId) return null;
    return profileMap[avatarId] || null;
  }, [avatarId, profileMap]);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchLayoutId, setSearchLayoutId] = useState<string>('tablet-search-pill');

  // Logic dependencies
  const postsSearchSignature = feedPostIds.join(',');
  const searchIndexes = useMemo(() => {
    const loadedPosts = feedPostIds.map(id => usePostStore.getState().posts[id]).filter(Boolean);
    return buildSearchIndexes(loadedPosts, profileMap, CATEGORIES);
  }, [postsSearchSignature, profileMap]);

  const updateUrl = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0) || value === '') {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key);
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, value);
      }
    });
    const newQuery = params.toString();
    const url = newQuery ? `${pathname}?${newQuery}` : pathname;
    const isOnlyQueryUpdate = Object.keys(updates).length === 1 && 'q' in updates;
    if (isOnlyQueryUpdate) {
        router.replace(url, { scroll: false });
    } else {
        router.push(url, { scroll: false });
    }
  };

  const setSortBy = (sort: string) => updateUrl({ sort: sort === 'balanced' ? null : sort });
  const handleCategoryChange = (cats: string[]) => {
    setSearchQuery(''); 
    updateUrl({ cat: cats, q: null });
  };
  
  const handleAvatarSelect = (avatar: Avatar) => {
    const href = currentProfile && avatar.id === currentProfile.id 
      ? `/@${currentProfile.username}` 
      : `/@${avatar.username}`;
    window.dispatchEvent(new Event('app-navigation-start'));
    router.push(href, { scroll: false });
  };
  
  const clearAvatarFilter = () => updateUrl({ avatar: null });

  const resetFilters = () => {
    setSearchQuery('');
    updateUrl({ sort: null, cat: [], avatar: null, q: null });
  };

  // Async filtering and sorting engine
  useEffect(() => {
    let isMounted = true;
    
    const processPosts = async () => {
        try {
            setIsProcessing(true);
            let posts: Post[];
            const loadedPosts = feedPostIds.map(id => usePostStore.getState().posts[id]).filter(Boolean);

            // 1. Initial filter (Avatar or Search)
            if (selectedAvatar) {
                posts = loadedPosts.filter(post => post.avatar_id === selectedAvatar.id);
            } else if (urlQuery.trim().length >= 2) {
                const results = await searchPosts(searchIndexes, urlQuery, 100);
                posts = results.map(r => r.post);
            } else {
                posts = [...loadedPosts];
            }

            // 2. Category filter
            if (selectedCategories.length > 0) {
                posts = posts.filter(post => selectedCategories.includes(post.category));
            }

            // 3. Sorting & Metrics filter
            if (sortBy === 'highest_rated') {
                posts = posts.filter(p => (p.review_count || 0) >= 3);
                
                posts.sort((a,b) => {
                    return (b.average_score || 0) - (a.average_score || 0);
                });
            } else if (sortBy === 'most_reviewed') {
                posts.sort((a,b) => {
                    return (b.review_count || 0) - (a.review_count || 0);
                });
            } else if (sortBy === 'newest') {
                posts.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }

            // 4. Balanced Curated Sort
            let finalPosts = posts;
            if (sortBy === 'balanced' && urlQuery.trim().length < 2) {
                finalPosts = await curatedFreshnessSort(posts);
            }

            if (isMounted) {
                setSortedPostIds(finalPosts.map(p => p.id));
            }
        } catch (error) {
            console.error('Failed to process posts:', error);
            if (isMounted) {
                setSortedPostIds([]);
            }
        } finally {
            if (isMounted) {
                setIsProcessing(false);
            }
        }
    };

    processPosts();
    return () => { isMounted = false; };
  }, [searchIndexes, urlQuery, selectedCategories, sortBy, selectedAvatar, feedPostIds]);

  return (
    <>
      <Header 
        onPostClick={() => {
          window.dispatchEvent(new Event('app-navigation-start'));
          router.push('/submit', { scroll: false });
        }} 
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
        hideControls={false}
        onPostSelect={(post) => {
          window.dispatchEvent(new Event('app-navigation-start'));
          router.push(`/post/${post.id}`, { scroll: false });
        }}
        onAvatarSelect={handleAvatarSelect}
        onReset={resetFilters}
        searchIndexes={searchIndexes}
        onMobileSearchOpen={(id) => {
          if (id) setSearchLayoutId(id);
          setIsMobileSearchOpen(true);
        }}
      />

      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        activeLayoutId={searchLayoutId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
        onPostSelect={(post) => {
          window.dispatchEvent(new Event('app-navigation-start'));
          router.push(`/post/${post.id}`, { scroll: false });
          setIsMobileSearchOpen(false);
        }}
        onAvatarSelect={(avatar) => {
          handleAvatarSelect(avatar);
          setIsMobileSearchOpen(false);
        }}
        onReset={resetFilters}
        searchIndexes={searchIndexes}
      />
      
      <main className="flex-1 w-full pt-2">
        <AnimatePresence mode="wait">
            <motion.div 
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-4 md:pt-0"
            >
              {selectedAvatar && (
                <div className="max-w-[1600px] mx-auto px-6 mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-600">Avatar:</span>
                    <span className="text-sm font-bold text-black">{selectedAvatar.name}</span>
                    <button 
                      onClick={clearAvatarFilter}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {(sortBy !== 'balanced' || selectedCategories.length > 0) && (
                <div className="min-[769px]:hidden max-w-[1600px] mx-auto px-6 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {sortBy !== 'balanced' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary rounded-full">
                        <span className="text-xs font-medium text-black">{SORT_LABELS[sortBy] ?? sortBy}</span>
                        <button 
                          onClick={() => setSortBy('balanced')}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-primary hover:bg-[#e6b00f] transition-colors"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    )}
                    
                    {selectedCategories.map(cat => (
                      <div key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                        <span className="text-xs font-medium text-black">{cat}</span>
                        <button 
                          onClick={() => handleCategoryChange(selectedCategories.filter(c => c !== cat))}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-400 hover:bg-gray-500 transition-colors"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}

                    {(selectedCategories.length > 1 || (sortBy !== 'balanced' && selectedCategories.length > 0)) && (
                      <button 
                        onClick={() => {
                          setSortBy('balanced');
                          handleCategoryChange([]);
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-black underline transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {urlQuery.trim().length >= 2 && !selectedAvatar && (
                <div className="max-w-[1600px] mx-auto px-6 mb-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-500 font-medium">Results for</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#111111] rounded-full">
                      <span className="text-sm font-semibold text-white">"{urlQuery.trim()}"</span>
                      <button
                        onClick={() => {
                            setSearchQuery('');
                            handleSearchSubmit('');
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-400">
                      {isProcessing ? 'Searching...' : (
                        sortedPostIds.length === 0
                          ? 'Nothing here yet'
                          : `${sortedPostIds.length} post${sortedPostIds.length === 1 ? '' : 's'} found`
                      )}
                    </span>
                  </div>
                </div>
              )}

              <MasonryGrid 
                postIds={sortedPostIds} 
                isLoading={isProcessing || isFetchingPage}
              />

              {!isProcessing && (
                <div className="max-w-[1600px] mx-auto px-6 py-12 flex flex-col items-center justify-center border-t border-gray-50 mt-10">
                    {hasMore ? (
                        <button 
                            onClick={handleLoadMore}
                            disabled={isFetchingPage}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black font-semibold rounded-full transition-colors disabled:opacity-50"
                        >
                            {isFetchingPage ? 'Loading...' : 'Load More'}
                        </button>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mb-4" />
                            <p className="text-[12px] font-semibold text-gray-400 tracking-wider select-none">
                                {sortedPostIds.length > 0 
                                ? "You've reached the end of the feed"
                                : sortedPostIds.length === 0 && urlQuery.trim() 
                                    ? "Everybody still dey create"
                                    : "Nothing here yet"}
                            </p>
                        </>
                    )}
                </div>
              )}
            </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

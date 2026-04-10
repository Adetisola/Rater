"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { MasonryGrid } from '@/components/MasonryGrid';
import { MobileSearchOverlay } from '@/components/MobileSearchOverlay';
import { MOCK_POSTS, MOCK_AVATARS, CATEGORIES, type Post, type Avatar } from '@/logic/mockData';
import { curatedFreshnessSort } from '@/logic/curatedSort';
import { createSearchIndexes, searchPosts } from '@/logic/searchUtils';
import { computeBadges } from '@/logic/badgeUtils';
import { computeHotPosts } from '@/logic/hotPostUtils';
import { useDebounce } from '@/hooks/useDebounce';
import { X } from 'lucide-react';

const SORT_LABELS: Record<string, string> = {
  balanced: '✨Balanced',
  highest_rated: 'Highest Rated',
  most_reviewed: 'Most Reviewed',
  newest: 'Newest',
};

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read URL params (fallback to empty/default)
  const urlQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'balanced';
  const selectedCategories = searchParams.getAll('cat');
  const designerId = searchParams.get('designer');

  // Local state for fast typing in search
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // Sync debounced search to URL cleanly without breaking history
  useEffect(() => {
    // Only update url if it's different to avoid loops
    if (debouncedSearchQuery !== urlQuery) {
      updateUrl({ q: debouncedSearchQuery || null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  const selectedDesigner = useMemo(() => {
    if (!designerId) return null;
    return Object.values(MOCK_AVATARS).find(a => a.id === designerId) || null;
  }, [designerId]);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchLayoutId, setSearchLayoutId] = useState<string>('tablet-search-pill');

  // Global static computation
  const searchIndexes = useMemo(() => createSearchIndexes(MOCK_POSTS, MOCK_AVATARS, CATEGORIES), []);
  const globalBadgeMap = useMemo(() => computeBadges(MOCK_POSTS), []);
  const hotPostIds = useMemo(() => computeHotPosts(MOCK_POSTS), []);

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
    
    // Use router.replace for search typing to avoid massive history lists, but push for actual filter clicks
    const isOnlyQueryUpdate = Object.keys(updates).length === 1 && 'q' in updates;
    if (isOnlyQueryUpdate) {
        router.replace(url, { scroll: false });
    } else {
        router.push(url, { scroll: false });
    }
  };

  const setSortBy = (sort: string) => updateUrl({ sort: sort === 'balanced' ? null : sort });
  const setSelectedCategories = (cats: string[]) => updateUrl({ cat: cats });
  
  const handleDesignerSelect = (avatar: Avatar) => {
    setSearchQuery(''); // clear local fast state
    updateUrl({ designer: avatar.id, q: null });
  };
  
  const clearDesignerFilter = () => {
    updateUrl({ designer: null });
  };

  const resetFilters = () => {
    updateUrl({ 
      sort: null, 
      cat: [], 
      designer: null, 
      q: null 
    });
    setSearchQuery('');
  };

  const filteredPosts = useMemo(() => {
    let posts: Post[];

    if (selectedDesigner) {
      posts = MOCK_POSTS.filter(post => post.designerId === selectedDesigner.id);
    }
    else if (debouncedSearchQuery.trim().length >= 2) {
      const searchResults = searchPosts(searchIndexes, debouncedSearchQuery, 100);
      posts = searchResults.map(result => result.post);
    } 
    else {
      posts = [...MOCK_POSTS];
    }

    if (selectedCategories.length > 0) {
      posts = posts.filter(post => selectedCategories.includes(post.category));
    }

    if (sortBy === 'highest_rated') {
      posts = posts.filter(post => !post.rating.isLocked);
    }

    if (selectedDesigner || debouncedSearchQuery.trim().length < 2) {
      switch (sortBy) {
        case 'highest_rated':
          posts.sort((a, b) => b.rating.average - a.rating.average);
          break;
        case 'most_reviewed':
          posts.sort((a, b) => b.rating.reviewCount - a.rating.reviewCount);
          break;
        case 'newest':
          posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    return posts;
  }, [searchIndexes, debouncedSearchQuery, selectedCategories, sortBy, selectedDesigner]);

  const sortedPosts = (
    sortBy === 'balanced' &&
    debouncedSearchQuery.trim().length < 2
  )
    ? curatedFreshnessSort(filteredPosts)
    : filteredPosts;

  return (
    <>
      <Header 
        onPostClick={() => router.push('/app/submit')} 
        onLogoClick={() => window.scrollTo(0,0)} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        hideControls={false}
        onPostSelect={(post) => router.push(`/app/post/${post.id}`)}
        onDesignerSelect={handleDesignerSelect}
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
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        onPostSelect={(post) => {
          router.push(`/app/post/${post.id}`);
          setIsMobileSearchOpen(false);
        }}
        onDesignerSelect={(avatar) => {
          handleDesignerSelect(avatar);
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
              {selectedDesigner && (
                <div className="max-w-[1600px] mx-auto px-6 mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-600">Designer:</span>
                    <span className="text-sm font-bold text-[#111111]">{selectedDesigner.name}</span>
                    <button 
                      onClick={clearDesignerFilter}
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
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEC312]/15 border border-[#FEC312] rounded-full">
                        <span className="text-xs font-medium text-[#111111]">{SORT_LABELS[sortBy] ?? sortBy}</span>
                        <button 
                          onClick={() => setSortBy('balanced')}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-[#FEC312] hover:bg-[#e6b00f] transition-colors"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    )}
                    
                    {selectedCategories.map(cat => (
                      <div key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                        <span className="text-xs font-medium text-[#111111]">{cat}</span>
                        <button 
                          onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
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
                          setSelectedCategories([]);
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-[#111111] underline transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {debouncedSearchQuery.trim().length >= 2 && !selectedDesigner && (
                <div className="max-w-[1600px] mx-auto px-6 mb-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-500 font-medium">Results for</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#111111] rounded-full">
                      <span className="text-sm font-semibold text-white">"{debouncedSearchQuery.trim()}"</span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-400">
                      {sortedPosts.length === 0
                        ? 'No posts found'
                        : `${sortedPosts.length} post${sortedPosts.length === 1 ? '' : 's'} found`}
                    </span>
                  </div>
                </div>
              )}

              <MasonryGrid 
                posts={sortedPosts} 
                badgeMap={globalBadgeMap}
                hotPostIds={hotPostIds}
              />

              <div className="max-w-[1600px] mx-auto px-6 py-12 flex flex-col items-center justify-center border-t border-gray-50 mt-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mb-4" />
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] select-none">
                      {sortedPosts.length > 0 
                        ? "You've reached the end of the feed"
                        : sortedPosts.length === 0 && debouncedSearchQuery.trim() 
                          ? "No matches found for your search"
                          : "No posts found in this category"}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-2 font-medium">✨ Refined & Curated Daily</p>
              </div>
            </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrowseContent />
    </Suspense>
  );
}

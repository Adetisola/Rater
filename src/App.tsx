import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/Header';
import { MasonryGrid } from './components/MasonryGrid';
import { SubmitPage } from './components/SubmitPage';
import { PostDetailOverlay } from './components/PostDetailOverlay';
import { MobileSearchOverlay } from './components/MobileSearchOverlay';
import { MOCK_POSTS, MOCK_AVATARS, CATEGORIES, type Post, type Avatar } from './logic/mockData';
import { curatedFreshnessSort } from './logic/curatedSort';
import { createSearchIndexes, searchPosts } from './logic/searchUtils';
import { computeBadges } from './logic/badgeUtils';
import { useDebounce } from './hooks/useDebounce';
import { X } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'submit'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('✨Curated Freshness');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDelayed, setIsDelayed] = useState(false);
  
  // Designer filter state - when a designer is selected from search
  const [selectedDesigner, setSelectedDesigner] = useState<Avatar | null>(null);

  // Mobile search overlay state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Scroll to top on page/route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentPage]);

  // Debounce search query for grid filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  // Create all search indexes once
  const searchIndexes = useMemo(
    () => createSearchIndexes(MOCK_POSTS, MOCK_AVATARS, CATEGORIES),
    []
  );

  // Compute badges once globally (simulates daily backend calculation)
  const globalBadgeMap = useMemo(
    () => computeBadges(MOCK_POSTS),
    [] // Never recompute - badges are global and stable
  );

  const handleHomeClick = () => {
    if (currentPage === 'submit') {
        setIsDelayed(true);
        setCurrentPage('home');
        setTimeout(() => setIsDelayed(false), 800);
    } else {
        setCurrentPage('home');
    }
    // Clear designer filter when going home
    setSelectedDesigner(null);
  };

  // Handle designer selection from search dropdown
  const handleDesignerSelect = (avatar: Avatar) => {
    setSelectedDesigner(avatar);
    setSearchQuery(''); // Clear search
  };

  // Clear designer filter
  const clearDesignerFilter = () => {
    setSelectedDesigner(null);
  };

  // Filter & Sort posts
  const filteredPosts = useMemo(() => {
    let posts: Post[];

    // 1. Designer Filter (highest priority - this is explicit selection)
    if (selectedDesigner) {
      posts = MOCK_POSTS.filter(post => post.designerId === selectedDesigner.id);
    }
    // 2. Search Filter - Use Fuse.js fuzzy search
    else if (debouncedSearchQuery.trim().length >= 2) {
      const searchResults = searchPosts(searchIndexes, debouncedSearchQuery, 100);
      posts = searchResults.map(result => result.post);
    } 
    // 3. No filters - use all posts
    else {
      posts = [...MOCK_POSTS];
    }

    // 4. Category Filter (applies on top of designer or search)
    if (selectedCategories.length > 0) {
      posts = posts.filter(post => selectedCategories.includes(post.category));
    }

    // 5. Locked Rating Filter
    if (sortBy === 'Highest Rated' || sortBy === 'Lowest Rated') {
      posts = posts.filter(post => !post.rating.isLocked);
    }

    // 6. Sorting Logic
    // If designer selected: use default homepage sorting
    // If search active: keep relevance order
    // Otherwise: apply selected sort
    if (selectedDesigner || debouncedSearchQuery.trim().length < 2) {
      switch (sortBy) {
        case '✨Curated Freshness':
          // Handled separately
          break;
        case 'Highest Rated':
          posts.sort((a, b) => b.rating.average - a.rating.average);
          break;
        case 'Lowest Rated':
          posts.sort((a, b) => a.rating.average - b.rating.average);
          break;
        case 'Newest':
          posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'Oldest':
          posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'Most Reviewed':
          posts.sort((a, b) => b.rating.reviewCount - a.rating.reviewCount);
          break;
      }
    }

    return posts;
  }, [searchIndexes, debouncedSearchQuery, selectedCategories, sortBy, selectedDesigner]);

  // Apply Curated Freshness sort
  const sortedPosts = (
    sortBy === '✨Curated Freshness' && 
    debouncedSearchQuery.trim().length < 2
  )
    ? curatedFreshnessSort(filteredPosts)
    : filteredPosts;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#111111]">
      <Header 
        onPostClick={() => setCurrentPage('submit')} 
        onLogoClick={handleHomeClick} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        hideControls={currentPage === 'submit'}

        onPostSelect={(post) => setSelectedPost(post)}
        onDesignerSelect={handleDesignerSelect}
        searchIndexes={searchIndexes}
        onMobileSearchOpen={() => setIsMobileSearchOpen(true)}
      />

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        onPostSelect={(post) => {
          setSelectedPost(post);
          setIsMobileSearchOpen(false);
        }}
        onDesignerSelect={(avatar) => {
          handleDesignerSelect(avatar);
          setIsMobileSearchOpen(false);
        }}
        searchIndexes={searchIndexes}
      />
      
      <main className="flex-1 w-full pt-2">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && !isDelayed ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-4 md:pt-0"
            >
              {/* Designer Filter Pill */}
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

              {/* Active Filters Display - Mobile Only (≤425px) */}
              {(sortBy !== '✨Curated Freshness' || selectedCategories.length > 0) && (
                <div className="xs:hidden max-w-[1600px] mx-auto px-6 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sort Filter Pill */}
                    {sortBy !== '✨Curated Freshness' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEC312]/15 border border-[#FEC312] rounded-full">
                        <span className="text-xs font-medium text-[#111111]">{sortBy}</span>
                        <button 
                          onClick={() => setSortBy('✨Curated Freshness')}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-[#FEC312] hover:bg-[#e6b00f] transition-colors"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    )}
                    
                    {/* Category Filter Pills */}
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

                    {/* Clear All Button */}
                    {(selectedCategories.length > 1 || (sortBy !== '✨Curated Freshness' && selectedCategories.length > 0)) && (
                      <button 
                        onClick={() => {
                          setSortBy('✨Curated Freshness');
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
              
              <MasonryGrid 
                posts={sortedPosts} 
                badgeMap={globalBadgeMap}
                onPostClick={(post) => setSelectedPost(post)}
              />
            </motion.div>
          ) : (
            <SubmitPage key="submit" />
          )}
        </AnimatePresence>
      </main>

      {/* OVERLAYS */}
      <AnimatePresence>
        {selectedPost && (
            <PostDetailOverlay 
               key="post-detail-overlay"
               post={selectedPost} 
               onClose={() => setSelectedPost(null)}
            />
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  )
}

export default App

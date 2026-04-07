import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from './ui/Button';
import { FilterDropdown } from './FilterDropdown';
import { SearchResults } from './SearchResults';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, type SearchIndexes, type SectionedSearchResults } from '../logic/searchUtils';
import type { Post, Avatar, Category } from '../logic/mockData';
import { CloudUpload, ListFilter, Search } from 'lucide-react';

import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    onPostClick: () => void;
    onLogoClick: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    selectedCategories: string[];
    onCategoryChange: (categories: string[]) => void;
    hideControls?: boolean;

    onPostSelect?: (post: Post) => void;
    onDesignerSelect?: (avatar: Avatar) => void;
    searchIndexes: SearchIndexes;
    onMobileSearchOpen?: (activeId: string) => void;
}

export function Header({ 
    onPostClick, 
    onLogoClick, 
    searchQuery, 
    onSearchChange,
    sortBy,
    onSortChange,
    selectedCategories,
    onCategoryChange,
    hideControls = false,

    onPostSelect,
    onDesignerSelect,
    searchIndexes,
    onMobileSearchOpen
}: HeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showWidgets, setShowWidgets] = useState(!hideControls);
  const [opacityTrigger, setOpacityTrigger] = useState(!hideControls);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query for performance
  const debouncedQuery = useDebounce(searchQuery, 150);

  // Perform sectioned search with debounced query
  const searchResults = useMemo((): SectionedSearchResults => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      return { designers: [], posts: [], categories: [] };
    }
    
    return searchAll(searchIndexes, debouncedQuery, {
      designers: 3,
      posts: 5,
      categories: 3
    });
  }, [searchIndexes, debouncedQuery]);

  // Check if there are any results
  const hasResults = searchResults.designers.length > 0 || 
                     searchResults.posts.length > 0 || 
                     searchResults.categories.length > 0;

  // Show results when typing
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2 && hasResults) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [debouncedQuery, hasResults]);

  // Handle designer click - switch to filtered browsing
  const handleDesignerClick = (avatar: Avatar) => {
    setShowSearchResults(false);
    onSearchChange(''); // Clear search
    searchInputRef.current?.blur();
    onDesignerSelect?.(avatar);
  };

  // Handle post click - open post detail
  const handlePostClick = (post: Post) => {
    setShowSearchResults(false);
    searchInputRef.current?.blur();
    onPostSelect?.(post);
  };

  // Handle category click - add to category filter
  const handleCategoryClick = (category: Category) => {
    setShowSearchResults(false);
    onSearchChange(''); // Clear search
    searchInputRef.current?.blur();
    // Add category to filter if not already selected
    if (!selectedCategories.includes(category)) {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  // Handle closing search dropdown (with blur - for header area clicks)
  const handleCloseSearch = () => {
    setShowSearchResults(false);
    searchInputRef.current?.blur();
  };

  // Handle soft close (without blur - for outside clicks like post grid)
  const handleSoftCloseSearch = () => {
    setShowSearchResults(false);
  };

  // Handle Enter key press - run mixed search (handled by App.tsx)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSearchResults(false);
      searchInputRef.current?.blur();
      // Search query stays - App.tsx will use it a for grid filtering
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      searchInputRef.current?.blur();
      onSearchChange('');
    }
  };

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    if (hideControls) {
      setOpacityTrigger(false);
      setShowWidgets(false);
    } else {
      t1 = setTimeout(() => {
        setShowWidgets(true);
        t2 = setTimeout(() => setOpacityTrigger(true), 50);
      }, 700);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hideControls]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl py-2 md:py-4 border-b border-white/20 rounded-bl-[20px] rounded-br-[20px] md:rounded-bl-[30px] md:rounded-br-[30px]">
      <div className={`relative max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 flex items-center gap-2 sm:gap-3 md:gap-6 min-h-[48px] ${hideControls ? 'justify-center' : 'justify-between'}`}>
        
        {/* ANIMATED LOGO - Always absolute for smooth animation */}
        <div className={`absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${hideControls ? 'left-1/2 -translate-x-1/2' : 'left-3 sm:left-4 md:left-6 translate-x-0'}`}>
          <div 
            onClick={onLogoClick}
            className="w-[44px] h-[44px] sm:w-12 sm:h-12 rounded-xl flex items-center justify-center cursor-pointer group relative"
          >
            <img 
              src="/icons/logo-rater.svg" 
              alt="Rater Logo" 
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0" 
            />
            <img 
              src="/icons/logo-rater-hover.svg" 
              alt="Rater Logo Hover" 
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
            />
          </div>
        </div>

        {/* GHOST LOGO SPACER - visible on all screens to reserve space for absolute logo */}
        {!hideControls && <div className="w-[44px] h-[44px] sm:w-12 sm:h-12 shrink-0 invisible" aria-hidden="true" />}

        {/* DESKTOP SEARCH BAR - visible on screens strictly larger than 768px (>768px) */}
        {showWidgets && (
        <div className={`hidden min-[769px]:flex flex-1 min-w-0 max-w-3xl relative z-50 transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative w-full group">
            
            {/* Search Input Container */}
            <div className={`relative w-full transition-opacity duration-200 ${isFilterOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                
                {/* Search Icon */}
                <Search 
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 opacity-40 group-focus-within:opacity-100 transition-opacity z-10" 
                />

                {/* Input Wrapper - Styles applied here instead of input to contain pills */}
                <div 
                  className="w-full min-h-[48px] pl-12 pr-16 py-1.5 rounded-full border-2 border-[#FEC312] bg-white flex items-center flex-wrap gap-2 transition-all group-focus-within:ring-4 group-focus-within:ring-[#FEC312]/10"
                  onClick={() => searchInputRef.current?.focus()}
                >
                  {/* Category Pills */}
                  {selectedCategories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-bold text-[#111111] whitespace-nowrap animate-in fade-in zoom-in duration-200">
                      {cat}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newCats = selectedCategories.filter(c => c !== cat);
                          onCategoryChange(newCats);
                        }}
                        className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <X size={12} className="text-gray-500" />
                      </button>
                    </span>
                  ))}

                  {/* Actual Input */}
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => {
                      if (hasResults) {
                        setShowSearchResults(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      handleKeyDown(e);
                      // Backspace to remove last tag if input is empty
                      if (e.key === 'Backspace' && searchQuery === '' && selectedCategories.length > 0) {
                        const newCats = [...selectedCategories];
                        newCats.pop();
                        onCategoryChange(newCats);
                      }
                    }}
                    placeholder={selectedCategories.length === 0 ? "Search by title, designer, or category..." : ""} 
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:ring-0 p-0 font-sans text-base placeholder:text-gray-400 h-8"
                  />
                </div>
                
                {/* Filter Trigger Button */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-gray-100"
                    >
                        <ListFilter className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Search Results Dropdown - Sectioned */}
            <SearchResults 
              results={searchResults}
              isVisible={showSearchResults && !isFilterOpen}
              onDesignerClick={handleDesignerClick}
              onPostClick={handlePostClick}
              onCategoryClick={handleCategoryClick}
              onClose={handleCloseSearch}
              onSoftClose={handleSoftCloseSearch}
            />

            {/* Filter Panel */}
            <FilterDropdown 
                 isOpen={isFilterOpen}
                 onClose={() => setIsFilterOpen(false)}
                 searchQuery={searchQuery}
                 onSearchChange={onSearchChange}
                 sortBy={sortBy}
                 onSortChange={onSortChange}
                 selectedCategories={selectedCategories}
                 onCategoryChange={onCategoryChange}
                 className="top-0 left-0 w-full shadow-2xl"
            />
          </div>
        </div>
        )}

        {/* TABLET CONDENSED SEARCH PILL - strictly for tablet/small laptops (426px to 768px) */}
        {showWidgets && (
        <div className={`hidden xs:flex min-[769px]:hidden flex-1 justify-end relative z-40 transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
            <motion.button 
                layoutId="tablet-search-pill"
                onClick={() => onMobileSearchOpen?.('tablet-search-pill')}
                className="w-full max-w-[180px] sm:max-w-[200px] flex items-center justify-between min-h-[44px] sm:min-h-[48px] pl-4 pr-4 rounded-full border-2 border-[#FEC312] bg-white hover:bg-gray-50 transition-colors group overflow-hidden"
                style={{ borderRadius: 9999 }}
            >
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden w-full">
                    <img 
                      src="/icons/search.svg" 
                      alt="Search" 
                      className="h-4 w-4 sm:h-5 sm:w-5 opacity-40 shrink-0" 
                    />
                    <div className="flex flex-1 items-center gap-1.5 overflow-hidden pr-2">
                        {/* Show category pill if active, otherwise show query/placeholder */}
                        {selectedCategories.length > 0 ? (
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 text-[10px] sm:text-xs font-bold text-[#111111] whitespace-nowrap overflow-hidden">
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
        )}

        {/* ACTIONS */}
        {showWidgets && (
        <div className={`flex items-center gap-2 shrink-0 transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
            {/* PURE MOBILE SEARCH ICON - visible only on ≤425px, styled with yellow border */}
            <motion.button 
              layoutId="mobile-search-circle"
              onClick={() => onMobileSearchOpen?.('mobile-search-circle')}
              className="flex xs:hidden w-[44px] h-[44px] items-center justify-center rounded-full border-2 border-[#FEC312] bg-white hover:bg-[#FEC312] transition-all shrink-0 group overflow-hidden"
              style={{ borderRadius: 9999 }}
            >
              <img src="/icons/search.svg" alt="Search" className="w-6 h-6 opacity-70 group-hover:brightness-0 group-hover:invert transition-all duration-300" />
            </motion.button>

            {/* Post Button Container - Uses placeholder trick for grid stability */}
            <div className="relative">
                {/* Invisible placeholder maintains the baseline layout width */}
                <Button
                    variant="outline" 
                    className="h-[44px] sm:h-12 rounded-full px-3 sm:px-5 text-base sm:text-xl font-medium gap-1 sm:gap-2 opacity-0 pointer-events-none"
                    aria-hidden="true"
                    tabIndex={-1}
                >
                    <CloudUpload strokeWidth={2.5} className="h-5 w-5 sm:h-5 sm:w-5 shrink-0" />
                    <span className="hidden sm:inline">Post</span>
                </Button>

                {/* Interactive absolute button that expands smoothly to the left */}
                <Button
                    variant="outline" 
                    onClick={onPostClick}
                    className="absolute top-0 right-0 w-[45px] sm:w-auto h-[44px] sm:h-12 rounded-full px-3 sm:px-5 text-base sm:text-xl font-medium gap-1 sm:gap-2 group transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap z-10"
                >
                    <CloudUpload strokeWidth={2.25} className="h-6 w-6 sm:h-5 sm:w-5 shrink-0 transition-all group-hover:brightness-0 group-hover:invert" />
                    <span className="hidden text-[18px] sm:flex items-center">
                        Post
                        <span className="max-w-0 opacity-0 overflow-hidden xl:group-hover:max-w-[110px] xl:group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <span className="pl-1.5">your work</span>
                        </span>
                    </span>
                </Button>
            </div>
        </div>
        )}
      </div>
    </header>
  );
}

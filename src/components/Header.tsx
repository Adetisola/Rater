import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from './ui/Button';
import { FilterDropdown } from './FilterDropdown';
import { SearchResults } from './SearchResults';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, type SearchIndexes, type SectionedSearchResults } from '../logic/searchUtils';
import type { Post, Avatar, Category } from '../logic/mockData';

import { X } from 'lucide-react';

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
    searchIndexes
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
        
        {/* ANIMATED LOGO - Absolute on desktop, flow on mobile */}
        <div className={`${hideControls ? 'absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2' : 'relative md:absolute md:top-1/2 md:-translate-y-1/2 md:left-6'} z-10 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0`}>
          <div 
            onClick={onLogoClick}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center cursor-pointer group relative"
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

        {/* GHOST LOGO SPACER - only on desktop where logo is absolute */}
        {!hideControls && <div className="hidden md:block w-12 h-12 shrink-0 invisible" aria-hidden="true" />}

        {/* SEARCH BAR */}
        {showWidgets && (
        <div className={`flex-1 min-w-0 max-w-3xl relative z-50 transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative w-full group">
            
            {/* Search Input Container */}
            <div className={`relative w-full transition-opacity duration-200 ${isFilterOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                
                {/* Search Icon */}
                <img 
                  src="/icons/search.svg" 
                  alt="Search" 
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40 group-focus-within:opacity-100 transition-opacity z-10" 
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
                        <img src="/icons/filter.svg" alt="Filter" className="h-5 w-5 opacity-70" />
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

        {/* ACTIONS */}
        {showWidgets && (
        <div className={`flex items-center shrink-0 transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
            <Button
                variant="outline" 
                onClick={onPostClick}
                className="h-10 sm:h-12 rounded-full px-3 sm:px-5 text-base sm:text-xl font-medium gap-1 sm:gap-2 group"
            >
                <img src="/icons/upload.svg" alt="Upload" className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:brightness-0 group-hover:invert" />
                <span className="hidden sm:inline">Post</span>
            </Button>
        </div>
        )}
      </div>
    </header>
  );
}

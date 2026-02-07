import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MobileFilterPanel } from './MobileFilterPanel';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, type SearchIndexes, type SectionedSearchResults } from '../logic/searchUtils';
import type { Post, Avatar, Category } from '../logic/mockData';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onPostSelect?: (post: Post) => void;
  onDesignerSelect?: (avatar: Avatar) => void;
  searchIndexes: SearchIndexes;
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryChange,
  onPostSelect,
  onDesignerSelect,
  searchIndexes
}: MobileSearchOverlayProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query for performance
  const debouncedQuery = useDebounce(searchQuery, 150);

  // Perform sectioned search with debounced query
  const searchResults: SectionedSearchResults = (() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      return { designers: [], posts: [], categories: [] };
    }
    return searchAll(searchIndexes, debouncedQuery, {
      designers: 5,
      posts: 10,
      categories: 5
    });
  })();

  const hasResults = searchResults.designers.length > 0 || 
                     searchResults.posts.length > 0 || 
                     searchResults.categories.length > 0;

  // Lock body scroll and handle Android back button
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Focus input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);

      // Handle Android back button (popstate event)
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        onClose();
        // Push state back to prevent actual navigation
        window.history.pushState(null, '', window.location.href);
      };

      // Push a state so back button triggers popstate instead of leaving page
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  // Handle designer click
  const handleDesignerClick = (avatar: Avatar) => {
    onSearchChange('');
    onClose();
    onDesignerSelect?.(avatar);
  };

  // Handle post click
  const handlePostClick = (post: Post) => {
    onClose();
    onPostSelect?.(post);
  };

  // Handle category click
  const handleCategoryClick = (category: Category) => {
    onSearchChange('');
    if (!selectedCategories.includes(category)) {
      onCategoryChange([...selectedCategories, category]);
    }
    onClose();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchInputRef.current?.blur();
      onClose();
    } else if (e.key === 'Escape') {
      onSearchChange('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-60 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="sticky top-0 px-3 py-3 border-b border-gray-100 flex items-center gap-3 bg-white z-10 shrink-0">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Search Input */}
        <div className="flex-1 relative">
          <img 
            src="/icons/search.svg" 
            alt="Search" 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40 z-10" 
          />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing to search..." 
            className="w-full h-12 pl-12 pr-4 rounded-full border-2 border-[#FEC312] bg-white font-sans text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#FEC312]/10"
          />
        </div>

        {/* Filter Button */}
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
        >
          <img src="/icons/filter.svg" alt="Filter" className="h-5 w-5 opacity-70" />
        </button>
      </div>

      {/* Search Results - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Filters Pills (Sort + Categories) */}
        {(sortBy !== '✨Curated Freshness' || selectedCategories.length > 0) && (
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
            {/* Sort Pill - matches homepage exactly */}
            {sortBy !== '✨Curated Freshness' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEC312]/15 border border-[#FEC312] rounded-full">
                <span className="text-xs font-medium text-[#111111]">{sortBy}</span>
                <button 
                  onClick={() => onSortChange('✨Curated Freshness')}
                  className="w-4 h-4 flex items-center justify-center rounded-full bg-[#FEC312] hover:bg-[#e6b00f] transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            )}
            
            {/* Category Pills - matches homepage exactly */}
            {selectedCategories.map(cat => (
              <div key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                <span className="text-xs font-medium text-[#111111]">{cat}</span>
                <button 
                  onClick={() => {
                    const newCats = selectedCategories.filter(c => c !== cat);
                    onCategoryChange(newCats);
                  }}
                  className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-400 hover:bg-gray-500 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {hasResults ? (
          <div className="divide-y divide-gray-100">
            {/* DESIGNERS SECTION */}
            {searchResults.designers.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Designers</span>
                </div>
                <div className="p-2">
                  {searchResults.designers.map(({ avatar }) => (
                    <DesignerResultItem 
                      key={avatar.id}
                      avatar={avatar}
                      onClick={() => handleDesignerClick(avatar)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* POSTS SECTION */}
            {searchResults.posts.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Posts</span>
                </div>
                <div className="p-2">
                  {searchResults.posts.map((result) => (
                    <PostResultItem 
                      key={result.post.id}
                      post={result.post}
                      onClick={() => handlePostClick(result.post)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORIES SECTION */}
            {searchResults.categories.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</span>
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
          </div>
        ) : debouncedQuery.trim().length >= 2 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No results found for "{debouncedQuery}"
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Search by title, designer, or category...
          </div>
        )}
      </div>

      {/* Mobile Filter Panel */}
      <MobileFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={onClose} // Close entire search overlay when Apply is clicked
        sortBy={sortBy}
        onSortChange={onSortChange}
        selectedCategories={selectedCategories}
        onCategoryChange={onCategoryChange}
      />
    </div>,
    document.body
  );
}

// ============================================================================
// RESULT ITEM COMPONENTS (simplified versions for mobile)
// ============================================================================

interface DesignerResultItemProps {
  avatar: Avatar;
  onClick: () => void;
}

function DesignerResultItem({ avatar, onClick }: DesignerResultItemProps) {
  const initials = avatar.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center"
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
        style={{ backgroundColor: avatar.bgColor }}
      >
        {avatar.avatarUrl ? (
          <img src={avatar.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-sm text-[#111111]">{avatar.name}</span>
        <p className="text-xs text-gray-400">Designer</p>
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
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-4 items-start"
    >
      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img 
          src={post.imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-[#111111] truncate">{post.title}</h4>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.description}</p>
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
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center"
    >
      <div className="w-8 h-8 rounded-lg bg-[#FEC312]/10 flex items-center justify-center shrink-0">
        <span className="text-[#FEC312] text-sm">📁</span>
      </div>
      <span className="font-medium text-sm text-[#111111]">{category}</span>
    </button>
  );
}

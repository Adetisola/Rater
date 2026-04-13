"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MobileFilterPanel } from './MobileFilterPanel';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, type SearchIndexes, type SectionedSearchResults } from '../logic/searchUtils';
import type { Post, Avatar, Category } from '../logic/mockData';
import { useAuth } from '../context/AuthContext';

// Maps internal sort keys → display labels for active filter pills
const SORT_OPTION_LABELS: Record<string, string> = {
  balanced: '✨Balanced',
  highest_rated: 'Highest Rated',
  most_reviewed: 'Most Reviewed',
  newest: 'Newest',
};

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
  const { currentAvatar } = useAuth();

  // Data state
  const [searchResults, setSearchResults] = useState<SectionedSearchResults>({ avatars: [], posts: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 200);

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

  const hasResults = searchResults.avatars.length > 0 || 
                     searchResults.posts.length > 0 || 
                     searchResults.categories.length > 0;

  // Lock body scroll and handle Android back button
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 400);

      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        onClose();
        window.history.pushState(null, '', window.location.href);
      };

      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  // Handle avatar click
  const handleAvatarClick = (avatar: Avatar) => {
    onClose();
    if (onAvatarSelect) {
      onAvatarSelect(avatar);
    } else {
      const href = currentAvatar && avatar.id === currentAvatar.id 
        ? '/app/avatar' 
        : `/app/avatar/${avatar.id}`;
      router.push(href);
    }
  };

  // Handle post click
  const handlePostClick = (post: Post) => {
    onClose();
    onPostSelect?.(post);
  };

  // Handle category click
  const handleCategoryClick = (category: Category) => {
    onClose();
    if (!selectedCategories.includes(category)) {
      onCategoryChange([...selectedCategories, category]);
    }
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
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-60 bg-white flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 px-3 py-3 border-b border-gray-100 flex items-center gap-3 bg-white z-10 shrink-0">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <motion.div 
              layoutId={activeLayoutId}
              className="flex-1 relative flex items-center bg-white rounded-full border-2 border-[#FEC312] overflow-hidden focus-within:ring-4 focus-within:ring-[#FEC312]/10"
              style={{ borderRadius: 9999 }}
            >
              <img 
                src="/icons/search.svg" 
                alt="Search" 
                className={`absolute left-4 h-5 w-5 z-10 shrink-0 pointer-events-none transition-opacity ${isSearching ? 'opacity-20' : 'opacity-40'}`} 
              />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing to search..." 
                className="w-full h-11 pl-12 pr-4 bg-transparent font-sans text-base placeholder:text-gray-400 focus:outline-none"
              />
            </motion.div>

        <button 
          onClick={() => setIsFilterOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
        >
          <ListFilter className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(sortBy !== 'balanced' || selectedCategories.length > 0) && (
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
            {sortBy !== 'balanced' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEC312]/15 border border-[#FEC312] rounded-full">
                <span className="text-xs font-medium text-[#111111]">{SORT_OPTION_LABELS[sortBy] ?? sortBy}</span>
                <button 
                  onClick={() => onSortChange('balanced')}
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

        {isSearching ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Searching...</div>
        ) : hasResults ? (
          <div className="divide-y divide-gray-100">
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

            {searchResults.avatars.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avatars</span>
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
          </div>
        ) : debouncedQuery.trim().length >= 2 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No results found for "{debouncedQuery}"
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Search by title, avatar, or category...
          </div>
        )}
      </div>

      <MobileFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={onClose} 
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
  const initials = avatar.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center cursor-pointer"
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
        style={{ backgroundColor: avatar.bg_color }}
      >
        {avatar.avatar_url ? (
          <img src={avatar.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-sm text-[#111111]">{avatar.name}</span>
        <p className="text-xs text-gray-400">{avatar.role || 'Avatar'}</p>
      </div>
    </div>
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
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-4 items-start"
    >
      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img 
          src={post.image_url} 
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
    <div
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-[#FEC312]/10 flex items-center justify-center shrink-0">
        <span className="text-[#FEC312] text-sm">📁</span>
      </div>
      <span className="font-medium text-sm text-[#111111]">{category}</span>
    </div>
  );
}


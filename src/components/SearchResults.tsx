"use client";

import type { Avatar, Category, Post } from '../logic/mockData';
import type { SectionedSearchResults, HighlightSegment, PostSearchResult } from '../logic/searchUtils';
import { highlightMatches } from '../logic/searchUtils';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import type { RecentItemData } from '../hooks/useRecentSearches';

import Link from 'next/link';

interface SearchResultsProps {
  results: SectionedSearchResults;
  isVisible: boolean;
  onAvatarClick: (avatar: Avatar) => void;
  onPostClick: (post: Post) => void;
  onCategoryClick: (category: Category) => void;
  onClose: () => void;
  onSoftClose?: () => void;
  recentMode?: boolean;
  recentItems?: RecentItemData[];
  onRecentSearchClick?: (query: string) => void;
  onRemoveRecentItem?: (index: number) => void;
  onClearRecent?: () => void;
}

export function SearchResults({ 
  results, 
  isVisible, 
  onAvatarClick,
  onPostClick,
  onCategoryClick,
  onClose,
  onSoftClose,
  recentMode = false,
  recentItems = [],
  onRecentSearchClick,
  onRemoveRecentItem,
  onClearRecent
}: SearchResultsProps) {
  const hasResults = recentMode 
    ? recentItems.length > 0 
    : (results.avatars.length > 0 || results.posts.length > 0 || results.categories.length > 0);
  
  const { allAvatars } = useAuth();
  const { posts: allPosts } = usePosts();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isVisible || !hasResults || !mounted) {
    return null;
  }

  return (
    <>
      {/* Backdrop for page-wide clicks - soft close (keeps focus) */}
      {createPortal(
        <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => {
              (onSoftClose || onClose)();
            }}
        />,
        document.body
      )}
      
      {/* Header-area backdrop - close with blur */}
      <div 
        className="absolute inset-x-0 -top-20 h-32 z-41" 
        onClick={onClose}
      />
      
      {/* Results Dropdown */}
      <div 
        className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[70vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* RECENT SEARCHES MODE */}
        {recentMode && recentItems.length > 0 ? (
          <div>
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recent</span>
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearRecent?.();
                }}
                className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-2 py-0.5 rounded-full hover:bg-red-50"
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
                      onRemoveRecentItem?.(index); 
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0 ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                );

                if (item.type === 'search') {
                  return (
                    <div key={`rec-search-${item.query}`} className="flex items-center group">
                      <div
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRecentSearchClick?.(item.query); }}
                        className="flex-1 w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <span className="font-medium text-sm text-black truncate">{item.query}</span>
                          <span className="text-xs font-semibold text-gray-400">Search</span>
                        </div>
                      </div>
                      {removeBtn}
                    </div>
                  );
                }

                if (item.type === 'avatar') {
                  const avatar = allAvatars[item.avatarId];
                  if (!avatar) return null;
                  return (
                    <div key={`rec-av-${item.avatarId}`} className="flex items-center group flex-nowrap">
                       <div className="flex-1 min-w-0" onMouseDown={() => onAvatarClick(avatar)}>
                         <AvatarResultItem avatar={avatar} onClick={() => onAvatarClick(avatar)} />
                       </div>
                       {removeBtn}
                    </div>
                  );
                }

                if (item.type === 'post') {
                  const postObj = allPosts.find(p => p.id === item.postId);
                  if (!postObj) return null;
                  return (
                    <div key={`rec-post-${item.postId}`} className="flex items-center group flex-nowrap">
                       <div className="flex-1 min-w-0" onMouseDown={() => onPostClick(postObj)}>
                         <PostResultItem result={{ post: postObj, matches: [], score: 1 }} onClick={() => onPostClick(postObj)} />
                       </div>
                       {removeBtn}
                    </div>
                  );
                }

                if (item.type === 'category') {
                  return (
                     <div key={`rec-cat-${item.category}`} className="flex items-center group flex-nowrap">
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
        ) : (
          <>
            {/* CATEGORIES SECTION */}
        {results.categories.length > 0 && (
          <div className="border-b border-gray-100">
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categories</span>
            </div>
            <div className="p-2">
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

        {/* AVATARS SECTION */}
        {results.avatars.length > 0 && (
          <div className="border-b border-gray-100">
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avatars</span>
            </div>
            <div className="p-2">
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

        {/* POSTS SECTION */}
        {results.posts.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posts</span>
            </div>
            <div className="p-2">
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
          </>
        )}
      </div>
    </>
  );
}

// ============================================================================
// AVATAR RESULT ITEM
// ============================================================================

interface AvatarResultItemProps {
  avatar: Avatar;
  onClick: () => void;
}

function AvatarResultItem({ avatar, onClick }: AvatarResultItemProps) {
  const initials = avatar.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center cursor-pointer"
    >
      {/* Avatar */}
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
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-black">{avatar.name}</span>
        <p className="text-xs text-gray-400">{avatar.role || 'Avatar'}</p>
      </div>
    </div>
  );
}

// ============================================================================
// POST RESULT ITEM
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
      href={`/app/post/${post.id}`}
      scroll={false}
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-4 items-start cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img 
          src={post.image_url} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-black truncate">
          <HighlightedText segments={titleSegments} />
        </h4>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
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
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-3 items-center cursor-pointer"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-[#FEC312]/10 flex items-center justify-center shrink-0">
        <span className="text-[#FEC312] text-sm">📁</span>
      </div>
      
      {/* Category Name */}
      <span className="font-medium text-sm text-black">{category}</span>
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
            className="bg-[#FEC312]/30 text-inherit rounded-sm px-0.5"
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

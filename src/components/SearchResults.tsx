"use client";

import type { Avatar, Category, Post } from '../logic/mockData';
import type { SectionedSearchResults, HighlightSegment, PostSearchResult } from '../logic/searchUtils';
import { highlightMatches } from '../logic/searchUtils';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import Link from 'next/link';

interface SearchResultsProps {
  results: SectionedSearchResults;
  isVisible: boolean;
  onAvatarClick: (avatar: Avatar) => void;
  onPostClick: (post: Post) => void;
  onCategoryClick: (category: Category) => void;
  onClose: () => void;
  onSoftClose?: () => void;
}

export function SearchResults({ 
  results, 
  isVisible, 
  onAvatarClick,
  onPostClick,
  onCategoryClick,
  onClose,
  onSoftClose
}: SearchResultsProps) {
  const hasResults = results.avatars.length > 0 || results.posts.length > 0 || results.categories.length > 0;
  
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
        
        {/* CATEGORIES SECTION */}
        {results.categories.length > 0 && (
          <div className="border-b border-gray-100">
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</span>
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
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avatars</span>
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
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Posts</span>
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
        style={{ backgroundColor: avatar.bgColor }}
      >
        {avatar.avatarUrl ? (
          <img src={avatar.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          initials
        )}
      </div>
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="font-bold text-sm text-[#111111]">{avatar.name}</span>
        <p className="text-xs text-gray-400">Avatar</p>
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
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-4 items-start cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img 
          src={post.imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-[#111111] truncate">
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
      <span className="font-medium text-sm text-[#111111]">{category}</span>
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

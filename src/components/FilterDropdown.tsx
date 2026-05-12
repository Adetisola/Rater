"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { CATEGORIES } from '../logic/mockData';
import { ListFilter, Search } from 'lucide-react';

export interface FilterState {
  sortBy: string;
  categories: string[];
}

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onReset?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string; // Allow positioning customization
}

// Internal sort key → display label mapping (mirrors App.tsx SORT_LABELS)
const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'highest_rated', label: 'Highest Rated' },
  { key: 'most_reviewed', label: 'Most Reviewed' },
  { key: 'newest',        label: 'Newest'        },
];

// Returns the display label for a given sort key
function getSortLabel(sortKey: string): string {
  if (sortKey === 'balanced') return '✨Balanced';
  return SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? sortKey;
}



export function FilterDropdown({ 
  isOpen, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryChange,
  onReset,
  onSearchSubmit,
  className 
}: FilterDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const toggleCategory = (cat: string) => {
    const newCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    onCategoryChange(newCategories);
  };

  return (
    <>
      {createPortal(
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onMouseDown={(e) => {
             // Prevents focus loss if possible, though unmounting makes this tricky.
             // Main goal: capture click outside to close.
             if (e.target === e.currentTarget) {
                 e.preventDefault();
                 onClose();
             }
          }}
          aria-hidden="true"
        />,
        document.body
      )}
      
      {/* Expanded Container */}
      <div className={cn(
        "absolute bg-white rounded-4xl border-2 border-[#FEC312] z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden shadow-2xl",
        className
      )}>
        
        {/* TOP SECTION: Search Bar Area */}
        <div className="relative w-full min-h-[48px] flex items-center px-1 my-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 opacity-40 z-10" />
            
            <div 
              className="w-full min-h-[48px] pl-12 pr-16 py-1.5 flex items-center flex-wrap gap-2"
              onClick={() => document.getElementById('filter-search-input')?.focus()}
            >
              {/* Category Pills */}
              {selectedCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-bold text-black whitespace-nowrap animate-in fade-in zoom-in duration-200">
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

              <input 
                id="filter-search-input"
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && searchQuery === '' && selectedCategories.length > 0) {
                    const newCats = [...selectedCategories];
                    newCats.pop();
                    onCategoryChange(newCats);
                  } else if (e.key === 'Enter') {
                    onSearchSubmit?.(searchQuery);
                    onClose();
                  }
                }}
                placeholder={selectedCategories.length === 0 ? "Search by title, avatar, or category..." : ""} 
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:ring-0 p-0 font-sans text-base placeholder:text-gray-400 h-8"
                autoFocus
              />
            </div>
            
            {/* Active Filter Toggle */}
            <button 
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-[#FEC312] text-white hover:bg-[#eeb40e] transition-colors"
            >
               <ListFilter className="h-5 w-5" />
            </button>
        </div>

        <div className="px-8 pb-8 pt-2">
            
            {/* DIVIDER */}
            <div className="h-px w-full bg-gray-100 mb-6"></div>

            {/* SORT BY SECTION */}
            <div className="mb-8 relative flex items-center gap-4">
                <label className="text-sm font-semibold text-black whitespace-nowrap">Sort by</label>
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-60 h-12 px-5 bg-transparent border border-[#EBEBEB] rounded-xl flex items-center justify-between text-left hover:border-gray-300 transition-colors focus:ring-2 focus:ring-[#FEC312]/10"
                    >
                        <span className="text-sm font-medium text-black">{getSortLabel(sortBy)}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Custom Select Dropdown */}
                    {isSortOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-20 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {SORT_OPTIONS.map(({ key, label }) => (
                            <button
                            key={key}
                            onClick={() => {
                                onSortChange(key);
                                setIsSortOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 flex items-center justify-between transition-colors"
                            >
                            {label}
                            {sortBy === key && <Check className="w-4 h-4 text-[#FEC312]" strokeWidth={2.5} />}
                            </button>
                        ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CATEGORY SECTION */}
            <div className="mb-10">
            <label className="block text-sm font-semibold text-black mb-3">Category</label>
            <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                    "group pl-1.5 pr-2.5 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                    isSelected 
                        ? "bg-[#ebebeb] border-[#727272] text-black" 
                        : "bg-white border-[#E0E0E0] text-black hover:bg-[#fafafa]"
                    )}
                >
                    {/* Toggle Indicator */}
                    <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200",
                        isSelected
                            ? "bg-[#FEC312]"
                            : "border-[1.5px] border-[#E0E0E0]"
                    )}>
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                    </div>
                    
                    {cat}
                </button>
                )})}
            </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-start gap-4 pt-6 border-t border-[#F5F5F5]">
            <Button 
                variant="ghost"
                className="h-10 px-6 rounded-full text-sm font-medium transition-all"
                onClick={() => {
                  if (onReset) {
                    onReset();
                  } else {
                    onSortChange('balanced');
                    onCategoryChange([]);
                  }
                }}
            >
                Reset
            </Button>
            <Button 
                className="rounded-full px-5 bg-white border-2 border-[#FEC312] text-black font-semibold hover:bg-[#FEC312] hover:text-white transition-all duration-300 shadow-none border-solid"
                onClick={onClose}
            >
                Apply
            </Button>
            </div>
        </div>

      </div>
    </>
  );
}


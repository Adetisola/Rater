import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

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
  className?: string; // Allow positioning customization
}

const SORT_OPTIONS = [
  '✨Curated Freshness✨',
  'Highest Rated',
  'Lowest Rated',
  'Newest',
  'Oldest',
  'Most Reviewed'
];

const CATEGORIES = [
  'Web Design',
  'Poster Design',
  'Social Media Design',
  'Flyer Design',
  'Logo Design',
  'Brand Identity Design',
  'Mobile App Design'
];

export function FilterDropdown({ 
  isOpen, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryChange,
  className 
}: FilterDropdownProps) {
  if (!isOpen) return null;

  const [isSortOpen, setIsSortOpen] = useState(false);

  const toggleCategory = (cat: string) => {
    const newCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    onCategoryChange(newCategories);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose} 
        aria-hidden="true"
      />
      
      {/* Expanded Container */}
      <div className={cn(
        "absolute bg-white rounded-4xl border-2 border-[#FEC312] z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden shadow-2xl",
        className
      )}>
        
        {/* TOP SECTION: Search Bar Area */}
        <div className="relative w-full h-12 flex items-center px-1">
            <img src="/src/assets/icons/search.svg" alt="Search" className="absolute left-6 h-5 w-5 opacity-40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, designer, or category..." 
              className="w-full h-full pl-14 pr-16 bg-transparent border-none focus:outline-none focus:ring-0 font-sans text-base placeholder:text-gray-400"
              autoFocus
            />
            
            {/* Active Filter Toggle */}
            <button 
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-[#FEC312] text-white hover:bg-[#eeb40e] transition-colors"
            >
               <img src="/src/assets/icons/filter.svg" alt="Filter" className="h-5 w-5 brightness-0 invert" />
            </button>
        </div>

        <div className="px-8 pb-8 pt-2">
            
            {/* DIVIDER */}
            <div className="h-px w-full bg-gray-100 mb-6"></div>

            {/* SORT BY SECTION */}
            <div className="mb-8 relative flex items-center gap-4">
                <label className="text-sm font-bold text-[#111111] whitespace-nowrap">Sort by</label>
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-60 h-12 px-5 bg-transparent border border-[#EBEBEB] rounded-xl flex items-center justify-between text-left hover:border-gray-300 transition-colors focus:ring-2 focus:ring-[#FEC312]/10"
                    >
                        <span className="text-sm font-medium text-[#111111]">{sortBy}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Custom Select Dropdown */}
                    {isSortOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-20 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {SORT_OPTIONS.map(option => (
                            <button
                            key={option}
                            onClick={() => {
                                onSortChange(option);
                                setIsSortOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-gray-50 flex items-center justify-between transition-colors"
                            >
                            {option}
                            {sortBy === option && <Check className="w-4 h-4 text-[#FEC312]" strokeWidth={2.5} />}
                            </button>
                        ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CATEGORY SECTION */}
            <div className="mb-10">
            <label className="block text-sm font-bold text-[#111111] mb-3">Category</label>
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
                        ? "bg-[#ebebeb] border-[#727272] text-[#111111]" 
                        : "bg-white border-[#E0E0E0] text-[#111111] hover:bg-[#fafafa]"
                    )}
                >
                    {/* Toggle Circle Indicator */}
                    <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
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
            <button 
                onClick={() => {
                onSortChange('✨Curated Freshness✨');
                onCategoryChange([]);
                }}
                className="px-5 py-2 rounded-full text-sm font-bold text-[#111111] transition-all duration-300 hover:bg-[#FEC312] hover:text-white"
            >
                Reset
            </button>
            <Button 
                className="rounded-full px-5 bg-white border-2 border-[#FEC312] text-[#111111] font-bold hover:bg-[#FEC312] hover:text-white transition-all duration-300 shadow-none border-solid"
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


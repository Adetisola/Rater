import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface MobileFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const SORT_OPTIONS = [
  '✨Curated Freshness',
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

export function MobileFilterPanel({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryChange
}: MobileFilterPanelProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    const newCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    onCategoryChange(newCategories);
  };

  const handleReset = () => {
    onSortChange('✨Curated Freshness');
    onCategoryChange([]);
    // Reset stays open per user clarification
  };

  const handleApply = () => {
    onClose(); // Apply closes panel
  };

  return createPortal(
    <div className="fixed inset-0 z-70 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
        <span className="text-lg font-bold text-[#111111]">Filters</span>
        <button 
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* SORT BY SECTION */}
        <div className="mb-8 relative">
          <label className="block text-sm font-bold text-[#111111] mb-3">Sort by</label>
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full h-12 px-5 bg-transparent border border-[#EBEBEB] rounded-xl flex items-center justify-between text-left hover:border-gray-300 transition-colors focus:ring-2 focus:ring-[#FEC312]/10"
            >
              <span className="text-sm font-medium text-[#111111]">{sortBy}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Sort Dropdown */}
            {isSortOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-20 max-h-60 overflow-y-auto">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      onSortChange(option);
                      setIsSortOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-[#111111] hover:bg-gray-50 flex items-center justify-between transition-colors"
                  >
                    {option}
                    {sortBy === option && <Check className="w-4 h-4 text-[#FEC312]" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY SECTION - using pill style matching existing design */}
        <div className="mb-6">
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with Reset/Apply */}
      <div className="px-4 py-4 border-t border-gray-100 flex gap-3 shrink-0">
        <button 
          onClick={handleReset}
          className="flex-1 px-5 py-3 rounded-full text-sm font-bold text-[#111111] transition-all duration-300 hover:bg-[#FEC312] hover:text-white border border-gray-200"
        >
          Reset
        </button>
        <Button 
          className="flex-1 rounded-full px-5 py-3 bg-[#FEC312] border-2 border-[#FEC312] text-[#111111] font-bold hover:bg-[#eeb40e] transition-all duration-300 shadow-none"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>,
    document.body
  );
}

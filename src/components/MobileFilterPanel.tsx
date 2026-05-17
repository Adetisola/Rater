"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { CATEGORIES } from '../logic/mockData';

interface MobileFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  onReset?: () => void;
}

// Internal sort key → display label mapping
const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'highest_rated', label: 'Highest Rated' },
  { key: 'most_reviewed', label: 'Most Reviewed' },
  { key: 'newest',        label: 'Newest'        },
];

function getSortLabel(sortKey: string): string {
  if (sortKey === 'balanced') return '✨Balanced';
  return SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? sortKey;
}

// Bottom sheet config
const DISMISS_THRESHOLD = 150; // pixels dragged down to dismiss

export function MobileFilterPanel({
  isOpen,
  onClose,
  onApply,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryChange,
  onReset
}: MobileFilterPanelProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const y = useMotionValue(0);

  // Detect mobile vs tablet
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 426);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animate open
  useEffect(() => {
    if (isOpen && isMobile) {
      controls.start({
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 200 }
      });
    }
  }, [isOpen, isMobile, controls]);

  // Map y position to backdrop opacity
  const backdropOpacity = useTransform(y, [0, 300], [0.4, 0]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const currentY = y.get();
    const velocity = info.velocity.y;

    // Fast downward swipe or dragged past threshold → dismiss
    if (velocity > 500 || currentY > DISMISS_THRESHOLD) {
      controls.start({
        y: window.innerHeight,
        transition: { type: 'spring', damping: 25, stiffness: 200 }
      }).then(onClose);
    } else {
      // Snap back to open
      controls.start({
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 200 }
      });
    }
  }, [controls, onClose, y]);

  const [mounted, setMounted] = useState(false);

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

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onSortChange('balanced');
      onCategoryChange([]);
    }
  };

  const handleApply = () => {
    if (isMobile) {
      controls.start({
        y: window.innerHeight,
        transition: { type: 'spring', damping: 25, stiffness: 200 }
      }).then(() => {
        onClose();
        onApply?.();
      });
    } else {
      onClose();
      onApply?.();
    }
  };

  const handleBackdropClose = () => {
    if (isMobile) {
      controls.start({
        y: window.innerHeight,
        transition: { type: 'spring', damping: 25, stiffness: 200 }
      }).then(onClose);
    } else {
      onClose();
    }
  };

  // ── Shared filter content ──────────────────────────────────────────
  const filterContent = (
    <>
      {/* SORT BY SECTION */}
      <div className="mb-8 relative text-left">
        <label className="block text-sm font-bold text-black mb-3">Sort by</label>
        <div className="relative">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full h-12 px-5 bg-transparent border border-[#EBEBEB] rounded-xl flex items-center justify-between text-left hover:border-gray-300 transition-colors focus:ring-2 focus:ring-[#FEC312]/10"
          >
            <span className="text-sm font-medium text-black">{getSortLabel(sortBy)}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isSortOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-20 max-h-[200px] overflow-y-auto">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    onSortChange(key);
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-black hover:bg-gray-50 flex items-center justify-between transition-colors"
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
      <div className="mb-6 text-left">
        <label className="block text-sm font-bold text-black mb-3">Category</label>
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
    </>
  );

  const footerContent = (
    <div className="flex gap-3">
      <Button 
        variant="ghost"
        className="flex-1 h-10 px-6 rounded-full text-sm font-medium transition-all"
        onClick={handleReset}
      >
        Reset
      </Button>
      <Button 
        className="flex-1 rounded-full px-5 bg-white border-2 border-[#FEC312] text-black font-semibold hover:bg-[#FEC312] hover:text-white transition-all duration-300 shadow-none border-solid"
        onClick={handleApply}
      >
        Apply
      </Button>
    </div>
  );

  // ── MOBILE: Bottom Sheet ───────────────────────────────────────────
  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-70">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ opacity: backdropOpacity }}
              onClick={handleBackdropClose}
            />

            {/* Bottom Sheet */}
            <motion.div
              ref={sheetRef}
              className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col max-h-[90vh]"
              style={{ y }}
              initial={{ y: window.innerHeight }}
              animate={controls}
              exit={{ 
                y: window.innerHeight,
                transition: { type: 'spring', damping: 25, stiffness: 200 }
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
                <span className="text-lg font-bold text-black">Filters</span>
                <button 
                  onClick={handleBackdropClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div 
                className="overflow-y-auto px-5 py-5 overscroll-contain"
                onPointerDownCapture={(e) => {
                  // Prevent sheet drag when scrolling content
                  const el = e.currentTarget;
                  if (el.scrollHeight > el.clientHeight && el.scrollTop > 0) {
                    e.stopPropagation();
                  }
                }}
              >
                {filterContent}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footerContent}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  // ── TABLET+: Centered Modal Overlay ────────────────────────────────
  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6" onClick={handleBackdropClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal Content */}
      <div 
        className="w-full max-w-[500px] bg-white rounded-[24px] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 focus:outline-none max-h-[90vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0 w-full text-left">
          <span className="text-xl font-bold text-black">Filters</span>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {filterContent}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 shrink-0">
          {footerContent}
        </div>
      </div>
    </div>,
    document.body
  );
}

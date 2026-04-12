"use client";

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { StarRating } from './ui/StarRating';
import { Input } from './ui/Input';

import { motion, AnimatePresence } from 'framer-motion';

interface ReviewFormProps {
  onSubmit: (ratings: { clarity: number; purpose: number; aesthetics: number }, comment: string, reviewerName: string) => void;
  initialName?: string;
  isLoggedIn?: boolean;
}

const CRITERIA_INFO = {
  Clarity: {
    question: "How clear, readable, and well structured is the design?",
    points: ["Hierarchy", "Spacing", "Readability", "Layout Balance"]
  },
  Purpose: {
    question: "How well does the design communicate it's intended message or goal?",
    points: ["Brand Fit", "UX intent", "Conversion Clarity", "Context Alignment"]
  },
  Aesthetics: {
    question: "How visually appealing and polished is the design?",
    points: ["Colour Usage", "Typography", "Style Consistency", "Overall Look & Feel"]
  }
};

function CriteriaLabel({ label, info, iconUrl }: { label: string, info: { question: string, points: string[] }, iconUrl?: string }) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle tap to toggle tooltip
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTooltipVisible(prev => !prev);
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    if (!isTooltipVisible) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTooltipVisible(false);
      }
    };

    // Small delay to prevent immediate close on the same tap
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTooltipVisible]);

  return (
    <div 
      ref={containerRef}
      className="relative group cursor-help flex items-center"
      onClick={handleTap}
    >
      <div className="flex items-center gap-2 border-b-2 border-dotted border-gray-300 pb-0.5 transition-colors group-hover:border-black select-none">
        {iconUrl && <img src={iconUrl} alt={`${label} icon`} className="w-5 h-5 object-contain" />}
        <span className="text-[14px] xs:text-base font-medium text-[#111111] group-hover:text-black">
          {label}
        </span>
      </div>
      
      {/* Tooltip - visible on hover (desktop) or tap (mobile) */}
      {/* On mobile: left-aligned to prevent overflow. On desktop: centered */}
      <div className={`absolute bottom-full left-0 xs:left-1/2 xs:-translate-x-1/2 mb-3 w-[calc(100vw-3rem)] xs:w-64 max-w-64 p-4 bg-[#111111] text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none transform transition-all duration-200
        ${isTooltipVisible 
          ? 'opacity-100 visible translate-y-0' 
          : 'opacity-0 invisible translate-y-2 md:group-hover:opacity-100 md:group-hover:visible md:group-hover:translate-y-0'
        }`}
      >
        {/* Arrow - positioned at label on mobile, centered on desktop */}
        <div className="absolute top-full left-4 xs:left-1/2 xs:-translate-x-1/2 border-8 border-transparent border-t-[#111111]" />
        
        <p className="font-semibold mb-2.5 leading-relaxed text-white">{info.question}</p>
        <ul className="space-y-1.5 text-gray-300">
          {info.points.map(point => (
            <li key={point} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-white/60 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReviewForm({ onSubmit, initialName, isLoggedIn }: ReviewFormProps) {
  const [clarity, setClarity] = useState(0);
  const [purpose, setPurpose] = useState(0);
  const [aesthetics, setAesthetics] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(initialName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

  // Calculate completeness
  const isComplete = clarity > 0 && purpose > 0 && aesthetics > 0;
  
  // Validation check
  const canSubmit = isComplete && (isLoggedIn || name.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!isComplete) return;
    if (!isLoggedIn && !name.trim()) {
        setShowNameError(true);
        return;
    }
    
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
        const finalName = isLoggedIn ? (initialName || 'Member') : name.trim();
        onSubmit({ clarity, purpose, aesthetics }, comment, finalName);
        setIsSubmitting(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 xs:p-8 rounded-[32px] border-2 border-gray-100">
      <h3 className="font-semibold text-xl mb-8">Rate this Design</h3>
      
      <div className="space-y-4 mb-8">
        {/* CLARITY */}
        <div className="flex items-center justify-between gap-1">
            <CriteriaLabel 
                label="Clarity" 
                info={CRITERIA_INFO.Clarity} 
                iconUrl="https://img.icons8.com/external-creatype-blue-field-colourcreatype/100/external-clarity-tools-design-creatype-blue-field-colourcreatype.png" 
            />
            <div className="scale-80 xs:scale-90 min-[769px]:scale-100 origin-right transition-transform shrink-0">
                <StarRating rating={clarity} onChange={setClarity} interactive size="lg" />
            </div>
        </div>

        {/* PURPOSE */}
        <div className="flex items-center justify-between gap-1">
            <CriteriaLabel 
                label="Purpose" 
                info={CRITERIA_INFO.Purpose} 
                iconUrl="https://img.icons8.com/color/96/goal--v1.png" 
            />
            <div className="scale-80 xs:scale-90 min-[769px]:scale-100 origin-right transition-transform shrink-0">
                <StarRating rating={purpose} onChange={setPurpose} interactive size="lg" />
            </div>
        </div>

        {/* AESTHETICS */}
        <div className="flex items-center justify-between gap-1">
            <CriteriaLabel 
                label="Aesthetics" 
                info={CRITERIA_INFO.Aesthetics} 
                iconUrl="https://img.icons8.com/color/96/color-palette.png" 
            />
            <div className="scale-80 xs:scale-90 min-[769px]:scale-100 origin-right transition-transform shrink-0">
                <StarRating rating={aesthetics} onChange={setAesthetics} interactive size="lg" />
            </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
         <AnimatePresence mode="wait" initial={false}>
            {!isLoggedIn ? (
                <motion.div 
                    key="guest-name"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pb-1">
                        <Input 
                            placeholder="Your name" 
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (e.target.value.trim()) setShowNameError(false);
                            }}
                            className={`h-12 rounded-xl transition-all focus-visible:border-[#FEC312] ${
                                showNameError ? 'border-red-500 bg-red-50/30' : ''
                            }`}
                        />
                        {showNameError && (
                            <motion.p 
                                initial={{ opacity: 0, y: -5 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="text-[10px] text-red-500 font-semibold mt-1 ml-1 uppercase"
                            >
                                Name is required to rate
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="logged-in-label"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 py-1 px-1"
                >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-gray-500">
                        Reviewing as <span className="text-[#111111] font-semibold">{initialName}</span>
                    </span>
                </motion.div>
            )}
         </AnimatePresence>

         <div className="relative">
             <Textarea 
                placeholder={isLoggedIn ? `${initialName}, Add a comment... (Optional)` : "Optional comment..."} 
                value={comment}
                onChange={(e) => {
                    if (e.target.value.length <= 200) {
                        setComment(e.target.value);
                    }
                }}
                maxLength={200}
                className="min-h-[120px] rounded-xl resize-none p-4 pb-8 focus-visible:border-[#FEC312]"
             />
             <div className={`absolute bottom-3 right-4 text-xs transition-colors font-medium pointer-events-none ${
                 comment.length >= 200 ? 'text-red-500' : 'text-gray-400'
             }`}>
                 {comment.length} / 200
             </div>
         </div>
      </div>

      <Button 
        type="submit" 
        className="w-full sm:w-28 h-12 rounded-full text-lg font-medium transition-all" 
        variant={canSubmit ? "outline" : "outline"}
        disabled={!isComplete || isSubmitting}
        isLoading={isSubmitting}
      >
        Rate
      </Button>
    </form>
  );
}

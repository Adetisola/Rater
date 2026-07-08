"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  /** Position of the tooltip relative to the trigger. Default is 'top' (above trigger). */
  position?: 'top' | 'bottom';
  /** Alignment of the tooltip. Default is 'start' (left-aligned). */
  align?: 'start' | 'center' | 'end';
  /** Custom alignment classes, overrides the default align prop. */
  alignClassName?: string;
  /** Width of the tooltip content box. E.g. 'w-64', 'w-48'. */
  width?: string;
  /** Extra classes for the content box itself. */
  contentClassName?: string;
  /** Extra inline styles for the content box itself. */
  contentStyle?: React.CSSProperties;
  /** Gap bridging padding class. e.g., 'pb-1' if position is top. */
  gapClass?: string;
  /** Classes for the wrapper element. */
  triggerClassName?: string;
  /** Disables the tooltip entirely */
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  align = 'start',
  alignClassName,
  width = 'w-64',
  contentClassName = 'p-3 bg-white border-2 border-primary text-black text-[11px] rounded-xl shadow-xl',
  gapClass,
  triggerClassName = 'group relative inline-flex items-center',
  disabled = false,
  contentStyle,
}: TooltipProps) {
  const [isMobileVisible, setIsMobileVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobileVisible) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMobileVisible(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileVisible]);

  if (disabled) return <>{children}</>;

  const handleTap = () => {
    setIsMobileVisible(prev => !prev);
  };

  const positionClasses = position === 'top' 
    ? `bottom-full translate-y-2 ${isMobileVisible ? 'translate-y-0' : 'group-hover/tooltip:translate-y-0'}` 
    : `top-full -translate-y-2 ${isMobileVisible ? 'translate-y-0' : 'group-hover/tooltip:translate-y-0'}`;

  const alignClasses = alignClassName || (align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2');
  
  // Default gap bridge: pb-2 for top tooltip, pt-2 for bottom tooltip
  const defaultGapClass = position === 'top' ? 'pb-2' : 'pt-2';
  const effectiveGapClass = gapClass || defaultGapClass;

  return (
    <div 
      ref={containerRef}
      className={cn(triggerClassName, 'group/tooltip')}
      onClick={handleTap}
    >
      {children}
      
      {/* Tooltip Wrapper */}
      <div 
        className={cn(
          "absolute z-50 transition-all duration-200 delay-300 cursor-auto",
          positionClasses,
          alignClasses,
          effectiveGapClass,
          width,
          isMobileVisible ? 'opacity-100 visible' : 'opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible'
        )}
        onClick={(e) => e.stopPropagation()} // prevent clicks inside the tooltip from toggling it off
      >
        <div className={contentClassName} style={contentStyle}>
          {content}
        </div>
      </div>
    </div>
  );
}

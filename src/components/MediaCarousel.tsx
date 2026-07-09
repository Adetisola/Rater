import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedMedia } from './OptimizedMedia';
import type { MediaAsset } from '@/types';

interface MediaCarouselProps {
  media: MediaAsset[];
  variant?: 'thumbnail' | 'detail';
  className?: string;
  imageClassName?: string;
  onErrorChange?: (hasError: boolean) => void;
  onLoadChange?: (loaded: boolean) => void;
  onImageClick?: (index: number) => void;
  externalIndex?: number;
}

export function MediaCarousel({ 
  media, 
  variant = 'thumbnail', 
  className,
  imageClassName,
  onErrorChange,
  onLoadChange,
  onImageClick,
  externalIndex
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [coverHeight, setCoverHeight] = useState<number | null>(null);
  const coverImgRef = useRef<HTMLImageElement>(null);

  // If only one media, render simple version exactly as before
  if (media.length <= 1) {
    return (
      <div className={cn("w-full h-full relative", className)}>
        <OptimizedMedia 
          media={media[0]} 
          variant={variant} 
          priority={true} 
          className={imageClassName}
          onError={(e) => {
            onErrorChange?.(true);
            (e.target as HTMLImageElement).src = '/images/placeholder-image.jpg';
          }}
          onLoad={() => onLoadChange?.(true)}
        />
        {onImageClick && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer" 
            onClick={() => onImageClick(0)} 
          />
        )}
      </div>
    );
  }

  // Handle intersection observer to update current index based on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver((entries) => {
      // Filter out elements that don't have a width yet (initial mount)
      const visibleEntries = entries.filter(entry => 
        entry.isIntersecting && entry.boundingClientRect.width > 0
      );
      
      if (visibleEntries.length > 0) {
        // Find the one with the highest intersection ratio
        const mostVisible = visibleEntries.reduce((prev, current) => 
          prev.intersectionRatio > current.intersectionRatio ? prev : current
        );
        
        const index = Number(mostVisible.target.getAttribute('data-index'));
        if (!isNaN(index)) setCurrentIndex(index);
      }
    }, {
      root: el,
      threshold: 0.5
    });

    const children = Array.from(el.children);
    children.forEach(child => observer.observe(child));

    return () => observer.disconnect();
  }, [media.length]);

  // Sync from external index
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex >= 0 && externalIndex !== currentIndex) {
      scrollToIndex(externalIndex);
    }
  }, [externalIndex]);

  const scrollToIndex = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (scrollRef.current) {
      const el = scrollRef.current;
      const childWidth = el.clientWidth;
      el.scrollTo({
        left: index * childWidth,
        behavior: 'smooth'
      });
    }
  };

  // Hover handlers with 100ms delay for intentional feel
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
    setIsHovered(false);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Capture cover image height for thumbnail variant
  const handleCoverLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (variant === 'thumbnail') {
      const img = e.currentTarget;
      setCoverHeight(img.offsetHeight);
    }
    onLoadChange?.(true);
  }, [variant, onLoadChange]);

  // Recalculate cover height on resize
  useEffect(() => {
    if (variant !== 'thumbnail' || !coverImgRef.current) return;
    const observer = new ResizeObserver(() => {
      if (coverImgRef.current) {
        setCoverHeight(coverImgRef.current.offsetHeight);
      }
    });
    observer.observe(coverImgRef.current);
    return () => observer.disconnect();
  }, [variant]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < media.length - 1;

  // Determine if arrows should show (desktop hover only)
  const showPrev = isHovered && hasPrev;
  const showNext = isHovered && hasNext;

  return (
    <div 
      className={cn("relative w-full overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={variant === 'thumbnail' && coverHeight ? { height: coverHeight } : undefined}
    >
      
      {/* Scroll Container - Native snap for mobile, hidden scrollbar */}
      <div 
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {media.map((item, idx) => (
          <div 
            key={`${item.url}-${idx}`} 
            data-index={idx}
            className="w-full h-full shrink-0 snap-center relative"
          >
            {idx === 0 ? (
              <OptimizedMedia 
                ref={coverImgRef}
                media={item} 
                variant={variant}
                priority={true}
                loading="eager"
                className={cn(
                  imageClassName,
                  variant === 'thumbnail' ? 'w-full h-auto' : undefined
                )} 
                onError={() => onErrorChange?.(true)}
                onLoad={handleCoverLoad}
              />
            ) : (
              <OptimizedMedia 
                media={item} 
                variant={variant}
                priority={false}
                loading="lazy"
                className={cn(
                  imageClassName,
                  variant === 'thumbnail' ? 'w-full h-full object-cover' : undefined
                )} 
                onLoad={() => { if (idx === 0) onLoadChange?.(true); }}
              />
            )}
            {onImageClick && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => onImageClick(idx)} 
              />
            )}
          </div>
        ))}
      </div>

      {/* Adaptive Navigation Pill - Bottom Right */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 20,
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 9999,
          height: 28,
          overflow: 'hidden',
        }}
      >
        {/* Previous Arrow - slides in from left */}
        <div
          className="hidden sm:flex"
          style={{
            width: showPrev ? 28 : 0,
            opacity: showPrev ? 1 : 0,
            transition: 'width 220ms ease-out, opacity 180ms ease-out',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <button
            onClick={(e) => scrollToIndex(currentIndex - 1, e)}
            aria-label="Previous image"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderRadius: 9999,
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Counter - always visible, stable position */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#000',
            letterSpacing: '0.06em',
            paddingLeft: showPrev ? 0 : 10,
            paddingRight: showNext ? 0 : 10,
            transition: 'padding 220ms ease-out',
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'none',
            lineHeight: '28px',
            whiteSpace: 'nowrap',
          }}
        >
          {currentIndex + 1} / {media.length}
        </span>

        {/* Next Arrow - slides in from right */}
        <div
          className="hidden sm:flex"
          style={{
            width: showNext ? 28 : 0,
            opacity: showNext ? 1 : 0,
            transition: 'width 220ms ease-out, opacity 180ms ease-out',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <button
            onClick={(e) => scrollToIndex(currentIndex + 1, e)}
            aria-label="Next image"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderRadius: 9999,
              flexShrink: 0,
            }}
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

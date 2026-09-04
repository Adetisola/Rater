"use client";

import { useState, useMemo, type MouseEvent } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type ThumbnailPreset, 
  THUMBNAIL_PRESETS, 
  getOptimizedThumbnailUrl 
} from '@/lib/cloudinary/transforms';

export interface PostThumbnailProps {
  publicId?: string | null;
  imageUrl?: string | null;
  preset?: ThumbnailPreset;
  alt?: string;
  className?: string;
  imageClassName?: string;
  badgeCount?: number;
  priority?: boolean;
  onClick?: (e: MouseEvent) => void;
}

/**
 * PostThumbnail
 *
 * A self-dimensioning, high-performance thumbnail component for list and table contexts.
 * Automatically enforces width/height/aspect-ratio contracts, generates 2x DPR Cloudinary
 * transforms with intelligent auto-gravity cropping, and provides smooth shimmer/fallback handling.
 */
export function PostThumbnail({
  publicId,
  imageUrl,
  preset = 'POST_THUMBNAIL_SM',
  alt = 'Post thumbnail',
  className,
  imageClassName,
  badgeCount,
  priority = false,
  onClick,
}: PostThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const presetConfig = THUMBNAIL_PRESETS[preset] || THUMBNAIL_PRESETS.POST_THUMBNAIL_SM;

  const optimizedSrc = useMemo(() => {
    return getOptimizedThumbnailUrl({ publicId, url: imageUrl }, preset);
  }, [publicId, imageUrl, preset]);

  const hasImage = Boolean(optimizedSrc && !hasError);

  return (
    <div
      onClick={onClick}
      style={{
        width: `${presetConfig.containerWidth}px`,
        height: `${presetConfig.containerHeight}px`,
        aspectRatio: presetConfig.cssAspectRatio,
      }}
      className={cn(
        "relative rounded-2xl bg-surface-subtle overflow-hidden shrink-0 border border-border-default select-none",
        className
      )}
    >
      {/* Neutral Shimmer Placeholder while loading */}
      {hasImage && !isLoaded && (
        <div className="absolute inset-0 bg-surface-interactive animate-pulse" />
      )}

      {hasImage ? (
        <img
          src={optimizedSrc}
          alt={alt}
          width={presetConfig.containerWidth}
          height={presetConfig.containerHeight}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            imageClassName
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
          <ImageIcon size={Math.min(presetConfig.containerWidth * 0.4, 20)} />
        </div>
      )}

      {/* Multi-image count badge (e.g. +2) */}
      {typeof badgeCount === 'number' && badgeCount > 1 && (
        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[9px] font-extrabold text-white leading-none shadow-xs pointer-events-none">
          +{badgeCount - 1}
        </span>
      )}
    </div>
  );
}

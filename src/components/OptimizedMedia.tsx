import React, { forwardRef } from 'react';
import type { MediaAsset } from '@/types';
import { cn } from '@/lib/utils';

interface OptimizedMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  media: MediaAsset;
  variant?: 'thumbnail' | 'detail';
  priority?: boolean;
}

/**
 * OptimizedMedia
 * 
 * Generic media wrapper prepared for future Cloudinary integration.
 * Currently renders standard image tags, but architected to be hot-swapped
 * with `next-cloudinary`'s `<CldImage>` during backend migration.
 */
export const OptimizedMedia = forwardRef<HTMLImageElement, OptimizedMediaProps>(function OptimizedMedia({ 
  media, 
  variant = 'thumbnail', 
  priority = false, 
  className,
  alt,
  ...props 
}, ref) {
  
  if (media.type === 'video') {
    // Future-proofing for video support
    return (
      <video 
        src={media.url} 
        controls 
        className={cn("object-cover", className)} 
        {...props as any}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={media.url}
      alt={alt || "Post media"}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn("object-cover w-full h-full", className)}
      {...props}
    />
  );
});

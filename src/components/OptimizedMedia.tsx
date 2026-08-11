import React, { forwardRef, useMemo } from 'react';
import type { MediaAsset } from '@/types';
import { cn } from '@/lib/utils';
import { generateResponsiveUrls, extractPublicId } from '@/lib/cloudinary/transforms';

interface OptimizedMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  media: MediaAsset;
  variant?: 'thumbnail' | 'detail';
  priority?: boolean;
}

/**
 * OptimizedMedia
 * 
 * Generic media wrapper integrating Cloudinary transforms.
 */
export const OptimizedMedia = forwardRef<HTMLImageElement, OptimizedMediaProps>(function OptimizedMedia({ 
  media, 
  variant = 'thumbnail', 
  priority = false, 
  className,
  alt,
  ...props 
}, forwardedRef) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const innerRef = React.useRef<HTMLImageElement>(null);

  const setRefs = React.useCallback(
    (node: HTMLImageElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );
  
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

  // Memoize URL generation so we don't recalculate strings on every render
  const optimizedData = useMemo(() => {
    const publicId = media.public_id || (media.url ? extractPublicId(media.url) : null);
    if (!publicId) return null;
    return generateResponsiveUrls(publicId);
  }, [media.public_id, media.url]);

  const src = optimizedData ? optimizedData.src : media.url;
  const srcSet = optimizedData ? optimizedData.srcSet : undefined;

  // Check for cached images on mount
  React.useEffect(() => {
    if (innerRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [src, srcSet]);
  
  const sizes = variant === 'thumbnail'
    ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    : "(max-width: 768px) 100vw, 800px";

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    props.onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    props.onError?.(e);
  };

  // Detail variant: image dictates container size naturally (no crop)
  if (variant === 'detail') {
    return (
      <div className={cn("relative", className)}>
        {/* Blur Placeholder - hidden once loaded */}
        {optimizedData && (
          <img
            src={optimizedData.placeholder}
            className={cn(
              "absolute inset-0 w-full h-full object-cover blur-xl scale-110 z-0 transition-opacity duration-500",
              isLoaded ? "opacity-0" : "opacity-100"
            )}
            alt=""
            aria-hidden="true"
          />
        )}

        {/* Main Image - natural flow, no crop */}
        <img
          ref={setRefs}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt || "Post media"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={cn(
            "relative z-10 block transition-opacity duration-500 max-h-[150vh] md:max-h-[75vh]",
            !optimizedData || isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
          {...props}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // Thumbnail variant: fill container with crop (object-cover)
  return (
    <div className={cn("relative overflow-hidden bg-[#d1d5db]", className)}>
      {/* Blur Placeholder */}
      {optimizedData && (
        <img
          src={optimizedData.placeholder}
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 z-0"
          alt=""
          aria-hidden="true"
        />
      )}

      {/* Main Image */}
      <img
        ref={setRefs}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || "Post media"}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={cn(
          "object-cover w-full h-full relative z-10 transition-opacity duration-500",
          !optimizedData || isLoaded ? "opacity-100" : "opacity-0"
        )}
        {...props}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});

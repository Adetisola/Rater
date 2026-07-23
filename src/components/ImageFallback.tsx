"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageFallbackProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  placeholderSrc?: string;
  priority?: boolean;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onLoadChange?: (loaded: boolean) => void;
  onErrorChange?: (hasError: boolean) => void;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function ImageFallback({
  src,
  srcSet,
  sizes,
  placeholderSrc,
  priority = false,
  alt,
  className = '',
  fallbackClassName = '',
  onLoadChange,
  onErrorChange,
  onClick,
  children,
}: ImageFallbackProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryKey, setRetryKey] = useState<string>('');
  const cooldownRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset status when source changes
  useEffect(() => {
    if (!src || src.trim() === '') {
      setStatus('error');
      onLoadChange?.(true);
      onErrorChange?.(true);
      return;
    }
    setStatus('loading');
    setRetryKey('');
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = useCallback(() => {
    setStatus('loaded');
    setIsRetrying(false);
    onLoadChange?.(true);
    onErrorChange?.(false);
  }, [onLoadChange, onErrorChange]);

  const handleError = useCallback(() => {
    setStatus('error');
    setIsRetrying(false);
    onLoadChange?.(true);
    onErrorChange?.(true);
  }, [onLoadChange, onErrorChange]);

  // Append retry keys to URLs if we are retrying
  const currentSrc = retryKey && src ? `${src}${src.includes('?') ? '' : '?'}${retryKey}` : src;
  
  // Helper to append retry key to a srcSet string
  const currentSrcSet = retryKey && srcSet 
    ? srcSet.split(',').map(part => {
        const [url, size] = part.trim().split(' ');
        if (!url) return part;
        return `${url}${url.includes('?') ? '' : '?'}${retryKey} ${size}`;
      }).join(', ')
    : srcSet;

  // Check for cached images
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
      handleLoad();
    }
  }, [src, currentSrcSet, handleLoad]);

  const handleRetry = useCallback(() => {
    if (cooldownRef.current || status !== 'error') return;
    cooldownRef.current = true;
    setIsRetrying(true);

    setStatus('loading');
    setRetryKey(`&_retry=${Date.now()}`);

    setTimeout(() => { 
      cooldownRef.current = false; 
    }, 500);
  }, [status]);

  if (status === 'error') {
    return (
      <div
        className={`relative overflow-hidden ${fallbackClassName}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRetry();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRetry(); }}
      >
        {/* Dark background */}
        <div className="absolute inset-0 bg-gray-300" />

        {/* Content */}
        <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[130px] md:min-h-[160px] gap-2 md:gap-3 px-6 py-6 md:py-8 transition-opacity duration-300 ${isRetrying ? 'opacity-30' : 'opacity-100'}`}>
          {/* Desaturated Logo */}
          <img
            src="/icons/rater-logo-transparent-bg-stroked.svg"
            alt=""
            className="w-8 h-8 md:w-10 md:h-10 grayscale brightness-75 contrast-75 pointer-events-none select-none"
            draggable={false}
          />

          {/* Primary Text */}
          <p className="text-[10px] md:text-[13px] font-medium text-black text-center leading-tight select-none">
            This work couldn&apos;t be displayed
          </p>

          {/* Secondary Text */}
          <p className="text-[11px] text-gray-700 text-center select-none">
            {isMobile ? 'Tap to retry' : 'Click to retry'}
          </p>
        </div>

        {/* Hover state (desktop only) */}
        <div className="absolute inset-0 bg-white/3 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#d1d5db] ${fallbackClassName}`} onClick={onClick}>
      {/* Blur Placeholder */}
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 z-0"
          alt=""
          aria-hidden="true"
        />
      )}

      {/* Main Image */}
      {src && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={currentSrcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} relative z-10 transition-opacity duration-500 ease-in-out ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {children}
    </div>
  );
}

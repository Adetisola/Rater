"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageFallbackProps {
  src: string;
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
  const cooldownRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!src || src.trim() === '') {
      setStatus('error');
      onLoadChange?.(true);
      onErrorChange?.(true);
      return;
    }

    setStatus('loading');
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setStatus('loaded');
      setIsRetrying(false);
      onLoadChange?.(true);
      onErrorChange?.(false);
    };
    img.onerror = () => {
      setStatus('error');
      setIsRetrying(false);
      onLoadChange?.(true);
      onErrorChange?.(true);
    };
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    if (cooldownRef.current || status !== 'error') return;
    cooldownRef.current = true;
    setIsRetrying(true);

    // Bust cache with timestamp
    const separator = src.includes('?') ? '&' : '?';
    const retrySrc = `${src}${separator}_retry=${Date.now()}`;

    const img = new window.Image();
    img.src = retrySrc;
    img.onload = () => {
      setStatus('loaded');
      setIsRetrying(false);
      onLoadChange?.(true);
      onErrorChange?.(false);
      setTimeout(() => { cooldownRef.current = false; }, 500);
    };
    img.onerror = () => {
      setIsRetrying(false);
      setTimeout(() => { cooldownRef.current = false; }, 500);
    };
  }, [src, status, onLoadChange, onErrorChange]);

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
        <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[160px] gap-3 px-6 py-8 transition-opacity duration-300 ${isRetrying ? 'opacity-40' : 'opacity-100'}`}>
          {/* Desaturated Logo */}
          <img
            src="/icons/rater-logo-transparent-bg-stroked.svg"
            alt=""
            className="w-10 h-10 grayscale brightness-75 contrast-75 pointer-events-none select-none"
            draggable={false}
          />

          {/* Primary Text */}
          <p className="text-[13px] font-medium text-black text-center leading-tight select-none">
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

  if (status === 'loading') {
    return (
      <div className={`bg-[#d1d5db] animate-pulse ${fallbackClassName}`} />
    );
  }

  // status === 'loaded'
  return (
    <div className={`relative overflow-hidden ${fallbackClassName}`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300`}
        style={{ opacity: 1 }}
      />
      {children}
    </div>
  );
}

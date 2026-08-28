"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLearnMore: () => void;
}

export function WhatsNewModal({ isOpen, onClose, onLearnMore }: WhatsNewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock, focus management & keyboard trap
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore later
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus primary dismissal button after entrance
    const focusTimer = setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 50);

    // Respect prefers-reduced-motion for video autoplay
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches && videoRef.current) {
        videoRef.current.pause();
      }
    }

    // Keydown listener for Escape and Tab focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-new-title"
          aria-describedby="whats-new-desc"
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]"
          >
            {/* Top 35–40% Media Area */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/8.5] bg-gray-950 overflow-hidden rounded-t-[32px] shrink-0">
              {!videoFailed ? (
                <video
                  ref={videoRef}
                  src="/Rater v1.2 animated.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onError={() => setVideoFailed(true)}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              ) : (
                /* Fallback Branded Graphic if WebM fails */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-zinc-900 via-black to-zinc-950 select-none">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2 shadow-inner">
                    <img
                      src="/icons/rater-logo-white-bg.svg"
                      alt="Rater"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                    Rater v1.2.0
                  </span>
                </div>
              )}

              {/* Accessible Floating Close Control */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close What's New dialog"
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div>
                <h2
                  id="whats-new-title"
                  className="text-xl font-bold text-gray-950 tracking-tight"
                >
                  Rater v1.2.0
                </h2>
                <p
                  id="whats-new-desc"
                  className="text-xs text-gray-500 font-medium mt-1"
                >
                  A better way to share, discover &amp; discuss design.
                </p>
              </div>

              {/* Release Highlights */}
              <div className="space-y-3.5">
                {/* 1. Critiques */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 text-base shadow-2xs select-none">
                    💬
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-xs font-bold text-gray-950 tracking-tight">
                      Critiques are now conversations
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                      Reply to critiques and mention other creators.
                    </p>
                  </div>
                </div>

                {/* 2. Search & Discovery */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 text-base shadow-2xs select-none">
                    🔍
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-xs font-bold text-gray-950 tracking-tight">
                      Find creators &amp; work faster
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                      Smarter search and creator discovery.
                    </p>
                  </div>
                </div>

                {/* 3. Notifications */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 text-base shadow-2xs select-none">
                    🔔
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-xs font-bold text-gray-950 tracking-tight">
                      Stay in the loop
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                      Real-time notifications and web push.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLearnMore}
                  className="w-full sm:flex-1 h-11 rounded-2xl text-xs font-bold text-gray-800 border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  Learn More
                </Button>
                <Button
                  ref={primaryButtonRef}
                  type="button"
                  variant="primary"
                  onClick={onClose}
                  className="w-full sm:flex-1 h-11 rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

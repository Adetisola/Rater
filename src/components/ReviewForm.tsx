"use client";

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Button } from './ui/Button';

import { StarRating } from './ui/StarRating';

import { Tooltip } from './ui/Tooltip';

import { motion, AnimatePresence } from 'framer-motion';
import {
  loadDraft,
  saveDraft,
  deleteDraft,
  loadSnapshot,
  deleteSnapshot
} from '../utils/draftManager';
import { useDebounce } from '../hooks/useDebounce';
import type { Category } from '../types';
import { getReviewMode } from '../config/reviewModes';
import { RichTextarea } from './ui/RichTextarea';

/**
 * Props for the ReviewForm component.
 */
interface ReviewFormProps {
  onSubmit: (ratings: Record<string, number>, comment: string, reviewerName: string) => void | Promise<void>;
  isLoggedIn?: boolean;
  postId: string;
  userId?: string;
  userName?: string;
  postCategory?: Category;
  editingReview?: import('../types').Review | null;
  onCancelEdit?: () => void;
}

function CriteriaLabel({ label, info, iconUrl }: { label: string, info: { question: string, points: string[] }, iconUrl?: string }) {
  return (
    <Tooltip
      triggerClassName="group relative flex items-center cursor-help"
      alignClassName="left-0 min-[769px]:left-1/2 min-[769px]:-translate-x-1/2"
      width="w-[calc(100vw-3rem)] min-[769px]:w-64 max-w-64"
      contentClassName="p-4 bg-surface-elevated border-2 border-primary text-text-primary text-[11px] rounded-xl shadow-elevated"
      content={
        <>
          <p className="font-semibold mb-2.5 leading-relaxed">{info.question}</p>
          <ul className="space-y-1.5 text-text-secondary">
            {info.points.map(point => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-text-muted shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <div className="flex items-center gap-2 border-b-2 border-dotted border-border-default pb-0.5 transition-colors group-hover:border-primary select-none">
        {iconUrl && <img src={iconUrl} alt={`${label} icon`} className="w-5 h-5 object-contain" />}
        <span className="text-[14px] xs:text-base font-medium text-text-primary group-hover:text-text-primary">
          {label}
        </span>
      </div>
    </Tooltip>
  );
}

/**
 * A form component for submitting reviews on a post.
 * Features a star rating system across multiple criteria (Clarity, Purpose, Aesthetics),
 * a comment box, and draft persistence to survive auth interruptions.
 */
export function ReviewForm({
  onSubmit,
  isLoggedIn = true,
  postId,
  userId,
  userName,
  postCategory,
  editingReview,
  onCancelEdit
}: ReviewFormProps) {
  const modeConfig = getReviewMode(postCategory);
  const criteria = modeConfig.criteria;

  const [ratings, setRatings] = useState<Record<string, number>>(editingReview?.ratings || {});
  const [comment, setComment] = useState(editingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when editingReview changes
  useEffect(() => {
    if (editingReview) {
      setRatings(editingReview.ratings || {});
      setComment(editingReview.comment || '');
    } else {
      setRatings({});
      setComment('');
    }
  }, [editingReview]);

  // --- GSAP RATE BUTTON HOVER EXPLOSION LOGIC ---
  const btnRef = useRef<HTMLButtonElement>(null);
  const hoverTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Clean up active timelines on unmount
  useEffect(() => {
    return () => {
      if (hoverTimelineRef.current) {
        hoverTimelineRef.current.kill();
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (!btnRef.current || !isComplete) return;

    if (hoverTimelineRef.current) {
      hoverTimelineRef.current.kill();
    }

    const tl = gsap.timeline();
    hoverTimelineRef.current = tl;

    // 1. Character-by-Character Staggered 3D Roll (Super Snappy!)
    tl.to(btnRef.current.querySelectorAll('.rate-btn-span'), {
      y: "-1.3em",
      duration: 0.28,
      stagger: 0.02,
      ease: "power3.out"
    }, 0);

    // 2. Button Scale, Gold Background, and Glow
    tl.to(btnRef.current, {
      scale: 1.02,
      backgroundColor: "#FEC312", // Rich amber/gold background
      color: "#FFFFFF",
      borderColor: "#FEC312",
      boxShadow: "0 6px 20px rgba(254, 195, 18, 0.3)",
      duration: 0.15,
      ease: "power2.out"
    }, 0);
  };
  const handleMouseLeave = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (!btnRef.current) return;

    if (hoverTimelineRef.current) {
      hoverTimelineRef.current.kill();
    }

    const tl = gsap.timeline();
    hoverTimelineRef.current = tl;

    // Restore resting character state (roll back to 0 - Super Snappy!)
    tl.to(btnRef.current.querySelectorAll('.rate-btn-span'), {
      y: "0em",
      duration: 0.28,
      stagger: 0.02,
      ease: "power3.out"
    }, 0);

    // Restore resting button coordinates and color
    tl.to(btnRef.current, {
      scale: 1,
      backgroundColor: "#FFFFFF",
      color: "#000000",
      borderColor: "#FEC312",
      boxShadow: "0 0 0px rgba(254, 195, 18, 0)",
      duration: 0.2,
      ease: "power2.out"
    }, 0);
  };

  // --- GSAP SUCCESS CONFETTI RAIN LOGIC ---
  const triggerSuccessConfetti = () => {
    const confettiContainer = document.body;
    const particleCount = 45; // Lush, beautiful celebration rain!

    for (let i = 0; i < particleCount; i++) {
      const isStar = Math.random() > 0.4; // 60% stars, 40% other confetti shapes
      let element: HTMLElement;
      const size = isStar ? (18 + Math.random() * 20) : (8 + Math.random() * 10);

      if (isStar) {
        // Create custom inline SVG to support perfect gradient fills and vectors
        element = document.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as HTMLElement;
        element.setAttribute("viewBox", "0 0 83 80");
        element.setAttribute("class", "fixed pointer-events-none select-none z-[9999] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]");
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;

        // Create linearGradient
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        const gradId = `confetti-grad-${i}-${Math.random().toString(36).substring(2, 9)}`;
        gradient.setAttribute("id", gradId);
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "100%");
        gradient.setAttribute("y2", "100%");

        // Brand color gradient varieties
        const colors = [
          ["#fec312", "#ff4f6d", "#c400d2", "#7c3bed"],
          ["#ff4f6d", "#c400d2", "#7c3bed", "#fec312"],
          ["#7c3bed", "#fec312", "#ff4f6d", "#c400d2"]
        ][Math.floor(Math.random() * 3)];

        const stops = [
          { offset: "0%", color: colors[0] },
          { offset: "33%", color: colors[1] },
          { offset: "66%", color: colors[2] },
          { offset: "100%", color: colors[3] }
        ];

        stops.forEach(s => {
          const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          stop.setAttribute("offset", s.offset);
          stop.setAttribute("stop-color", s.color);
          gradient.appendChild(stop);
        });
        defs.appendChild(gradient);
        element.appendChild(defs);

        // Create star path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M33.4429 5.87036C35.9789 -1.9568 47.0211 -1.95678 49.5571 5.87037L53.5461 18.1821C54.6803 21.6825 57.933 24.0525 61.6032 24.0525H74.5121C82.7188 24.0525 86.131 34.5838 79.4916 39.4213L69.0481 47.0303C66.0789 49.1937 64.8365 53.0284 65.9706 56.5288L69.9596 68.8405C72.4957 76.6677 63.5624 83.1764 56.923 78.3389L46.4796 70.7299C43.5103 68.5665 39.4897 68.5665 36.5204 70.7299L26.077 78.339C19.4376 83.1764 10.5043 76.6676 13.0404 68.8405L17.0294 56.5288C18.1635 53.0284 16.9211 49.1937 13.9519 47.0303L3.5084 39.4213C-3.131 34.5838 0.281216 24.0525 8.48797 24.0525H21.3968C25.067 24.0525 28.3197 21.6825 29.4539 18.1821L33.4429 5.87036Z");
        path.setAttribute("fill", `url(#${gradId})`);
        element.appendChild(path);
      } else {
        // Create rectangular / round standard confetti piece in solid brand colors
        element = document.createElement("div");
        const brandColors = ["#fec312", "#ff4f6d", "#c400d2", "#7c3bed"];
        const randomColor = brandColors[Math.floor(Math.random() * brandColors.length)];
        const isRound = Math.random() > 0.5;

        element.className = `fixed pointer-events-none select-none z-[9999] shadow-sm ${isRound ? 'rounded-full' : 'rounded-sm'}`;
        element.style.width = isRound ? `${size}px` : `${size * 1.5}px`;
        element.style.height = `${size}px`;
        element.style.backgroundColor = randomColor;
      }

      // Initial top alignment just above the viewport, spread across screen width
      const startX = Math.random() * window.innerWidth;
      const startY = -50 - Math.random() * 100; // Staggered entry

      element.style.left = `${startX}px`;
      element.style.top = `${startY}px`;

      confettiContainer.appendChild(element);

      // Animation parameters
      const travelDistanceY = window.innerHeight + 150;
      const driftX = (Math.random() - 0.5) * 160; // Swaying motion
      const rotation = (Math.random() - 0.5) * 720; // 3D spin roll
      const duration = 2.0 + Math.random() * 2.0; // Gentler drift (2-4 seconds)
      const delay = Math.random() * 0.8; // Beautiful staggered cascades

      gsap.to(element, {
        y: travelDistanceY,
        x: driftX,
        rotation: rotation,
        opacity: 0.1, // Fade out at the bottom
        duration: duration,
        delay: delay,
        ease: "sine.inOut",
        onComplete: () => {
          element.remove();
        }
      });
    }
  };



  // --- DRAFT SYSTEM ---

  // 1. Initial Load & Recovery
  useEffect(() => {
    // Priority 1: Auth Snapshot (after login/signup)
    const snapshot = loadSnapshot(postId);

    // Priority 2: Persistent Local Draft
    const localDraft = userId ? loadDraft(postId, userId) : null;

    // Merge logic: Snapshot usually wins as it's the most recent unsaved state during auth
    const draftToRestore = snapshot || localDraft;

    if (draftToRestore) {
      if (draftToRestore.ratings) setRatings(draftToRestore.ratings);
      if (draftToRestore.comment) setComment(draftToRestore.comment);
    }
  }, [postId, isLoggedIn, userId]);

  // 2. Auto-Save (Debounced)
  const currentDraftData = {
    ratings,
    comment
  };
  const debouncedDraft = useDebounce(currentDraftData, 800);

  useEffect(() => {
    // Only save if there is some progress
    const hasRatings = Object.values(ratings).some(val => val && val > 0);
    const hasProgress = hasRatings || comment.trim();
    if (hasProgress && userId) {
      saveDraft(postId, userId, debouncedDraft);
    }
  }, [debouncedDraft, postId, userId]);

  // Calculate completeness
  const isComplete = criteria.every(c => (ratings[c.dbKey] || 0) > 0);

  const [inlineSubmitError, setInlineSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineSubmitError(null);

    // Final validation
    if (!isComplete) return;
    if (!isLoggedIn) return;

    setIsSubmitting(true);
    
    try {
      if (editingReview) {
        await onSubmit(ratings, comment.trim(), userName || 'Anonymous');
        if (onCancelEdit) onCancelEdit();
      } else {
        await Promise.all([
          onSubmit(ratings, comment.trim(), userName || 'Anonymous'),
          new Promise(resolve => setTimeout(resolve, 500))
        ]);

        // Trigger screen success confetti rain!
        triggerSuccessConfetti();

        setRatings({});
        setComment('');

        if (userId) {
          deleteDraft(postId, userId);
        }
        deleteSnapshot(postId);
      }
    } catch (err: any) {
      const normalized = await import('@/lib/errors/normalizeError').then(m => m.normalizeError(err, {
        fallbackCode: 'RATER_REVIEW_001',
        fallbackMessage: 'Failed to submit review. Please try again.'
      }));
      setInlineSubmitError(normalized.userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full pt-2">
        {/* <h3 className="font-semibold text-xl mb-8 text-center">Rate this Work</h3> */}

        <div className="space-y-4 mb-8">
          {criteria.map((c) => (
            <div key={c.dbKey} className="flex items-center justify-between gap-1">
              <CriteriaLabel
                label={c.label}
                info={{ question: c.question, points: c.points }}
                iconUrl={c.iconUrl}
              />
              <div className="scale-80 xs:scale-90 min-[769px]:scale-100 origin-right transition-transform shrink-0">
                <StarRating
                  rating={ratings[c.dbKey] || 0}
                  onChange={(val) => setRatings(prev => ({ ...prev, [c.dbKey]: val }))}
                  interactive
                  size="lg"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-8">


          <div>
            <div className="relative">
              <RichTextarea
                placeholder={userName ? `${userName}, what do you think?...` : "What do you think?..."}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                }}
                maxLength={500}
                className="min-h-30 rounded-xl resize-none p-4 pb-8 focus-visible:border-primary font-sans"
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {inlineSubmitError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex justify-center mb-3"
            >
              <p className="text-xs text-red-500 font-medium">
                {inlineSubmitError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

          {/* Submit/Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            {editingReview && onCancelEdit && (
              <Button
                variant="ghost"
                type="button"
                onClick={onCancelEdit}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-gray-500 font-semibold h-12 rounded-full px-6"
              >
                Cancel
              </Button>
            )}
            <Button
              ref={btnRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              type="submit"
              className="relative w-full sm:w-28 h-12 rounded-full text-lg font-medium transition-all overflow-hidden"
              variant="outline"
              disabled={!isComplete || isSubmitting}
              isLoading={isSubmitting}
            >
              <div className="relative w-14 h-[1.3em] overflow-hidden flex justify-center items-center pointer-events-none select-none">
                {['S', 'a', 'v', 'e'].map((_, index) => (
                  <span
                    key={index}
                    className="rate-btn-span inline-block relative font-medium text-lg"
                    style={{
                      textShadow: "0px 1.3em currentColor",
                      transform: "translateY(0.001deg)"
                    }}
                  >
                    {editingReview ? (['S', 'a', 'v', 'e'][index] || '') : (['R', 'a', 't', 'e'][index] || '')}
                  </span>
                ))}
              </div>
            </Button>
          </div>
      </form>

    </>
  );
}

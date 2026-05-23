"use client";

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { StarRating } from './ui/StarRating';
import { Input } from './ui/Input';
import { useGuestEngagementPrompt } from '../hooks/useGuestEngagementPrompt';
import { GuestSignupPrompt } from './GuestSignupPrompt';

import { motion, AnimatePresence } from 'framer-motion';
import {
  loadDraft,
  saveDraft,
  deleteDraft,
  saveSnapshot,
  loadSnapshot,
  deleteSnapshot,
  migrateDraft,
  getGuestSessionId
} from '../utils/draftManager';
import { useDebounce } from '../hooks/useDebounce';

/**
 * Props for the ReviewForm component.
 */
interface ReviewFormProps {
  onSubmit: (ratings: { clarity: number; purpose: number; aesthetics: number }, comment: string, reviewerName: string) => void | Promise<void>;
  initialName?: string;
  isLoggedIn?: boolean;
  postId: string;
  userId?: string;
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
        <span className="text-[14px] xs:text-base font-medium text-black group-hover:text-black">
          {label}
        </span>
      </div>

      {/* Tooltip - visible on hover (desktop) or tap (mobile) */}
      {/* On mobile: left-aligned to prevent overflow. On desktop: centered */}
      <div className={`absolute bottom-full left-0 min-[769px]:left-1/2 min-[769px]:-translate-x-1/2 mb-3 w-[calc(100vw-3rem)] min-[769px]:w-64 max-w-64 p-4 bg-[#111111] text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none transform transition-all duration-200
        ${isTooltipVisible
          ? 'opacity-100 visible translate-y-0'
          : 'opacity-0 invisible translate-y-2 md:group-hover:opacity-100 md:group-hover:visible md:group-hover:translate-y-0'
        }`}
      >
        {/* Arrow - positioned at label on mobile, centered on desktop */}
        <div className="absolute top-full left-4 min-[769px]:left-1/2 min-[769px]:-translate-x-1/2 border-8 border-transparent border-t-[#111111]" />

        <p className="font-medium mb-2.5 leading-relaxed text-white">{info.question}</p>
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

/**
 * A form component for submitting reviews on a post.
 * Features a star rating system across multiple criteria (Clarity, Purpose, Aesthetics),
 * a comment box, and draft persistence to survive auth interruptions.
 * Also intelligently prompts guest users to sign up after filling out their name.
 */
export function ReviewForm({ onSubmit, initialName, isLoggedIn, postId, userId }: ReviewFormProps) {
  const [clarity, setClarity] = useState(0);
  const [purpose, setPurpose] = useState(0);
  const [aesthetics, setAesthetics] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(initialName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

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

  // Guest engagement prompt — triggers only after name field completion
  const {
    isVisible: isPromptVisible,
    dismiss: dismissPrompt,
    personalizedTitle,
    guestName: resolvedGuestName,
  } = useGuestEngagementPrompt({
    guestName: isLoggedIn ? '' : name,
    isNameFocused,
  });

  // --- DRAFT SYSTEM ---

  // 1. Initial Load & Recovery
  useEffect(() => {
    // Priority 1: Auth Snapshot (after login/signup)
    const snapshot = loadSnapshot(postId);

    // Priority 2: Persistent Local Draft
    const localDraft = loadDraft(postId, userId);

    // Merge logic: Snapshot usually wins as it's the most recent unsaved state during auth
    const draftToRestore = snapshot || localDraft;

    if (draftToRestore) {
      if (draftToRestore.ratings?.clarity) setClarity(draftToRestore.ratings.clarity);
      if (draftToRestore.ratings?.purpose) setPurpose(draftToRestore.ratings.purpose);
      if (draftToRestore.ratings?.aesthetics) setAesthetics(draftToRestore.ratings.aesthetics);
      if (draftToRestore.comment) setComment(draftToRestore.comment);
      if (draftToRestore.name && !isLoggedIn) setName(draftToRestore.name);

      // Clear snapshot after use
      if (snapshot) deleteSnapshot(postId);
    }

    // Handle Migration: Guest -> User
    if (isLoggedIn && userId) {
      migrateDraft(postId, getGuestSessionId(), userId);
    }
  }, [postId, isLoggedIn, userId]);

  // 2. Auto-Save (Debounced)
  const currentDraftData = {
    ratings: { clarity, purpose, aesthetics },
    comment,
    name
  };
  const debouncedDraft = useDebounce(currentDraftData, 800);

  useEffect(() => {
    // Only save if there is some progress
    const hasProgress = clarity > 0 || purpose > 0 || aesthetics > 0 || comment.trim() || name.trim();
    if (hasProgress) {
      saveDraft(postId, userId, debouncedDraft);
    }
  }, [debouncedDraft, postId, userId]);

  // 3. Auth Interruption Snapshot
  const handleBeforeSignup = () => {
    saveSnapshot(postId, currentDraftData);
  };

  // Calculate completeness
  const isComplete = clarity > 0 && purpose > 0 && aesthetics > 0;

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

      // Trigger screen success confetti rain!
      triggerSuccessConfetti();

      onSubmit({ clarity, purpose, aesthetics }, comment, finalName);

      // Clear drafts on success
      deleteDraft(postId, userId);
      deleteSnapshot(postId);

      setIsSubmitting(false);
    }, 800);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white p-5 xs:p-8 rounded-[24px] border-2 border-gray-100">
        <h3 className="font-semibold text-xl mb-8 text-center">Rate this Design</h3>

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
            {!isLoggedIn && (
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
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    className={`h-12 rounded-xl transition-all focus-visible:border-[#FEC312] ${showNameError ? 'border-red-500 bg-red-50/30' : ''
                      }`}
                  />
                  {showNameError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-red-500 font-semibold mt-1 ml-1"
                    >
                      Name is required to rate
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Textarea
              placeholder={isLoggedIn ? `${initialName}, What do you think?...` : "What do you think?..."}
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setComment(e.target.value);
                }
              }}
              maxLength={200}
              className="min-h-[120px] rounded-xl resize-none p-4 pb-8 focus-visible:border-[#FEC312]"
            />
            <div className={`absolute bottom-3 right-4 text-xs transition-colors font-medium pointer-events-none ${comment.length >= 200 ? 'text-red-500' : 'text-gray-400'
              }`}>
              {comment.length} / 200
            </div>
          </div>
        </div>

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
          <div className="relative w-[3.5rem] h-[1.3em] overflow-hidden flex justify-center items-center pointer-events-none select-none">
            {['R', 'a', 't', 'e'].map((char, index) => (
              <span
                key={index}
                className="rate-btn-span inline-block relative font-medium text-lg"
                style={{
                  textShadow: "0px 1.3em currentColor",
                  transform: "translateY(0.001deg)"
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </Button>
      </form>

      <GuestSignupPrompt
        isVisible={isPromptVisible}
        onDismiss={dismissPrompt}
        onBeforeSignup={handleBeforeSignup}
        personalizedTitle={personalizedTitle}
        guestName={resolvedGuestName}
      />
    </>
  );
}

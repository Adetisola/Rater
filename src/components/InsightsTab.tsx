"use client";

/**
 * InsightsTab — Hybrid Perception Synthesis (Deterministic + LLM)
 *
 * Architecture:
 * 1. Criterion progress bars always visible (deterministic)
 * 2. "Generate Insights" button triggers LLM synthesis via /api/insights
 * 3. LLM output (summary + strengths + areas to improve) rendered below bars
 * 4. Results cached in localStorage (24h TTL, invalidated on new reviews)
 * 5. On error → silent fallback to deterministic engine output
 *
 * The LLM is the "writer", the deterministic engine is the "thinker".
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import type { Review, Category } from '@/types';
import { TrendingUp, TrendingDown, Sparkles, MessageCircle, RefreshCw, Loader2, AlertCircle, Info } from 'lucide-react';
import { getReviewMode } from '@/config/reviewModes';
import { getCachedInsight, setCachedInsight, type CachedInsight } from '@/utils/insightCache';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { AuthOverlay } from './AuthOverlay';
import { LegalModal } from './LegalModal';
import { Tooltip } from './ui/Tooltip';

// ─── Criterion Score Analysis ────────────────────────────────────────────────

interface CriterionInsight {
  label: string;
  icon: React.ReactNode;
  average: number;
  sentiment: 'positive' | 'neutral' | 'needs_work';
  info: { question: string, points: string[] };
}

function analyzeCriteria(reviews: Review[], category?: Category): {
  criteria: CriterionInsight[];
  overallAverage: number;
} {
  if (reviews.length === 0) {
    return { criteria: [], overallAverage: 0 };
  }

  const modeConfig = getReviewMode(category);
  const activeCriteria = modeConfig.criteria;

  const getSentiment = (avg: number): 'positive' | 'neutral' | 'needs_work' => {
    if (avg >= 4.0) return 'positive';
    if (avg >= 3.0) return 'neutral';
    return 'needs_work';
  };

  const criteria: CriterionInsight[] = activeCriteria.map(c => {
    let sum = 0;
    let count = 0;
    for (const r of reviews) {
      if (r.ratings?.[c.dbKey] != null) {
        sum += r.ratings[c.dbKey] as number;
        count++;
      }
    }
    const rawAvg = count > 0 ? sum / count : 0;
    const avg = Math.round(rawAvg * 10) / 10;

    return {
      label: c.label,
      icon: <img src={c.iconUrl} alt={`${c.label} icon`} className="w-6 h-6 object-contain" />,
      average: avg,
      sentiment: getSentiment(avg),
      info: { question: c.question, points: c.points },
    };
  });

  const overallAverage = reviews.length > 0
    ? reviews.reduce((acc, review) => {
      let sum = 0;
      let count = 0;
      activeCriteria.forEach(c => {
        const val = review.ratings?.[c.dbKey];
        if (typeof val === 'number' && val > 0) {
          sum += val;
          count++;
        }
      });
      const avg = count > 0 ? sum / count : 0;
      return acc + avg;
    }, 0) / reviews.length
    : 0;

  return { criteria, overallAverage };
}

function InsightCriterionLabel({ children, info }: { children: React.ReactNode, info: { question: string, points: string[] } }) {
  return (
    <Tooltip
      triggerClassName="group relative flex items-center cursor-help w-full"
      width="w-[calc(100vw-3rem)] min-[769px]:w-64 max-w-64"
      contentClassName="p-4 bg-white border-2 border-primary text-black text-[11px] rounded-xl shadow-xl"
      content={
        <>
          <p className="font-semibold mb-2.5 leading-relaxed whitespace-normal">{info.question}</p>
          <ul className="space-y-1.5 text-gray-700">
            {info.points.map(point => (
              <li key={point} className="flex items-start gap-2 whitespace-normal text-left">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ul>
        </>
      }
    >
      {children}
    </Tooltip>
  );
}

// ─── LLM Synthesis Hook ─────────────────────────────────────────────────────

type SynthesisState = 'idle' | 'loading' | 'done' | 'error';

function useInsightSynthesis(
  reviews: Review[],
  postId: string,
  postCategory?: Category,
  postTitle?: string,
  postDescription?: string,
) {
  const [state, setState] = useState<SynthesisState>('idle');
  const [result, setResult] = useState<CachedInsight | null>(null);
  const [model, setModel] = useState<string>('');

  // Check cache on mount
  useEffect(() => {
    let mounted = true;
    async function checkCache() {
      const cached = await getCachedInsight(postId, reviews.length);
      if (cached && mounted) {
        setResult(cached);
        setModel(cached.model || '');
        setState('done');
      }
    }
    checkCache();
    return () => { mounted = false; };
  }, [postId, reviews.length]);

  const generate = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await getCachedInsight(postId, reviews.length);
      if (cached) {
        setResult(cached);
        setState('done');
        return;
      }
    }

    // We no longer extract signals on the client. The backend does everything.
    // We just ensure we have enough reviews before making the call.
    if (reviews.length < 2) {
      return;
    }

    setState('loading');

    try {
      // Retry logic for rate limits (429)
      const MAX_RETRIES = 2;
      let lastError: Error | null = null;
      let data: CachedInsight | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          // Wait before retrying: 3s, then 6s
          await new Promise(r => setTimeout(r, attempt * 3000));
        }

        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews,
            postCategory,
            postTitle,
            postDescription
          }),
        });

        if (response.status === 429 && attempt < MAX_RETRIES) {
          lastError = new Error('Rate limited, retrying...');
          continue;
        }

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(`API error ${response.status}: ${errBody.error || 'Unknown'}`);
        }

        data = await response.json();
        break;
      }

      if (!data) throw lastError || new Error('Failed after retries');
      // Validate response
      if (!data.summary || !Array.isArray(data.strengths) || !Array.isArray(data.areasToImprove)) {
        throw new Error('Invalid response shape');
      }

      await setCachedInsight(postId, data, reviews.length);
      setResult(data);
      setModel(data.model || '');
      setState('done');
    } catch (err) {
      console.error('Insight generation failed:', err);
      setState('error');
    }
  }, [reviews, postId, postCategory, postTitle, postDescription]);

  return { state, result, model, generate };
}

// ─── Component ───────────────────────────────────────────────────────────────

const LOADING_PHRASES = [
  "Reading the room...",
  "Gathering good stuff...",
  "Checking the vibe...",
  "Putting it together...",
  "Almost there."
];

const STAGGER_DELAYS = [1500, 2000, 2500, 3000];

function LoadingTextAnimation() {
  const [index, setIndex] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const nextStep = (currentIndex: number) => {
      if (currentIndex >= LOADING_PHRASES.length - 1) return; // hold at last step

      const delay = STAGGER_DELAYS[currentIndex] || 2000;

      timeout = setTimeout(() => {
        if (!textRef.current) return;
        // fade out
        gsap.to(textRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: "power1.inOut",
          onComplete: () => {
            setIndex(currentIndex + 1);
            // fade in
            if (textRef.current) {
              gsap.to(textRef.current, {
                opacity: 1,
                duration: 0.25,
                ease: "power1.inOut",
                onComplete: () => {
                  nextStep(currentIndex + 1);
                }
              });
            }
          }
        });
      }, delay);
    };

    nextStep(0);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!textRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(textRef.current, {
        backgroundPositionX: "200%",
        duration: 3,
        ease: "none",
        repeat: -1
      });
    }, textRef);
    return () => ctx.revert();
  }, []);

  return (
    <span
      ref={textRef}
      className="text-[13px] font-medium min-w-[150px] inline-block"
      style={{
        backgroundImage: 'linear-gradient(to right, var(--color-primary, #fec312), #ff4f6d, #c400d2, #7c3bed, var(--color-primary, #fec312))',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        whiteSpace: 'nowrap'
      }}
    >
      {LOADING_PHRASES[index]}
    </span>
  );
}

function FastTypewriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(false);
    let i = 0;
    let interval: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      setIsTyping(true);
      interval = setInterval(() => {
        i += 2; // type 2 characters at a time for speed
        if (i > text.length) i = text.length;
        setDisplayedText(text.slice(0, i));

        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 15);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay]);

  return (
    <>
      {displayedText}
      {isTyping && <span className="inline-block w-[3px] h-[1em] ml-0.5 bg-gray-300 align-middle opacity-70" />}
    </>
  );
}

interface InsightsTabProps {
  reviews: Review[];
  postCategory?: Category;
  postTitle?: string;
  postDescription?: string;
  postId: string;
}

export function InsightsTab({ reviews, postCategory, postTitle, postDescription, postId }: InsightsTabProps) {
  const { currentProfile } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; title: string; docUrl: string }>({
    isOpen: false,
    title: '',
    docUrl: ''
  });

  const { criteria, overallAverage } = useMemo(
    () => analyzeCriteria(reviews, postCategory),
    [reviews, postCategory]
  );

  const { state, result, model, generate } = useInsightSynthesis(
    reviews, postId, postCategory, postTitle, postDescription
  );

  // Check if threshold is met for showing the generate button
  const meetsThreshold = reviews.length >= 2;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Allow a 15px buffer for hitting the bottom
    setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 15);
  }, []);

  // Update scroll mask visibility when results load or change
  useEffect(() => {
    if (state === 'done' && result) {
      // Small timeout to allow DOM layout
      const timer = setTimeout(() => {
        handleScroll();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [state, result, handleScroll]);

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-5 h-5 text-gray-300" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Insights appear after the first review</p>
      </div>
    );
  }

  const roundedOverall = Math.round(overallAverage * 10) / 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Overall Score */}
      <div className="text-center pb-1">
        <div className="text-2xl font-semibold text-black">{roundedOverall}</div>
        <p className="text-xs text-gray-400 mt-0.5">Overall average from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
      </div>

      {/* Per-Criterion Breakdown */}
      <div className="space-y-2.5">
        {criteria.map((c) => (
          <InsightCriterionLabel key={c.label} info={c.info}>
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 flex items-center justify-center shrink-0">
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-black">{c.label}</span>
                  <span className="text-sm font-semibold text-black tabular-nums">{c.average}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.average / 5) * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`h-full rounded-full ${c.sentiment === 'positive'
                      ? 'bg-emerald-400'
                      : c.sentiment === 'needs_work'
                        ? 'bg-amber-400'
                        : 'bg-gray-300'
                      }`}
                  />
                </div>
              </div>
            </div>
          </InsightCriterionLabel>
        ))}
      </div>

      {/* ── Synthesis Section ─────────────────────────────────────────── */}

      {!currentProfile ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 py-8 px-3 bg-gray-50 rounded-[20px] border border-gray-100 flex flex-col items-center text-center"
        >
          <img
            src="/icons/rater-logo-white-bg.svg"
            alt="Rater"
            className="w-12 h-12 mb-4"
          />
          <h3 className="text-md font-medium text-black mb-1.5">Let's look deeper.</h3>
          <p className="text-xs text-gray-500 mb-6 max-w-[260px] leading-relaxed">
            Create an avatar to unlock audience perception insights and see exactly how this work is landing.
          </p>
          <Button onClick={() => setShowAuthOverlay(true)} variant="primary" className="px-6 h-10 rounded-full font-medium text-sm">
            Create Profile
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Generated Result */}
          {state === 'done' && result && (
            <motion.div
              key="insights-result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="space-y-4 pt-1 pb-4 pr-2 max-h-[50vh] overflow-y-auto custom-scrollbar"
              >
                {/* Summary */}
                {result.summary && (
                  <div className="flex items-start gap-2">
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                      <FastTypewriter text={result.summary} delay={0} />
                    </p>
                    {/* Refresh button */}
                    <button
                      type="button"
                      onClick={() => generate(true)}
                      className="shrink-0 mt-0.5 p-1 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                      title="Regenerate insights"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Strengths */}
                {result.strengths && result.strengths.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Strengths
                    </h4>
                    <div className="space-y-2.5">
                      {result.strengths.map((observation, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 mt-[7px] shrink-0" />
                          <p className="text-[13px] text-gray-600 leading-relaxed">
                            <FastTypewriter text={observation} delay={300 + i * 150} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas to Improve */}
                {result.areasToImprove && result.areasToImprove.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-amber-500" />
                      Areas to Improve
                    </h4>
                    <div className="space-y-2.5">
                      {result.areasToImprove.map((observation, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-1 h-1 rounded-full bg-amber-400 mt-[7px] shrink-0" />
                          <p className="text-[13px] text-gray-600 leading-relaxed">
                            <FastTypewriter text={observation} delay={500 + (result.strengths.length * 150) + (i * 150)} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom fade mask for scrollable area */}
              <div
                className={`absolute bottom-[36px] left-0 right-2 h-8 bg-linear-to-t from-white to-transparent pointer-events-none transition-opacity duration-300 ${isScrolledToBottom ? 'opacity-0' : 'opacity-100'}`}
              />

              {/* Footer info: Sources & Model indicator (Outside scroll area to prevent tooltip clipping) */}
              <div className="flex justify-between items-center pt-3 pb-1 border-t border-gray-50 mt-1">
                <Tooltip
                  width="w-64"
                  gapClass="pb-1"
                  content={
                    <>
                      <p className="leading-relaxed">
                        Synthesized from <strong className="font-semibold">{reviews.length}</strong> user reviews, analyzing ratings and written feedback.
                      </p>
                      <p className="text-[10px] text-gray-500 leading-relaxed border-t border-gray-100 pt-2 mt-2">
                        AI-generated insights may be imperfect. Learn more in the{' '}
                        <button 
                          type="button"
                          onClick={() => setLegalModal({ isOpen: true, title: 'AI & Insights Policy', docUrl: '/legal/Rater AI & Insights Policy.md' })}
                          className="font-semibold text-gray-600 hover:text-black transition-colors"
                        >
                          AI &amp; Insights Policy
                        </button>.
                      </p>
                    </>
                  }
                >
                  <button
                    type="button"
                    className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 py-1 pr-4"
                  >
                    <Info className="w-3 h-3" />
                    Sources
                  </button>
                </Tooltip>

                {model && (
                  <p className="text-[10px] text-gray-400">
                    Powered by {model}
                  </p>
                )}
              </div>

            </motion.div>
          )}

          {/* Loading State */}
          {state === 'loading' && (
            <motion.div
              key="insights-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-4" />
              <LoadingTextAnimation />
            </motion.div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <motion.div
              key="insights-error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="flex items-start gap-2.5 py-3 px-4 bg-gray-50 rounded-2xl relative">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[13px] text-red-500 leading-relaxed pr-6">
                  We couldn't pull the insights right now, your network dey stress.
                </p>
                <button
                  type="button"
                  onClick={() => generate(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Try again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Generate Button (idle state, threshold met) */}
          {state === 'idle' && meetsThreshold && (
            <motion.div
              key="insights-generate"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="pt-2"
            >
              <Button
                type="button"
                onClick={() => generate()}
                className="w-full flex items-center justify-center gap-0.5 py-3 text-[13px] font-medium rounded-full"
              >
                Generate Insights
              </Button>
            </motion.div>
          )}

          {/* Below Threshold */}
          {state === 'idle' && !meetsThreshold && reviews.length > 0 && (
            <motion.div
              key="insights-threshold"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="flex items-start gap-2.5 py-3 px-4 bg-gray-50 rounded-2xl">
                <MessageCircle className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <p className="text-[13px] text-gray-400 leading-relaxed">
                  Not enough feedback yet to generate meaningful insights.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {showAuthOverlay && <AuthOverlay initialTab="signup" redirectOnSuccess={false} onClose={() => setShowAuthOverlay(false)} />}
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
        title={legalModal.title}
        docUrl={legalModal.docUrl}
      />
    </motion.div>
  );
}

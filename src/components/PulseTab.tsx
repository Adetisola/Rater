"use client";

/**
 * PulseTab — Inline tab content for the Pulse feedback session feature.
 *
 * States:
 * 1. Creator + No Session → "Launch a Pulse" creation form
 * 2. Active Session → Voting UI + live results + countdown
 * 3. Expired Session → Historical record of final results
 * 4. Not Creator + No Session → null (tab is hidden by parent)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import type { PulseSession, PulseType, PulseDuration } from '@/types';
import { PULSE_DURATION_LABELS } from '@/types';
import {
  getPulseSession,
  isPulseActive,
  hasVotedInPulse,
  createPulseSession,
  voteInPulse,
  getPulseResults,
  getPulseSliderAverage,
  getPulseTimeRemaining,
} from '../utils/pulseManager';
import { Clock, CheckCircle2, BarChart3, SlidersHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/Button"

// ─── Sub-Components ───────────────────────────────────────────────────────────

function AnimatedPulseIcon() {
  return (
    <div className="flex items-end justify-center gap-[3px] w-5 h-5">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: ["40%", "100%", "40%"]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2
          }}
          style={{ height: "40%" }}
        />
      ))}
    </div>
  );
}

function TactileSlider({ min, max, step, value, onChange }: { min: number, max: number, step: number, value: number, onChange: (val: number) => void }) {
  const percentage = ((value - min) / (max - min)) * 100;

  // Track dragging/hover state
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isActive = isHovered || isDragging;

  const bubbleRef = useRef<HTMLDivElement>(null);
  const lastValRef = useRef(value);

  // GSAP Inertial Physics
  useEffect(() => {
    const delta = value - lastValRef.current;
    lastValRef.current = value;

    if (isActive && bubbleRef.current && delta !== 0) {
      // Sensitive tilt: highly exaggerated on small movements
      const maxTilt = 50;
      const rawTilt = delta * -40; // Super exaggerated tilt multiplier
      const tilt = Math.max(-maxTilt, Math.min(maxTilt, rawTilt));

      // Kill any active tweens on the bubble to prevent conflicts
      gsap.killTweensOf(bubbleRef.current);

      gsap.to(bubbleRef.current, {
        rotate: tilt,
        duration: 0.15,
        overwrite: "auto",
        onComplete: () => {
          // Bouncy, rubber-band snap back to 0
          gsap.to(bubbleRef.current, {
            rotate: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.4)"
          });
        }
      });
    }
  }, [value, isActive]);

  return (
    <div
      className="relative w-full h-8 flex items-center group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={() => setIsDragging(true)}
      onPointerUp={() => setIsDragging(false)}
      onPointerCancel={() => setIsDragging(false)}
    >
      {/* The visible track */}
      <div className="absolute left-0 right-0 h-1.5 bg-gray-100 rounded-full overflow-hidden transition-colors group-hover:bg-gray-200">
        <motion.div
          className="absolute top-0 left-0 bottom-0 bg-primary"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>

      {/* The visible thumb and bubble container */}
      <motion.div
        className="absolute w-6 h-6 rounded-full flex items-center justify-center pointer-events-none z-10"
        initial={false}
        animate={{ left: `calc(${percentage}% - 12px)` }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* The thumb */}
        <div className="w-full h-full bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center group-active:scale-110 group-active:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-shadow duration-200">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>

        {/* The Bubble */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              ref={bubbleRef}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.1))' }}
              className="absolute -top-13 flex flex-col items-center pointer-events-none origin-bottom"
            >
              {/* Main Bubble Body */}
              <div className="bg-white px-3 py-1.5 rounded-[12px] flex items-center justify-center min-w-[36px]">
                <span className="text-sm font-bold text-black leading-none">{value}</span>
              </div>
              {/* Seamless curved pointing tail */}
              <svg width="14" height="7" viewBox="0 0 14 7" fill="none" className="text-white -mt-px">
                <path d="M0 0 H14 L8.5 5.5 Q 7 7 5.5 5.5 L0 0Z" fill="currentColor" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The invisible native slider for perfect interaction */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing touch-none z-20"
      />
    </div>
  );
}

function PulseTypeIcon({ type }: { type: PulseType }) {
  const cls = "w-4 h-4";
  if (type === 'choice') return <BarChart3 className={cls} />;
  return <SlidersHorizontal className={cls} />;
}

const PULSE_TYPE_LABELS: Record<PulseType, string> = {
  choice: 'Choice',
  slider: 'Slider Scale',
};

// ─── Creator Form ─────────────────────────────────────────────────────────────

function PulseCreatorForm({ postId, creatorId, onCreated }: {
  postId: string;
  creatorId: string;
  onCreated: (session: PulseSession) => void;
}) {
  const [question, setQuestion] = useState('');
  const [pulseType, setPulseType] = useState<PulseType>('choice');
  const [duration, setDuration] = useState<PulseDuration>('24h');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [sliderMin, setSliderMin] = useState(1);
  const [sliderMax, setSliderMax] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const isValid = () => {
    if (!question.trim()) return false;
    if (pulseType === 'slider') return sliderMin < sliderMax;
    return options.every(o => o.trim().length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const session = createPulseSession(
          postId,
          creatorId,
          question.trim(),
          pulseType,
          duration,
          pulseType !== 'slider' ? options.map(o => o.trim()) : undefined,
          allowMultiple,
          pulseType === 'slider' ? { min: sliderMin, max: sliderMax, step: 1 } : undefined
        );
        onCreated(session);
      } catch (err) {
        console.error(err);
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center pb-2 pt-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <AnimatedPulseIcon />
        </div>
        <h4 className="font-semibold text-lg text-black tracking-tight">Launch a Pulse</h4>
        <p className="text-[13px] text-gray-500 mt-1.5 font-medium">Ask your audience one focused question</p>
      </div>

      {/* Question */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 tracking-[0.08em] mb-2">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you think about..."
          maxLength={120}
          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-primary transition-colors bg-white"
        />
        <div className="text-right mt-1">
          <span className={`text-[10px] font-medium ${question.length >= 120 ? 'text-red-400' : 'text-gray-300'}`}>{question.length}/120</span>
        </div>
      </div>

      {/* Pulse Type Selector */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 tracking-[0.08em] mb-2">Format</label>
        <div className="flex gap-2">
          {(['choice', 'slider'] as PulseType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPulseType(type);
                if (type === 'choice' && options.length < 2) setOptions(['', '']);
              }}
              className={`flex-1 py-2.5 px-2 rounded-full text-[12px] font-medium border transition-all duration-150 flex items-center justify-center gap-2 ${pulseType === type
                ? 'bg-primary/10 text-black border-primary'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <PulseTypeIcon type={type} />
              <span className="hidden xs:inline">{PULSE_TYPE_LABELS[type]}</span>
              <span className="xs:hidden">{type === 'choice' ? 'Choice' : 'Scale'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options (Choice) */}
      {pulseType !== 'slider' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-semibold text-gray-700 tracking-[0.08em]">
              Options
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="w-3 h-3 accent-primary cursor-pointer"
              />
              <span className="text-[10px] font-medium text-gray-500">Allow multiple selections</span>
            </label>
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-gray-400">{String.fromCharCode(65 + i)}</span>
                </div>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  maxLength={60}
                  className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-primary transition-colors"
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-xs font-medium text-gray-400 hover:text-black transition-colors"
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Slider Config */}
      {pulseType === 'slider' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-2">Scale Range</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[10px] text-gray-400 font-medium">Min</span>
              <input
                type="number"
                value={sliderMin}
                onChange={(e) => setSliderMin(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <span className="text-gray-300 mt-4">→</span>
            <div className="flex-1">
              <span className="text-[10px] text-gray-400 font-medium">Max</span>
              <input
                type="number"
                value={sliderMax}
                onChange={(e) => setSliderMax(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 tracking-[0.08em] mb-2">Duration</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PULSE_DURATION_LABELS) as PulseDuration[]).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-4 py-2 rounded-full text-[12px] font-medium border transition-all duration-200 ${duration === d
                ? 'bg-primary/10 border-primary/30 text-black'
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                }`}
            >
              {PULSE_DURATION_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        variant="outline"
        type="submit"
        disabled={!isValid() || isSubmitting}
        className="w-full h-11 text-sm font-medium rounded-full transition-all"
      >
        {isSubmitting ? 'Launching…' : 'Launch Pulse'}
      </Button>
    </form>
  );
}

// ─── Active / Expired Voting UI ───────────────────────────────────────────────

function PulseVotingView({ session: initialSession, avatarId, onVoted }: {
  session: PulseSession;
  avatarId?: string;
  onVoted?: () => void;
}) {
  const [session, setSession] = useState(initialSession);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(session.slider_min ?? 1);
  const [hasVoted, setHasVoted] = useState(hasVotedInPulse(session, avatarId));
  const [timeRemaining, setTimeRemaining] = useState(getPulseTimeRemaining(session));
  const active = isPulseActive(session);
  const results = getPulseResults(session);
  const totalVotes = session.votes.length;

  // Live countdown timer (local only)
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const remaining = getPulseTimeRemaining(session);
      setTimeRemaining(remaining);
      if (remaining === 'Expired') clearInterval(interval);
    }, 60000); // update every 60s
    return () => clearInterval(interval);
  }, [session, active]);

  const handleVote = () => {
    const choice = session.pulse_type === 'slider' ? sliderValue : (session.allow_multiple_selections ? selectedChoices : selectedChoices[0]);
    if (session.pulse_type !== 'slider' && selectedChoices.length === 0) return;
    if (choice === null || choice === undefined) return;

    const updated = voteInPulse(session.post_id, choice, avatarId);
    if (updated) {
      setSession(updated);
      setHasVoted(true);
      onVoted?.();
    }
  };

  const showResults = hasVoted || !active;

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="text-center pb-1">
        <h4 className="font-semibold text-base text-black leading-snug">{session.question}</h4>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${active
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-gray-100 text-gray-400'
            }`}>
            <Clock className="w-3 h-3" />
            {active ? timeRemaining : 'Expired'}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      {/* Choice */}
      {session.pulse_type !== 'slider' && (
        <div className="space-y-2">
          {(session.options || []).map((option) => {
            const result = results[option] || { count: 0, percentage: 0 };
            const isSelected = selectedChoices.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (!showResults && active) {
                    if (session.allow_multiple_selections) {
                      setSelectedChoices(prev =>
                        prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]
                      );
                    } else {
                      setSelectedChoices([option]);
                    }
                  }
                }}
                disabled={showResults || !active}
                className={`w-full relative overflow-hidden rounded-[16px] border transition-all duration-300 text-left ${showResults
                  ? 'cursor-default border-transparent bg-gray-50/50'
                  : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
              >
                {/* Result bar fill */}
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.percentage}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 bg-primary/15 rounded-[16px]"
                  />
                )}

                <div className="relative z-10 flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {!showResults && (
                      <div className={`w-4 h-4 border-2 transition-all shrink-0 ${session.allow_multiple_selections ? 'rounded' : 'rounded-full'} ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                        }`}>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-full h-full flex items-center justify-center"
                          >
                            {session.allow_multiple_selections ? (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}
                    <span className="text-sm font-medium text-black">{option}</span>
                  </div>
                  {showResults && (
                    <span className="text-sm font-semibold text-black tabular-nums">{result.percentage}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Slider */}
      {session.pulse_type === 'slider' && (
        <div className="space-y-3 pt-1">
          {showResults ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-black">{getPulseSliderAverage(session)}</div>
              <p className="text-xs text-gray-400 mt-1">Average rating from {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</p>
              {/* Distribution bar */}
              <div className="flex items-end justify-center gap-0.5 mt-4 h-16">
                {Array.from({ length: (session.slider_max ?? 10) - (session.slider_min ?? 1) + 1 }, (_, i) => {
                  const value = (session.slider_min ?? 1) + i;
                  const result = results[String(value)];
                  const pct = result?.percentage ?? 0;
                  return (
                    <div key={value} className="flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(pct * 0.6, 2)}px` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-5 rounded-t bg-primary/60"
                      />
                      <span className="text-[9px] text-gray-400 font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <input
                type="range"
                min={session.slider_min ?? 1}
                max={session.slider_max ?? 10}
                step={session.slider_step ?? 1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 accent-primary hidden"
                style={{ accentColor: '#FEC312' }}
              />
              <TactileSlider
                min={session.slider_min ?? 1}
                max={session.slider_max ?? 10}
                step={session.slider_step ?? 1}
                value={sliderValue}
                onChange={setSliderValue}
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-semibold pt-1">
                <span>{session.slider_min ?? 1}</span>
                <span>{session.slider_max ?? 10}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vote Button */}
      {active && !hasVoted && (
        <Button
          onClick={handleVote}
          disabled={session.pulse_type !== 'slider' && selectedChoices.length === 0}
          variant="outline"
          className="w-full h-11 text-sm font-medium rounded-full transition-all"
        >
          Submit Vote
        </Button>
      )}

      {/* Voted confirmation */}
      {hasVoted && active && (
        <div className="flex items-center justify-center gap-2 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">Your vote has been recorded</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface PulseTabProps {
  postId: string;
  isCreator: boolean;
  creatorId?: string;
  avatarId?: string;
}

export function PulseTab({ postId, isCreator, creatorId, avatarId }: PulseTabProps) {
  const [session, setSession] = useState<PulseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(() => {
    const existing = getPulseSession(postId);
    setSession(existing);
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-400">Loading…</div>;
  }

  // No session exists — creator can launch one
  if (!session && isCreator && creatorId) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="creator-form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PulseCreatorForm
            postId={postId}
            creatorId={creatorId}
            onCreated={(newSession) => setSession(newSession)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // No session and not creator — shouldn't render (parent hides tab)
  if (!session) {
    return null;
  }

  // Session exists (active or expired)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="voting-view"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <PulseVotingView
          session={session}
          avatarId={avatarId}
          onVoted={loadSession}
        />
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Utility: Determine if the Pulse tab should be shown.
 * - Always show if a session exists (active or expired history)
 * - Show if the current user is the creator (so they can launch one)
 */
export function shouldShowPulseTab(postId: string, isCreator: boolean): boolean {
  const session = getPulseSession(postId);
  return session !== null || isCreator;
}

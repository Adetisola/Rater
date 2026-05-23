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

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Clock, CheckCircle2, BarChart3, Radio, SlidersHorizontal } from 'lucide-react';

// ─── Sub-Components ───────────────────────────────────────────────────────────

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center pb-2">
        <div className="w-10 h-10 rounded-full bg-[#FEC312]/10 flex items-center justify-center mx-auto mb-3">
          <Radio className="w-5 h-5 text-[#FEC312]" />
        </div>
        <h4 className="font-semibold text-base text-black">Launch a Pulse</h4>
        <p className="text-xs text-gray-400 mt-1">Ask your audience one focused question</p>
      </div>

      {/* Question */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you think about..."
          maxLength={120}
          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-[#FEC312] transition-colors bg-white"
        />
        <div className="text-right mt-1">
          <span className={`text-[10px] font-medium ${question.length >= 120 ? 'text-red-400' : 'text-gray-300'}`}>{question.length}/120</span>
        </div>
      </div>

      {/* Pulse Type Selector */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
        <div className="flex gap-2">
          {(['choice', 'slider'] as PulseType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPulseType(type);
                if (type === 'choice' && options.length < 2) setOptions(['', '']);
              }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-medium border transition-all duration-150 flex items-center justify-center gap-1.5 ${
                pulseType === type
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
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
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Options
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={allowMultiple} 
                onChange={(e) => setAllowMultiple(e.target.checked)} 
                className="w-3 h-3 accent-[#FEC312] cursor-pointer"
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
                  className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-[#FEC312] transition-colors"
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
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Scale Range</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[10px] text-gray-400 font-medium">Min</span>
              <input
                type="number"
                value={sliderMin}
                onChange={(e) => setSliderMin(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:border-[#FEC312] transition-colors"
              />
            </div>
            <span className="text-gray-300 mt-4">→</span>
            <div className="flex-1">
              <span className="text-[10px] text-gray-400 font-medium">Max</span>
              <input
                type="number"
                value={sliderMax}
                onChange={(e) => setSliderMax(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:border-[#FEC312] transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PULSE_DURATION_LABELS) as PulseDuration[]).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                duration === d
                  ? 'bg-[#FEC312]/10 border-[#FEC312]/40 text-black'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              {PULSE_DURATION_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid() || isSubmitting}
        className="w-full h-11 rounded-full bg-black text-white text-sm font-medium hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {isSubmitting ? 'Launching…' : 'Launch Pulse'}
      </button>
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

  // Live countdown timer
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const remaining = getPulseTimeRemaining(session);
      setTimeRemaining(remaining);
      if (remaining === 'Expired') clearInterval(interval);
    }, 30000); // update every 30s
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
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${
            active
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
                className={`w-full relative overflow-hidden rounded-xl border transition-all duration-200 text-left ${
                  showResults
                    ? 'cursor-default border-gray-100'
                    : isSelected
                      ? 'border-[#FEC312] bg-[#FEC312]/5'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Result bar fill */}
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.percentage}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-y-0 left-0 bg-[#FEC312]/8 rounded-xl"
                  />
                )}

                <div className="relative z-10 flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {!showResults && (
                      <div className={`w-4 h-4 border-2 transition-all shrink-0 ${session.allow_multiple_selections ? 'rounded' : 'rounded-full'} ${
                        isSelected ? 'border-[#FEC312] bg-[#FEC312]' : 'border-gray-300'
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
                        className="w-5 rounded-t bg-[#FEC312]/60"
                      />
                      <span className="text-[9px] text-gray-400 font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <span className="text-2xl font-bold text-black">{sliderValue}</span>
              </div>
              <input
                type="range"
                min={session.slider_min ?? 1}
                max={session.slider_max ?? 10}
                step={session.slider_step ?? 1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 accent-[#FEC312]"
                style={{ accentColor: '#FEC312' }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>{session.slider_min ?? 1}</span>
                <span>{session.slider_max ?? 10}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vote Button */}
      {active && !hasVoted && (
        <button
          onClick={handleVote}
          disabled={session.pulse_type !== 'slider' && selectedChoices.length === 0}
          className="w-full h-11 rounded-full bg-black text-white text-sm font-medium hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Submit Vote
        </button>
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

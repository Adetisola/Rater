"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageSquarePlus, 
  Sparkles, 
  ChevronUp, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useOverlayStore } from '@/store/overlayStore';
import { useAuthState } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getPopularFeedback, checkSimilarFeedback, toggleFeedbackVote } from '@/lib/feedback/server';
import type { FeedbackRequest, FeedbackType, FeedbackCategory } from '@/types';
import { showToast } from '@/components/GlobalOverlays';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const FEEDBACK_TYPES: { id: FeedbackType; label: string; desc: string }[] = [
  { id: 'Feature Request', label: 'Feature Request', desc: 'Brand new capability' },
  { id: 'Improvement', label: 'Improvement', desc: 'Make existing tools better' },
  { id: 'Bug Report', label: 'Bug Report', desc: 'Something not working' },
  { id: 'General Feedback', label: 'General', desc: 'Thoughts & observations' },
];

const CATEGORIES: FeedbackCategory[] = [
  'UI',
  'Search',
  'Performance',
  'Profiles',
  'Reviews',
  'Mobile',
  'Accessibility',
  'Notifications',
  'General',
];

export function FeedbackDrawer() {
  const router = useRouter();
  const { isFeedbackDrawerOpen, defaultFeedbackType, closeFeedbackDrawer } = useOverlayStore();
  const { currentProfile } = useAuthState();

  // Form State
  const [type, setType] = useState<FeedbackType>(defaultFeedbackType || 'Feature Request');
  const [category, setCategory] = useState<FeedbackCategory>('UI');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);

  // Duplicate Suggestion State
  const [similarRequests, setSimilarRequests] = useState<FeedbackRequest[]>([]);
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);

  // Popular Requests State
  const [popularRequests, setPopularRequests] = useState<FeedbackRequest[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);

  const [mounted, setMounted] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isFeedbackDrawerOpen) {
      setType(defaultFeedbackType || 'Feature Request');
      setSubmittedSlug(null);
      setError(null);
      document.body.style.overflow = 'hidden';

      // Fetch popular active requests
      setIsLoadingPopular(true);
      getPopularFeedback(currentProfile?.id || null)
        .then((items) => setPopularRequests(items))
        .finally(() => setIsLoadingPopular(false));

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isFeedbackDrawerOpen, defaultFeedbackType, currentProfile?.id]);

  // Debounced Similarity Search (Threshold: 8 chars)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = title.trim();
    if (trimmed.length < 8) {
      setSimilarRequests([]);
      setIsSearchingSimilar(false);
      return;
    }

    setIsSearchingSimilar(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await checkSimilarFeedback(trimmed);
        setSimilarRequests(results);
      } catch {
        setSimilarRequests([]);
      } finally {
        setIsSearchingSimilar(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [title]);

  if (!mounted || !isFeedbackDrawerOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (!currentProfile) {
      showToast('Please sign in to share feedback.', 'info');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate clean slug
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
          .slice(0, 50) +
        '-' +
        Math.floor(1000 + Math.random() * 9000);

      const { data, error: insertError } = await supabase
        .from('feedback_requests')
        .insert({
          title: title.trim(),
          description: description.trim().slice(0, 2000),
          type,
          category,
          slug,
          author_id: currentProfile.id,
          status: 'New',
        })
        .select('slug')
        .single();

      if (insertError) throw insertError;

      setSubmittedSlug(data.slug);
      setTitle('');
      setDescription('');
      showToast('Feedback submitted successfully!', 'success');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopularVote = async (requestId: string) => {
    if (!currentProfile) {
      showToast('Please sign in to upvote.', 'info');
      return;
    }

    const target = popularRequests.find(r => r.id === requestId);
    if (!target) return;

    const wasVoted = !!target.has_voted;
    const oldCount = target.upvote_count ?? 0;
    const newCount = wasVoted ? Math.max(0, oldCount - 1) : oldCount + 1;

    setPopularRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, has_voted: !wasVoted, upvote_count: newCount } : r))
    );

    const { success, newVoteState } = await toggleFeedbackVote(requestId, currentProfile.id, wasVoted);
    if (!success || newVoteState === wasVoted) {
      setPopularRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, has_voted: wasVoted, upvote_count: oldCount } : r))
      );
      showToast('Vote failed. Please try again.', 'error');
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-120 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          onClick={closeFeedbackDrawer}
        />

        {/* Slide-Over Drawer Sheet */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full sm:w-[440px] h-full bg-white shadow-2xl flex flex-col z-10 overflow-hidden border-l border-gray-100"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-primary/20 flex items-center justify-center text-primary">
                <MessageSquarePlus size={16} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-950 tracking-tight">Feedback & Ideas</h2>
                <p className="text-xs text-gray-400">Help shape the future of Rater</p>
              </div>
            </div>

            <button
              onClick={closeFeedbackDrawer}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            {submittedSlug ? (
              /* Emotional Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 px-4 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 size={28} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-gray-950">Feedback Submitted 🎉</h3>
                  <p className="text-xs sm:text-[13px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Thanks for helping shape Rater! Your idea is now live on the public community board.
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
                  <Button
                    variant="primary"
                    onClick={() => {
                      closeFeedbackDrawer();
                      router.push(`/feedback/${submittedSlug}`);
                    }}
                    className="h-10 rounded-xl text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Your Request</span>
                    <ArrowRight size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSubmittedSlug(null)}
                    className="h-10 rounded-xl text-xs font-semibold"
                  >
                    Share Another Idea
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Main Submit Form Flow */
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Type Selector Tabs */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 tracking-wider">Type</label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100/70 rounded-xl border border-gray-200/40">
                      {FEEDBACK_TYPES.map(t => {
                        const isSelected = type === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setType(t.id)}
                            className={cn(
                              "py-1.5 px-2 rounded-lg text-center select-none text-xs font-semibold transition-all",
                              isSelected
                                ? "bg-white text-gray-950 shadow-2xs border border-gray-200/50"
                                : "text-gray-500 hover:text-gray-900"
                            )}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as FeedbackCategory)}
                      className="w-full h-10 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3 text-xs font-medium text-gray-900 focus:outline-none focus:border-black transition-colors"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 tracking-wider">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Short, descriptive title"
                      maxLength={120}
                      className="w-full h-10 bg-white border border-gray-200/80 rounded-xl px-3.5 text-xs sm:text-[13px] font-medium text-gray-950 placeholder-gray-400 focus:outline-none focus:border-black transition-colors shadow-2xs"
                      required
                    />
                  </div>

                  {/* Non-Blocking Similarity Card */}
                  {similarRequests.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 text-amber-900">
                        {isSearchingSimilar ? (
                          <Loader2 size={14} className="animate-spin text-primary shrink-0" />
                        ) : (
                          <Sparkles size={14} className="text-primary shrink-0" />
                        )}
                        <p className="text-xs font-bold">Similar community requests</p>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Looks similar? You can upvote an existing request or continue submitting below.
                      </p>

                      <div className="space-y-1.5 pt-0.5">
                        {similarRequests.map(sim => (
                          <div
                            key={sim.id}
                            className="flex items-center justify-between gap-2 p-2 bg-white/90 rounded-xl border border-amber-200/40"
                          >
                            <Link
                              href={`/feedback/${sim.slug}`}
                              onClick={closeFeedbackDrawer}
                              className="text-xs font-semibold text-gray-900 hover:underline truncate"
                            >
                              {sim.title}
                            </Link>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {sim.status}
                              </span>
                              <span className="text-xs font-bold text-gray-700">
                                ▲ {sim.upvote_count || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Description Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 tracking-wider">Details</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Explain what you want to achieve, why it helps, or what went wrong..."
                      rows={4}
                      maxLength={2000}
                      className="w-full bg-white border border-gray-200/80 rounded-xl p-3 text-xs sm:text-[13px] font-medium text-gray-950 placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none shadow-2xs"
                      required
                    />
                  </div>

                  {/* Submit Action */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="w-full h-10 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {isSubmitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        <span>Submit Feedback</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </Button>
                </form>

                {/* Popular Community Requests Section */}
                <div className="pt-5 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <Flame size={15} className="text-amber-500" />
                      <h3 className="text-xs font-bold text-gray-900 tracking-tight">Popular Active Requests</h3>
                    </div>
                    <span className="text-[11px] text-gray-400">Past 90 days</span>
                  </div>

                  {isLoadingPopular ? (
                    <div className="py-6 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <span>Loading popular requests...</span>
                    </div>
                  ) : popularRequests.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No active popular requests yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {popularRequests.map(pop => (
                        <div
                          key={pop.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100 hover:border-gray-200/80 bg-gray-50/40 hover:bg-white transition-all shadow-2xs group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (pop.id) handlePopularVote(pop.id);
                            }}
                            className={cn(
                              "w-9 h-11 rounded-xl flex flex-col items-center justify-center border transition-all shrink-0",
                              pop.has_voted
                                ? "bg-amber-50 border-primary/40 text-black font-bold"
                                : "bg-white border-gray-200/70 text-gray-500 hover:border-gray-300"
                            )}
                          >
                            <ChevronUp size={14} strokeWidth={3} className={pop.has_voted ? "text-primary" : ""} />
                            <span className="text-[11px] font-bold">{pop.upvote_count || 0}</span>
                          </button>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/feedback/${pop.slug}`}
                              onClick={closeFeedbackDrawer}
                              className="text-xs font-semibold text-gray-900 group-hover:text-black line-clamp-1 hover:underline"
                            >
                              {pop.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                pop.status === 'Planned' && "bg-blue-50 text-blue-700 border border-blue-200/50",
                                pop.status === 'In Progress' && "bg-purple-50 text-purple-700 border border-purple-200/50",
                                pop.status === 'Under Review' && "bg-amber-50 text-amber-800 border border-amber-200/50",
                                (!pop.status || pop.status === 'New') && "bg-gray-100 text-gray-600"
                              )}>
                                {pop.status || 'New'}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate">{pop.category}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between shrink-0">
            <Link
              href="/feedback"
              onClick={closeFeedbackDrawer}
              className="text-xs font-semibold text-gray-700 hover:text-black inline-flex items-center gap-1.5 transition-colors"
            >
              <span>View full feedback board</span>
              <ExternalLink size={13} />
            </Link>
            <span className="text-[11px] text-gray-400">Rater Studio</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

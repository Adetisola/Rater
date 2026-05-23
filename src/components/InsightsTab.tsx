"use client";

/**
 * InsightsTab — Lightweight structured feedback analytics tab.
 *
 * Dynamically generates feedback themes based on actual review scores.
 * Shows recurring positive themes, constructive criticism, and
 * structured per-criterion reaction summaries.
 *
 * V1: Keep this simple and functional — no overcomplication.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Review, Category } from '@/types';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { getReviewMode } from '@/config/reviewModes';

// ─── Insight Generation Logic ────────────────────────────────────────────────

interface CriterionInsight {
  label: string;
  icon: React.ReactNode;
  average: number;
  sentiment: 'positive' | 'neutral' | 'needs_work';
  positiveFeedback: string;
  constructiveFeedback: string;
}

function generateInsights(reviews: Review[], category?: Category): {
  criteria: CriterionInsight[];
  positiveTags: string[];
  constructiveTags: string[];
  overallAverage: number;
} {
  if (reviews.length === 0) {
    return { criteria: [], positiveTags: [], constructiveTags: [], overallAverage: 0 };
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
      if (r[c.dbKey] != null) {
        sum += r[c.dbKey] as number;
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
      positiveFeedback: avg >= 4.5
        ? `Excellent ${c.label.toLowerCase()}`
        : avg >= 4.0
          ? `Strong ${c.label.toLowerCase()}`
          : `Good ${c.label.toLowerCase()}`,
      constructiveFeedback: avg < 3.0
        ? `${c.label} needs significant improvement`
        : avg < 3.5
          ? `${c.label} could be refined`
          : `Minor ${c.label.toLowerCase()} tweaks possible`,
    };
  });

  const validAverages = criteria.filter(c => c.average > 0);
  const overallAverage = validAverages.length > 0
    ? validAverages.reduce((sum, c) => sum + c.average, 0) / validAverages.length
    : 0;

  // Aggregate positive / constructive tags
  const positiveTags: string[] = [];
  const constructiveTags: string[] = [];

  criteria.forEach(c => {
    if (c.sentiment === 'positive') positiveTags.push(c.positiveFeedback);
    if (c.sentiment === 'needs_work') constructiveTags.push(c.constructiveFeedback);
  });

  // Add overall tags
  if (overallAverage >= 4.5) positiveTags.push('Exceptional overall quality');
  if (overallAverage >= 4.0 && overallAverage < 4.5) positiveTags.push('Strong design fundamentals');
  if (overallAverage < 3.0) constructiveTags.push('Needs holistic improvement');
  if (reviews.length >= 5) positiveTags.push('Well-reviewed by the community');

  return { criteria, positiveTags, constructiveTags, overallAverage };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface InsightsTabProps {
  reviews: Review[];
  postCategory?: Category;
}

export function InsightsTab({ reviews, postCategory }: InsightsTabProps) {
  const { criteria, positiveTags, constructiveTags, overallAverage } = useMemo(
    () => generateInsights(reviews, postCategory),
    [reviews, postCategory]
  );

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
        <div className="text-3xl font-bold text-black">{roundedOverall}</div>
        <p className="text-xs text-gray-400 mt-0.5">Overall average from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
      </div>

      {/* Per-Criterion Breakdown */}
      <div className="space-y-2.5">
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center gap-3">
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
                  className={`h-full rounded-full ${
                    c.sentiment === 'positive'
                      ? 'bg-emerald-400'
                      : c.sentiment === 'needs_work'
                        ? 'bg-amber-400'
                        : 'bg-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Positive Themes */}
      {positiveTags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Strengths</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {positiveTags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Constructive Themes */}
      {constructiveTags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Areas to Improve</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {constructiveTags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

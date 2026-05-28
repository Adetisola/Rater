/**
 * Insight Engine — Context-Aware Creative Perception Synthesis
 *
 * Analyzes review scores, comments, review mode context, and post metadata
 * to generate grounded, human-sounding feedback synthesis.
 *
 * NOT an AI feature. Deterministic keyword clustering + score trend analysis
 * + template-based natural language output.
 *
 * Voice: "a smart creative quietly synthesizing audience perception."
 */

import type { Review, Category } from '@/types';
import { getReviewMode, type ReviewModeConfig } from '@/config/reviewModes';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PerceptionTheme {
  id: string;
  /** Keywords that trigger this theme (negative/friction context) */
  keywords: string[];
  /** Keywords that trigger this theme (positive context) */
  positiveKeywords: string[];
  /** Which criterion db keys this theme correlates with */
  criterionAffinity: string[];
  /** Human observation sentences when theme is positive */
  positiveObservations: string[];
  /** Human observation sentences when theme is negative */
  negativeObservations: string[];
}

interface ThemeMatch {
  themeId: string;
  positiveCount: number;
  negativeCount: number;
  totalMentions: number;
  sentiment: 'positive' | 'negative' | 'mixed';
  cumulativeSignal: number;
}

export interface PerceptionInsights {
  summary: string | null;
  strengths: string[];
  areasToImprove: string[];
  meetsThreshold: boolean;
}

interface ScoreTrend {
  criterionKey: string;
  label: string;
  average: number;
  sentiment: 'strong' | 'solid' | 'neutral' | 'weak';
}

// ─── Theme Definitions ──────────────────────────────────────────────────────

const PERCEPTION_THEMES: PerceptionTheme[] = [
  {
    id: 'readability',
    keywords: ['hard to read', 'text too small', 'tiny font', 'can\'t read', 'difficult to read', 'cramped text', 'small text', 'unreadable', 'font size', 'cramped', 'squint', 'strain'],
    positiveKeywords: ['easy to read', 'readable', 'clear text', 'legible', 'comfortable to read', 'good font', 'clean text', 'text is clear', 'well spaced text'],
    criterionAffinity: ['clarity'],
    positiveObservations: [
      "Text is easy to read across the board. Nothing to squint at.",
      "The type scans well. You don't have to work to take anything in.",
      "Text sizing feels natural. Everything sits comfortably.",
    ],
    negativeObservations: [
      "Some of the text runs a bit small. You have to lean in.",
      "The denser sections get harder to follow at smaller sizes.",
      "A few text areas feel cramped when more content shows up.",
    ],
  },
  {
    id: 'hierarchy',
    keywords: ['no hierarchy', 'flat', 'everything same size', 'no focal point', 'nothing stands out', 'hard to navigate', 'confusing layout', 'lost', 'where to look', 'cluttered', 'messy', 'disorganised', 'disorganized', 'overwhelming'],
    positiveKeywords: ['clear hierarchy', 'well structured', 'easy to follow', 'flows well', 'organized', 'organised', 'well laid out', 'natural flow', 'logical', 'intuitive flow', 'guided', 'easy to navigate'],
    criterionAffinity: ['clarity', 'usability'],
    positiveObservations: [
      "The layout guides your eye naturally. Nothing feels forced.",
      "Easy to move through. The structure just makes sense.",
      "The hierarchy feels intentional. You always know where to look.",
    ],
    negativeObservations: [
      "Some sections start to blur together when more content comes in.",
      "The focal point gets a bit lost in the busier areas.",
      "A few spots could use stronger anchors to hold the layout together.",
    ],
  },
  {
    id: 'colour',
    keywords: ['bad colours', 'bad colors', 'colour clash', 'color clash', 'too bright', 'too dark', 'dull colours', 'dull colors', 'muddy', 'garish', 'harsh', 'overwhelming colour', 'overwhelming color', 'neon'],
    positiveKeywords: ['great colours', 'great colors', 'nice palette', 'colour harmony', 'color harmony', 'beautiful colours', 'beautiful colors', 'vibrant', 'cohesive palette', 'colour choice', 'color choice', 'warm tones', 'cool tones', 'tasteful'],
    criterionAffinity: ['aesthetics'],
    positiveObservations: [
      "The palette feels cohesive. Everything looks like it belongs together.",
      "The colours set the right mood without overdoing it.",
      "The tones work well together. The whole thing feels considered.",
    ],
    negativeObservations: [
      "Some of the colours feel like they're competing instead of working together.",
      "The palette gets a bit harder to follow in certain areas.",
      "A few colour combos don't quite land.",
    ],
  },
  {
    id: 'spacing',
    keywords: ['too tight', 'cramped', 'no breathing room', 'crowded', 'squeezed', 'too close', 'no space', 'dense', 'packed', 'cluttered'],
    positiveKeywords: ['good spacing', 'breathing room', 'well spaced', 'spacious', 'airy', 'clean layout', 'room to breathe', 'generous spacing', 'balanced spacing'],
    criterionAffinity: ['clarity', 'composition'],
    positiveObservations: [
      "Everything has room to breathe. The spacing feels natural.",
      "Nothing is crowding anything else. The layout sits comfortably.",
      "The whitespace is doing real work here. It lets the content land.",
    ],
    negativeObservations: [
      "Some areas feel tighter than they need to be.",
      "A few sections could use more breathing room between elements.",
      "It gets dense in places where a little more space would help.",
    ],
  },
  {
    id: 'typography',
    keywords: ['bad font', 'ugly font', 'wrong font', 'font doesn\'t fit', 'font mismatch', 'inconsistent fonts', 'too many fonts', 'weird typography', 'font choice'],
    positiveKeywords: ['great font', 'nice typography', 'clean font', 'beautiful type', 'good font choice', 'typography is clean', 'type feels right', 'font pairing', 'well chosen font'],
    criterionAffinity: ['aesthetics', 'clarity'],
    positiveObservations: [
      "The type choices feel right. They carry the whole mood.",
      "The typography gives it a confident, refined quality.",
      "The type adds polish without pulling focus from anything else.",
    ],
    negativeObservations: [
      "The font doesn't quite match the tone of the rest.",
      "Some of the type choices feel a little off from what the work is going for.",
      "The font pairing could be tighter.",
    ],
  },
  {
    id: 'navigation',
    keywords: ['hard to navigate', 'confusing navigation', 'lost', 'where do I go', 'not intuitive', 'confusing flow', 'unclear path', 'can\'t find', 'hidden', 'buried'],
    positiveKeywords: ['easy to navigate', 'intuitive', 'smooth flow', 'easy to find', 'clear navigation', 'user friendly', 'straightforward', 'natural to use'],
    criterionAffinity: ['usability'],
    positiveObservations: [
      "Navigation is straightforward. No guessing required.",
      "Everything flows. You don't have to think about where to go next.",
      "Key actions are easy to find without hunting.",
    ],
    negativeObservations: [
      "Some paths through the interface aren't as obvious as they could be.",
      "A few important actions are a bit buried. You have to look for them.",
      "The flow between sections doesn't always match the clarity of the rest.",
    ],
  },
  {
    id: 'polish',
    keywords: ['unfinished', 'rough', 'unpolished', 'needs work', 'half done', 'inconsistent', 'sloppy', 'rushed', 'careless', 'lazy'],
    positiveKeywords: ['polished', 'refined', 'clean', 'sharp', 'well done', 'professional', 'sleek', 'finished', 'pixel perfect', 'crisp', 'meticulous', 'attention to detail'],
    criterionAffinity: ['aesthetics', 'detail'],
    positiveObservations: [
      "It feels finished. That level of polish stands out.",
      "The small details add up. You can feel the craftsmanship.",
      "The overall finish feels considered. Nothing looks accidental.",
    ],
    negativeObservations: [
      "Some parts feel more polished than others.",
      "A few areas look like they could use one more pass.",
      "The finish isn't quite consistent across the whole piece.",
    ],
  },
  {
    id: 'branding',
    keywords: ['off brand', 'doesn\'t fit the brand', 'identity unclear', 'generic', 'no personality', 'bland', 'forgettable', 'no character'],
    positiveKeywords: ['strong brand', 'memorable', 'recognisable', 'recognizable', 'distinctive', 'unique', 'personality', 'identity', 'on brand', 'brand feel', 'standout'],
    criterionAffinity: ['recognition', 'purpose'],
    positiveObservations: [
      "The identity clicks right away. You know what this is.",
      "The branding comes through clearly without being heavy-handed.",
      "There's real personality here. It feels distinct.",
    ],
    negativeObservations: [
      "The identity doesn't quite land the way the rest of the work does.",
      "The brand personality feels a bit quiet for what this is trying to be.",
      "It could push the distinctiveness further to leave a stronger mark.",
    ],
  },
  {
    id: 'attention',
    keywords: ['no focus', 'nothing grabs', 'boring', 'bland', 'flat', 'no impact', 'doesn\'t grab', 'weak first impression', 'forgettable'],
    positiveKeywords: ['eye catching', 'stands out', 'grabs attention', 'striking', 'bold', 'impactful', 'strong first impression', 'attention grabbing', 'hero', 'draws you in', 'pulls you in'],
    criterionAffinity: ['impact', 'engagement', 'aesthetics'],
    positiveObservations: [
      "Your eye goes where it should without being pushed.",
      "Strong first impression. It grabs you right away.",
      "Hard to scroll past. The visual presence is real.",
    ],
    negativeObservations: [
      "The main focus blends into the rest more than you'd expect.",
      "The first impression doesn't grab as hard as it could.",
      "It needs a stronger visual anchor to pull people in.",
    ],
  },
  {
    id: 'contrast',
    keywords: ['low contrast', 'hard to see', 'faded', 'washed out', 'too subtle', 'not enough contrast', 'blends in', 'disappears'],
    positiveKeywords: ['good contrast', 'clear contrast', 'stands out', 'strong contrast', 'visible', 'pops', 'defined'],
    criterionAffinity: ['clarity', 'impact'],
    positiveObservations: [
      "Everything reads clearly. The contrast is well handled.",
      "Key elements stand out without fighting each other.",
      "Clean separation between sections. It all feels intentional.",
    ],
    negativeObservations: [
      "Some elements don't have enough contrast to stand out from their background.",
      "A few details fade into their surroundings.",
      "The separation between certain areas could be stronger.",
    ],
  },
  {
    id: 'composition',
    keywords: ['unbalanced', 'off center', 'awkward placement', 'weird layout', 'uneven', 'lopsided', 'misaligned', 'doesn\'t flow'],
    positiveKeywords: ['well composed', 'balanced', 'well framed', 'great composition', 'well placed', 'harmonious', 'cohesive', 'everything fits', 'visual balance'],
    criterionAffinity: ['composition', 'aesthetics'],
    positiveObservations: [
      "The composition feels balanced. Everything sits where it should.",
      "The placement of elements feels natural. Nothing looks forced.",
      "Good visual weight. The whole thing feels grounded.",
    ],
    negativeObservations: [
      "The balance feels slightly off in a few areas.",
      "Some elements don't quite feel settled in their placement.",
      "The arrangement could be more intentional in certain sections.",
    ],
  },
  {
    id: 'detail',
    keywords: ['lacks detail', 'too simple', 'bare', 'minimal effort', 'basic', 'not enough detail', 'empty'],
    positiveKeywords: ['great detail', 'well detailed', 'intricate', 'rich', 'layered', 'depth', 'thoughtful details', 'nuanced', 'refined details', 'subtle details'],
    criterionAffinity: ['detail', 'aesthetics'],
    positiveObservations: [
      "The finer details add depth without overwhelming anything.",
      "You can see the care in the smaller elements. It shows.",
      "Subtle touches that quietly raise the overall quality.",
    ],
    negativeObservations: [
      "Some areas could use more thoughtful detailing.",
      "The smaller elements didn't get the same attention as the bigger ones.",
      "A bit more refinement in the finer details would help it feel complete.",
    ],
  },
  {
    id: 'engagement',
    keywords: ['boring', 'dull', 'not interesting', 'didn\'t hold', 'lost interest', 'static', 'lifeless', 'flat'],
    positiveKeywords: ['engaging', 'interesting', 'captivating', 'held my attention', 'couldn\'t look away', 'dynamic', 'inviting', 'compelling', 'drew me in'],
    criterionAffinity: ['engagement', 'impact'],
    positiveObservations: [
      "It holds your attention. You want to keep looking.",
      "There's a pull to keep exploring instead of moving on.",
      "The visual energy keeps the whole thing feeling alive.",
    ],
    negativeObservations: [
      "Interest starts to drop off after the first impression.",
      "It feels a bit passive. Could use more to keep you engaged.",
      "Needs more visual hooks to hold attention past the initial look.",
    ],
  },
];

// ─── Computational Audience Perception Types ─────────────────────────────────

export interface ScoredReview {
  review: Review;
  classification: 'relevant' | 'partially_relevant' | 'low_signal' | 'off_topic';
  confidence: number;
  signal_strength: number;
}

// ─── Comment Analysis ────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'").replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesKeywords(normalizedComment: string, keywords: string[]): boolean {
  return keywords.some(kw => normalizedComment.includes(kw.toLowerCase()));
}

function clusterComments(scoredReviews: ScoredReview[]): ThemeMatch[] {
  const themeMatches: Map<string, ThemeMatch> = new Map();

  for (const sr of scoredReviews) {
    // Strict Filtering: Only highly confident 'relevant' comments can define themes.
    if (sr.classification !== 'relevant') continue;
    if (sr.confidence < 0.6) continue;
    
    const rawComment = sr.review.comment;
    if (!rawComment) continue;

    const normalized = normalizeText(rawComment);
    if (normalized.length < 5) continue; // skip trivially short

    for (const theme of PERCEPTION_THEMES) {
      const isNegative = matchesKeywords(normalized, theme.keywords);
      const isPositive = matchesKeywords(normalized, theme.positiveKeywords);

      if (isNegative || isPositive) {
        const existing = themeMatches.get(theme.id) || {
          themeId: theme.id,
          positiveCount: 0,
          negativeCount: 0,
          totalMentions: 0,
          sentiment: 'positive' as const,
          cumulativeSignal: 0,
        };

        if (isPositive) existing.positiveCount++;
        if (isNegative) existing.negativeCount++;
        existing.totalMentions++;
        existing.cumulativeSignal += sr.signal_strength; // Theme Confidence Weighting

        themeMatches.set(theme.id, existing);
      }
    }
  }

  // Determine final sentiment for each theme (Contradiction Awareness)
  for (const match of themeMatches.values()) {
    if (match.positiveCount > 0 && match.negativeCount === 0) {
      match.sentiment = 'positive';
    } else if (match.negativeCount > 0 && match.positiveCount === 0) {
      match.sentiment = 'negative';
    } else {
      match.sentiment = 'mixed'; // Divergent perception
    }
  }

  return Array.from(themeMatches.values());
}

// ─── Score Trend Analysis ────────────────────────────────────────────────────

function analyzeScoreTrends(reviews: Review[], modeConfig: ReviewModeConfig): ScoreTrend[] {
  const trends: ScoreTrend[] = [];
  for (const c of modeConfig.criteria) {
    let sum = 0;
    let count = 0;
    for (const r of reviews) {
      const val = r[c.dbKey as keyof Review];
      if (val != null && typeof val === 'number') {
        sum += val;
        count++;
      }
    }
    
    // Completely ignore criteria that have zero ratings
    if (count === 0) continue;

    const avg = Math.round((sum / count) * 10) / 10;

    let sentiment: ScoreTrend['sentiment'];
    if (avg >= 4.0) sentiment = 'strong';
    else if (avg >= 3.5) sentiment = 'solid';
    else if (avg >= 3.0) sentiment = 'neutral';
    else sentiment = 'weak';

    trends.push({ criterionKey: c.dbKey as string, label: c.label, average: avg, sentiment });
  }
  return trends;
}

// ─── Summary Generation ──────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSummary(
  scoreTrends: ScoreTrend[],
  themeMatches: ThemeMatch[],
  _modeConfig: ReviewModeConfig,
  _postTitle?: string,
): string {
  const strongCriteria = scoreTrends.filter(t => t.sentiment === 'strong' || t.sentiment === 'solid');
  const weakCriteria = scoreTrends.filter(t => t.sentiment === 'weak');
  const overallAvg = scoreTrends.reduce((s, t) => s + t.average, 0) / scoreTrends.length;

  // Find the dominant negative theme (most mentioned)
  const recurringNegative = themeMatches
    .filter(t => t.sentiment === 'negative' && t.totalMentions >= 2)
    .sort((a, b) => b.totalMentions - a.totalMentions)[0];

  // Find the dominant positive theme
  const recurringPositive = themeMatches
    .filter(t => t.sentiment === 'positive' && t.totalMentions >= 2)
    .sort((a, b) => b.totalMentions - a.totalMentions)[0];


  // Build the summary based on the overall picture
  if (overallAvg >= 4.0 && !recurringNegative) {
    // Very positive, no recurring issues
    const openers = [
      `I've pulled the feedback together for you! Reviewers gave this a really strong reception, and the polish came through beautifully.`,
      `Great work! The data shows solid execution, with the audience really picking up on the visual quality.`,
      `I love seeing this! The ratings indicate a strong reception overall, and confidence in the execution really shows.`,
    ];
    return pickRandom(openers);
  }

  if (overallAvg >= 4.0 && recurringNegative) {
    // Strong overall but with a specific recurring friction
    const theme = PERCEPTION_THEMES.find(t => t.id === recurringNegative.themeId);
    const frictionHint = theme ? pickRandom(theme.negativeObservations).toLowerCase() : 'a few things drew repeated attention';
    return `I've synthesized the feedback! Reviewers noted a lot of polish overall, though the data highlights that ${frictionHint.replace(/^the /, '').replace(/\.$/, '')}.`;
  }

  if (overallAvg >= 3.0 && overallAvg < 4.0) {
    // Mixed reception
    if (strongCriteria.length > 0 && weakCriteria.length > 0) {
      const strongLabel = strongCriteria[0].label.toLowerCase();
      const weakLabel = weakCriteria[0].label.toLowerCase();
      return `I've looked at the data! The ${strongLabel} was rated highly, though the feedback shows the ${weakLabel} got slightly mixed reactions.`;
    }
    if (recurringPositive && recurringNegative) {
      const posTheme = PERCEPTION_THEMES.find(t => t.id === recurringPositive.themeId);
      const negTheme = PERCEPTION_THEMES.find(t => t.id === recurringNegative.themeId);
      const posHint = posTheme ? pickRandom(posTheme.positiveObservations).toLowerCase() : 'some areas worked well';
      const negHint = negTheme ? pickRandom(negTheme.negativeObservations).toLowerCase() : 'other areas needed attention';
      return `I've pulled the feedback together! Reviewers loved that ${posHint.charAt(0).toLowerCase() + posHint.slice(1).replace(/\.$/, '')}. The data also highlights that ${negHint.replace(/^the /, '').replace(/\.$/, '')}, which is an easy area to refine.`;
    }
    return `I've synthesized the results! The feedback shows some mixed signals, with some areas working well alongside a few spots reviewers felt could be refined.`;
  }

  // Below 3.0 overall
  if (recurringNegative) {
    const theme = PERCEPTION_THEMES.find(t => t.id === recurringNegative.themeId);
    const frictionHint = theme ? pickRandom(theme.negativeObservations) : 'Several things kept coming up.';
    return `I've looked at the feedback, and it looks like the audience had a tougher reception to this one. ${frictionHint}`;
  }

  return `I've pulled the data together! Most of the feedback points to deeper issues with the core approach, but we can work through this.`;
}

// ─── Strengths / Areas to Improve Generation ─────────────────────────────────

function generateStrengths(
  scoreTrends: ScoreTrend[],
  themeMatches: ThemeMatch[],
): string[] {
  const bullets: string[] = [];

  // Priority 1: Themes with ≥2 positive mentions AND correlated strong score
  const positiveThemes = themeMatches
    .filter(t => t.sentiment === 'positive' && t.totalMentions >= 2)
    .sort((a, b) => b.totalMentions - a.totalMentions);

  for (const match of positiveThemes) {
    if (bullets.length >= 3) break;
    const theme = PERCEPTION_THEMES.find(t => t.id === match.themeId);
    if (!theme) continue;

    // Check if correlated criterion is also strong
    const hasStrongScore = theme.criterionAffinity.some(key =>
      scoreTrends.find(t => t.criterionKey === key && (t.sentiment === 'strong' || t.sentiment === 'solid'))
    );

    if (hasStrongScore) {
      bullets.push(pickRandom(theme.positiveObservations));
    }
  }

  // Priority 2: Remaining positive themes (even without strong score match)
  for (const match of positiveThemes) {
    if (bullets.length >= 3) break;
    const theme = PERCEPTION_THEMES.find(t => t.id === match.themeId);
    if (!theme) continue;
    const observation = pickRandom(theme.positiveObservations);
    if (!bullets.includes(observation)) {
      bullets.push(observation);
    }
  }

  // Priority 3: Fallback — strong scores without comment themes
  if (bullets.length < 3) {
    const strongScores = scoreTrends
      .filter(t => t.sentiment === 'strong')
      .sort((a, b) => b.average - a.average);

    for (const score of strongScores) {
      if (bullets.length >= 3) break;
      bullets.push(`The ${score.label.toLowerCase()} scored very high (${score.average}/5), indicating strong approval.`);
    }
  }

  return bullets;
}

function generateAreasToImprove(
  scoreTrends: ScoreTrend[],
  themeMatches: ThemeMatch[],
): string[] {
  const bullets: string[] = [];

  // Priority 1: Themes with ≥2 negative mentions AND correlated weak/neutral score
  const negativeThemes = themeMatches
    .filter(t => (t.sentiment === 'negative' || t.sentiment === 'mixed') && t.totalMentions >= 2)
    .sort((a, b) => b.totalMentions - a.totalMentions);

  for (const match of negativeThemes) {
    if (bullets.length >= 3) break;
    const theme = PERCEPTION_THEMES.find(t => t.id === match.themeId);
    if (!theme) continue;

    const hasWeakScore = theme.criterionAffinity.some(key =>
      scoreTrends.find(t => t.criterionKey === key && (t.sentiment === 'weak' || t.sentiment === 'neutral'))
    );

    if (hasWeakScore) {
      bullets.push(pickRandom(theme.negativeObservations));
    }
  }

  // Priority 2: Remaining negative themes
  for (const match of negativeThemes) {
    if (bullets.length >= 3) break;
    const theme = PERCEPTION_THEMES.find(t => t.id === match.themeId);
    if (!theme) continue;
    const observation = pickRandom(theme.negativeObservations);
    if (!bullets.includes(observation)) {
      bullets.push(observation);
    }
  }

  // Priority 3: Fallback — weak scores without comment themes
  if (bullets.length < 3) {
    const weakScores = scoreTrends
      .filter(t => t.sentiment === 'weak')
      .sort((a, b) => a.average - b.average);

    for (const score of weakScores) {
      if (bullets.length >= 3) break;
      bullets.push(`The ${score.label.toLowerCase()} scored low (${score.average}/5), suggesting a potential area for refinement.`);
    }
  }

  return bullets;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

const MIN_REVIEWS = 5;
const MIN_COMMENTS = 2;

export function synthesizeInsights(
  reviews: Review[],
  category?: Category,
  postTitle?: string,
  _postDescription?: string,
): PerceptionInsights {
  // Confidence gate
  if (reviews.length < MIN_REVIEWS) {
    return { summary: null, strengths: [], areasToImprove: [], meetsThreshold: false };
  }

  const comments = reviews
    .map(r => r.comment)
    .filter((c): c is string => !!c && c.trim().length > 0);

  if (comments.length < MIN_COMMENTS) {
    return { summary: null, strengths: [], areasToImprove: [], meetsThreshold: false };
  }

  const modeConfig = getReviewMode(category);

  // Analyze
  const mockScoredReviews: ScoredReview[] = comments.map(c => ({
    review: { comment: c } as any,
    classification: 'relevant',
    confidence: 1,
    signal_strength: 1,
  }));
  const themeMatches = clusterComments(mockScoredReviews);
  const scoreTrends = analyzeScoreTrends(reviews, modeConfig);

  // Synthesize
  const summary = generateSummary(scoreTrends, themeMatches, modeConfig, postTitle);
  const strengths = generateStrengths(scoreTrends, themeMatches);
  const areasToImprove = generateAreasToImprove(scoreTrends, themeMatches);

  return { summary, strengths, areasToImprove, meetsThreshold: true };
}

// ─── Signal Extraction (for LLM Synthesis Layer) ────────────────────────────

export interface CriterionMeta {
  label: string;
  question: string;
  points: string[];
}

export interface ReviewerSnapshot {
  name: string;
  scores: Record<string, number>;
  comment?: string;
}

export interface InsightSignals {
  // Structured signals (from deterministic engine)
  positiveThemes: string[];
  negativeThemes: string[];
  contradictions: string[];
  scoreTrends: { label: string; average: number; sentiment: string }[];

  // Review mode context
  reviewMode: string;
  category: string;
  criteriaContext: CriterionMeta[];

  // Post metadata
  postTitle?: string;
  postDescription?: string;

  // Raw data (curated subset)
  highSignalSnapshots: ReviewerSnapshot[];
  lowSignalSnapshots: ReviewerSnapshot[];

  // Counts
  reviewCount: number;
  commentCount: number;
}

export function extractInsightSignals(
  scoredReviews: ScoredReview[],
  category?: Category,
  postTitle?: string,
  postDescription?: string,
): InsightSignals {
  const reviews = scoredReviews.map(sr => sr.review);
  const modeConfig = getReviewMode(category);
  const themeMatches = clusterComments(scoredReviews);
  const scoreTrends = analyzeScoreTrends(reviews, modeConfig);

  // Convert theme matches to human-readable signal strings
  const positiveThemes: string[] = [];
  const negativeThemes: string[] = [];
  const contradictions: string[] = [];

  for (const match of themeMatches) {
    // Perception Stability Check
    if (match.totalMentions < 2) continue;
    if (match.cumulativeSignal < 1.0) continue; // Minimum signal threshold

    const theme = PERCEPTION_THEMES.find(t => t.id === match.themeId);
    if (!theme) continue;

    if (match.sentiment === 'positive') positiveThemes.push(theme.id.replace(/_/g, ' '));
    else if (match.sentiment === 'negative') negativeThemes.push(theme.id.replace(/_/g, ' '));
    else if (match.sentiment === 'mixed') {
      contradictions.push(`${theme.id.replace(/_/g, ' ')} (divided perception: some positive, some negative)`);
    }
  }

  // Criteria context
  const criteriaContext: CriterionMeta[] = modeConfig.criteria.map(c => ({
    label: c.label,
    question: c.question,
    points: c.points,
  }));

  // Separate Snapshots
  const highSignalSnapshots: ReviewerSnapshot[] = [];
  const lowSignalSnapshots: ReviewerSnapshot[] = [];

  for (const sr of scoredReviews) {
    if (sr.classification === 'off_topic' || sr.confidence < 0.6) continue;

    const r = sr.review;
    const scores: Record<string, number> = {};
    for (const c of modeConfig.criteria) {
      const val = r[c.dbKey as keyof Review];
      if (typeof val === 'number') scores[c.label] = val;
    }

    const snapshot: ReviewerSnapshot = {
      name: (r.reviewer_id || 'Unknown').substring(0, 8),
      scores,
      comment: r.comment,
    };

    if (sr.classification === 'relevant') {
      highSignalSnapshots.push(snapshot);
    } else {
      // partially_relevant or low_signal
      lowSignalSnapshots.push(snapshot);
    }
  }

  return {
    positiveThemes,
    negativeThemes,
    contradictions,
    scoreTrends: scoreTrends.map(t => ({ label: t.label, average: t.average, sentiment: t.sentiment })),
    reviewMode: modeConfig.modeName,
    category: category || 'general',
    criteriaContext,
    postTitle,
    postDescription,
    highSignalSnapshots,
    lowSignalSnapshots,
    reviewCount: reviews.length,
    commentCount: reviews.filter(r => !!r.comment).length,
  };
}

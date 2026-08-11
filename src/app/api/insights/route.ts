/**
 * POST /api/insights — Computational Audience Perception System
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractInsightSignals } from '@/utils/insightEngine';
import type { ScoredReview, InsightSignals } from '@/utils/insightEngine';
import type { Review, Category } from '@/types';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
// ─── Model Invocation ─────────────────────────────────────────────────────────

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || response.statusText;
    throw new Error(`Gemini ${model} ${response.status}: ${errMsg}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

interface ModelProvider {
  name: string;
  call: (prompt: string, geminiKey: string, openrouterKey: string) => Promise<string>;
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://www.raterapp.site',
      'X-Title': 'Rater Insights',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || response.statusText;
    throw new Error(`OpenRouter ${response.status}: ${errMsg}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

const MODEL_CASCADE: ModelProvider[] = [
  { name: 'Gemini 3.5 Flash', call: (p, g) => callGemini('gemini-3.5-flash', p, g) },
  { name: 'Gemini 3.1 Pro', call: (p, g) => callGemini('gemini-3.1-pro-preview', p, g) },
  { name: 'Gemini 2.5 Flash', call: (p, g) => callGemini('gemini-2.5-flash', p, g) },
  { name: 'Gemini 2.0 Flash', call: (p, g) => callGemini('gemini-2.0-flash', p, g) },
  { name: 'Gemini 2.5 Flash Lite', call: (p, g) => callGemini('gemini-2.5-flash-lite', p, g) },
  { name: 'OpenRouter', call: (p, _g, o) => callOpenRouter(p, o) },
];

// ─── Classification Layer ────────────────────────────────────────────────────

interface ClassifyResult {
  review_id: string;
  classification: 'relevant' | 'partially_relevant' | 'low_signal' | 'off_topic';
  confidence: number;
  signal_strength: number;
}

function sampleReviews(reviews: Review[], limits: { newest: number, highestRated: number, longest: number }): Review[] {
  const sampled = new Map<string, Review>();
  
  // 1. Newest
  const byNewest = [...reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  byNewest.slice(0, limits.newest).forEach(r => sampled.set(r.id, r));

  // 2. Highest Rated (Average of ratings given)
  const byRating = [...reviews].sort((a, b) => {
    const avgA = Object.values(a.ratings || {}).reduce((sum, val) => sum + val, 0) / (Object.values(a.ratings || {}).length || 1);
    const avgB = Object.values(b.ratings || {}).reduce((sum, val) => sum + val, 0) / (Object.values(b.ratings || {}).length || 1);
    return avgB - avgA;
  });
  byRating.filter(r => !sampled.has(r.id)).slice(0, limits.highestRated).forEach(r => sampled.set(r.id, r));

  // 3. Longest
  const byLength = [...reviews].sort((a, b) => (b.comment?.length || 0) - (a.comment?.length || 0));
  byLength.filter(r => !sampled.has(r.id)).slice(0, limits.longest).forEach(r => sampled.set(r.id, r));

  return Array.from(sampled.values());
}

async function classifyComments(
  reviews: Review[],
  category: string,
  postDescription: string | undefined,
  geminiKey: string,
  openrouterKey: string
): Promise<ScoredReview[]> {
  const reviewsWithComments = reviews.filter(r => !!r.comment && r.comment.trim().length > 0);

  const INSIGHT_COMMENT_LIMITS = {
    newest: 40,
    highestRated: 30, // Sorted by average rating given
    longest: 30,
  };

  if (reviewsWithComments.length === 0) {
    return reviews.map(r => ({
      review: r,
      classification: 'off_topic',
      confidence: 1,
      signal_strength: 0,
    }));
  }

  const prompt = `You are a strict relevance classifier for a creative review platform.
Determine if each comment is genuinely discussing or evaluating the creative work being reviewed.
WORK CATEGORY: ${category}
${postDescription ? `WORK DESCRIPTION: ${postDescription}` : ''}

Respond ONLY with a valid JSON array of objects. Each object MUST have:
- "review_id": the exact string provided
- "classification": one of ["relevant", "partially_relevant", "low_signal", "off_topic"]
- "confidence": number between 0.0 and 1.0
- "signal_strength": number between 0.0 and 1.0 (density and depth of actionable critique. e.g. "nice" = 0.1, "the layout feels too crowded in the hero section" = 0.9)

DEFINITIONS:
- relevant: Deep, actionable observation or evaluation.
- partially_relevant: Contains some critique but mixed with noise/spam.
- low_signal: On-topic but too shallow to extract meaningful insight (e.g., "nice layout", "looks good", "clean", "wow").
- off_topic: Unrelated to the work or generic spam.

EXAMPLES:
COMMENT: "The typography feels a bit cramped in the hero section." -> {"classification": "relevant", "confidence": 0.9, "signal_strength": 0.8}
COMMENT: "nice layout but I love pizza" -> {"classification": "partially_relevant", "confidence": 0.8, "signal_strength": 0.4}
COMMENT: "looks good" -> {"classification": "low_signal", "confidence": 0.9, "signal_strength": 0.1}
COMMENT: "clean" -> {"classification": "low_signal", "confidence": 0.9, "signal_strength": 0.1}
COMMENT: "spam 1" -> {"classification": "off_topic", "confidence": 0.9, "signal_strength": 0.0}
COMMENT: "follow my instagram" -> {"classification": "off_topic", "confidence": 0.9, "signal_strength": 0.0}

COMMENTS TO CLASSIFY:
${sampleReviews(reviewsWithComments, INSIGHT_COMMENT_LIMITS).map(r => `ID: "${r.id}"\nCOMMENT: "${r.comment}"`).join('\n\n')}
`;

  let lastError: any;
  let geminiDown = false;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let responseText = '';
      try {
        if (!geminiDown && geminiKey && geminiKey !== 'your_api_key_here') {
          responseText = await callGemini('gemini-2.5-flash-lite', prompt, geminiKey);
        } else {
          throw new Error("No valid Gemini API key provided or Gemini is marked as down.");
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('fetch failed') || err.message.includes('Timeout') || err.message.includes('503'))) {
            geminiDown = true;
        }
        if (attempt === 1) console.warn('[Classifier] Gemini failed, falling back to OpenRouter...', err);
        if (openrouterKey && openrouterKey !== 'your_api_key_here') {
          // OpenRouter uses deepseek-chat or google/gemini-2.5-flash-lite
          responseText = await callOpenRouter(prompt, openrouterKey);
        } else {
          throw new Error("No OpenRouter API key available for fallback.");
        }
      }

      let textToParse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const arrayMatch = textToParse.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        textToParse = arrayMatch[0];
      } else {
        // Fallback: If no array brackets were found, try extracting from the first '{' to the last '}'
        // and wrap it in array brackets. This catches LLMs that forget the surrounding '[' ']' 
        // but still output valid objects (e.g. {...}, {...}) while ignoring conversational filler.
        const objectMatch = textToParse.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          textToParse = `[${objectMatch[0]}]`;
        }
      }
      
      let parsedData = JSON.parse(textToParse);

      // Handle case where LLM wraps the array in an object (e.g. { "classifications": [...] })
      if (!Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
        const arrayVal = Object.values(parsedData).find(v => Array.isArray(v));
        if (arrayVal) {
          parsedData = arrayVal;
        } else {
          // It's a single object, wrap it in an array
          parsedData = [parsedData];
        }
      }

      if (!Array.isArray(parsedData)) {
        throw new Error("Parsed data could not be resolved to an array");
      }

      const classifications: ClassifyResult[] = parsedData;

      // Ensure the schema actually matches our expectations so we don't silently fail
      if (classifications.length > 0 && !classifications.some(c => c.review_id && c.classification)) {
        throw new Error("JSON parsed successfully but is missing 'review_id' and 'classification' keys");
      }

      return reviews.map(r => {
        // Fallback to matching by index if LLM completely butchered the review_id
        const cls = classifications.find(c => c.review_id === r.id) || 
                   (classifications.length === reviews.length ? classifications[reviews.indexOf(r)] : null);
                   
        return {
          review: r,
          classification: cls?.classification || 'off_topic',
          confidence: cls?.confidence ?? 1.0,
          signal_strength: cls?.signal_strength ?? 0.0,
        };
      });
    } catch (error) {
      console.warn(`[Classifier] Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      lastError = error;
      // Let it loop to retry
    }
  }

  console.error('[Classifier] Completely Failed after 3 attempts:', lastError);
  // We throw the error so the main catch block can return a 500 status.
  // This allows the frontend to show the "Network dey stress" error state,
  // rather than falling back to a false "Not enough feedback" state.
  throw new Error('Classifier failed due to network, timeout, or parsing issues.');
}

// ─── Synthesis Layer ─────────────────────────────────────────────────────────

function sanitize(text: string): string {
  return text.replace(/"/g, "'").replace(/\\/g, '').replace(/\n/g, ' ').replace(/\r/g, '').trim().slice(0, 300);
}

function buildPrompt(signals: InsightSignals, analysisMode: string): string {
  const scoreSummary = signals.scoreTrends
    .map(s => `${s.label}: ${s.average}/5 (${s.sentiment})`)
    .join('\n');

  const positiveList = signals.positiveThemes.length > 0 ? signals.positiveThemes.join(', ') : 'none detected';
  const negativeList = signals.negativeThemes.length > 0 ? signals.negativeThemes.join(', ') : 'none detected';
  const contradictionsList = signals.contradictions.length > 0 ? signals.contradictions.join(', ') : 'none detected';

  const criteriaSection = signals.criteriaContext
    .map(c => `- ${c.label}: "${c.question}" — evaluates: ${c.points.join(', ')}`)
    .join('\n');

  const highSignalSection = signals.highSignalSnapshots
    .map(r => `${r.name}: ${Object.entries(r.scores).map(([k, v]) => `${k}:${v}`).join(' ')} — ${r.comment ? sanitize(r.comment) : ''}`)
    .join('\n');

  const lowSignalSection = signals.lowSignalSnapshots
    .map(r => `${r.name}: ${Object.entries(r.scores).map(([k, v]) => `${k}:${v}`).join(' ')} — ${r.comment ? sanitize(r.comment) : ''}`)
    .join('\n');

  return `You are the voice of Rater, a design review platform built by creatives for creatives.
You synthesize audience perception patterns. You are NOT analyzing the design itself.

==================================================
VOICE & PERSONALITY
==================================================

You write like a warm, empathetic, and accommodating creative collaborator who is synthesizing audience feedback.
Your tone is natural, conversational, and highly supportive.

CRITICAL PERSONA RULE:
You must separate your supportive voice from the objective feedback data.
- Use personal pronouns ("I", "we") ONLY in the 'summary' to address the user as a supportive peer (e.g. "I've pulled the feedback together for you...").
- Do NOT use "I" or "We" in the 'strengths' or 'areasToImprove' arrays.
- The actual feedback (strengths and areas to improve) MUST be framed objectively, focusing on the data ("The ratings indicate...", "The feedback shows...") or the audience ("Reviewers noted...", "Your audience felt...").
- Never pretend that YOU (the AI) are passing subjective judgment. Always attribute the critique to the reviewers or the data.

INSTEAD OF: "We are absolutely blown away by the masterful sense of depth." (Too subjective, uses "We")
WRITE: "Reviewers were absolutely blown away by the masterful sense of depth."

INSTEAD OF: "Some of us felt the colors are coming across a bit muddy." (Too subjective, uses "us")
WRITE: "The feedback highlights that the colors are coming across a bit muddy to some reviewers."

FORMATTING RULES:
- Frame strengths and areas to improve as derived from actual data/audience opinions.
- Be encouraging and empathetic, especially when discussing areas to improve.
- Confident but never harsh; always cushion negative feedback.
- No em dashes. Use periods or commas instead.
- No "however", "moreover", "furthermore" connector words.
- Sound like a friendly team member analyzing the data with the user.

==================================================
WORK CONTEXT
==================================================

Category: ${signals.category}
Review Mode: ${signals.reviewMode}
${signals.postTitle ? `Title: "${signals.postTitle}"` : ''}

CRITERIA BEING EVALUATED:
${criteriaSection}

AGGREGATED SCORES:
${scoreSummary}

RECURRING POSITIVE THEMES:
${positiveList}

RECURRING NEGATIVE THEMES:
${negativeList}

CONTRADICTIONS (Divergent Perception):
${contradictionsList}

HIGH-SIGNAL REVIEWER DATA:
${highSignalSection || 'none'}

LOW-SIGNAL REVIEWER DATA (Use only for mild sentiment reinforcement):
${lowSignalSection || 'none'}

==================================================
ANALYSIS MODE
==================================================

You MUST follow the current ANALYSIS MODE exactly.

ANALYSIS MODE: ${analysisMode}

1. comment_supported
- Use both comments and ratings.
- Preserve specific observations people repeatedly mentioned.
- You may reference nuanced details from high-signal comments.
- Mention contradictory perceptions naturally if they exist.

2. low_signal
- Most written comments were shallow ("looks good", "clean").
- Be heavily restrained. Don't pretend people gave deep critiques.
- Keep it grounded (e.g. "Generally well received, though written feedback stayed pretty brief.")
- Do not fabricate depth.

3. ratings_only
- Generate insights ONLY from criterion scores and score trends.
- Do NOT pretend people mentioned visual specifics.
- Keep it natural and grounded.

==================================================
SYNTHESIS RULES
==================================================

- Never hallucinate design details nobody mentioned.
- Never fabricate critique points.
- Preserve specificity when meaningful patterns exist.
- Low-signal comments should not drive major observations.

==================================================
OUTPUT REQUIREMENTS
==================================================

- Write exactly 1 Summary (max 2 sentences, describing audience perception)
- Write up to 3 Strengths (short observation bullets)
- Write up to 3 Areas to Improve (short observation bullets)
- If there are no positive themes AND no strong/solid scores, write 0 Strengths.
- If there are no negative themes AND no weak scores, write 0 Areas to Improve.

RESPOND IN THIS EXACT JSON FORMAT:
{"summary":"...","strengths":["...","..."],"areasToImprove":["...","..."]}
`;
}

// ─── JSON Parsing ───────────────────────────────────────────────────────────

function parseJSONResponse(responseText: string) {
  const textToParse = responseText.trim();
  try {
    const parsed = JSON.parse(textToParse);
    if (parsed.summary) return parsed;
  } catch { }

  const fenceMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed.summary) return parsed;
    } catch { }
  }

  const jsonMatch = textToParse.match(/\{[\s\S]*"summary"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary) return parsed;
    } catch { }
  }
  throw new Error('Failed to parse LLM response as JSON');
}

// ─── Handler ─────────────────────────────────────────────────────────────────

interface RequestBody {
  postId: string;
  postCategory: Category;
  postTitle?: string;
  postDescription?: string;
}

type AnalysisMode = 'comment_supported' | 'ratings_only' | 'low_signal' | 'insufficient';

export async function POST(request: NextRequest) {
  // 1. Verify the caller is authenticated
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';
  const hasGemini = geminiKey && geminiKey !== 'your_api_key_here';

  if (!hasGemini && !openrouterKey) {
    return NextResponse.json({ error: 'No API keys configured.' }, { status: 503 });
  }

  try {
    const body: RequestBody = await request.json();
    const { postId, postCategory, postTitle, postDescription } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: dbReviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error || !dbReviews) {
      console.error('[Insights API] Failed to fetch reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
    
    const reviews = dbReviews as Review[];

    if (!reviews || reviews.length < 2) {
      return NextResponse.json(
        { summary: "Not enough feedback yet to generate insights.", strengths: [], areasToImprove: [] }
      );
    }

    // 1. Mini-Classifier
    const scoredReviews = await classifyComments(reviews, postCategory, postDescription, geminiKey, openrouterKey);

    // 2. Extract Signals & Segregate
    const signals = extractInsightSignals(scoredReviews, postCategory, postTitle, postDescription);

    // 3. Orchestrator: Analysis Mode Determination
    const totalComments = signals.commentCount;
    const relevantCommentCount = scoredReviews.filter(r => r.classification === 'relevant' || r.classification === 'partially_relevant').length;
    const lowSignalCount = scoredReviews.filter(r => r.classification === 'low_signal').length;

    let analysisMode: AnalysisMode = 'insufficient';

    const hasMeaningfulRatings = signals.reviewCount >= 3 && signals.scoreTrends.some(s => s.average >= 4.2 || s.average <= 2.8);

    // Loosened threshold: if there is at least 1 relevant/partially_relevant comment and it makes up a decent chunk of total feedback
    if (relevantCommentCount >= 1 && (relevantCommentCount / totalComments) >= 0.25) {
      analysisMode = 'comment_supported';
    } else if (lowSignalCount >= 2 && (lowSignalCount / totalComments) >= 0.4) {
      analysisMode = 'low_signal';
    } else if (hasMeaningfulRatings && signals.reviewCount >= 3) {
      analysisMode = 'ratings_only';
    }

    // 4. Short-Circuit
    if (analysisMode === 'insufficient') {
      return NextResponse.json({
        summary: "Not enough relevant feedback yet to generate meaningful insights.",
        strengths: [],
        areasToImprove: [],
        model: 'Rater'
      });
    }

    // 5. Synthesis
    const prompt = buildPrompt(signals, analysisMode);

    const availableProviders = MODEL_CASCADE.filter(p => p.name === 'OpenRouter' ? openrouterKey : hasGemini);

    let responseText = '';
    let usedModel = '';

    for (const provider of availableProviders) {
      try {
        responseText = await provider.call(prompt, geminiKey, openrouterKey);
        usedModel = provider.name;
        break;
      } catch (err) {
        console.warn(`[Insights API] ${provider.name} failed`);
      }
    }

    if (!responseText) throw new Error('All models failed');

    const parsed = parseJSONResponse(responseText);

    const resultPayload = {
      summary: parsed.summary.slice(0, 500),
      strengths: parsed.strengths.slice(0, 3).map((s: string) => s.slice(0, 200)),
      areasToImprove: parsed.areasToImprove.slice(0, 3).map((s: string) => s.slice(0, 200)),
      model: usedModel,
    };

    // Cache the result using Service Role so everyone benefits, bypassing RLS
    if (postId) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { error } = await supabaseAdmin.from('insight_cache').upsert({
        post_id: postId,
        result: resultPayload,
        review_count: reviews.length
      });
      if (error) {
        console.error('[Insights API] Failed to cache:', error);
      }
    }

    return NextResponse.json(resultPayload);
  } catch (error: unknown) {
    console.error('[Insights API] Error:', error);
    return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 });
  }
}

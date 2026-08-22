import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Insights Disclosure | Rater',
  description: 'How AI perception modeling and synthesis operates on Rater, with strict creator IP protections.',
};

export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-black uppercase tracking-wider">
            AI Transparency
          </span>
          <span className="text-xs text-gray-400">Last updated: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          AI Insights Disclosure
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
          Rater uses AI exclusively to synthesize human review patterns and surface actionable feedback trends. Here is how our perception modeling operates and how your creative rights are safeguarded.
        </p>
      </div>

      {/* 1. What AI Does on Rater */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          1. How AI Operates on Rater
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Perception & Sentiment Synthesis</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                When a published work unlocks its Overall Score (minimum 3 peer critiques), Rater&apos;s synthesis engine analyzes the text of submitted reviews to identify recurring consensus patterns, strengths, and prioritized areas for iteration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-gray-900">Theme Extraction</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Highlights common keywords and design attributes (e.g., &quot;typography balance&quot;, &quot;high-contrast palette&quot;) noted by multiple reviewers.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-gray-900">Actionable Summaries</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Synthesizes constructive next steps so creators don&apos;t have to manually parse dozens of individual comments for key takeaways.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Human-First Rating Guarantee */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          2. Human-First Rating Guarantee
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900">AI Never Rates or Scores Work</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  All 1–10 scores and badges awarded on Rater originate strictly from authenticated human designers and product peers. AI has zero influence on the numerical score calculation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900">No Synthetic or Bot Reviews</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Rater does not generate automated critique comments. Every review displayed on a work is authored by an authenticated creator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Intellectual Property & Training Boundaries */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          3. Creator IP Protection & Training Boundaries
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Your Designs Are Never Used for Generative Training</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Artwork, screenshots, brand identities, and design assets uploaded to Rater are <strong className="text-gray-900">never used to train, fine-tune, or develop third-party generative foundational models</strong> (such as text-to-image or diffusion models).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-900">Data Processing Scope</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              AI text processing is strictly transient and scoped to analyzing written review feedback within the Rater platform to produce the Insights summary on your post.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Algorithmic Integrity & Governance */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          4. Algorithmic Integrity & Governance
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Bias Mitigation & Auditability</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                We regularly audit our perception synthesis algorithms to prevent stylistic bias, linguistic distortion, or unfair critique characterizations. Creators can report inaccurate insights summaries directly to our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

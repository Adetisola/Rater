import type { Metadata } from 'next';
import { BookOpen, ShieldCheck, AlertCircle, CheckCircle2, Star, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Guidelines | Rater',
  description: 'Rating standards, constructive critique philosophy, and creative conduct rules on Rater.',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-black uppercase tracking-wider">
            Code of Conduct
          </span>
          <span className="text-xs text-gray-400">Last updated: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Community Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
          Rater is built to provide honest, peer-driven critique for designers and product creators. These standards preserve constructive discourse and rating integrity.
        </p>
      </div>

      {/* 1. Core Critique Philosophy */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          1. Critique Philosophy & Principles
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Constructive, Objective, & Actionable</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                A great critique elevates the craft. When rating and commenting on published work, focus on the execution—visual hierarchy, typography, color harmony, user experience, and concept execution—rather than subjective personal taste alone.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/50 space-y-1.5">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>What We Encourage</span>
              </p>
              <ul className="text-[11px] text-emerald-800/80 space-y-1 list-disc list-inside">
                <li>Specific feedback identifying strengths and revision opportunities.</li>
                <li>Nuanced, honest 1-10 scores aligned with real execution craft.</li>
                <li>Respectful dialogue between senior and emerging designers.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/50 space-y-1.5">
              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" />
                <span>What We Avoid</span>
              </p>
              <ul className="text-[11px] text-amber-800/80 space-y-1 list-disc list-inside">
                <li>Low-effort, single-word reviews (&quot;nice&quot;, &quot;bad&quot;, &quot;10/10&quot;).</li>
                <li>Personal attacks, insults, or unconstructive negativity.</li>
                <li>Rating work based on the creator&apos;s identity rather than the design.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. The 1-10 Rating Standard */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          2. The 1-10 Rating Standard
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-12 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 font-bold text-xs shrink-0">
              1.0–3.9
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Needs Foundational Revision</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Work with severe execution flaws: unresolved hierarchy, broken responsive scaling, illegible contrast, or incomplete conceptual framework.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-12 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 font-bold text-xs shrink-0">
              4.0–6.9
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Solid Functional Baseline</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Work that functions and meets standard design patterns, but shows clear opportunities to refine typography choices, micro-spacing, or visual excitement.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-12 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-900 font-bold text-xs shrink-0">
              7.0–8.9
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Production-Ready & High Polish</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Exceptional craft: cohesive visual language, rigorous attention to detail, balanced color systems, and seamless usability. Ready for real-world launch.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-12 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-black font-extrabold text-xs shrink-0">
              9.0–10.0
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-gray-900">Masterclass & Benchmark</p>
                <Star size={12} className="text-primary fill-primary" />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Visionary execution that pushes design boundaries. Flawless craft, memorable art direction, and exemplary problem-solving. Reserved for extraordinary work.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Prohibited Content & Behavior */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          3. Prohibited Conduct & Integrity Rules
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Plagiarism & Intellectual Property Theft</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  You may only publish work that you created or have documented license to showcase. Passing off another creator&apos;s design as your own results in immediate permanent suspension.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Review Bombing & Score Manipulation</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Coordinated down-voting, creating duplicate burner accounts to inflate scores, or trading 10/10 scores is strictly prohibited. Rater&apos;s algorithms detect and nullify artificial voting patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Harassment, Hate Speech & NSFW Content</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Rater is a professional studio space. Content containing hate speech, harassment, explicit nudity, or unlawful imagery will be removed immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Moderation & Enforcement */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          4. Moderation & Enforcement
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Community Reporting & Strikes</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Community members can flag reviews or works that breach these guidelines. Flagged items are reviewed by Rater moderators. Repeated violations result in reviewer credibility penalties or account termination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Pledge Callout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-primary/20 flex items-start gap-3.5 shadow-2xs">
        <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-gray-900">Our Shared Commitment</p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
            By sharing work and writing critiques on Rater, you contribute to a community where creators can grow with honest, respectful, and insightful feedback.
          </p>
        </div>
      </div>
    </div>
  );
}

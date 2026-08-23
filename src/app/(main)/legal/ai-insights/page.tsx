import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI & Insights Policy | Rater',
  description: "How Rater's AI-powered Insights features work, how feedback signals are synthesized, and creator IP safeguards.",
  alternates: {
    canonical: 'https://www.raterapp.site/legal/ai-insights',
  },
};

export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-black uppercase tracking-wider">
            AI & Insights Policy
          </span>
          <span className="text-xs text-gray-400">Effective Date: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Rater AI & Insights Policy
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
          This Policy explains how Rater’s AI-powered Insights features work and what users should expect from them.
        </p>
      </div>

      {/* 1. What Insights Are */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          1. What Insights Are
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            Rater may generate AI-powered insights that summarize review activity, recurring themes, and overall perception patterns for a post. These insights are designed to help creatives understand:
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>how their work is being received,</li>
            <li>what stands out most,</li>
            <li>where feedback is repeated,</li>
            <li>and where there may be room to improve.</li>
          </ul>
        </div>
      </div>

      {/* 2. How Insights Are Generated */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          2. How Insights Are Generated
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 leading-relaxed">Insights may use:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>review ratings,</li>
            <li>criterion scores,</li>
            <li>review modes,</li>
            <li>written comments,</li>
            <li>recurring patterns in feedback,</li>
            <li>and other related signals collected from the platform.</li>
          </ul>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">
            Rater may use automated systems and AI models to synthesize these signals into short summaries, strengths, and areas to improve.
          </p>
        </div>
      </div>

      {/* 3. What Insights Are Not */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          3. What Insights Are Not
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 font-medium">Insights are not:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>professional design advice,</li>
            <li>factual guarantees,</li>
            <li>definitive judgments,</li>
            <li>legal, financial, or technical advice,</li>
            <li>or a replacement for human judgment.</li>
          </ul>
          <p className="text-xs text-gray-500 italic pt-1">
            They are a synthesis of available feedback signals and may sometimes be incomplete or imperfect.
          </p>
        </div>
      </div>

      {/* 4. When Insights May Be Limited */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          4. When Insights May Be Limited
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            If there is not enough meaningful feedback, or if the available feedback is too sparse or off-topic, Rater may show a limited result, a reduced result, or a message explaining that there is not enough relevant feedback yet.
          </p>
          <p className="text-xs text-gray-500">
            This helps prevent misleading or low-quality summaries.
          </p>
        </div>
      </div>

      {/* 5. Public vs. Profile-Based Access */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          5. Public vs. Profile-Based Access
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700">
            Rater may show basic public perception analytics, such as:
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
            <li>overall rating averages,</li>
            <li>review counts,</li>
            <li>and criterion averages.</li>
          </ul>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">
            More advanced AI-generated insights may be available only to registered users or profile holders, depending on the feature design.
          </p>
        </div>
      </div>

      {/* 6. Human Feedback Still Matters */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          6. Human Feedback Still Matters
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-900 font-semibold">
            AI insights are only as useful as the feedback behind them.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            If reviews are thoughtful and specific, the insights can be more helpful. If reviews are off-topic, shallow, or spammy, the system may produce limited or reduced insights.
          </p>
        </div>
      </div>

      {/* 7. Model Behavior and Limitations */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          7. Model Behavior and Limitations
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            Rater may use multiple AI providers or fallback models to support the Insights feature. AI systems can vary in tone, phrasing, and output style. For that reason:
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>the same data may sometimes be summarized slightly differently,</li>
            <li>outputs may not always be identical,</li>
            <li>and the system may be updated over time to improve quality and reliability.</li>
          </ul>
        </div>
      </div>

      {/* IP Protection & Non-Generative Training Safeguard */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          Creator IP & Training Protections
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-emerald-600" />
            <p className="text-xs font-bold text-gray-900">No Generative Model Training</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Visual artwork, design files, screenshots, and creative assets uploaded to Rater are <strong className="text-gray-900">never used to train third-party generative foundational models</strong> (such as text-to-image or diffusion models).
          </p>
        </div>
      </div>

      {/* 8. Your Responsibilities */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          8. Your Responsibilities
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 font-medium">By using the Insights feature, you agree that:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>you understand the insights are automated,</li>
            <li>you will not treat them as perfect,</li>
            <li>and you will not rely on them as a substitute for your own judgment or professional review.</li>
          </ul>
        </div>
      </div>

      {/* 9. Changes to This Policy */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          9. Changes to This Policy
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            We may update this Policy from time to time as the insights system evolves. If we make material changes, we may update the Effective Date or notify users through the Service.
          </p>
        </div>
      </div>

      {/* 10. Contact */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          10. Contact
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            If you have questions about the AI & Insights Policy, contact us directly at{' '}
            <a href="mailto:support@raterapp.site" className="text-gray-900 font-semibold underline hover:text-primary">
              support@raterapp.site
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}

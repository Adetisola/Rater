import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Guidelines | Rater',
  description: "Rater's standards for constructive, respectful creative critique, rating integrity, and community rules.",
  alternates: {
    canonical: 'https://www.raterapp.site/legal/community-guidelines',
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
      {/* Header Banner */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-text-primary uppercase tracking-wider">
            Community Standards
          </span>
          <span className="text-xs text-text-muted">Effective Date: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Rater Community Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
          These Community Guidelines explain the kind of culture we want to build on Rater. Rater is for creatives, reviewers, and people who want to help work get better. The point is to critique the work, not attack the person.
        </p>
      </div>

      {/* 1. Be Constructive */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          1. Be Constructive
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed font-medium">
            If you leave feedback, try to make it useful. Good feedback explains:
          </p>
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li><strong className="text-text-primary">What worked</strong></li>
            <li><strong className="text-text-primary">What didn’t</strong></li>
            <li><strong className="text-text-primary">And what could be improved</strong></li>
          </ul>
          <p className="text-xs text-text-secondary leading-relaxed pt-1">
            If something is off, say why it feels off. If something is strong, say why it stands out.
          </p>
        </div>
      </div>

      {/* 2. Critique the Work, Not the Person */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          2. Critique the Work, Not the Person
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-primary font-semibold leading-relaxed">
            Designs are open to critique. People are not.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Do not use reviews or comments to insult, mock, harass, threaten, or embarrass other users.
          </p>
        </div>
      </div>

      {/* 3. Be Honest */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          3. Be Honest
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li>Do not inflate ratings just because you know the creator.</li>
            <li>Do not tank ratings because you are in a bad mood.</li>
          </ul>
          <p className="text-xs text-text-primary font-bold pt-1">
            Rate what you actually think.
          </p>
        </div>
      </div>

      {/* 4. Stay On Topic */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          4. Stay On Topic
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            Reviews should be about the creative work being reviewed. Do not spam unrelated content, random phrases, copied text, or off-topic messages.
          </p>
          <p className="text-xs text-text-muted italic">
            If your comment is not about the work, it probably does not belong there.
          </p>
        </div>
      </div>

      {/* 5. No Abuse or Manipulation */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          5. No Abuse or Manipulation
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary font-medium">Do not:</p>
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li>spam reviews,</li>
            <li>coordinate fake ratings,</li>
            <li>create fake engagement,</li>
            <li>repeatedly submit meaningless feedback,</li>
            <li>attempt to manipulate the system.</li>
          </ul>
        </div>
      </div>

      {/* 6. Respect Copyright and Ownership */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          6. Respect Copyright and Ownership
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-primary font-semibold">Only upload work you have the right to share.</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Do not upload stolen content, unauthorized copies, or content that violates another person’s rights. If you reference someone else’s work, make sure you have permission or a valid reason to share it.
          </p>
        </div>
      </div>

      {/* 7. Keep It Respectful */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          7. Keep It Respectful
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-1.5">
          <p className="text-xs text-text-primary font-semibold">Disagreement is allowed. Personal attacks are not.</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            We want honest critique, not cruelty.
          </p>
        </div>
      </div>

      {/* 8. No Harmful Content */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          8. No Harmful Content
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs">
          <p className="text-xs text-text-secondary leading-relaxed">
            Do not use Rater to share content that is unlawful, abusive, hateful, violent, or otherwise harmful.
          </p>
        </div>
      </div>

      {/* 9. Use the Platform Responsibly */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          9. Use the Platform Responsibly
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary font-medium">Do not:</p>
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li>create fake accounts,</li>
            <li>scrape the platform,</li>
            <li>interfere with the Service,</li>
            <li>misuse AI features,</li>
            <li>abuse reporting tools,</li>
            <li>or try to bypass platform rules.</li>
          </ul>
        </div>
      </div>

      {/* 10. What Happens If You Break the Rules */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          10. What Happens If You Break the Rules
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            We may remove content, limit features, suspend accounts, or take other action if someone breaks these guidelines or threatens the integrity of the community.
          </p>
        </div>
      </div>

      {/* 11. The Spirit of Rater */}
      <div className="p-4 sm:p-6 rounded-2xl bg-amber-500/10 border border-primary/30 space-y-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">11. The Spirit of Rater</h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Rater works best when people are thoughtful, fair, and direct.
        </p>
        <p className="text-xs text-text-primary font-bold italic pt-1">
          &quot;If you would not want the same comment under your own work, do not post it under someone else’s.&quot;
        </p>
      </div>
    </div>
  );
}

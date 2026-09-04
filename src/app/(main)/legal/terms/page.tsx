import type { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Rater',
  description: 'The terms governing your access to and use of Rater, creative content ownership, and service rules.',
  alternates: {
    canonical: 'https://www.raterapp.site/legal/terms',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
      {/* Header Banner */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-text-primary uppercase tracking-wider">
            Legal Agreement
          </span>
          <span className="text-xs text-text-muted">Effective Date: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Rater Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
          Welcome to Rater. These Terms of Service (“Terms”) govern your access to and use of Rater’s website, applications, and related services (together, the “Service”). By accessing or using Rater, you agree to these Terms. If you do not agree, please do not use the Service.
        </p>
      </div>

      {/* 1. Eligibility */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          1. Eligibility
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            You must be at least 13 years old, or the minimum age required in your country, to use Rater.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            By creating an account, you confirm that the information you provide is accurate and that you are authorized to use the Service.
          </p>
        </div>
      </div>

      {/* 2. Accounts */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          2. Accounts
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must not:
          </p>
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li>create an account using false or misleading information,</li>
            <li>impersonate another person or organization,</li>
            <li>share your login credentials with others, or</li>
            <li>use another user’s account without permission.</li>
          </ul>
          <p className="text-xs text-text-secondary leading-relaxed pt-1">
            We may suspend or terminate accounts that violate these Terms or our Community Guidelines.
          </p>
        </div>
      </div>

      {/* 3. User Content */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          3. User Content & Creator Ownership
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-emerald-500" />
            <p className="text-xs font-bold text-text-primary">You Retain Full Ownership</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            You retain ownership of the creative work, images, text, reviews, and other content you submit to Rater (“User Content”).
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            By submitting User Content, you grant Rater a non-exclusive, worldwide, royalty-free license to host, store, display, reproduce, process, and distribute that content solely for operating, improving, and promoting the Service.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            You are responsible for ensuring you have the rights needed to upload or submit any content you share on Rater.
          </p>
        </div>
      </div>

      {/* 4. Reviews and Feedback */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          4. Reviews and Feedback
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-text-secondary font-medium">
            Rater is built for thoughtful creative feedback. When using the review system, you agree to:
          </p>
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li>be constructive,</li>
            <li>be respectful,</li>
            <li>review the work rather than attacking the person behind it,</li>
            <li>avoid spam, manipulation, or review abuse,</li>
            <li>avoid harassment, threats, hate speech, or discriminatory content.</li>
          </ul>
          <p className="text-xs text-text-secondary leading-relaxed pt-1">
            We may remove reviews that violate these Terms or our Community Guidelines.
          </p>
        </div>
      </div>

      {/* 5. AI-Generated Insights */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          5. AI-Generated Insights
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2.5">
          <p className="text-xs text-text-secondary leading-relaxed">
            Rater may use artificial intelligence to summarize community feedback and identify recurring themes from ratings, reviews, and other signals.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            These insights are provided to help creators reflect on how their work is being perceived. They are not guaranteed to be complete, accurate, or error-free, and they should not be treated as professional, legal, financial, or technical advice.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            By using the Service, you understand that AI-generated insights may reflect patterns in user feedback and may sometimes be imperfect.
          </p>
        </div>
      </div>

      {/* 6. Acceptable Use */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          6. Acceptable Use
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-text-secondary font-medium">You agree not to:</p>
          <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside pl-1">
            <li>upload unlawful, infringing, fraudulent, harmful, or abusive content,</li>
            <li>attempt to manipulate ratings, reviews, or insights,</li>
            <li>create fake accounts or automate abuse,</li>
            <li>scrape, reverse engineer, or interfere with the Service,</li>
            <li>introduce malware or unauthorized code,</li>
            <li>access data or systems you are not authorized to access,</li>
            <li>use the Service in a way that disrupts or degrades it for others.</li>
          </ul>
        </div>
      </div>

      {/* 7. Public Profiles and Visibility */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          7. Public Profiles and Visibility
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            Unless otherwise stated, your profile information, uploaded work, ratings, reviews, and public activity may be visible to other users of the Service.
          </p>
          <p className="text-xs text-text-muted italic">
            Do not submit information you do not want to be public.
          </p>
        </div>
      </div>

      {/* 8. Intellectual Property */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          8. Intellectual Property
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            Rater, including its branding, design, software, and original content, belongs to Rater or its licensors and is protected by applicable intellectual property laws.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            You may not copy, modify, distribute, or exploit any part of the Service except as allowed by these Terms or by law.
          </p>
        </div>
      </div>

      {/* 9. Service Changes */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          9. Service Changes
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs">
          <p className="text-xs text-text-secondary leading-relaxed">
            We may update, modify, suspend, or discontinue features of the Service at any time, with or without notice, to improve the platform or for operational reasons.
          </p>
        </div>
      </div>

      {/* 10. Suspension and Termination */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          10. Suspension and Termination
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            We may suspend, restrict, or terminate access to the Service if we believe you have violated these Terms, our Community Guidelines, or if your actions threaten the safety, integrity, or operation of the platform. We may also remove content that violates these Terms. You may also terminate your account at any time via <strong className="text-text-primary">Settings &gt; Account &gt; Delete Account</strong>.
          </p>
        </div>
      </div>

      {/* 11. Disclaimer */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          11. Disclaimer
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            The Service is provided “as is” and “as available.”
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            We do not guarantee that the Service will be uninterrupted, secure, or error-free. We also do not guarantee that every post will receive reviews, ratings, comments, or AI-generated insights.
          </p>
        </div>
      </div>

      {/* 12. Limitation of Liability */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          12. Limitation of Liability
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs">
          <p className="text-xs text-text-secondary leading-relaxed">
            To the fullest extent permitted by law, Rater and its team will not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service or reliance on content, reviews, ratings, or AI-generated insights.
          </p>
        </div>
      </div>

      {/* 13. Changes to These Terms */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          13. Changes to These Terms
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            We may update these Terms from time to time. If we make material changes, we will notify users by reasonable means, such as through the Service or by updating the Effective Date above.
          </p>
          <p className="text-xs text-text-secondary font-medium">
            Your continued use of the Service after updated Terms become effective means you accept the revised Terms.
          </p>
        </div>
      </div>

      {/* 14. Contact */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
          14. Contact
        </p>
        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 shadow-2xs">
          <p className="text-xs text-text-secondary leading-relaxed">
            If you have questions about these Terms, contact us directly at{' '}
            <a href="mailto:support@raterapp.site" className="text-text-primary font-semibold underline hover:text-primary break-all">
              support@raterapp.site
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}

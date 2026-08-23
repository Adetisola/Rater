import type { Metadata } from 'next';
import { Lock, ShieldCheck, Database, Bell, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Rater',
  description: 'How Rater collects, uses, stores, shares, and protects personal information and creative content.',
  alternates: {
    canonical: 'https://www.raterapp.site/legal/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-black uppercase tracking-wider">
            Privacy & Data Policy
          </span>
          <span className="text-xs text-gray-400">Effective Date: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Rater Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
          This Privacy Policy explains how Rater collects, uses, stores, shares, and protects personal information when you use the Service. By using Rater, you agree to the collection and use of information described in this Privacy Policy.
        </p>
      </div>

      {/* 1. Information We Collect */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          1. Information We Collect
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <p className="text-xs text-gray-700 font-medium">We may collect the following categories of information:</p>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1.5">
              <p className="text-xs font-bold text-gray-900">Account Information</p>
              <p className="text-[11px] text-gray-500">When you create an account, we may collect:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
                <li>name,</li>
                <li>username,</li>
                <li>email address,</li>
                <li>password or authentication information,</li>
                <li>profile image,</li>
                <li>role or bio,</li>
                <li>social links you choose to provide.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1.5">
              <p className="text-xs font-bold text-gray-900">Content and Activity</p>
              <p className="text-[11px] text-gray-500">We may collect:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
                <li>posts you upload,</li>
                <li>images and other creative content,</li>
                <li>reviews you submit,</li>
                <li>ratings you give,</li>
                <li>comments you write,</li>
                <li>search activity,</li>
                <li>profile updates,</li>
                <li>interactions with posts and features.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1.5">
              <p className="text-xs font-bold text-gray-900">Technical Information</p>
              <p className="text-[11px] text-gray-500">We may collect:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
                <li>device type,</li>
                <li>browser type,</li>
                <li>IP address,</li>
                <li>log data,</li>
                <li>usage data,</li>
                <li>session and authentication data,</li>
                <li>cookies or similar technologies,</li>
                <li>performance and error data.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. How We Use Information */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          2. How We Use Information
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 font-medium">We use personal information to:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>provide and operate the Service,</li>
            <li>create and manage user accounts,</li>
            <li>display public profiles and posts,</li>
            <li>process reviews and ratings,</li>
            <li>generate AI-powered insights,</li>
            <li>personalize the experience,</li>
            <li>send service-related notifications,</li>
            <li>prevent spam, abuse, and fraud,</li>
            <li>improve performance, reliability, and security,</li>
            <li>comply with legal obligations.</li>
          </ul>
        </div>
      </div>

      {/* 3. AI Processing */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          3. AI Processing
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2.5">
          <p className="text-xs text-gray-700 leading-relaxed">
            Rater uses automated systems, including AI models, to help summarize review data and identify recurring themes.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            The AI features are designed to analyze patterns in user-submitted ratings, reviews, and related signals so creators can better understand how their work is being perceived.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            We do not claim that AI-generated insights are perfect or always accurate. They are intended to support creative reflection, not replace human judgment.
          </p>
        </div>
      </div>

      {/* 4. How We Share Information */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          4. How We Share Information
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 font-medium">We may share information:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>with service providers that help us operate the platform,</li>
            <li>with infrastructure and hosting providers,</li>
            <li>with database, storage, analytics, and media services,</li>
            <li>when required by law,</li>
            <li>to protect the rights, safety, and security of Rater or its users.</li>
          </ul>
          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 text-xs text-gray-900 font-semibold">
            We do not sell your personal data in the ordinary sense of selling to advertisers.
          </div>
        </div>
      </div>

      {/* 5. Public Information */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          5. Public Information
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            Depending on your settings and how the Service is used, the following may be visible to other users:
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
            <li>username,</li>
            <li>profile information,</li>
            <li>posts,</li>
            <li>reviews,</li>
            <li>ratings,</li>
            <li>comments,</li>
            <li>profile image,</li>
            <li>other content you make public.</li>
          </ul>
          <p className="text-xs text-gray-500 italic pt-1">
            Please do not post information you do not want to be public.
          </p>
        </div>
      </div>

      {/* 6. Data Retention */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          6. Data Retention
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2.5">
          <p className="text-xs text-gray-700 leading-relaxed">
            We keep personal information only as long as needed to:
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
            <li>provide the Service,</li>
            <li>comply with legal obligations,</li>
            <li>resolve disputes,</li>
            <li>enforce our agreements,</li>
            <li>improve the platform.</li>
          </ul>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">
            If we do not have a specific retention period for a type of data, we use reasonable criteria to determine how long to keep it.
          </p>
        </div>
      </div>

      {/* 7. Security */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          7. Security
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-700 leading-relaxed">
            We use reasonable technical and organizational safeguards to protect personal information. No method of storage or transmission is completely secure, however, so we cannot guarantee absolute security.
          </p>
        </div>
      </div>

      {/* 8. Your Rights and Choices */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          8. Your Rights and Choices
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            Depending on where you live, you may have rights to:
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-1">
            <li>access your personal data,</li>
            <li>correct inaccurate information,</li>
            <li>delete certain information,</li>
            <li>restrict or object to certain processing,</li>
            <li>withdraw consent where applicable,</li>
            <li>request a copy of certain data.</li>
          </ul>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">
            You may also update your profile information or trigger permanent account deletion directly in the Service under Settings.
          </p>
        </div>
      </div>

      {/* 9. Children’s Privacy */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          9. Children’s Privacy
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Rater is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review and take appropriate action. COPPA applies to services directed to children under 13 or when operators have actual knowledge they are collecting personal information from a child under 13.
          </p>
        </div>
      </div>

      {/* 10. International Use */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          10. International Use
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            If you use Rater from outside the country where our servers or service providers are located, your information may be processed in other jurisdictions with different data protection laws.
          </p>
        </div>
      </div>

      {/* 11. Changes to This Policy */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          11. Changes to This Policy
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. If we make material changes, we will update the Effective Date and may notify you through the Service or other reasonable means.
          </p>
        </div>
      </div>

      {/* 12. Contact */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          12. Contact
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            If you have questions about this Privacy Policy or your personal data, contact us directly at{' '}
            <a href="mailto:support@raterapp.site" className="text-gray-900 font-semibold underline hover:text-primary">
              support@raterapp.site
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}

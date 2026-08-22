import type { Metadata } from 'next';
import { Lock, ShieldCheck, Database, Bell, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Rater',
  description: 'How Rater collects, stores, and protects your personal data and creative content.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-black uppercase tracking-wider">
            Privacy & Security
          </span>
          <span className="text-xs text-gray-400">Last updated: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
          Your privacy and creative ownership are core principles at Rater. This policy explains what information we collect, why we collect it, and how you maintain complete control over your data.
        </p>
      </div>

      {/* 1. Information We Collect */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          1. Information We Collect
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <UserCheck size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Account & Profile Information</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                When registering, we collect your email address, chosen username, display name, profile avatar, and optional portfolio links (GitHub, Behance, Dribbble, X).
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <Database size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Creative Content & Critiques</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Images, design assets, and text you upload when publishing work, as well as scores, ratings, and commentary you submit when critiquing peer designs.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Device & Push Subscription Data</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                If you opt in to Web Push Notifications or install the Rater PWA, we store standard browser push subscription endpoints to dispatch notifications. You can toggle or revoke this at any time in Settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. How We Use Your Data */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          2. How We Use Your Data
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
            <li>To authenticate your sessions and secure your creative profile.</li>
            <li>To calculate aggregated 1–10 design ratings and unlock Overall Scores upon receiving 3+ critiques.</li>
            <li>To dispatch notifications regarding feedback, score unlocks, and community milestones according to your preferences.</li>
            <li>To detect and prevent review manipulation, spam, or malicious bot behavior.</li>
          </ul>
        </div>
      </div>

      {/* 3. Trusted Infrastructure Partners */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          3. Storage & Infrastructure Partners
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Secure Processing & Storage</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                We partner only with industry-leading infrastructure providers under strict Data Processing Agreements:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-gray-900">Supabase (PostgreSQL & Auth)</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Encrypted database storage, row-level security (RLS), and authentication token management.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-gray-900">Cloudinary (Media CDN)</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                High-speed global media delivery with automatic WebP/AVIF compression and responsive scaling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Your Rights & Instant Account Deletion */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          4. Your Privacy Rights & Permanent Deletion
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Complete Self-Serve Control</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You have the full right to export, modify, or permanently purge your data from Rater at any time. When you trigger <strong className="text-gray-900">Delete Account</strong> in your settings, our backend automatically removes your profile, posts, uploaded media, and reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { FileText, ShieldCheck, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Rater',
  description: 'Terms of use, service agreements, and creator rights on Rater.',
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-black uppercase tracking-wider">
            Legal Agreement
          </span>
          <span className="text-xs text-gray-400">Last updated: August 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
          These terms govern your access to and use of Rater. By creating an account or accessing the platform, you agree to be bound by these provisions.
        </p>
      </div>

      {/* 1. Account Eligibility & Responsibilities */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          1. Account Eligibility & Security
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Your Account on Rater</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                To access critique submissions and publish work, you must register with a valid email address. You are responsible for safeguarding your login credentials and for all activities that occur under your username.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-gray-900">Username Guidelines</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Usernames must not impersonate other designers, trademark holders, or use misleading identities. Rater reserves the right to reclaim inactive or infringing handles.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-gray-900">Minimum Age</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                You must be at least 13 years of age (or the minimum legal age in your jurisdiction) to use Rater.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 100% Creator Ownership & Copyright */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          2. Intellectual Property & Creator Ownership
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">You Retain 100% Ownership of Your Creative Work</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You retain all copyright, moral rights, and intellectual property ownership in all visual artwork, design files, concepts, and portfolio assets you upload to Rater. We claim zero ownership over your creations.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
            <p className="text-xs font-bold text-gray-900">Limited Platform License</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              By uploading work to Rater, you grant us a worldwide, royalty-free, non-exclusive license solely to store, host, transcode (generate optimized WebP thumbnails and responsive sizes), and display your work to other users on the platform in accordance with your visibility settings.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Platform Acceptable Use & Prohibitions */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          3. Prohibited Activities & Platform Abuse
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">No Automated Scraping or Harvesting</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  You may not use bots, spiders, crawlers, or automated scripts to harvest creative artwork, user reviews, or profile directories without prior written consent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">No Manipulation of Rating Algorithms</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Circumventing review limits, creating bot voting clusters, or attempting to artificially influence leaderboard positioning is strictly prohibited and subject to immediate ban.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Termination & Self-Serve Deletion */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          4. Termination & Account Deletion
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0 mt-0.5">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Your Right to Delete</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You may terminate these terms and permanently delete your account, published works, and critiques at any time via the Settings overlay (<strong className="text-gray-900">Settings &gt; Account &gt; Delete Account</strong>).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Limitation of Liability */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          5. Limitation of Liability
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs text-xs text-gray-500 leading-relaxed space-y-2">
          <p>
            Rater is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We disclaim all warranties of any kind, whether express or implied, including fitness for a particular purpose or non-infringement.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 mt-auto flex flex-col items-center justify-center gap-2.5 px-4">
      {/* Top row: Legal & Resource Links */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium text-gray-500">
        <Link href="/legal/community-guidelines" className="hover:text-black transition-colors">
          Guidelines
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/legal/ai-insights" className="hover:text-black transition-colors">
          AI & Insights
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/legal/terms" className="hover:text-black transition-colors">
          Terms
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/legal/privacy" className="hover:text-black transition-colors">
          Privacy
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/feedback" className="hover:text-black transition-colors">
          Feedback
        </Link>
        <span className="text-gray-300">•</span>
        <a href="mailto:support@raterapp.site" className="hover:text-black transition-colors">
          Contact Support
        </a>
      </div>

      {/* Bottom row: Copyright */}
      <p className="text-[11px] text-gray-400 font-medium tracking-wide">
        Rater ©{currentYear}. All Rights Reserved.
      </p>
    </footer>
  );
}

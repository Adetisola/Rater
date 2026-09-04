"use client";

import Link from 'next/link';
import { openFeedbackDrawer } from './GlobalOverlays';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 mt-auto flex flex-col items-center justify-center gap-2.5 px-4">
      {/* Top row: Legal & Resource Links */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs font-medium text-text-secondary">
        <Link href="/legal/community-guidelines" className="hover:text-text-primary transition-colors">
          Guidelines
        </Link>
        <span className="text-border-default">•</span>
        <Link href="/legal/ai-insights" className="hover:text-text-primary transition-colors">
          AI & Insights
        </Link>
        <span className="text-border-default">•</span>
        <Link href="/legal/terms" className="hover:text-text-primary transition-colors">
          Terms
        </Link>
        <span className="text-border-default">•</span>
        <Link href="/legal/privacy" className="hover:text-text-primary transition-colors">
          Privacy
        </Link>
        <span className="text-border-default">•</span>
        <button
          type="button"
          onClick={() => openFeedbackDrawer()}
          className="hover:text-text-primary transition-colors"
        >
          Feedback
        </button>
        <span className="text-border-default">•</span>
        <a href="mailto:support@raterapp.site" className="hover:text-text-primary transition-colors">
          Contact Support
        </a>
      </div>

      {/* Bottom row: Copyright */}
      <p className="text-[11px] text-text-muted font-medium tracking-wide">
        Rater ©{currentYear}. All Rights Reserved.
      </p>
    </footer>
  );
}

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, FileText, Lock, Mail, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LEGAL_PAGES = [
  {
    title: 'Community Guidelines',
    href: '/legal/community-guidelines',
    icon: BookOpen,
    description: 'Rating standards, critique code of conduct, and moderation.',
  },
  {
    title: 'AI & Insights',
    href: '/legal/ai-insights',
    icon: Sparkles,
    description: 'Perception modeling, synthesis ethics, and IP protection.',
  },
  {
    title: 'Terms of Service',
    href: '/legal/terms',
    icon: FileText,
    description: 'Creator copyright ownership, service rules, and liability.',
  },
  {
    title: 'Privacy Policy',
    href: '/legal/privacy',
    icon: Lock,
    description: 'Data collection, push tokens, storage, and deletion rights.',
  },
];

export function LegalNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Sticky Horizontal Navigation (Clean & Contained, No Bleed Leaks) */}
      <div className="lg:hidden sticky top-14 z-30 w-full max-w-full py-2 bg-surface-primary/95 backdrop-blur-md border border-border-default rounded-2xl mb-4 px-2 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 px-1">
          <Link
            href="/browse"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            <span>App</span>
          </Link>
          <div className="w-px h-4 bg-border-subtle mx-0.5 shrink-0" />
          {LEGAL_PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = pathname === page.href;
            return (
              <Link
                key={page.href}
                href={page.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-surface-interactive text-text-primary font-semibold shadow-2xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover font-medium"
                )}
              >
                <Icon size={13} className={isActive ? "text-primary" : "text-text-muted"} />
                <span>{page.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex flex-col w-60 shrink-0 sticky top-24 space-y-4 self-start">
        {/* Back to Rater App */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Rater</span>
        </Link>

        {/* Navigation Links Card */}
        <div className="rounded-2xl border border-border-default bg-surface-primary p-2 shadow-2xs space-y-0.5">
          <p className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Legal & Resources
          </p>
          {LEGAL_PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = pathname === page.href;
            return (
              <Link
                key={page.href}
                href={page.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left group",
                  isActive
                    ? "bg-surface-subtle text-text-primary font-semibold"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary font-medium"
                )}
              >
                <Icon
                  size={15}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                <span className="truncate">{page.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Contact Support Mini Card */}
        <div className="rounded-2xl border border-border-default bg-surface-primary p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-text-primary">
            <Mail size={15} className="text-text-muted" />
            <p className="text-xs font-semibold">Need Assistance?</p>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Have questions about our terms, guidelines, or rights? Reach out directly.
          </p>
          <a
            href="mailto:support@raterapp.site?subject=Legal%20or%20Guidelines%20Inquiry"
            className="inline-flex items-center justify-center w-full py-1.5 px-3 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-primary text-[11px] font-semibold transition-colors break-all"
          >
            support@raterapp.site
          </a>
        </div>
      </div>
    </>
  );
}

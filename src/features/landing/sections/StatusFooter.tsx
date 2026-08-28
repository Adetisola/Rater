"use client";

// StatusFooter Section - Rater Landing Page
// Combined Status + Footer in one unified island container
// Status: gradient text statement + large "Rater" typographic stamp
// Footer: logo, tagline, copyright & comprehensive legal/support links

const logoRater = '/assets/landing/footer/rater-logo-black-bg.svg';
import Link from 'next/link';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

export function StatusFooter() {
  const { ref: sectionRef, state } = useScrollReveal<HTMLDivElement>({ triggerOnce: true, enterThreshold: 0.25 });
  const stateClass = state === 'visible' ? 'reveal-visible' : '';

  return (
    <section id="status-footer" className="pt-4 pb-6 md:pt-24 md:pb-24 relative z-10 bg-white" ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">

        {/* ── Unified Island Container ── */}
        <div className="status-footer-island">

          {/* ══════ STATUS BLOCK ══════ */}
          <div className="flex flex-col items-center text-center px-4 md:px-12 lg:px-16 pt-8 md:pt-12 lg:pt-10">

            {/* Gradient Status Text */}
            <p className={`status-gradient-text text-[12px] sm:text-[15px] md:text-[17px] lg:text-[18px] font-semibold leading-normal w-full mb-1 reveal-fade-rise ${stateClass}`}>
              This is an ongoing product experiment. Shaped by real usage, real feedback, and deliberate iteration.
            </p>

            {/* Large "Rater" Typographic Stamp */}
            <h2 className={`status-rater-stamp w-full text-center reveal-fade-rise-lg reveal-delay-120 ${stateClass}`}>
              Rater
            </h2>
          </div>

          {/* ══════ DIVIDER ══════ */}
          <div className={`px-8 md:px-12 lg:px-16 reveal-fade reveal-delay-200 ${stateClass}`}>
            <div className="h-px w-full bg-[#E8E8E8]" />
          </div>

          {/* ══════ FOOTER BLOCK ══════ */}
          <div className={`status-footer-bar flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-12 py-6 reveal-fade reveal-delay-300 ${stateClass}`}>

            {/* Left: Logo & Tagline */}
            <div className="flex items-center gap-3">
              <img
                src={logoRater}
                alt="Rater logo"
                width={36}
                height={36}
                loading="lazy"
                className="w-8 h-8 md:w-9 md:h-9"
              />
              <p className="text-[12px] md:text-[13px] text-gray-600 font-medium">
                A design exploration experiment.
              </p>
            </div>

            {/* Middle: Support & Resources */}
            <div className="flex items-center gap-2 text-[12px] md:text-[13px] text-gray-600 font-medium">
              <Link href="/feedback" className="hover:text-black transition-colors">
                Feedback
              </Link>
              <span className="text-gray-300">•</span>
              <a href="mailto:support@raterapp.site" className="hover:text-black transition-colors">
                Contact Support
              </a>
            </div>

            {/* Right: Legal Links & Copyright */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] md:text-[13px] text-gray-600 font-medium">
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
              <span className="text-gray-400">©2026 Rater</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

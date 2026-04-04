// StatusFooter Section - Rater Landing Page
// Combined Status + Footer in one unified island container
// Status: gradient text statement + large "Rater" typographic stamp
// Footer: logo, tagline, copyright — horizontal on desktop, stacked on mobile

import logoRaterHover from '../../../assets/landing/footer/logo-rater-hover.svg';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

export function StatusFooter() {
  const { ref: sectionRef, state } = useScrollReveal<HTMLDivElement>({ triggerOnce: true, enterThreshold: 0.25 });
  const stateClass = state === 'visible' ? 'reveal-visible' : '';

  return (
    <section id="status-footer" className="pt-4 pb-6 md:pt-24 md:pb-24 relative z-10" ref={sectionRef}>
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
          <div className={`status-footer-bar reveal-fade reveal-delay-300 ${stateClass}`}>

            {/* Left: Logo */}
            <div className="flex items-center justify-center">
              <img
                src={logoRaterHover}
                alt="Rater logo"
                className="w-8 h-8 md:w-9 md:h-9"
              />
            </div>

            {/* Center: Tagline */}
            <p className="text-[13px] md:text-[14px] text-[#111111] font-semibold">
              A design exploration experiment.
            </p>

            {/* Right: Copyright */}
            <p className="text-[13px] md:text-[14px] text-[#111111] font-semibold">
              ©2026
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

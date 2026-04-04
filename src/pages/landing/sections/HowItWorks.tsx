// HowItWorks Section - Rater Landing Page
// Contains: Island-style SVG background, centered heading + CTA pill, 3 cards (Observe, Evaluate, Reflect)
// Cards expand on hover (desktop only) with gradient border, visual reveal, and supporting text

import { useState } from 'react';
import gradientArrow from '../../../assets/landing/what-is-rater/Gradient Arrow.svg';
import howItWorksBg from '../../../assets/landing/how-it-works/how it works-bg.svg';
import observeVisual from '../../../assets/landing/how-it-works/observe card-visual.png';
import evaluateVisual from '../../../assets/landing/how-it-works/evaluate card-visual.png';
import reflectVisual from '../../../assets/landing/how-it-works/reflect card-visual.png';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

const CARDS = [
  {
    label: 'Observe',
    description: 'Observe real design work',
    supportingText: 'No tutorials. No theory. Just real projects, as they are.',
    gradient: 'radial-gradient(circle at bottom right, #F4C7C0 0%, #FFFFFF 60%)',
    visual: observeVisual,
  },
  {
    label: 'Evaluate',
    description: 'Make intentional evaluations',
    supportingText: 'Rate based on clarity, purpose, and aesthetics.',
    gradient: 'radial-gradient(circle at bottom right, #FEE086 0%, #FFFFFF 60%)',
    visual: evaluateVisual,
  },
  {
    label: 'Reflect',
    description: 'Notice patterns in your judgment',
    supportingText: 'Compare ratings over time and sharpen your eye.',
    gradient: 'radial-gradient(circle at bottom right, #BD9CF6 0%, #FFFFFF 60%)',
    visual: reflectVisual,
  },
];

// Gradient border colors for expanded card
const GRADIENT_BORDER = 'linear-gradient(to right, #fec312, #ff4f6d, #c400d2, #7c3bed)';

export function HowItWorks() {
  // null = no card hovered (all equal), number = index of hovered card
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Trigger animation only once when component enters viewport
  const { ref: sectionRef, state } = useScrollReveal<HTMLDivElement>({ triggerOnce: true, enterThreshold: 0.15 });
  const stateClass = state === 'visible' ? 'reveal-visible' : '';

  return (
    <section id="how-it-works" className="py-16 md:py-24 relative z-10" ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">

        {/* ── MOBILE LAYOUT (<768px): normal flow, no absolute positioning ── */}
        <div className="md:hidden rounded-[24px] border border-[#EEEEEE] bg-[#FAFAFA] px-5 pt-7 pb-7">

          {/* Mobile Header */}
          <div className="flex flex-row items-center justify-center gap-3 mb-6">
            <h2 className="text-[22px] font-semibold text-[#000000] tracking-tight leading-tight">
              How it works
            </h2>
            <div className="inline-flex items-center justify-start pl-[14px] border-[3px] border-[#FEC312] rounded-[30px] w-[80px] h-[30px]">
              <img src={gradientArrow} alt="" className="w-[14px] h-[14px] object-contain" />
            </div>
          </div>

          {/* Mobile Cards — stacked vertically, visuals always shown */}
          <div className="flex flex-col gap-8">
            {CARDS.map((card, index) => {
              const delayClass = index === 0 ? '' : index === 1 ? 'reveal-delay-120' : 'reveal-delay-240';
              return (
              <div
                key={card.label}
                className={`rounded-2xl overflow-hidden reveal-card ${delayClass} ${stateClass}`}
                style={{ background: '#EEEEEE', padding: '2px' }}
              >
                <div
                  className="rounded-[14px] flex flex-col overflow-hidden"
                  style={{ background: card.gradient }}
                >
                  {/* Visual — always visible on mobile */}
                  <div className="w-full">
                    <img
                      src={card.visual}
                      alt={`${card.label} visual`}
                      className="w-full h-auto block"
                    />
                  </div>

                  {/* Text content */}
                  <div className="px-5 pb-5 pt-4 flex flex-col gap-1">
                    <h3 className="text-[20px] font-medium text-[#C4C4C4] tracking-tight leading-tight">
                      {card.label}
                    </h3>
                    <p className="text-[13px] font-medium text-[#000000] leading-snug pt-2 max-w-[85%]">
                      {card.description}
                    </p>
                    <p className="text-[11px] text-[#555555] leading-snug mt-1 max-w-[90%]">
                      {card.supportingText}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (≥768px): island SVG background with absolute content ── */}
        <div className="hidden md:block relative w-full">
          {/* SVG Background — defines the island shape */}
          <img
            src={howItWorksBg}
            alt=""
            className="w-full h-auto block"
            aria-hidden="true"
          />

          {/* Content Layer — positioned over the SVG */}
          <div className="absolute inset-0 flex flex-col items-center px-6 sm:px-10 md:px-14 lg:px-16 pt-[5%] pb-[6%]">

            {/* Header: Title + CTA Pill */}
            <div className="flex flex-row items-center justify-center gap-3 mb-8 md:mb-12">
              <h2 className="text-[22px] sm:text-[26px] md:text-[32px] lg:text-[38px] font-semibold text-[#000000] tracking-tight leading-tight">
                How it works
              </h2>

              {/* CTA Pill — reuses the same pattern */}
              <div>
                <div className="inline-flex items-center justify-start pl-[14px] border-3 border-[#FEC312] rounded-[30px] w-[90px] h-[32px] md:w-[100px] md:h-[36px]">
                  <img src={gradientArrow} alt="" className="w-[15px] h-[15px] md:w-[17px] md:h-[17px] object-contain" />
                </div>
              </div>
            </div>

            {/* Cards Container */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 w-full flex-1 max-w-[960px]">
              {CARDS.map((card, index) => {
                const isHovered = hoveredIndex === index;
                const hasHover = hoveredIndex !== null;

                // Flex grow values: expanded card gets 1.2, others shrink to 0.9
                const flexGrow = !hasHover ? 1 : isHovered ? 1.2 : 0.9;
                const delayClass = index === 0 ? '' : index === 1 ? 'reveal-delay-120' : 'reveal-delay-240';

                return (
                  <div
                    key={card.label}
                    className={`rounded-2xl flex flex-col justify-between min-h-[160px] md:min-h-[240px] relative overflow-hidden reveal-card ${delayClass} ${stateClass}`}
                    style={{
                      flexGrow,
                      flexBasis: 0,
                      transition: 'flex-grow 350ms ease-in-out',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Gradient border wrapper — pseudo-element approach via nested div */}
                    {/* Outer = border (gradient or solid), Inner = card content with background */}
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        padding: '3px',
                        background: isHovered ? GRADIENT_BORDER : '#EEEEEE',
                        transition: 'background 350ms ease-in-out',
                        // Make the inner content show through
                        WebkitMask: 'none',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-[13px]"
                        style={{ background: card.gradient }}
                      />
                    </div>

                    {/* Card Content — sits above the border wrapper */}
                    <div
                      className="relative z-10 flex flex-col h-full rounded-[13px] overflow-hidden"
                      style={{
                        // Inset by border width so content doesn't overlap the gradient border
                        margin: '3px',
                        background: card.gradient,
                      }}
                    >
                      {/* Visual — only visible on desktop when expanded */}
                      <div
                        className="hidden md:block w-full overflow-hidden"
                        style={{
                          maxHeight: isHovered ? '800px' : '0px',
                          opacity: isHovered ? 1 : 0,
                          transition: 'max-height 350ms ease-in-out, opacity 350ms ease-in-out',
                        }}
                      >
                        <img
                          src={card.visual}
                          alt={`${card.label} visual`}
                          className="w-full max-w-none h-auto block"
                        />
                      </div>

                      {/* Text/Content protected container */}
                      <div className="p-5 md:p-6 lg:p-8 flex flex-col justify-between flex-1">
                        {/* Card Label */}
                        <h3 
                          className={`text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] font-medium text-[#C4C4C4] tracking-tight leading-tight transition-all ease-in-out duration-[350ms] overflow-hidden ${
                            isHovered ? 'md:max-h-0 md:opacity-0' : 'md:max-h-[50px] md:opacity-100'
                          }`}
                        >
                          {card.label}
                        </h3>

                        {/* Card Description */}
                        <div className="mt-auto pt-6 md:pt-10">
                          <p
                            className="text-[13px] md:text-[14px] lg:text-[20px] font-medium text-[#000000] leading-snug max-w-[85%] lg:max-w-[80%]"
                            style={{
                              opacity: hasHover && !isHovered ? 0 : 1,
                              transition: 'opacity 300ms ease-in-out',
                            }}
                          >
                            {card.description}
                          </p>

                          {/* Supporting text — fades in on hover (desktop only) */}
                          <p
                            className="hidden md:block text-[11px] lg:text-[13px] text-[#555555] leading-snug mt-2 max-w-[90%]"
                            style={{
                              opacity: isHovered ? 1 : 0,
                              transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
                              transition: 'opacity 300ms ease-in-out 100ms, transform 300ms ease-in-out 100ms',
                            }}
                          >
                            {card.supportingText}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

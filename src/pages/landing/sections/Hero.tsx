// Hero Section - Rater Landing Page
// Contains: Navbar + "Judgment is built, not found" hero content
// Animations are deferred until hero images are loaded to prevent layout shift

import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import assets
import heroVisual from '../../../assets/landing/hero/hero-visual.png';
import heroBg from '../../../assets/landing/hero/hero-bg.svg';
import { AnimatedScribble } from '../../../components/AnimatedScribble';

interface HeroProps {
  onReady?: () => void;
  animationReady?: boolean;
  activeSection?: string | null;           // ADD
  onSectionClick?: (id: string) => void;   // ADD
}

export function Hero({ onReady, animationReady, activeSection, onSectionClick }: HeroProps = {}) {
  // Track image loading to prevent animation-before-layout-stable glitch
  const [bgLoaded, setBgLoaded] = useState(false);
  const [visualLoaded, setVisualLoaded] = useState(false);
  
  // If parent controls animation, wait for it, otherwise use local loading state
  const isReady = animationReady !== undefined ? animationReady : (bgLoaded && visualLoaded);

  useEffect(() => {
    if (bgLoaded && visualLoaded) {
      onReady?.();
    }
  }, [bgLoaded, visualLoaded, onReady]);

  useEffect(() => {
    if (!activeSection) {
      setDotStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    const el = navRefs.current[activeSection];
    const container = el?.closest('.nav-links-container') as HTMLElement | null;
    if (!el || !container) return;
    const rect = el.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();
    setDotStyle({
      left: rect.left - parentRect.left + rect.width / 2 - 3,
      opacity: 1,
    });
  }, [activeSection]);

  const onBgLoad = useCallback(() => setBgLoaded(true), []);
  const onVisualLoad = useCallback(() => setVisualLoaded(true), []);
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [dotStyle, setDotStyle] = useState({ left: 0, opacity: 0 });

  return (
    <>
      {/* STICKY NAVBAR - matches app header background effect */}
      <nav className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl py-4 md:py-5 border-b border-white/20 rounded-bl-[20px] rounded-br-[20px] md:rounded-bl-[30px] md:rounded-br-[30px]">
        <div className="w-full px-6 md:px-12 lg:px-20 flex items-center justify-between">
          {/* Left Side: Logo (fixed space for balance) */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center cursor-pointer group relative">
                <img 
                  src="/icons/logo-rater.svg" 
                  alt="Rater Logo" 
                  width={48}
                  height={48}
                  className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0" 
                />
                <img 
                  src="/icons/logo-rater-hover.svg" 
                  alt="Rater Logo Hover" 
                  width={48}
                  height={48}
                  className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
                />
              </div>
            </Link>
          </div>

          {/* Center Side: Navigation Links */}
          <div className="nav-links-container hidden md:flex flex-1 justify-center items-center gap-10 relative">
            <div className="flex flex-col items-center gap-1">
              <a 
                ref={el => { navRefs.current['what-is-rater'] = el; }}
                href="#what-is-rater"
                onClick={() => onSectionClick?.('what-is-rater')}
                className={`text-[15px] font-medium transition-colors ${
                  activeSection === 'what-is-rater' ? 'text-[#FEC312]' : 'text-[#111111] hover:text-[#FEC312]'
                }`}
              >
                What is Rater
              </a>
            </div>

            <div className="flex flex-col items-center gap-1">
              <a 
                ref={el => { navRefs.current['what-changes'] = el; }}
                href="#what-changes"
                onClick={() => onSectionClick?.('what-changes')}
                className={`text-[15px] font-medium transition-colors ${
                  activeSection === 'what-changes' ? 'text-[#FEC312]' : 'text-[#111111] hover:text-[#FEC312]'
                }`}
              >
                What Changes
              </a>
            </div>

            <div className="flex flex-col items-center gap-1">
              <a 
                ref={el => { navRefs.current['how-it-works'] = el; }}
                href="#how-it-works"
                onClick={() => onSectionClick?.('how-it-works')}
                className={`text-[15px] font-medium transition-colors ${
                  activeSection === 'how-it-works' ? 'text-[#FEC312]' : 'text-[#111111] hover:text-[#FEC312]'
                }`}
              >
                How it works
              </a>
            </div>

            {/* Single moving dot */}
            <span
              className="absolute -bottom-[14px] h-2 w-2 rounded-full bg-[#FEC312] pointer-events-none"
              style={{
                left: dotStyle.left,
                opacity: dotStyle.opacity,
                transition: 'left 0.3s ease, opacity 0.2s ease',
              }}
            />
          </div>

          {/* Right Side: CTA Button */}
          <div className="flex-1 flex justify-end">
            <Link 
              to="/app"
              className="px-5 py-1.5 rounded-full border-2 border-[#FEC312] text-[15px] font-semibold text-[#111111] hover:bg-[#FEC312] hover:text-white transition-all duration-300"
            >
              Enter Rater
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-white">
      <div className="relative w-full px-0 md:px-12 lg:px-20 md:pt-4 pb-8">
        {/* Hero Background Container */}
        <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden">
          {/* SVG Background - defines container height. Fixed taller height on mobile to prevent text overlap */}
          <img 
            src={heroBg}
            alt=""
            width={1400}
            height={700}
            fetchPriority="high"
            className="w-full h-[520px] sm:h-[600px] md:h-auto object-cover object-center block"
            aria-hidden="true"
            onLoad={onBgLoad}
          />
          {/* Hero Visual - middle layer: above card, behind text
              h-full = always matches card height, w-auto = scales proportionally */}
          <motion.img 
            src={heroVisual}
            alt="Rater app showing design feedback with star ratings"
            width={600}
            height={900}
            initial={{ opacity: 0, y: 40 }}
            animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-5 h-[65%] sm:h-[95%] md:h-[90%] w-auto max-w-none"
            style={{ willChange: 'transform, opacity' }}
            onLoad={onVisualLoad}
          />

          {/* Text Content - top layer: above everything */}
          <div className="absolute inset-0 z-10 flex flex-col items-center pt-16 md:pt-8 lg:pt-10 xl:pt-14 pointer-events-none">
            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ willChange: 'transform, opacity' }}
              className="text-[34px] sm:text-[36px] md:text-[38px] lg:text-[44px] xl:text-[56px] font-bold text-[#111111] text-center leading-tight tracking-tight px-4 w-full"
            >
              <span className="block sm:inline">Judgment is built, </span>
              <span className="block sm:inline">
                not{' '}
                <span className="relative inline-block">
                  found
                {/* Animated yellow scribble on top of the word */}
                <AnimatedScribble 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-auto pointer-events-none select-none"
                />
              </span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              style={{ willChange: 'transform, opacity' }}
              className="mt-2 md:mt-4 lg:mt-5 xl:mt-6 text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] text-black text-center max-w-[600px] mx-auto px-4 sm:px-0"
            >
              Rater helps designers train their eye by actively evaluating real design work.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              style={{ willChange: 'transform, opacity' }}
              className="mt-10 sm:mt-8 md:mt-6 xl:mt-8 flex items-center justify-center gap-5 sm:gap-4 md:gap-5 xl:gap-6 w-full pointer-events-auto"
            >
              {/* Primary CTA */}
              <Link 
                to="/app"
                className="px-7 py-2.5 md:px-5 md:py-1.5 lg:px-6 lg:py-2 rounded-full bg-[#FEC312] text-[15px] md:text-[13px] lg:text-[14px] xl:text-[15px] font-semibold text-white hover:bg-[#e6b00f] transition-all duration-300"
              >
                Enter Rater
              </Link>

              {/* Secondary CTA */}
              <a 
                href="#how-it-works"
                className="text-[15px] md:text-[13px] lg:text-[14px] xl:text-[15px] font-semibold text-[#111111] hover:text-[#FEC312] transition-colors"
              >
                How it works
              </a>
            </motion.div>

            {/* Footer Text - inside the card, at bottom */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={isReady ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute bottom-4 right-6 sm:right-12 md:bottom-5 md:right-10 text-[8px] max-[376px]:text-[7px] sm:text-[12px] text-black italic pointer-events-none"
            >
              *An ongoing design experiment
            </motion.p>
          </div>
        </div>

      </div>
      </section>
    </>
  );
}

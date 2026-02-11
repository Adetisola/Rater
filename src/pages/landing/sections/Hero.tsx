// Hero Section - Rater Landing Page
// Contains: Navbar + "Judgment is built, not found" hero content

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import assets
import heroVisual from '../../../assets/landing/hero/hero-visual.png';
import heroBg from '../../../assets/landing/hero/hero-bg.svg';
import { AnimatedScribble } from '../../../components/AnimatedScribble';

export function Hero() {
  return (
    <>
      {/* STICKY NAVBAR - matches app header background effect */}
      <nav className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl py-4 md:py-5 border-b border-white/20 rounded-bl-[20px] rounded-br-[20px] md:rounded-bl-[30px] md:rounded-br-[30px]">
        <div className="w-full px-6 md:px-12 lg:px-20 flex items-center justify-between">
          {/* Logo - matches app header exactly */}
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center cursor-pointer group relative">
              <img 
                src="/icons/logo-rater.svg" 
                alt="Rater Logo" 
                className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0" 
              />
              <img 
                src="/icons/logo-rater-hover.svg" 
                alt="Rater Logo Hover" 
                className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
              />
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-10">
            <a 
              href="#what-is-rater" 
              className="text-[15px] font-medium text-[#111111] hover:text-[#FEC312] transition-colors"
            >
              What is Rater
            </a>
            <a 
              href="#why-rater" 
              className="text-[15px] font-medium text-[#111111] hover:text-[#FEC312] transition-colors"
            >
              Why Rater
            </a>
            <a 
              href="#how-it-works" 
              className="text-[15px] font-medium text-[#111111] hover:text-[#FEC312] transition-colors"
            >
              How it works
            </a>
          </div>

          {/* CTA Button */}
          <Link 
            to="/app"
            className="px-5 py-1.5 rounded-full border-2 border-[#FEC312] text-[15px] font-semibold text-[#111111] hover:bg-[#FEC312] hover:text-white transition-all duration-300"
          >
            Enter Rater
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-white">
      <div className="relative w-full px-6 md:px-12 lg:px-20 pt-4 pb-8">
        {/* Hero Background Container */}
        <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden">
          {/* SVG Background - natural flow, defines container height */}
          <img 
            src={heroBg}
            alt=""
            className="w-full h-auto block"
            aria-hidden="true"
          />
          {/* Hero Visual - middle layer: above card, behind text
              h-full = always matches card height, w-auto = scales proportionally */}
          <motion.img 
            src={heroVisual}
            alt="Rater app showing design feedback with star ratings"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-5 h-[95%] w-auto max-w-none"
          />

          {/* Text Content - top layer: above everything */}
          <div className="absolute inset-0 z-10 flex flex-col items-center pt-6 md:pt-8 lg:pt-10 xl:pt-14 pointer-events-none">
            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-[32px] md:text-[38px] lg:text-[44px] xl:text-[56px] font-bold text-[#111111] text-center leading-tight tracking-tight px-4 w-full"
            >
              Judgment is built, not{' '}
              <span className="relative inline-block">
                found
                {/* Animated yellow scribble on top of the word */}
                <AnimatedScribble 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-auto pointer-events-none select-none"
                />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="mt-3 md:mt-4 lg:mt-5 xl:mt-6 text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] text-black text-center max-w-[600px] mx-auto whitespace-nowrap"
            >
              Rater helps designers train their eye by actively evaluating real design work.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-5 md:mt-6 xl:mt-8 flex items-center justify-center gap-4 md:gap-5 xl:gap-6 w-full pointer-events-auto"
            >
              {/* Primary CTA */}
              <Link 
                to="/app"
                className="px-5 py-1.5 lg:px-6 lg:py-2 rounded-full bg-[#FEC312] text-[13px] lg:text-[14px] xl:text-[15px] font-semibold text-white hover:bg-[#e6b00f] transition-all duration-300"
              >
                Enter Rater
              </Link>

              {/* Secondary CTA */}
              <a 
                href="#what-is-rater"
                className="text-[13px] lg:text-[14px] xl:text-[15px] font-semibold text-[#111111] hover:text-[#FEC312] transition-colors"
              >
                What is Rater
              </a>
            </motion.div>

            {/* Footer Text - inside the card, at bottom */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute bottom-4 right-12 md:bottom-5 md:right-10 text-[10px] text-black italic pointer-events-none"
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

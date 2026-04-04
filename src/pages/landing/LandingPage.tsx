// LandingPage - Top-level landing page component
// Hero mounts immediately; other sections delay-mount via RevealSection
// Scroll is forced to top on mount to prevent flicker

import { useState, useEffect, useCallback } from 'react';
import { Hero } from './sections/Hero';
import { WhatIsRater } from './sections/WhatIsRater';
import { WhyRater } from './sections/WhyRater';
import { HowItWorks } from './sections/HowItWorks';
import { StatusFooter } from './sections/StatusFooter';
import { useScrollToTop } from '../../hooks/useScrollToTop';

import yellowMeshBg from '../../assets/landing/Yellow mesh gradient background.jpg';
import loaderLogoAnim from '../../assets/icons/Rater Logo Black Animation.svg';

export function LandingPage() {
  // Loading states
  const [heroImagesLoaded, setHeroImagesLoaded] = useState(false);
  const [domReady, setDomReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  // Force scroll to top on mount (prevents scroll restoration flicker)
  useScrollToTop();

  // 1. Force scroll & track DOM loaded
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setDomReady(true);
    } else {
      const handleLoad = () => setDomReady(true);
      document.addEventListener('DOMContentLoaded', handleLoad);
      window.addEventListener('load', handleLoad);
      return () => {
        document.removeEventListener('DOMContentLoaded', handleLoad);
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  // 2. Enforce a minimum display time for the loader animation (5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 5000); // 5 seconds mandatory minimum
    return () => clearTimeout(timer);
  }, []);

  // 3. Maximum failsafe to avoid getting trapped (adjusted to 8s so it exceeds the 5s minimum)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setHeroImagesLoaded(true);
        setDomReady(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // 4. Trigger loader fadeout when all conditions met + minimum time elapsed
  useEffect(() => {
    if (heroImagesLoaded && domReady && minTimeElapsed && isLoading) {
      setIsLoading(false);
    }
  }, [heroImagesLoaded, domReady, minTimeElapsed, isLoading]);

  // 5. Remove loader from DOM entirely after fade out animation
  useEffect(() => {
    if (!isLoading && showLoader) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 500); // wait time matches opacity transition duration
      return () => clearTimeout(timer);
    }
  }, [isLoading, showLoader]);

  const handleHeroReady = useCallback(() => {
    setHeroImagesLoaded(true);
  }, []);

  return (
    <>
      {/* LOADER OVERLAY */}
      {showLoader && (
        <div 
          className="fixed top-0 left-0 w-full h-[100vh] bg-white z-[99999] flex items-center justify-center transform-gpu"
          style={{
            opacity: isLoading ? 1 : 0,
            transition: 'opacity 500ms ease-out',
          }}
        >
          {/* Using object allows SVGator JS to animate gracefully. img tag strips inner script. */}
          <object 
            data={loaderLogoAnim} 
            type="image/svg+xml" 
            className="w-[100px] h-[100px] md:w-[120px] md:h-[120px]" 
            aria-label="Loading Rater"
          />
        </div>
      )}

      {/* Hero automatically triggers handleHeroReady when images download */}
      <Hero onReady={handleHeroReady} animationReady={!isLoading} />

      {/* Unified Background Wrapper for Rater Features */}
      {/* The mt-16 md:mt-16 lg:mt-24 creates the white gap matching the spacing before HowItWorks */}
      <div className="bg-transparent md:bg-[#fffdd0] transition-colors duration-500 relative mt-8 md:mt-16 lg:mt-16">
        {/* Desktop-only background image layer */}
        <div 
          className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${yellowMeshBg})` }}
        />
        
        {/* Content container */}
        <div className="relative z-10">
          <WhatIsRater />
          <WhyRater />
        </div>
      </div>

      <HowItWorks />
      <StatusFooter />
    </>
  );
}

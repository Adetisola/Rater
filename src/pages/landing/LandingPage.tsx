// LandingPage - Top-level landing page component
// Hero mounts immediately; other sections delay-mount via RevealSection
// Scroll is forced to top on mount to prevent flicker

import { Hero } from './sections/Hero';
import { WhatIsRater } from './sections/WhatIsRater';
import { WhyRater } from './sections/WhyRater';
import { HowItWorks } from './sections/HowItWorks';
import { StatusFooter } from './sections/StatusFooter';
import { RevealSection } from '../../components/RevealSection';
import { useScrollToTop } from '../../hooks/useScrollToTop';

import yellowMeshBg from '../../assets/landing/Yellow mesh gradient background.jpg';

// Delay before non-hero sections are allowed to mount (ms)
// Gives the hero animation time to settle without layout interference
const SECTION_MOUNT_DELAY = 800;

export function LandingPage() {
  // Force scroll to top on mount (prevents scroll restoration flicker)
  useScrollToTop();

  return (
    <>
      {/* Hero always mounts first and immediately */}
      <Hero />

      {/* Unified Background Wrapper for Rater Features */}
      {/* The mt-16 md:mt-16 lg:mt-24 creates the white gap matching the spacing before HowItWorks */}
      <div className="bg-[#fffdd0] transition-colors duration-500 relative mt-8 md:mt-16 lg:mt-16">
        {/* Desktop-only background image layer */}
        <div 
          className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${yellowMeshBg})` }}
        />
        
        {/* Content container */}
        <div className="relative z-10">
          {/* Remaining sections delay-mount and reveal on scroll */}
          <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
            <WhatIsRater />
          </RevealSection>

          <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
            <WhyRater />
          </RevealSection>
        </div>
      </div>

      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
        <HowItWorks />
      </RevealSection>

      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
        <StatusFooter />
      </RevealSection>
    </>
  );
}

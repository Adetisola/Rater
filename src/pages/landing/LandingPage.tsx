// LandingPage - Top-level landing page component
// Hero mounts immediately; other sections delay-mount via RevealSection
// Scroll is forced to top on mount to prevent flicker

import { Hero } from './sections/Hero';
import { WhatIsRater } from './sections/WhatIsRater';
import { WhyRater } from './sections/WhyRater';
import { HowItWorks } from './sections/HowItWorks';
import { Status } from './sections/Status';
import { Footer } from './sections/Footer';
import { RevealSection } from '../../components/RevealSection';
import { useScrollToTop } from '../../hooks/useScrollToTop';

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

      {/* Remaining sections delay-mount and reveal on scroll */}
      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
        <WhatIsRater />
      </RevealSection>

      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
        <WhyRater />
      </RevealSection>

      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
        <HowItWorks />
      </RevealSection>

      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="120px">
        <Status />
      </RevealSection>

      <RevealSection mountDelay={SECTION_MOUNT_DELAY} minHeight="80px">
        <Footer />
      </RevealSection>
    </>
  );
}

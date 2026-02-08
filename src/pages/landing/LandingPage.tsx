// LandingPage - Top-level landing page component
// Renders all sections in order

import { Hero } from './sections/Hero';
import { WhatIsRater } from './sections/WhatIsRater';
import { WhyRater } from './sections/WhyRater';
import { HowItWorks } from './sections/HowItWorks';
import { Status } from './sections/Status';
import { Footer } from './sections/Footer';

export function LandingPage() {
  return (
    <>
      <Hero />
      <WhatIsRater />
      <WhyRater />
      <HowItWorks />
      <Status />
      <Footer />
    </>
  );
}

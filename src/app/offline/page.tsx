"use client";

import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/Footer';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useState } from 'react';

export default function Offline() {
  const [lottieLoaded, setLottieLoaded] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center animate-in fade-in zoom-in duration-500">
        
        {/* Visual Graphic */}
        <div className="w-48 h-48 mb-6 relative flex items-center justify-center">
          {!lottieLoaded && (
            <div className="absolute inset-0 bg-surface-subtle rounded-full animate-pulse" />
          )}
          <DotLottieReact
            src="https://lottie.host/5eaf9040-adfb-420e-b4fe-c6dfb3981581/sNznGaVOKa.lottie"
            autoplay
            loop
            dotLottieRefCallback={(dotLottie) => {
              if (dotLottie) {
                dotLottie.addEventListener('load', () => setLottieLoaded(true));
              }
            }}
          />
        </div>

        {/* Text Content */}
        <h2 className="text-xl md:text-2xl font-medium mb-2 text-text-primary tracking-tight">
          You are offline
        </h2>
        <p className="text-md text-text-secondary mb-8 max-w-sm mx-auto">
          You appear to be offline. Check your network connection and retry.
        </p>

        {/* Action Button */}
        <Button 
          variant="primary" 
          onClick={() => window.location.reload()}
          className="h-12 px-8 text-lg rounded-full transition-transform"
        >
          Retry
        </Button>

      </div>
      <Footer />
    </div>
  );
}

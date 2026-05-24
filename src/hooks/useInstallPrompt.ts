import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToShow, setIsReadyToShow] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // 1. Listen for interaction
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    // 2. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // 3. Determine visibility condition
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Show if we have the prompt, user has interacted, and we are not standalone.
    if (deferredPrompt && hasInteracted && !isStandalone) {
      setIsReadyToShow(true);
    } else {
      setIsReadyToShow(false);
    }
  }, [deferredPrompt, hasInteracted]);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // We no longer need the prompt. Clear it up.
      setDeferredPrompt(null);
      setIsReadyToShow(false);
    } else {
      // User dismissed, we allow it to be re-prompted later by not clearing it.
    }
  };

  return { isReadyToShow, promptInstall };
}

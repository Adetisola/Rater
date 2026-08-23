"use client";

import { useState, useEffect } from 'react';
import { usePWAInstall } from './usePWAInstall';

export function useInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // 1. Listen for user interaction
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  const isReadyToShow = isInstallable && hasInteracted && !isInstalled;

  const promptInstall = async () => {
    return installApp();
  };

  return { isReadyToShow, promptInstall };
}

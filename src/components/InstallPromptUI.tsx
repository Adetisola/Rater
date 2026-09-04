'use client';

import { useState, useEffect } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download } from 'lucide-react';
import { AmbientPromptShell } from './AmbientPromptShell';
import { usePathname } from 'next/navigation';

import { showInstallAppModal } from './GlobalOverlays';

interface InstallPromptUIProps {
  className?: string;
  variant?: 'button' | 'banner';
}

const DISMISS_KEY = 'rater_install_prompt_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPromptUI({ className = '', variant = 'banner' }: InstallPromptUIProps) {
  const { isReadyToShow, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true); // Default true to prevent hydration mismatch / flash
  const [timePassed, setTimePassed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check dismissal state
    const dismissData = localStorage.getItem(DISMISS_KEY);
    if (dismissData) {
      const parsed = JSON.parse(dismissData);
      if (Date.now() - parsed.timestamp < DISMISS_DURATION) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);

    // Set 30s delay timer
    const timer = setTimeout(() => {
      setTimePassed(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ timestamp: Date.now() }));
  };

  const handleAction = async () => {
    const res = await promptInstall();
    if (res.outcome === 'accepted') {
      handleDismiss();
    } else if (res.outcome === 'guide' || res.outcome === 'unavailable') {
      showInstallAppModal();
    }
  };

  // Do not show on landing page
  if (pathname === '/') return null;

  // For banner, wait for time passed. For button, show as long as it's ready and not dismissed.
  const shouldShowBanner = isReadyToShow && !dismissed && timePassed;

  if (variant === 'banner') {
    return (
      <AmbientPromptShell
        isVisible={shouldShowBanner}
        onDismiss={handleDismiss}
        icon={
          <img 
            src="/icons/rater-logo-white-bg.svg" 
            alt="Rater Logo" 
            className="w-10 h-10 rounded-lg shadow-sm" 
          />
        }
        title="Install Rater"
        description="Install Rater for quick studio access."
        actionButton={
          <button
            onClick={handleAction}
            className="bg-rater-yellow text-white px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:text-primary transition-colors shadow-sm"
          >
            Install
          </button>
        }
        className={className}
      />
    );
  }

  if (!isReadyToShow) return null;

  return (
    <button
      onClick={handleAction}
      className={`flex items-center gap-2 text-text-primary hover:text-primary transition-colors font-medium ${className}`}
      aria-label="Install Rater"
    >
      <Download size={18} />
      <span>Install Rater</span>
    </button>
  );
}

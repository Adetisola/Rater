'use client';

import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download } from 'lucide-react';
import { AmbientPromptShell } from './AmbientPromptShell';

interface InstallPromptUIProps {
  className?: string;
  variant?: 'button' | 'banner';
}

export function InstallPromptUI({ className = '', variant = 'banner' }: InstallPromptUIProps) {
  const { isReadyToShow, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isReadyToShow || dismissed) {
    if (variant === 'banner') return null;
  }

  if (variant === 'banner') {
    return (
      <AmbientPromptShell
        isVisible={isReadyToShow && !dismissed}
        onDismiss={() => setDismissed(true)}
        icon={
          <img 
            src="/icons/rater-logo-white-bg.svg" 
            alt="Rater Logo" 
            className="w-10 h-10 rounded-lg shadow-sm" 
          />
        }
        title="Install Rater"
        description="For a faster, native experience"
        actionButton={
          <button
            onClick={promptInstall}
            className="bg-rater-yellow text-white px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:text-[#FEC312] transition-colors shadow-sm"
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
      onClick={promptInstall}
      className={`flex items-center gap-2 text-black hover:text-[#FEC312] transition-colors font-medium ${className}`}
      aria-label="Install Rater"
    >
      <Download size={18} />
      <span>Install App</span>
    </button>
  );
}

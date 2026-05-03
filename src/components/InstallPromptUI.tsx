'use client';

import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download } from 'lucide-react';

interface InstallPromptUIProps {
  className?: string;
  variant?: 'button' | 'banner';
}

export function InstallPromptUI({ className = '', variant = 'banner' }: InstallPromptUIProps) {
  const { isReadyToShow, promptInstall } = useInstallPrompt();

  if (!isReadyToShow) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className={`fixed bottom-4 left-4 right-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 ${className}`}>
        <div className="flex flex-col">
          <span className="text-white font-medium">Install Rater</span>
          <span className="text-zinc-400 text-sm">For a faster, native experience</span>
        </div>
        <button
          onClick={promptInstall}
          className="bg-rater-yellow text-black px-4 py-2 rounded-lg font-medium hover:bg-rater-yellow/90 transition-colors"
        >
          Install
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={promptInstall}
      className={`flex items-center gap-2 text-rater-yellow hover:text-rater-yellow/80 transition-colors font-medium ${className}`}
      aria-label="Install Rater"
    >
      <Download size={18} />
      <span>Install App</span>
    </button>
  );
}

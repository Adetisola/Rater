'use client';

import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';

interface InstallPromptUIProps {
  className?: string;
  variant?: 'button' | 'banner';
}

export function InstallPromptUI({ className = '', variant = 'banner' }: InstallPromptUIProps) {
  const { isReadyToShow, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isReadyToShow || dismissed) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className={`fixed bottom-4 left-4 right-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 ${className}`}>
        <div className="flex items-center gap-3">
          <img src="/icons/rater-logo-white-bg.svg" alt="Rater Logo" className="w-10 h-10 rounded-lg shadow-sm" />
          <div className="flex flex-col">
            <span className="text-white font-medium text-base">Install Rater</span>
            <span className="text-zinc-400 text-[13px]">For a faster, native experience</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={promptInstall}
            className="bg-rater-yellow text-white px-4 py-2 rounded-lg font-medium hover:text-[#FEC312] transition-colors shadow-sm"
          >
            Install
          </button>
          <button 
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center"
            aria-label="Dismiss install prompt"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

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

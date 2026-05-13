'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { AmbientPromptShell } from './AmbientPromptShell';
import { AuthOverlay } from './AuthOverlay';
import { AnimatePresence } from 'framer-motion';

interface GuestSignupPromptProps {
  isVisible: boolean;
  onDismiss: () => void;
  onBeforeSignup?: () => void;
  personalizedTitle?: string;
  guestName?: string;
}

export function GuestSignupPrompt({ 
  isVisible, 
  onDismiss, 
  onBeforeSignup,
  personalizedTitle,
  guestName,
}: GuestSignupPromptProps) {
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  const handleSignupClick = () => {
    // Execute any save logic (e.g. saving draft)
    if (onBeforeSignup) {
      onBeforeSignup();
    }
    
    // Show Auth Overlay
    setShowAuthOverlay(true);
  };

  return (
    <>
      <AmbientPromptShell
        isVisible={isVisible && !showAuthOverlay}
        onDismiss={onDismiss}
        icon={
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shadow-sm">
            <UserPlus size={22} className="text-[#FEC312]" />
          </div>
        }
        title={personalizedTitle || 'Want to keep your reviews connected to you?'}
        description="Create your avatar so your reviews stay part of you"
        actionButton={
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDismiss}
              className="text-zinc-500 px-3 py-2 rounded-lg text-sm font-medium hover:text-zinc-300 transition-colors hidden sm:block"
            >
              Maybe later
            </button>
            <button
              onClick={handleSignupClick}
              className="bg-rater-yellow text-white px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:text-[#FEC312] transition-colors shadow-sm whitespace-nowrap"
            >
              Create Avatar
            </button>
          </div>
        }
      />

      <AnimatePresence>
        {showAuthOverlay && (
          <AuthOverlay 
            initialTab="signup" 
            onClose={() => setShowAuthOverlay(false)}
            prefillName={guestName}
            redirectOnSuccess={false}
          />
        )}
      </AnimatePresence>
    </>
  );
}

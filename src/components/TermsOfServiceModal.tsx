"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Use a simple wrapper component so we can use AnimatePresence properly 
  // without losing the portal unmount behavior. We conditionally render the portal content.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/10 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[24px] overflow-hidden relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100/80 shrink-0">
              <h2 className="text-lg font-medium text-black">Terms of Service</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100/80 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-[13px] leading-relaxed text-gray-600">
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-black shrink-0">1.</span>
                  <div>
                    <strong className="text-gray-900 font-medium">Be Constructive: </strong> You are here to review designs, not roast the designer&apos;s entire existence. Keep the feedback sharp, actionable, and kind.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-black shrink-0">2.</span>
                  <div>
                    <strong className="text-gray-900 font-medium">The LLM is Trying Its Best: </strong> We use AI to synthesize insights. Sometimes it&apos;s a genius; sometimes it hallucinates. By using Rater, you agree not to sue us if the AI says your work needs &quot;to pop more.&quot; LOL
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-black shrink-0">3.</span>
                  <div>
                    <strong className="text-gray-900 font-medium">No Review Spam: </strong> Don&apos;t just click 1-star on everything because you&apos;re having a bad day. The algorithm will know, and it will silently judge you.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-black shrink-0">4.</span>
                  <div>
                    <strong className="text-gray-900 font-medium">Your Data: </strong> We analyze the reviews to generate cool insights. We won&apos;t sell your soul to advertisers, mostly because we wouldn&apos;t even know how to build the integration for that yet.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-black shrink-0">5.</span>
                  <div>
                    <strong className="text-gray-900 font-medium">Just Vibe: </strong> By clicking &quot;Accept&quot;, you agree to maintain immaculate vibes at all times while using the platform.
                  </div>
                </li>
              </ul>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

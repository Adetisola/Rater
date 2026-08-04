"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { AccessAvatarForm } from './AccessAvatarForm';
import { CreateAvatarOverlay } from './CreateAvatarOverlay';
import { LegalModal } from './LegalModal';

interface AuthOverlayProps {
  onClose: () => void;
  initialTab?: 'login' | 'signup';
  prefillName?: string;
  redirectOnSuccess?: boolean;
}

export function AuthOverlay({ onClose, initialTab = 'login', prefillName, redirectOnSuccess = true }: AuthOverlayProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; title: string; docUrl: string }>({
    isOpen: false,
    title: '',
    docUrl: ''
  });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const openLegal = (title: string, docUrl: string) => {
    setLegalModal({ isOpen: true, title, docUrl });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [mounted]);

  const handleLoginSuccess = () => {
    onClose();
    if (redirectOnSuccess) {
      router.push('/browse', { scroll: false });
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 h-140 max-h-[90vh]">

        {/* Tab Header */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-6 text-sm font-semibold uppercase tracking-wider transition-all relative ${activeTab === 'login' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </div>
            {activeTab === 'login' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-6 text-sm font-semibold uppercase tracking-wider transition-all relative ${activeTab === 'signup' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Sign up
            </div>
            {activeTab === 'signup' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-8 pb-10 pt-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="w-full flex flex-col items-center my-auto py-2"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-medium text-black mb-1">Welcome Back</h2>
                  <p className="text-gray-500 text-sm">Enter your @username/email to continue</p>
                </div>
                <AccessAvatarForm
                  onSuccess={handleLoginSuccess}
                  onCreateNew={() => setActiveTab('signup')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-full flex-1 flex flex-col items-center"
              >
                <div className="text-center mb-2 shrink-0">
                  <h2 className="text-2xl font-medium text-black">Create Avatar</h2>
                  <p className="text-gray-500 text-sm mb-2">Join the community of Judges</p>
                </div>

                {/* Embedded Signup Form without the extra fixed overlay wrapper */}
                <div className="w-full flex-1 min-h-0">
                  <CreateAvatarOverlay
                    isEmbedded
                    onClose={onClose}
                    onShowLegal={openLegal}
                    onLogin={() => setActiveTab('login')}
                    onCreate={async () => {
                      onClose();
                      if (redirectOnSuccess) {
                        router.push('/browse', { scroll: false });
                      }
                    }}
                    prefillName={prefillName}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Link */}
        {activeTab === 'login' && (
          <div className="p-4 text-center border-t border-gray-100 shrink-0 bg-gray-50/50">
            <p className="text-[11px] text-gray-400">
              By continuing, you agree to Rater's{' '}
              <button onClick={() => openLegal('Terms of Service', '/legal/Rater Terms of Service.md')} className="font-semibold text-gray-500 hover:text-black transition-colors">Terms of Service</button>{' '}
              and{' '}
              <button onClick={() => openLegal('Privacy Policy', '/legal/Rater Privacy Policy.md')} className="font-semibold text-gray-500 hover:text-black transition-colors">Privacy Policy</button>.
            </p>
          </div>
        )}
      </div>
      
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
        title={legalModal.title}
        docUrl={legalModal.docUrl}
      />
    </div>,
    document.body
  );
}

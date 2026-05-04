"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { AccessAvatarForm } from './AccessAvatarForm';
import { CreateAvatarOverlay } from './CreateAvatarOverlay';

interface AuthOverlayProps {
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export function AuthOverlay({ onClose, initialTab = 'login' }: AuthOverlayProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

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
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden relative z-10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] md:max-h-[660px]">

        {/* Tab Header */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-6 text-sm font-semibold uppercase tracking-wider transition-all relative ${
              activeTab === 'login' ? 'text-[#111111]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </div>
            {activeTab === 'login' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#FEC312]" 
              />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-6 text-sm font-semibold uppercase tracking-wider transition-all relative ${
              activeTab === 'signup' ? 'text-[#111111]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Sign up
            </div>
            {activeTab === 'signup' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#FEC312]" 
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
                className="w-full flex flex-col items-center"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-[#111111] mb-2">Welcome Back</h2>
                  <p className="text-gray-500 text-sm">Enter your @username to continue</p>
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
                  <h2 className="text-2xl font-semibold text-[#111111]">Create Avatar</h2>
                  <p className="text-gray-500 text-sm mb-2">Join the community of Judges</p>
                </div>
                
                {/* Embedded Signup Form without the extra fixed overlay wrapper */}
                <div className="w-full flex-1 min-h-0">
                    <CreateAvatarOverlay 
                        isEmbedded
                        onClose={onClose} 
                        onCreate={async () => {
                            onClose();
                            router.push('/app/browse', { scroll: false });
                        }} 
                    />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>,
    document.body
  );
}

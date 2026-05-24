"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';


interface ForgotPasskeyOverlayProps {

  onCancel: () => void;
  onSend: (email: string) => void;
}

export function ForgotPasskeyOverlay({ onCancel, onSend }: ForgotPasskeyOverlayProps) {
  const [email, setEmail] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (!mounted) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        />

        <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center">
            
            <div className="text-center mb-8">
                <h2 className="text-2xl font-medium mb-2 text-black">Recover your Avatar</h2>
                <p className="text-sm text-gray-500 max-w-[290px] mx-auto leading-relaxed">
                    If you added an email when creating this avatar, we can help you recover access.
                </p>
            </div>

            <div className="w-full mb-8">
                 <Input 
                     type="email"
                     placeholder="Enter the email linked to your avatar" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="h-12 rounded-xl border-gray-300 text-sm px-4 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312]"
                 />
            </div>

            <div className="flex items-center justify-center gap-4 w-full">
                 <Button 
                    variant="ghost"
                    onClick={onCancel}
                    className="h-12 px-6 rounded-full text-base font-medium text-gray-500 transition-all"
                 >
                    Cancel
                 </Button>

                 <Button 
                    onClick={() => onSend(email)}
                    variant="outline"
                    disabled={!email}
                    className="min-w-[140px] h-12 rounded-full text-lg font-medium transition-all"
                >
                    Send Recovery Link
                </Button>
            </div>

        </div>
    </div>,
    document.body
  );
}

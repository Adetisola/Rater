"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '@/lib/supabase/client';
import { AlertCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForgotPasskeyOverlayProps {
  onCancel: () => void;
}

export function ForgotPasskeyOverlay({ onCancel }: ForgotPasskeyOverlayProps) {
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rate limiting state
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (isLoading || cooldown > 0 || !email) return;

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsLoading(false);

    if (resetError) {
      // Supabase rate limiting usually returns status 429
      if (resetError.status === 429) {
        setError("Please wait a moment before requesting another email.");
        setCooldown(60); // 60 second cooldown
      } else {
        setError(resetError.message || "Failed to send recovery email.");
      }
      return;
    }

    setIsSuccess(true);
    setCooldown(60); // prevent spamming after success
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setIsSuccess(false); // go back to initial state
    handleSend();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        />

        <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center overflow-hidden">
            
            {isSuccess ? (
              <div className="flex flex-col items-center w-full animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-medium mb-3 text-black text-center">Check your email</h2>
                <p className="text-sm text-gray-500 max-w-[290px] mx-auto leading-relaxed text-center mb-8">
                  If an account exists for this email, we've sent a password reset link.
                </p>
                
                <div className="flex flex-col items-center w-full gap-3">
                  <Button 
                    onClick={onCancel}
                    variant="outline"
                    className="w-full h-12 rounded-full text-lg font-medium transition-all"
                  >
                    Back to Login
                  </Button>
                  
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                    className="text-xs font-medium text-gray-500 hover:text-black transition-colors disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Resend Link (${cooldown}s)` : "Resend Link"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex flex-col items-center w-full animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-medium mb-2 text-black">Recover your Avatar</h2>
                    <p className="text-sm text-gray-500 max-w-[290px] mx-auto leading-relaxed">
                        If you added an email when creating this avatar, we can help you recover access.
                    </p>
                </div>

                <div className="w-full mb-6">
                     <Input 
                         type="email"
                         placeholder="Enter the email linked to your avatar" 
                         value={email}
                         onChange={(e) => {
                           setEmail(e.target.value);
                           setError(null);
                         }}
                         disabled={isLoading}
                         className={cn(
                           "h-12 rounded-xl border-gray-300 text-sm px-4 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312]",
                           error && "border-red-300 focus-visible:border-red-400"
                         )}
                     />
                     {error && (
                       <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                         <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                         <span>{error}</span>
                       </div>
                     )}
                </div>

                <div className="flex items-center justify-center gap-4 w-full">
                     <Button 
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-12 px-6 rounded-full text-base font-medium text-gray-500 transition-all"
                     >
                        Cancel
                     </Button>

                     <Button 
                        type="submit"
                        variant="outline"
                        disabled={!email || isLoading || cooldown > 0}
                        isLoading={isLoading}
                        className="min-w-[140px] h-12 rounded-full text-lg font-medium transition-all"
                    >
                        Send Recovery Link
                    </Button>
                </div>
              </form>
            )}

        </div>
    </div>,
    document.body
  );
}

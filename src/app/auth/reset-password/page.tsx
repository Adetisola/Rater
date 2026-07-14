"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { validatePasskey } from '@/utils/validation';
import { useAuth } from '@/context/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { currentProfile, isLoading: isAuthLoading } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (!isAuthLoading && currentProfile && !isSuccess) {
      passwordInputRef.current?.focus();
    }
  }, [isAuthLoading, currentProfile, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validation
    const passkeyError = validatePasskey(password);
    if (passkeyError) {
      setError(passkeyError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to update password. Your link may have expired.");
      return;
    }

    // Success! Clear fields and show success state before redirecting
    setPassword('');
    setConfirmPassword('');
    setIsSuccess(true);
    
    // Auto-redirect after a short delay
    setTimeout(() => {
      router.replace('/browse');
    }, 2000);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in and not loading, the link is invalid or expired
  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-medium mb-3 text-black">Link Expired</h2>
          <p className="text-sm text-gray-500 mb-8">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button 
            onClick={() => router.replace('/')}
            className="w-full h-12 rounded-full text-lg font-medium"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {isSuccess ? (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-black text-center">Password Updated</h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              Your password has been successfully reset. Redirecting you...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#FFF6DD] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-medium mb-2 text-black">Reset Password</h2>
              <p className="text-sm text-gray-500">
                Enter your new password below.
              </p>
            </div>

            <div className="w-full space-y-4 mb-8">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 tracking-wider ml-1">New Password</label>
                <div className="relative">
                  <Input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-sm px-4 pr-12 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 font-normal"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 tracking-wider ml-1">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 text-sm px-4 pr-12 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 font-normal"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button 
                type="submit"
                variant="outline"
                disabled={isLoading || !password || !confirmPassword}
                isLoading={isLoading}
                className="w-full h-12 rounded-full text-lg font-medium transition-all"
              >
                Update Password
              </Button>
              <Button 
                type="button"
                variant="ghost"
                onClick={() => router.replace('/')}
                disabled={isLoading}
                className="w-full h-12 rounded-full text-base font-medium text-gray-500 transition-all"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

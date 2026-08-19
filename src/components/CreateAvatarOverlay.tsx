"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tooltip } from './ui/Tooltip';
import { validatePasskey, getStrengthColor, getStrengthLabel } from '../utils/passkeyValidation';
import { useAuthActions } from '../context/AuthContext';
import { generateAvailableUsernameAsync } from '../utils/usernameUtils';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, ChevronLeft, Loader2, CheckCircle2, UserRound, Eye, EyeOff, Sparkles, Trash2, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Props for the CreateAvatarOverlay component.
 */
interface CreateAvatarOverlayProps {
  onClose: () => void;
  onCreate: (name: string, passkey: string, email?: string) => void;
  isEmbedded?: boolean;
  prefillName?: string;
  onLogin?: () => void;
  onShowLegal?: (title: string, url: string) => void;
}

/**
 * Helper to validate the display name length and presence.
 * @param name - The display name string.
 * @returns A string error message if invalid, or null if valid.
 */
function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Name cannot be empty";
  if (trimmed.length > 50) return "Too long (max. 50 chars)";
  return null;
}

/**
 * A multi-step form overlay (or embedded component) that guides a user through creating an avatar.
 * Handles image upload with simulated latency, passkey validation, unique username claiming, 
 * and role selection. It integrates with AuthContext for the final signup step.
 */
export function CreateAvatarOverlay({ onClose, onCreate, isEmbedded, prefillName, onLogin, onShowLegal }: CreateAvatarOverlayProps) {
  const [name, setName] = useState(prefillName || '');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [email, setEmail] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI Steps
  const [step, setStep] = useState<'create' | 'username' | 'role'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role State
  const [selectedRole, setSelectedRole] = useState('');

  // Name State
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  const validateEmailFormat = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email";
    return null;
  };
  const { signup, checkUsernameAvailable, loginWithGoogle } = useAuthActions();
  const [generatedUsernamePreview, setGeneratedUsernamePreview] = useState('username');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!name.trim() || name.trim().length < 3) {
      setGeneratedUsernamePreview('username');
      setIsCheckingAvailability(false);
      return;
    }

    const abortController = new AbortController();
    setIsCheckingAvailability(true);

    const timeout = setTimeout(async () => {
      try {
        const availableUsername = await generateAvailableUsernameAsync(
          name, 
          (username) => checkUsernameAvailable(username, ''), 
          abortController.signal
        );
        if (!abortController.signal.aborted) {
          setGeneratedUsernamePreview(availableUsername);
          setIsCheckingAvailability(false);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setIsCheckingAvailability(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [name, checkUsernameAvailable]);

  // Avatar Image Upload State
  const [avatarUploadState, setAvatarUploadState] = useState<'idle' | 'uploading' | 'error' | 'success'>('idle');
  const [avatarErrorMsg, setAvatarErrorMsg] = useState<string | null>(null);

  // Lock body scroll when overlay is open (stand-alone mode only)
  useEffect(() => {
    if (isEmbedded) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isEmbedded]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAvatarUploadState('error');
        setAvatarErrorMsg('Image must be under 5MB');
        setTimeout(() => { setAvatarUploadState('idle'); setAvatarErrorMsg(null); }, 3000);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setAvatarUploadState('uploading');
      setAvatarErrorMsg(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
          setAvatarUploadState('success');
          setTimeout(() => setAvatarUploadState('idle'), 2000);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setAvatarUploadState('error');
        setAvatarErrorMsg('Failed to upload image');
        setTimeout(() => { setAvatarUploadState('idle'); setAvatarErrorMsg(null); }, 3000);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarUploadState('idle');
    setAvatarErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // (Removed legacy Name Availability Check here)

  // Real-time passkey validation
  const validation = useMemo(() => {
    return validatePasskey(passkey, {
      userName: name,
      email: email,
    });
  }, [passkey, name, email]);

  const memoizedCheckAvailability = useCallback(
    (username: string) => checkUsernameAvailable(username, ''),
    [checkUsernameAvailable]
  );

  const {
    input: usernameInput,
    handleChange: handleUsernameChange,
    result: validationResult
  } = useUsernameValidation({
    currentUsername: generatedUsernamePreview,
    checkAvailability: memoizedCheckAvailability,
  });

  const passkeyMismatch = confirmPasskey.length > 0 && passkey !== confirmPasskey;

  const handleCreateStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateDisplayName(name);
    const emailErr = validateEmailFormat(email);

    if (nameErr) setNameError(nameErr);
    if (emailErr) setEmailError(emailErr);

    if (nameErr || emailErr) return;
    if (!validation.canSubmit || passkeyMismatch) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => null);
      
      if (response.ok && data && !data.available) {
        setEmailError('Email is already registered');
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error('Network error checking email:', err);
      // Proceed on network error so we don't hard-block them; the final signup will catch it anyway
    }
    setIsSubmitting(false);

    // Jump to username step
    setDirection(1);
    setStep('username');
  };

  const handleUsernameStepSubmit = async () => {
    if (validationResult.status !== 'valid' && validationResult.status !== 'unchanged') return;

    // Move to role step
    setDirection(1);
    setStep('role');
  };

  const SUGGESTED_ROLES = [
    'Logo Designer', 'Brand Designer', 'UI Designer', 'UX Designer',
    'Graphic Designer', 'Product Designer', 'Illustrator', 'Creative Developer',
    'Motion Designer', '3D Artist', 'Visual Designer', 'Web Designer',
    'Art Director', 'Photographer', 'AI Artist',
  ];

  const handleRoleSubmit = async () => {
    const role = selectedRole.trim();
    if (!role) return;

    setIsSubmitting(true);
    setSignupError(null);
    const result = await signup(name, email, passkey, avatarPreview || undefined, usernameInput, role);

    if (result.ok) {
      onCreate(name, passkey, email);
    } else {
      setIsSubmitting(false);
      // Supabase's default message for duplicate email is often "User already registered"
      if (result.error?.toLowerCase() === 'user already registered' || result.error === 'Email already in use') {
        setDirection(-1);
        setStep('create');
        setEmailError('Email already in use');
      } else if (result.error === 'Username is already taken.') {
        setDirection(-1);
        setStep('username');
        setSignupError(result.error);
      } else {
        setSignupError(result.error || 'Failed to complete setup. Please try again.');
      }
    }
  };

  const handleSkipRole = async () => {
    setIsSubmitting(true);
    setSignupError(null);
    const result = await signup(name, email, passkey, avatarPreview || undefined, usernameInput, undefined);

    if (result.ok) {
      onCreate(name, passkey, email);
    } else {
      setIsSubmitting(false);
      if (result.error?.toLowerCase() === 'user already registered' || result.error === 'Email already in use') {
        setDirection(-1);
        setStep('create');
        setEmailError('Email already in use');
      } else if (result.error === 'Username is already taken.') {
        setDirection(-1);
        setStep('username');
        setSignupError(result.error);
      } else {
        setSignupError(result.error || 'Failed to complete setup. Please try again.');
      }
    }
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);


  const stepContent = (
    <div className="relative w-full">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {step === 'create' ? (
          <motion.div
            key="create"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-6 pt-2">
              <h2 className={`${isEmbedded ? 'hidden' : 'text-2xl font-semibold mb-3 text-black'}`}>Create your Profile</h2>

              <div className="w-full max-w-sm mx-auto mb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary hover:text-black transition-colors"
                  onClick={loginWithGoogle}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-medium text-[15px]">Continue with Google</span>
                </Button>

                <div className="relative flex items-center py-2 pt-2">
                  <div className="grow border-t border-gray-100"></div>
                  <span className="shrink-0 mx-4 text-gray-400 text-[11px] font-bold tracking-widest uppercase">or</span>
                  <div className="grow border-t border-gray-100"></div>
                </div>
              </div>

              <div className="relative w-24 h-24 mx-auto -mb-2">
                <div
                  className={`w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto relative transition-all border-2 border-dashed group overflow-hidden ${avatarUploadState === 'uploading' ? 'border-primary opacity-80 cursor-wait' : avatarUploadState === 'error' ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:bg-gray-200 cursor-pointer'}`}
                  onClick={() => !avatarPreview && avatarUploadState !== 'uploading' && fileInputRef.current?.click()}
                >
                  {avatarUploadState === 'uploading' ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : avatarUploadState === 'success' ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 z-20 animate-in fade-in">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  ) : null}

                  {!avatarUploadState || (avatarUploadState !== 'uploading' && avatarUploadState !== 'success') ? (
                    avatarPreview ? (
                      <img src={avatarPreview} alt="Profile Picture Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className={`w-10 h-10 transition-colors ${avatarUploadState === 'error' ? 'text-red-300' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    )
                  ) : avatarPreview && avatarUploadState === 'uploading' ? (
                    <img src={avatarPreview} alt="Profile Picture Preview" className="w-full h-full object-cover blur-sm" />
                  ) : null}

                  {avatarUploadState === 'idle' && !avatarPreview && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {avatarPreview && avatarUploadState === 'idle' && (
                  <>
                    <Tooltip content="Change Picture" position="top">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-0 w-7 h-7 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-black hover:scale-105 hover:shadow-lg transition-all z-20"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Remove Picture" position="top">
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute bottom-1 left-0 w-7 h-7 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-red-500 hover:text-red-600 hover:scale-105 hover:shadow-lg hover:bg-red-50 transition-all z-20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </>
                )}
              </div>

              {avatarErrorMsg ? (
                <p className="text-[11px] font-medium text-red-500 animate-in slide-in-from-top-1 mb-2">
                  {avatarErrorMsg}
                </p>
              ) : !avatarPreview && (
                <p className="text-[11px] text-gray-400 font-medium mb-2">
                  Upload a picture
                </p>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <form onSubmit={handleCreateStepSubmit} className="w-full space-y-4">
              <div className="relative space-y-1">
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(null);
                  }}
                  className={`h-12 rounded-xl text-base px-4 border transition-all outline-none ${nameError
                    ? 'border-red-400 text-red-600 focus-visible:border-red-400'
                    : 'border-gray-300 focus-visible:border-primary'
                    }`}
                />
                {nameError ? (
                  <p className="text-xs text-red-500 font-medium ml-1">
                    {nameError}
                  </p>
                ) : (
                  <div className="flex justify-between items-start px-2 mt-1">
                    <p className="text-[11px] text-gray-500 leading-tight pr-2">
                      Your display name across Rater (emojis supported).
                    </p>
                    {name.trim() && (
                      <p className="text-[11px] font-medium text-gray-400 shrink-0 select-none flex items-center gap-1">
                        {isCheckingAvailability ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                            Checking...
                          </>
                        ) : (
                          <>
                            @{generatedUsernamePreview}
                            {name.trim().length >= 3 && generatedUsernamePreview !== 'username' && (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            )}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="relative space-y-1">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  className={`h-12 rounded-xl text-base px-4 border transition-all outline-none ${emailError
                    ? 'border-red-400 text-red-600 focus-visible:border-red-400'
                    : 'border-gray-300 focus-visible:border-primary'
                    }`}
                />
                {emailError && (
                  <div className="flex items-center gap-2 mt-1 ml-1 animate-in slide-in-from-top-1">
                    <p className="text-xs text-red-500 font-medium">
                      {emailError}
                    </p>
                    {emailError === 'Email is already registered' && onLogin && (
                      <button
                        type="button"
                        onClick={onLogin}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Log in instead
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPasskey ? "text" : "password"}
                    placeholder="Create Password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    onFocus={() => { }}
                    maxLength={64}
                    className={`h-12 rounded-xl text-base px-4 pr-12 transition-all outline-none border ${passkey.length > 0 && !validation.canSubmit
                      ? 'border-amber-400 focus-visible:border-amber-400'
                      : validation.canSubmit
                        ? 'border-green-400 focus-visible:border-green-400'
                        : 'border-gray-300 focus-visible:border-primary'
                      }`}
                  />
                  <button type="button" onClick={() => setShowPasskey(!showPasskey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPasskey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {passkey.length > 0 && (
                  <div className="px-1 space-y-3 pt-1">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${validation.score}%` }}
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ backgroundColor: getStrengthColor(validation.strength) }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-bold min-w-16.25 text-right uppercase tracking-widest"
                        style={{ color: getStrengthColor(validation.strength) }}
                      >
                        {getStrengthLabel(validation.strength)}
                      </span>
                    </div>

                    {/* Hints */}
                    {validation.hints.length > 0 && (
                      <div className="space-y-1.5 px-0.5">
                        {validation.hints.slice(0, 2).map((hint, index) => (
                          <div key={index} className="flex items-start gap-1.5 animate-in fade-in slide-in-from-left-1">
                            <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                            <p className="text-[11px] text-gray-500 font-medium leading-tight">
                              {hint}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  type={showPasskey ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  className={`h-12 rounded-xl text-base px-4 transition-all outline-none border ${passkeyMismatch ? 'border-red-400 focus-visible:border-red-400' : 'border-gray-300 focus-visible:border-primary'
                    }`}
                />
                {passkeyMismatch && <p className="text-xs text-red-500 ml-1">Passwords don't match</p>}
              </div>

              <div className="pt-4 flex flex-col items-center justify-center gap-4 w-full">
                <div className="flex items-center justify-center gap-6 w-full">
                  <Button variant='ghost' onClick={onClose} type="button" className="py-3 px-10 rounded-full text-base text-black font-medium">Close</Button>
                  <Button variant='outline' type="submit" disabled={isSubmitting || !validation.canSubmit || passkeyMismatch || name.trim().length === 0 || email.trim().length === 0} className="min-w-35 h-12 rounded-full text-lg font-medium transition-all">
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Checking...</span>
                      </div>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
                <div className="px-2">
                  <p className="text-[11px] text-center text-gray-400">
                    By creating a profile, you agree to our{' '}
                    <button type="button" onClick={(e) => { e.preventDefault(); onShowLegal?.('Terms of Service', '/legal/Rater Terms of Service.md'); }} className="font-semibold text-gray-500 hover:text-black transition-colors">Terms of Service</button>{' '}
                    and acknowledge our{' '}
                    <button type="button" onClick={(e) => { e.preventDefault(); onShowLegal?.('Privacy Policy', '/legal/Rater Privacy Policy.md'); }} className="font-semibold text-gray-500 hover:text-black transition-colors">Privacy Policy</button>.
                  </p>
                </div>
              </div>
              {onLogin && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-black font-medium hover:text-primary"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              )}
            </form>
          </motion.div>
        ) : step === 'username' ? (
          <motion.div
            key="username"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-10 mt-8">
              <div className="w-16 h-16 bg-[#FFF6DD] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AtSign className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-medium text-black mb-1">Claim your @username</h2>
              <p className="text-gray-400 text-sm">This is your unique identity on Rater</p>
            </div>

            <div className="w-full space-y-6 px-1">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 pointer-events-none group-focus-within:text-black">
                  <span className="text-[13px] font-medium tracking-tight">raterapp.site/@</span>
                </div>
                <Input
                  autoFocus
                  value={usernameInput}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={cn(
                    "h-12 pl-28.75 pr-4 text-base font-normal rounded-xl border transition-all outline-none",
                    validationResult.status === 'valid' && "border-green-400 focus-visible:border-green-400 bg-green-50/10",
                    validationResult.status === 'taken' && "border-red-400 focus-visible:border-red-400 bg-red-50/10",
                    (validationResult.status === 'idle' || validationResult.status === 'unchanged') && "border-gray-300 focus-visible:border-primary"
                  )}
                  disabled={isSubmitting}
                />
              </div>

              {validationResult.message && (
                <p className={cn("text-xs font-medium -mt-3 px-1", validationResult.status === 'valid' || validationResult.status === 'unchanged' ? "text-green-600" : "text-amber-600")}>
                  {validationResult.message}
                </p>
              )}

              <AnimatePresence>
                {validationResult.status === 'taken' && validationResult.suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 px-2">
                    {validationResult.suggestions.map(s => (
                      <button key={s} onClick={() => handleUsernameChange(s)} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                        @{s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3 pt-6">
                <Button
                  variant='outline'
                  onClick={handleUsernameStepSubmit}
                  disabled={!['valid', 'unchanged'].includes(validationResult.status) || isSubmitting}
                  className="w-full h-12 rounded-full text-lg font-medium transition-all"
                  isLoading={validationResult.status === 'checking'}
                >
                  Continue
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setDirection(-1);
                    setStep('create');
                  }}
                  className="flex items-center justify-center rounded-full gap-2 pl-3 pr-5 border-2 border-gray-100 font-medium hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Go back
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="role"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full flex flex-col items-center"
          >
            <div className="text-center mb-8 mt-8">
              <div className="w-16 h-16 bg-[#FFF6DD] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-medium text-black mb-1">What do you create?</h2>
              <p className="text-gray-400 text-sm">Tell us your creative role, or write your own.</p>
            </div>

            <div className="w-full space-y-6 px-1">
              {/* Custom role input */}
              <div className="relative group">
                <Input
                  autoFocus
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value.slice(0, 50))}
                  placeholder="e.g. Visual Storyteller"
                  className={cn(
                    "h-12 px-4 text-base font-normal rounded-xl border transition-all outline-none",
                    selectedRole.trim() ? "border-primary focus-visible:border-primary" : "border-gray-300 focus-visible:border-primary"
                  )}
                  disabled={isSubmitting}
                  maxLength={50}
                />
                <span className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium transition-opacity duration-200",
                  selectedRole.length > 0 ? "text-gray-300 opacity-100" : "opacity-0"
                )}>
                  {selectedRole.length}/50
                </span>
              </div>

              {/* Suggested role chips */}
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all duration-200",
                      selectedRole === role
                        ? "bg-primary/10 border-primary/40 text-black"
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-black"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                {signupError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 mb-2">
                    {signupError}
                  </div>
                )}
                <Button
                  variant='outline'
                  onClick={handleRoleSubmit}
                  disabled={!selectedRole.trim() || isSubmitting}
                  className="w-full h-12 rounded-full text-lg font-medium transition-all"
                  isLoading={isSubmitting}
                >
                  Complete Setup
                </Button>
                <Button
                  variant='ghost'
                  type="button"
                  onClick={handleSkipRole}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-full text-base font-medium transition-all text-gray-500 hover:text-black"
                >
                  Skip
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setDirection(-1);
                    setStep('username');
                  }}
                  className="flex items-center justify-center rounded-full gap-2 pl-3 pr-5 border-2 border-gray-100 font-medium hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4" /> Go back
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isEmbedded) {
    return stepContent;
  }

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="bg-white w-full max-w-md rounded-4xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center">
          {stepContent}
        </div>
      </div>
    </div>,
    document.body
  );
}

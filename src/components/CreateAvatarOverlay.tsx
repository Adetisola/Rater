"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { validatePasskey, getStrengthColor, getStrengthLabel } from '../logic/passkeyValidation';
import { useAuth } from '../context/AuthContext';
import { generateUsernameFromName } from '../logic/usernameUtils';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, ChevronLeft, Loader2, CheckCircle2, UserRound, Pencil, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface CreateAvatarOverlayProps {
  onClose: () => void;
  onCreate: (name: string, passkey: string, email?: string) => void;
  isEmbedded?: boolean;
}

// Validation Helper
function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Name cannot be empty";
  if (trimmed.length > 50) return "Too long (max. 50 chars)";
  return null;
}

export function CreateAvatarOverlay({ onClose, onCreate, isEmbedded }: CreateAvatarOverlayProps) {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [email, setEmail] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI Steps
  const [step, setStep] = useState<'create' | 'username'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Name State
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const validateEmailFormat = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email";
    return null;
  };

  const { signup, allAvatars, checkUsernameAvailable } = useAuth();

  const generatedUsernamePreview = useMemo(() => {
    if (!name.trim()) return 'username';
    return generateUsernameFromName(name, Object.values(allAvatars).map(a => a.username));
  }, [name, allAvatars]);

  // Avatar Image Upload State
  const [avatarUploadState, setAvatarUploadState] = useState<'idle' | 'uploading' | 'error' | 'success'>('idle');

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
        setTimeout(() => setAvatarUploadState('idle'), 3000);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setAvatarUploadState('uploading');
      
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
        setTimeout(() => setAvatarUploadState('idle'), 3000);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarUploadState('idle');
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

  const handleCreateStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateDisplayName(name);
    const emailErr = validateEmailFormat(email);
    
    if (nameErr) setNameError(nameErr);
    if (emailErr) setEmailError(emailErr);

    if (nameErr || emailErr) return;
    if (!validation.canSubmit || passkeyMismatch) return;
    
    // Jump to username step
    setDirection(1);
    setStep('username');
  };

  const handleFinalSubmit = async () => {
    if (validationResult.status !== 'valid' && validationResult.status !== 'unchanged') return;
    
    setIsSubmitting(true);
    const result = await signup(name, email, passkey, avatarPreview || undefined, usernameInput);
    
    if (result.ok) {
      onCreate(name, passkey, email);
    } else {
      setIsSubmitting(false);
      if (result.error === 'Email already in use') {
        setDirection(-1);
        setStep('create');
        setEmailError(result.error);
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
                <h2 className={`${isEmbedded ? 'hidden' : 'text-2xl font-semibold mb-3 text-black'}`}>Create your Avatar</h2>
                
                <div 
                    className={`w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto relative transition-all border-2 border-dashed group overflow-hidden ${avatarUploadState === 'uploading' ? 'border-[#FEC312] opacity-80 cursor-wait' : 'border-gray-100 hover:bg-gray-200 cursor-pointer'}`}
                    onClick={() => avatarUploadState !== 'uploading' && fileInputRef.current?.click()}
                >
                     {avatarUploadState === 'uploading' ? (
                         <Loader2 className="w-8 h-8 text-[#FEC312] animate-spin" />
                     ) : avatarUploadState === 'success' ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 z-20 animate-in fade-in">
                           <CheckCircle2 className="w-8 h-8 text-white" />
                         </div>
                     ) : null}

                     {!avatarUploadState || (avatarUploadState !== 'uploading' && avatarUploadState !== 'success') ? (
                       avatarPreview ? (
                           <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                       ) : (
                           <UserRound className="w-10 h-10 text-gray-400 group-hover:text-gray-500 transition-colors" />
                       )
                     ) : avatarPreview && avatarUploadState === 'uploading' ? (
                       <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover blur-sm" />
                     ) : null}
                     
                     {avatarUploadState === 'idle' && (
                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <Pencil className="w-5 h-5 text-white" />
                       </div>
                     )}
                </div>

                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
                
                <div className="flex gap-4 justify-center items-center mt-3">
                  <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploadState === 'uploading'}
                      className="text-[14px] font-medium text-black tracking-wide hover:text-[#FEC312] transition-colors disabled:opacity-50"
                  >
                      {avatarPreview ? 'Change Picture' : 'Upload a Picture'}
                  </button>
                  {avatarPreview && (
                    <button 
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploadState === 'uploading'}
                        className="text-[14px] font-semibold text-red-500 tracking-wide hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                        Remove
                    </button>
                  )}
                </div>
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
                         className={`h-12 rounded-xl text-base px-4 border transition-all outline-none ${
                            nameError 
                                ? 'border-red-400 text-red-600 focus-visible:border-red-400' 
                                : 'border-gray-300 focus-visible:border-[#FEC312]'
                         }`}
                     />
                     {nameError ? (
                         <p className="text-xs text-red-500 font-medium ml-1">
                             {nameError}
                         </p>
                     ) : (
                         <div className="flex justify-between items-start px-2 mt-1">
                             <p className="text-[11px] text-gray-500 leading-tight pr-2">
                                 This is your display name — emojis allowed.
                             </p>
                             {name.trim() && (
                                 <p className="text-[11px] font-medium text-gray-400 shrink-0 select-none">
                                     @{generatedUsernamePreview}
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
                         className={`h-12 rounded-xl text-base px-4 border transition-all outline-none ${
                            emailError 
                                ? 'border-red-400 text-red-600 focus-visible:border-red-400' 
                                : 'border-gray-300 focus-visible:border-[#FEC312]'
                         }`}
                     />
                     {emailError && (
                         <p className="text-xs text-red-500 font-medium ml-1 animate-in slide-in-from-top-1">
                             {emailError}
                         </p>
                     )}
                 </div>

                 <div className="space-y-2">
                    <div className="relative">
                        <Input 
                            type={showPasskey ? "text" : "password"}
                            placeholder="Enter Passkey (min. 8 characters)" 
                            value={passkey}
                            onChange={(e) => setPasskey(e.target.value)}
                            onFocus={() => {}}
                            maxLength={64}
                            className={`h-12 rounded-xl text-base px-4 pr-12 transition-all outline-none border ${
                                passkey.length > 0 && !validation.canSubmit 
                                    ? 'border-amber-400 focus-visible:border-amber-400' 
                                    : validation.canSubmit 
                                        ? 'border-green-400 focus-visible:border-green-400'
                                        : 'border-gray-300 focus-visible:border-[#FEC312]'
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
                                  className="text-[10px] font-bold min-w-[65px] text-right uppercase tracking-widest"
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
                        placeholder="Confirm Passkey" 
                        value={confirmPasskey}
                        onChange={(e) => setConfirmPasskey(e.target.value)}
                        className={`h-12 rounded-xl text-base px-4 transition-all outline-none border ${
                            passkeyMismatch ? 'border-red-400 focus-visible:border-red-400' : 'border-gray-300 focus-visible:border-[#FEC312]'
                        }`}
                    />
                    {passkeyMismatch && <p className="text-xs text-red-500 ml-1">Passkeys don't match</p>}
                 </div>

                 <div className="pt-4 flex items-center justify-center gap-6 w-full">
                     <Button variant='ghost' onClick={onClose} type="button" className="py-3 px-10 rounded-full text-sm text-black font-medium">Cancel</Button>
                     <Button variant='outline' type="submit" disabled={!validation.canSubmit || passkeyMismatch || name.trim().length === 0 || email.trim().length === 0} className="min-w-[140px] h-12 rounded-full text-lg font-medium transition-all">
                        Continue
                     </Button>
                 </div>
            </form>
          </motion.div>
        ) : (
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
                <AtSign className="w-8 h-8 text-[#FEC312]" />
              </div>
              <h2 className="text-2xl font-medium text-black mb-2">Claim your username</h2>
              <p className="text-gray-400 text-sm">This is your unique identity on Rater</p>
            </div>

            <div className="w-full space-y-6 px-1">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 pointer-events-none group-focus-within:text-black">
                  <span className="text-[13px] font-medium tracking-tight">rater-web.vercel.app/@</span>
                </div>
                <Input 
                  autoFocus
                  value={usernameInput}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={cn(
                    "h-14 pl-[170px] pr-4 text-[17px] font-medium rounded-2xl border-2 transition-all outline-none",
                    validationResult.status === 'valid' && "border-green-200 focus-visible:border-green-400 bg-green-50/10",
                    validationResult.status === 'taken' && "border-red-200 focus-visible:border-red-400 bg-red-50/10",
                    (validationResult.status === 'idle' || validationResult.status === 'unchanged') && "border-gray-100"
                  )}
                  disabled={isSubmitting}
                />
              </div>

              {validationResult.message && (
                <p className={cn("text-xs font-medium px-4", validationResult.status === 'valid' || validationResult.status === 'unchanged' ? "text-green-600" : "text-amber-600")}>
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
                  onClick={handleFinalSubmit} 
                  disabled={!['valid', 'unchanged'].includes(validationResult.status) || isSubmitting} 
                  className="w-full h-12 rounded-full text-lg font-medium transition-all"
                  isLoading={isSubmitting || validationResult.status === 'checking'}
                >
                  Claim & Continue
                </Button>
                <Button 
                  variant='secondary'
                  onClick={() => {
                    setDirection(-1);
                    setStep('create');
                  }} 
                  className="flex items-center justify-center rounded-full gap-2 pl-3 pr-5 border-2 border-gray-100 font-semibold hover:bg-gray-50"
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
      <div className="bg-white w-full max-w-md rounded-[32px] relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center">
          {stepContent}
        </div>
      </div>
    </div>,
    document.body
  );
}

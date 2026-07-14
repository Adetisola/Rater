"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, Loader2, AtSign, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { generateAvailableUsernameAsync } from '@/utils/usernameUtils';
import { checkUsernameAvailable } from '@/lib/profiles';

const SUGGESTED_ROLES = [
  'Logo Designer', 'Brand Designer', 'UI Designer', 'UX Designer',
  'Graphic Designer', 'Product Designer', 'Illustrator', 'Creative Developer',
  'Motion Designer', '3D Artist', 'Visual Designer', 'Web Designer',
  'Art Director', 'Photographer', 'AI Artist',
];

export default function CompleteProfilePage() {
  const { currentProfile, updateProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  // Step state
  type Step = 'username' | 'role';
  const [step, setStep] = useState<Step>('username');
  const [direction, setDirection] = useState(1);

  // Username state
  const [usernameInput, setUsernameInput] = useState('');
  const [hasGeneratedUsername, setHasGeneratedUsername] = useState(false);
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(true);

  // Role state
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const { result: validationResult, validate } = useUsernameValidation({
    currentUsername: currentProfile?.username || '',
    checkAvailability: (u) => checkUsernameAvailable(u, currentProfile?.id),
    debounceMs: 300,
  });

  // If the user already finished onboarding, redirect them to browse
  useEffect(() => {
    if (!isAuthLoading && currentProfile?.onboarding_completed) {
      router.replace('/browse');
    }
  }, [isAuthLoading, currentProfile, router]);

  // Pre-fill username on mount
  useEffect(() => {
    let mounted = true;
    
    async function prefillUsername() {
      if (!currentProfile?.name || hasGeneratedUsername) return;
      
      try {
        const generated = await generateAvailableUsernameAsync(currentProfile.name, (u) => checkUsernameAvailable(u, currentProfile.id));
        if (mounted) {
          setUsernameInput(generated);
          setHasGeneratedUsername(true);
        }
      } catch (err) {
        console.error("Failed to generate username:", err);
      } finally {
        if (mounted) setIsGeneratingUsername(false);
      }
    }

    if (currentProfile && !isAuthLoading && !hasGeneratedUsername) {
      prefillUsername();
    }
  }, [currentProfile, isAuthLoading, hasGeneratedUsername]);

  // Trigger validation when input changes
  useEffect(() => {
    if (usernameInput) {
      validate(usernameInput);
    }
  }, [usernameInput, validate]);

  const handleUsernameChange = (value: string) => {
    // Standardize input
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsernameInput(cleanValue);
  };

  const handleUsernameSubmit = async () => {
    if (validationResult.status !== 'valid' && validationResult.status !== 'unchanged') return;
    
    setIsSubmitting(true);
    setError(null);

    // Persist the username immediately
    const result = await updateProfile({ username: usernameInput });
    
    setIsSubmitting(false);

    if (result.ok) {
      setDirection(1);
      setStep('role');
    } else {
      // Handle race condition / collision
      setError("That username was just taken. Please choose another.");
    }
  };

  const handleRoleSubmit = async () => {
    const role = selectedRole.trim();
    if (!role) return;

    setIsSubmitting(true);
    setError(null);

    // Finalize onboarding
    const result = await updateProfile({ role, onboarding_completed: true });
    
    if (result.ok) {
      router.replace('/browse');
    } else {
      setError(result.error || 'Failed to complete profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkipRole = async () => {
    setIsSubmitting(true);
    setError(null);
    
    // Finalize onboarding with no role
    const result = await updateProfile({ onboarding_completed: true });
    
    if (result.ok) {
      router.replace('/browse');
    } else {
      setError(result.error || 'Failed to complete profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || (currentProfile && currentProfile.onboarding_completed)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 30 : -30,
      opacity: 0,
      scale: 0.95,
      position: 'absolute' as const
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-gray-100 flex flex-col items-center relative overflow-hidden min-h-[450px]">
        
        {isGeneratingUsername ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
             <p className="text-sm text-gray-500 animate-pulse">Setting up your profile...</p>
           </div>
        ) : (
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            {step === 'username' ? (
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
                <div className="text-center mb-8 mt-4">
                  <div className="w-16 h-16 bg-[#FFF6DD] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AtSign className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-medium text-black mb-1">Choose your @username</h2>
                  <p className="text-gray-400 text-sm px-4">This will be your public @username. People can search and mention you with it.</p>
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
                        "h-12 pl-[170px] pr-4 text-base font-normal rounded-xl border transition-all outline-none",
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
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 mb-2 mt-2">
                      {error}
                    </div>
                  )}

                  <AnimatePresence>
                    {validationResult.status === 'taken' && validationResult.suggestions.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 px-2 overflow-hidden">
                        {validationResult.suggestions.map(s => (
                          <button key={s} onClick={() => handleUsernameChange(s)} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                            @{s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-3 pt-6 w-full">
                    <Button
                      variant='outline'
                      onClick={handleUsernameSubmit}
                      disabled={!['valid', 'unchanged'].includes(validationResult.status) || isSubmitting}
                      className="w-full h-12 rounded-full text-lg font-medium transition-all"
                      isLoading={validationResult.status === 'checking' || isSubmitting}
                    >
                      Continue
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
                <div className="text-center mb-8 mt-4">
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

                  <div className="flex flex-col gap-3 pt-4 w-full">
                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 mb-2">
                        {error}
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
                      Skip for now
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => {
                        setDirection(-1);
                        setStep('username');
                        setError(null);
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
        )}
      </div>
    </div>
  );
}

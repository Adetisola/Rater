"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { UserRound, Pencil, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { validatePasskey, getStrengthColor, getStrengthLabel } from '../logic/passkeyValidation';
import { MOCK_AVATARS } from '../logic/mockData';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';

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
  const [showStrengthMeter, setShowStrengthMeter] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Name State
  const [nameError, setNameError] = useState<string | null>(null);
  
  const generatedUsernamePreview = useMemo(() => {
    let base = name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
    return base || 'username';
  }, [name]);

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
        setAvatarErrorMsg("Image is too large (max 5MB)");
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
        setAvatarErrorMsg("Upload failed. Try again.");
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

  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const err = validateDisplayName(name);
    if (err) {
      setNameError(err);
      return;
    }
    
    if (!validation.canSubmit || passkey !== confirmPasskey) {
      return;
    }
    
    const success = await signup(name, passkey, avatarPreview || undefined);

    if (success) {
      onCreate(name, passkey, email || undefined);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const strengthColor = getStrengthColor(validation.strength);
  const strengthLabel = getStrengthLabel(validation.strength);
  const passkeyMismatch = confirmPasskey.length > 0 && passkey !== confirmPasskey;

  const formContent = (
    <div className={`${isEmbedded ? 'w-full' : 'bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center max-h-[90vh] overflow-y-auto scrollbar-hide'}`} style={isEmbedded ? {} : { scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="text-center mb-6">
            <h2 className={`${isEmbedded ? 'hidden' : 'text-2xl font-semibold mb-6 text-[#111111]'}`}>Create your Avatar</h2>
            
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

            {avatarUploadState === 'error' && (
              <p className="text-red-500 text-xs font-medium mt-2 animate-in slide-in-from-top-1">{avatarErrorMsg}</p>
            )}

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
                  className="text-[14px] font-medium text-[#111111] tracking-wide hover:text-[#FEC312] transition-colors disabled:opacity-50"
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

        <form onSubmit={handleSubmit} className="w-full space-y-4">
             {/* Name Input with Helper Preview */}
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
                     <p className="text-xs text-red-500 font-medium ml-1 animate-in slide-in-from-top-1">
                         {nameError}
                     </p>
                 ) : (
                     <div className="flex justify-between items-start px-2 mt-1">
                         <p className="text-[11px] text-gray-500 leading-tight pr-2">
                             This is your display name — you can use emojis and change it anytime.
                         </p>
                         {name.trim() && (
                             <p className="text-[11px] font-medium text-gray-400 shrink-0 select-none">
                                 @{generatedUsernamePreview}
                             </p>
                         )}
                     </div>
                 )}
             </div>

             {/* Passkey Input with Strength Meter */}
             <div className="space-y-2">
                <div className="relative">
                    <Input 
                        type={showPasskey ? "text" : "password"}
                        placeholder="Enter Passkey (min. 8 characters)" 
                        value={passkey}
                        onChange={(e) => setPasskey(e.target.value)}
                        onFocus={() => setShowStrengthMeter(true)}
                        maxLength={64}
                        className={`h-12 rounded-xl text-base px-4 pr-12 transition-all outline-none border ${
                            passkey.length > 0 && !validation.canSubmit 
                                ? 'border-amber-400 focus-visible:border-amber-400' 
                                : validation.canSubmit 
                                    ? 'border-green-400 focus-visible:border-green-400'
                                    : 'border-gray-300 focus-visible:border-[#FEC312]'
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPasskey(!showPasskey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showPasskey ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
                
                {/* Strength Meter */}
                {showStrengthMeter && passkey.length > 0 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ 
                                        width: `${validation.score}%`,
                                        backgroundColor: strengthColor
                                    }}
                                />
                            </div>
                            <span 
                                className="text-xs font-bold min-w-[70px] text-right"
                                style={{ color: strengthColor }}
                            >
                                {strengthLabel}
                            </span>
                        </div>
                        
                        {/* Hints */}
                        {validation.hints.length > 0 && (
                            <div className="space-y-1">
                                {validation.hints.slice(0, 2).map((hint, index) => (
                                    <p 
                                        key={index} 
                                        className={`text-xs ${
                                            hint.includes('Great') || hint.includes('💪')
                                                ? 'text-green-600'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        {hint}
                                    </p>
                                ))}
                            </div>
                        )}
                        
                        {/* Character Count */}
                        <p className="text-[12px] font-medium text-gray-400 text-right">
                            {passkey.length} / 64 chars
                        </p>
                    </div>
                )}
             </div>

             {/* Confirm Passkey */}
             <div className="space-y-1">
                <div className="relative">
                    <Input 
                        type={showConfirmPasskey ? "text" : "password"}
                        placeholder="Confirm Passkey" 
                        value={confirmPasskey}
                        onChange={(e) => setConfirmPasskey(e.target.value)}
                        className={`h-12 rounded-xl text-base px-4 pr-12 transition-all outline-none border ${
                            passkeyMismatch
                                ? 'border-red-400 focus-visible:border-red-400'
                                : confirmPasskey.length > 0 && passkey === confirmPasskey
                                    ? 'border-green-400 focus-visible:border-green-400'
                                    : 'border-gray-300 focus-visible:border-[#FEC312]'
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPasskey(!showConfirmPasskey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showConfirmPasskey ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
                {passkeyMismatch && (
                    <p className="text-xs text-red-500 ml-1 animate-in fade-in">
                        Passkeys don't match
                    </p>
                )}
             </div>

            <Input 
                 type="email" 
                 placeholder="Recovery Email (optional)" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="h-12 rounded-xl text-base px-4 border transition-all outline-none focus-visible:border-[#FEC312]"
            />

            <div className="pt-4 flex items-center justify-center gap-6 w-full">
                 <button 
                    onClick={onClose}
                    type="button"
                    className="py-3 px-10 rounded-full text-sm font-medium text-[#111111] hover:bg-[#FEC312] hover:text-white transition-colors"
                 >
                    Cancel
                 </button>
                 <Button 
                    type="submit" 
                    variant="outline"
                    disabled={!validation.canSubmit || passkeyMismatch || name.trim().length === 0}
                    className={`px-12 h-12 rounded-full text-base font-semibold border-[#FEC312] transition-all text-[#111111] min-w-[140px] ${
                        !validation.canSubmit || passkeyMismatch || name.trim().length === 0
                            ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                            : 'hover:bg-[#FEC312] hover:text-white'
                    }`}
                >
                    Create
                </Button>
            </div>
        </form>
    </div>
  );

  if (!mounted) return null;

  if (isEmbedded) {
    return formContent;
  }

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
       <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {formContent}
    </div>,
    document.body
  );
}

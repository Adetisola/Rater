import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { User, Pencil, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { validatePasskey, getStrengthColor, getStrengthLabel } from '../logic/passkeyValidation';
import { MOCK_AVATARS } from '../logic/mockData';
import { useDebounce } from '../hooks/useDebounce';

interface CreateAvatarOverlayProps {
  onClose: () => void;
  onCreate: (name: string, passkey: string, email?: string) => void;
}

// Validation Helper
function validateAvatarName(name: string): string | null {
  if (name.length < 3) return "Too short (min. 3 chars)";
  if (name.length > 24) return "Too long (max. 24 chars)";
  if (/^ /.test(name)) return "Cannot start with a space";
  if (/ $/.test(name)) return "Cannot end with a space";
  if (/  /.test(name)) return "Cannot have consecutive spaces";
  if (!/^[a-zA-Z0-9 ]+$/.test(name)) return "Only letters, numbers & single spaces allowed";
  if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(name)) return "Invalid format";
  return null;
}

export function CreateAvatarOverlay({ onClose, onCreate }: CreateAvatarOverlayProps) {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [email, setEmail] = useState('');
  const [showStrengthMeter, setShowStrengthMeter] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);
  
  // Name Availability State
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [nameError, setNameError] = useState<string | null>(null);
  const debouncedName = useDebounce(name, 500);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Check Name Availability
  useEffect(() => {
    if (!debouncedName) {
        setNameStatus('idle');
        setNameError(null);
        return;
    }

    // 1. Validate Format Locally
    const validationError = validateAvatarName(debouncedName);
    if (validationError) {
        setNameError(validationError);
        setNameStatus('idle');
        return;
    }

    setNameError(null);
    setIsCheckingName(true);
    setNameStatus('idle');

    // 2. Mock API Check
    const timer = setTimeout(() => {
        const nameExists = Object.values(MOCK_AVATARS).some(
            avatar => avatar.name.toLowerCase() === debouncedName.trim().toLowerCase()
        );
        setNameStatus(nameExists ? 'taken' : 'available');
        setIsCheckingName(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [debouncedName]);

  // Real-time passkey validation
  const validation = useMemo(() => {
    return validatePasskey(passkey, {
      userName: name,
      email: email,
    });
  }, [passkey, name, email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.canSubmit || passkey !== confirmPasskey || nameStatus !== 'available') {
      return;
    }
    
    onCreate(name, passkey, email || undefined);
  };

  const strengthColor = getStrengthColor(validation.strength);
  const strengthLabel = getStrengthLabel(validation.strength);
  const passkeyMismatch = confirmPasskey.length > 0 && passkey !== confirmPasskey;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
       <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-6 text-[#111111]">Create your Avatar</h2>
            
            <p className="text-[10px] uppercase font-bold text-[#111111] mb-2 tracking-wide">upload a pic</p>
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 relative cursor-pointer hover:bg-gray-200 transition-colors">
                 <User className="w-8 h-8 text-[#111111]" />
                 <div className="absolute bottom-0 right-0 bg-surface rounded-full p-1 border border-white">
                    <Pencil className="w-3 h-3 text-[#111111]" />
                 </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
             {/* Name Input with Availability Check */}
             <div className="relative space-y-1">
                 <Input 
                     placeholder="Your name" 
                     value={name} 
                     onChange={(e) => {
                         setName(e.target.value);
                         if (e.target.value !== debouncedName) {
                             setNameStatus('idle'); // Reset checking visual immediately on type
                             setNameError(null);
                         }
                     }}
                     className={`h-12 rounded-xl text-base px-4 pr-10 border transition-all outline-none ${
                        nameError || nameStatus === 'taken' 
                            ? 'border-red-400 text-red-600 focus-visible:border-red-400' 
                            : nameStatus === 'available' 
                                ? 'border-green-400 text-green-700 focus-visible:border-green-400' 
                                : 'border-gray-300 focus-visible:border-[#FEC312]'
                     }`}
                 />
                 
                 {/* Status Indicator */}
                 <div className="absolute right-4 top-3.5">
                     {isCheckingName ? (
                         <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                     ) : nameStatus === 'available' ? (
                         <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in" />
                     ) : (nameStatus === 'taken' || nameError) ? (
                         <XCircle className="w-5 h-5 text-red-500 animate-in zoom-in" />
                     ) : null}
                 </div>

                 {/* Status Message */}
                 {(nameStatus === 'taken' || nameError) && !isCheckingName && (
                     <p className="text-xs text-red-500 font-medium ml-1 animate-in slide-in-from-top-1">
                         {nameError || "Name already taken"}
                     </p>
                 )}
                 {nameStatus === 'available' && !isCheckingName && !nameError && (
                     <p className="text-xs text-green-600 font-medium ml-1 animate-in slide-in-from-top-1">
                         Name available
                     </p>
                 )}
             </div>

             {/* Passkey Input with Strength Meter */}
             <div className="space-y-2">
                <div className="relative">
                    <Input 
                        type={showPasskey ? "text" : "password"}
                        placeholder="Enter Passkey (min. 12 characters)" 
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
                        <p className="text-[10px] text-gray-400 text-right">
                            {passkey.length}/64 characters
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
                    className="py-3 px-10 rounded-full text-sm font-bold text-[#111111] hover:bg-[#FEC312] hover:text-white transition-colors"
                 >
                    Cancel
                 </button>
                 <Button 
                    type="submit" 
                    variant="outline"
                    disabled={!validation.canSubmit || passkeyMismatch || nameStatus !== 'available' || isCheckingName}
                    className={`px-12 h-12 rounded-full text-base font-bold border-[#FEC312] transition-all text-[#111111] min-w-[140px] ${
                        !validation.canSubmit || passkeyMismatch || nameStatus !== 'available' || isCheckingName
                            ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                            : 'hover:bg-[#FEC312] hover:text-white'
                    }`}
                >
                    Create
                </Button>
            </div>
        </form>

      </div>
    </div>
  );
}

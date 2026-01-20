import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { User, Pencil, Eye, EyeOff } from 'lucide-react';
import { validatePasskey, getStrengthColor, getStrengthLabel } from '../logic/passkeyValidation';

interface CreateAvatarOverlayProps {
  onClose: () => void;
  onCreate: (name: string, passkey: string, email?: string) => void;
}

export function CreateAvatarOverlay({ onClose, onCreate }: CreateAvatarOverlayProps) {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [email, setEmail] = useState('');
  const [showStrengthMeter, setShowStrengthMeter] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Real-time passkey validation
  const validation = useMemo(() => {
    return validatePasskey(passkey, {
      userName: name,
      email: email,
    });
  }, [passkey, name, email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passkey strength
    if (!validation.canSubmit) {
      return;
    }
    
    // Check passkey match
    if (passkey !== confirmPasskey) {
      return;
    }
    
    // Check name
    if (!name.trim()) {
      return;
    }
    
    onCreate(name, passkey, email || undefined);
  };

  const strengthColor = getStrengthColor(validation.strength);
  const strengthLabel = getStrengthLabel(validation.strength);
  const passkeyMismatch = confirmPasskey.length > 0 && passkey !== confirmPasskey;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
       <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center max-h-[90vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        

        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-6 text-[#111111]">Create your Avatar</h2>
            
            <p className="text-[10px] uppercase font-bold text-[#111111] mb-2 tracking-wide">upload a pic</p>
            <div className="w-16 h-16 bg-[#EBEBEB] rounded-full flex items-center justify-center mx-auto mb-4 relative cursor-pointer hover:bg-gray-200 transition-colors">
                 <User className="w-8 h-8 text-[#111111]" />
                 <div className="absolute bottom-0 right-0 bg-[#EBEBEB] rounded-full p-1 border border-white">
                    <Pencil className="w-3 h-3 text-[#111111]" />
                 </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
             <Input 
                 placeholder="Your name" 
                 value={name} 
                 onChange={(e) => setName(e.target.value)}
                 className="h-12 rounded-xl border-gray-300 text-base px-4"
             />

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
                        className={`h-12 rounded-xl text-base px-4 pr-12 transition-colors ${
                            passkey.length > 0 && !validation.canSubmit 
                                ? 'border-amber-400 focus-visible:border-amber-400' 
                                : validation.canSubmit 
                                    ? 'border-green-400 focus-visible:border-green-400'
                                    : 'border-gray-300'
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
                        className={`h-12 rounded-xl text-base px-4 pr-12 transition-colors ${
                            passkeyMismatch
                                ? 'border-red-400 focus-visible:border-red-400'
                                : confirmPasskey.length > 0 && passkey === confirmPasskey
                                    ? 'border-green-400 focus-visible:border-green-400'
                                    : 'border-gray-300'
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
                 className="h-12 rounded-xl border-gray-300 text-base px-4"
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
                    disabled={!validation.canSubmit || passkeyMismatch || !name.trim()}
                    className={`px-12 h-12 rounded-full text-base font-bold border-[#FEC312] transition-all text-[#111111] min-w-[140px] ${
                        !validation.canSubmit || passkeyMismatch || !name.trim()
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

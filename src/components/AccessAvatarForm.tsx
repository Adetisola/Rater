import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MOCK_AVATARS, type Avatar } from '../logic/mockData';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { ForgotPasskeyOverlay } from './ForgotPasskeyOverlay';

interface AccessAvatarFormProps {
  onSuccess: (avatar: Avatar) => void;
  onCreateNew: () => void;
}

export function AccessAvatarForm({ onSuccess, onCreateNew }: AccessAvatarFormProps) {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Rate limiting state
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Forgot passkey overlay state
  const [showForgotOverlay, setShowForgotOverlay] = useState(false);

  // Clear startup delay
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (lockoutTime) {
      timer = setInterval(() => {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutTime(null);
          setAttempts(0);
          setError('');
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    setError('');
    setIsLoading(true);

    // Mock network delay
    setTimeout(() => {
      // 1. Check Rate Limit
      if (attempts >= 4) {
        const lockUntil = Date.now() + 30000; // 30s lock
        setLockoutTime(lockUntil);
        setTimeLeft(30);
        setError('Too many failed attempts. Please try again later.');
        setIsLoading(false);
        return;
      }

      // 2. Validate Credentials (MOCK)
      // Find avatar by name (case insensitive)
      const avatarEntry = Object.values(MOCK_AVATARS).find(
        a => a.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (avatarEntry && avatarEntry.passkey === passkey) {
        // Success
        onSuccess(avatarEntry);
      } else {
        // Generic Error
        setError('Avatar name or passkey is incorrect.');
        setAttempts(prev => prev + 1);
      }
      
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-sm space-y-6">
       
       {lockoutTime ? (
         <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col items-center text-center animate-in fade-in">
            <Lock className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-800">Account Locked</p>
            <p className="text-xs text-red-600 mt-1">
              Too many failed attempts.<br/>Try again in {timeLeft} seconds.
            </p>
         </div>
       ) : (
         <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                 <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">Avatar Name</label>
              <Input 
                  placeholder="e.g. Timi" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base px-4 rounded-xl border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312] placeholder:text-gray-400 font-medium"
                  disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">Passkey</label>
              <div className="relative">
                <Input 
                    type={showPasskey ? "text" : "password"}
                    placeholder="Enter your passkey" 
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    className="h-12 text-base px-4 pr-12 rounded-xl border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312] placeholder:text-gray-400 font-medium"
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    disabled={isLoading}
                >
                    {showPasskey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-left">
                <button 
                    type="button"
                    onClick={() => setShowForgotOverlay(true)}
                    className="text-xs font-semibold text-gray-500 hover:text-[#FEC312] transition-colors"
                    disabled={isLoading}
                >
                    Forgot passkey?
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                  type="submit" 
                  variant="outline"
                  className={cn(
                    "w-[140px] h-12 rounded-full text-lg font-semibold transition-all",
                    isLoading && "opacity-80 cursor-wait"
                  )}
                  disabled={isLoading || !name || !passkey}
              >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
              </Button>
            </div>
         </form>
       )}

       <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Don't have an avatar?{' '}
            <button 
                onClick={onCreateNew}
                className="text-[#111111] font-semibold hover:underline hover:text-[#FEC312]"
                disabled={isLoading}
            >
                Create new
            </button>
          </p>
       </div>

       {/* Forgot Passkey Overlay */}
       {showForgotOverlay && (
           <ForgotPasskeyOverlay 

             onCancel={() => setShowForgotOverlay(false)}
             onSend={(email) => {
               console.log('Recovery link sent to:', email);
               setShowForgotOverlay(false);
               // Show success message or notification here
             }}
           />
       )}
    </div>
  );
}

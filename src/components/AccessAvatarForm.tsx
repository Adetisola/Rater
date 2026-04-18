"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Eye, EyeOff, AlertCircle, Lock, AtSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { ForgotPasskeyOverlay } from './ForgotPasskeyOverlay';

import { useAuth } from '../context/AuthContext';

interface AccessAvatarFormProps {
  onSuccess: () => void;
  onCreateNew: () => void;
}

export function AccessAvatarForm({ onSuccess, onCreateNew }: AccessAvatarFormProps) {
  const [username, setUsername] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Rate limiting state
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
          setError('');
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const { login } = useAuth();

  // Normalize username input: strip @, extract from URLs, trim
  const normalizeUsername = (raw: string): string => {
    let val = raw.trim().toLowerCase();
    const urlMatch = val.match(/\/@([a-z0-9_]+)/);
    if (urlMatch) return urlMatch[1];
    return val.replace(/^@/, '');
  };

  const usernameFormatValid = (val: string): boolean => {
    if (!val) return true; // empty is not an error, just disabled
    return /^[a-z0-9_]{3,20}$/.test(val);
  };

  const handleUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow typing freely but strip @ for stored value
    setUsername(raw.startsWith('@') ? raw.slice(1) : raw);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    const normalized = normalizeUsername(username);

    if (!usernameFormatValid(normalized)) {
      setError('Enter a valid username');
      return;
    }

    setError('');
    setIsLoading(true);

    const success = await login(normalized, passkey);

    if (success) {
      onSuccess();
    } else {
      setError('Invalid username or passkey');
    }
    
    setIsLoading(false);
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
              <label className="text-xs font-semibold uppercase text-gray-600 tracking-wider ml-1">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <AtSign className="w-4 h-4" />
                </div>
                <Input 
                    placeholder="username" 
                    value={username}
                    onChange={handleUsernameInput}
                    className={cn(
                      "h-12 text-sm pl-10 pr-4 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 font-normal",
                      username && !usernameFormatValid(normalizeUsername(username)) && "border-red-300 focus-visible:border-red-400"
                    )}
                    disabled={isLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                />
              </div>
              {username && !usernameFormatValid(normalizeUsername(username)) && (
                <p className="text-[11px] text-red-500 font-medium ml-1 animate-in slide-in-from-top-1">Enter a valid username (3-20 chars, letters, numbers, underscores)</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-600 tracking-wider ml-1">Passkey</label>
              <div className="relative">
                <Input 
                    type={showPasskey ? "text" : "password"}
                    placeholder="Enter your passkey" 
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    className="h-12 text-sm px-4 pr-12 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 font-normal"
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
                    className="text-xs font-medium text-gray-500 hover:text-[#FEC312] transition-colors"
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
                  disabled={isLoading || !username || !passkey || !usernameFormatValid(normalizeUsername(username))}
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
                className="text-[#111111] font-semibold hover:text-[#FEC312]"
                disabled={isLoading}
            >
                Create one
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

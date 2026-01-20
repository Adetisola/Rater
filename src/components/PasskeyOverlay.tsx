import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Avatar } from '../logic/mockData';
import { ForgotPasskeyOverlay } from './ForgotPasskeyOverlay';

interface PasskeyOverlayProps {
  avatar: Avatar;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasskeyOverlay({ avatar, onClose, onSuccess }: PasskeyOverlayProps) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleEnter = () => {
    if (passkey === avatar.passkey) {
      onSuccess();
    } else {
      setError(true);
      // Optional: Shake animation or toast
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {showForgot ? (
          <ForgotPasskeyOverlay 
              avatar={avatar} 
              onCancel={() => setShowForgot(false)}
              onSend={(email) => {
                  // Mock sending email
                  console.log("Sending recovery to:", email);
                  alert("Recovery link sent to " + email);
                  setShowForgot(false);
              }}
          />
      ) : (
          <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col items-center">
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-[#111111] mb-8">Enter Passkey</h2>

            {/* Avatar Display */}
            <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    {avatar.avatarUrl ? (
                        <img src={avatar.avatarUrl} alt={avatar.name} className="w-full h-full object-cover" />
                    ) : (
                        <div 
                            className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: avatar.bgColor }}
                        >
                            {avatar.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
                <span className="font-bold text-lg text-[#111111]">{avatar.name}</span>
            </div>

            {/* Passkey Input */}
            <div className="w-full mb-2">
                <Input 
                    type="password"
                    placeholder="Passkey"
                    value={passkey}
                    onChange={(e) => {
                        setPasskey(e.target.value);
                        setError(false);
                    }}
                    className={`h-12 rounded-xl text-lg transition-all ${error ? '!border-red-500 !ring-red-500/20 focus-visible:!border-red-500 focus-visible:!ring-red-500/20' : 'border-gray-200'}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                    autoFocus
                />
                {error && (
                    <p className="text-red-500 text-sm font-medium mt-1 ml-1 animate-in slide-in-from-top-1">
                        Incorrect passkey
                    </p>
                )}
            </div>

            {/* Forgot Password Link */}
            <button 
                onClick={() => setShowForgot(true)}
                className="text-sm font-semibold text-[#111111] underline mb-8 hover:text-gray-600 transition-colors self-start ml-1"
            >
                Forgot Passkey?
            </button>

            {/* Enter Button */}
            <Button 
                onClick={handleEnter}
                variant="outline"
                className="px-6 h-12 rounded-full text-base font-bold border-[#FEC312] hover:bg-[#FEC312] hover:text-white transition-all"
            >
                Enter
            </Button>
          </div>
      )}
    </div>
  );
}

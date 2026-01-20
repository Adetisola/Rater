import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Avatar } from '../logic/mockData';

interface PasskeyOverlayProps {
  avatar: Avatar;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasskeyOverlay({ avatar, onClose, onSuccess }: PasskeyOverlayProps) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState(false);

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

      {/* Modal Content */}
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col items-center">
        
        {/* Header - Back Button */}
        <div className="w-full flex justify-start mb-4">
            <button 
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-2 rounded-full border border-[#111111] text-sm font-bold hover:bg-gray-50 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back
            </button>
        </div>

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
        <button className="text-sm font-bold text-[#111111] underline mb-8 hover:text-gray-600 transition-colors">
            Forgot Passkey?
        </button>

        {/* Enter Button */}
        <Button 
            onClick={handleEnter}
            variant="outline"
            className="px-12 h-12 rounded-full text-base font-bold border-[#FEC312] hover:bg-[#FEC312] hover:text-white transition-all"
        >
            Enter
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';
import type { Avatar } from '../logic/mockData';

interface EnterPasskeyOverlayProps {
  avatar: Avatar;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnterPasskeyOverlay({ avatar, onClose, onSuccess }: EnterPasskeyOverlayProps) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === avatar.passkey) {
        onSuccess();
    } else {
        setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
            <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
            <div 
               className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-sm"
               style={{ backgroundColor: avatar.avatarUrl ? 'transparent' : avatar.bgColor }}
            >
               {avatar.avatarUrl ? (
                  <img src={avatar.avatarUrl} alt={avatar.name} className="w-full h-full rounded-full object-cover" />
               ) : (
                  avatar.name.substring(0, 2).toUpperCase()
               )}
            </div>
            <h2 className="text-2xl font-bold mb-1">Enter Passkey</h2>
            <p className="text-gray-500 text-sm">Verify it's really you posting as <span className="text-black font-semibold">{avatar.name}</span>.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                 <Input 
                    type="password" 
                    placeholder="••••••" 
                    value={passkey}
                    onChange={(e) => {
                        setPasskey(e.target.value);
                        setError(false);
                    }}
                    className={error ? "border-red-500 focus-visible:border-red-500" : ""}
                    autoFocus
                 />
                 {error && <p className="text-red-500 text-xs mt-2 ml-1">Incorrect passkey</p>}
                 
                 <div className="text-right mt-2">
                     <button type="button" className="text-xs text-brand font-medium hover:underline">Forgot passkey?</button>
                 </div>
            </div>

            <div className="pt-2 flex gap-3">
                 <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Back</Button>
                 <Button type="submit" variant="primary" className="flex-1">Enter</Button>
            </div>
        </form>

      </div>
    </div>
  );
}

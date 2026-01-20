import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Avatar } from '../logic/mockData';

interface ForgotPasskeyOverlayProps {
  avatar: Avatar;
  onCancel: () => void;
  onSend: (email: string) => void;
}

export function ForgotPasskeyOverlay({ avatar, onCancel, onSend }: ForgotPasskeyOverlayProps) {
  const [email, setEmail] = useState('');

  return (
    <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 animate-in zoom-in-95 duration-200 flex flex-col items-center">
        
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2 text-[#111111]">Recover your Avatar</h2>
            <p className="text-sm text-gray-500 max-w-[290px] mx-auto leading-relaxed">
                If you added an email when creating this avatar, we can help you recover access.
            </p>
        </div>

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

        <div className="w-full mb-4">
             <Input 
                 type="email"
                 placeholder="Enter the email linked to this avatar" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="h-12 rounded-xl border-gray-300 text-sm px-4"
             />
             <p className="text-[10px] text-center text-[#111111] mt-2 font-medium">
                If no email was added, this avatar cannot be recovered.
             </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-8 w-full">
             <button 
                onClick={onCancel}
                className="py-3 px-10 rounded-full text-sm font-bold text-[#111111] hover:bg-[#FEC312] hover:text-white transition-colors"
             >
                Cancel
             </button>

             <Button 
                onClick={() => onSend(email)}
                variant="outline"
                className="px-6 h-12 rounded-full text-sm font-bold border-[#FEC312] hover:bg-[#FEC312] hover:text-white transition-all text-[#111111]"
            >
                Send Recovery Link
            </Button>
        </div>

    </div>
  );
}

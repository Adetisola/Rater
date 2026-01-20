import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ChevronLeft, User, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';

interface CreateAvatarOverlayProps {
  onClose: () => void;
  onCreate: (name: string, passkey: string, email?: string) => void;
}

export function CreateAvatarOverlay({ onClose, onCreate }: CreateAvatarOverlayProps) {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !passkey) return;
    if (passkey !== confirmPasskey) {
        alert("Passkeys do not match"); 
        return;
    }
    onCreate(name, passkey, email);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
       <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center">
        
        {/* BACK BUTTON */}
        <div className="w-full flex justify-start mb-2">
            <button 
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-2 rounded-full border border-[#111111] text-sm font-bold hover:bg-gray-50 transition-colors"
                type="button"
            >
                <ChevronLeft className="w-4 h-4" />
                Back
            </button>
        </div>

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

             <Input 
                 type="password"
                 placeholder="Enter Passkey" 
                 value={passkey}
                 onChange={(e) => setPasskey(e.target.value)}
                 className="h-12 rounded-xl border-gray-300 text-base px-4"
             />

             <Input 
                 type="password"
                 placeholder="Confirm Passkey" 
                 value={confirmPasskey}
                 onChange={(e) => setConfirmPasskey(e.target.value)}
                 className="h-12 rounded-xl border-gray-300 text-base px-4"
             />

            <Input 
                 type="email" 
                 placeholder="Recovery Email (optional)" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="h-12 rounded-xl border-gray-300 text-base px-4"
            />

            <div className="pt-4 flex justify-center">
                 <Button 
                    type="submit" 
                    variant="outline"
                    className="px-12 h-12 rounded-full text-base font-bold border-[#FEC312] hover:bg-[#FEC312] hover:text-white transition-all text-[#111111]"
                >
                    Create
                </Button>
            </div>
        </form>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';


interface ForgotPasskeyOverlayProps {

  onCancel: () => void;
  onSend: (email: string) => void;
}

export function ForgotPasskeyOverlay({ onCancel, onSend }: ForgotPasskeyOverlayProps) {
  const [email, setEmail] = useState('');

  // Lock body scroll when overlay is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        />

        <div className="bg-white w-full max-w-md rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center">
            
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-[#111111]">Recover your Avatar</h2>
                <p className="text-sm text-gray-500 max-w-[290px] mx-auto leading-relaxed">
                    If you added an email when creating this avatar, we can help you recover access.
                </p>
            </div>

            <div className="w-full mb-8">
                 <Input 
                     type="email"
                     placeholder="Enter the email linked to this avatar" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="h-12 rounded-xl border-gray-300 text-sm px-4 focus-visible:ring-[#FEC312]/20 focus-visible:border-[#FEC312]"
                 />
                 <p className="text-[10px] text-center text-[#111111] mt-3 font-medium opacity-60">
                    If no email was added, this avatar cannot be recovered.
                 </p>
            </div>

            <div className="flex items-center justify-center gap-6 w-full">
                 <button 
                    onClick={onCancel}
                    className="py-3 px-8 rounded-full text-sm font-bold text-[#111111] hover:bg-[#FEC312] hover:text-white transition-colors"
                 >
                    Cancel
                 </button>

                 <Button 
                    onClick={() => onSend(email)}
                    variant="outline"
                    disabled={!email}
                    className="px-8 h-12 rounded-full text-sm font-bold border-[#FEC312] hover:bg-[#FEC312] hover:text-white transition-all text-[#111111]"
                >
                    Send Recovery Link
                </Button>
            </div>

        </div>
    </div>,
    document.body
  );
}

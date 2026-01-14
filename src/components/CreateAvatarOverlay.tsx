import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';

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
        alert("Passkeys do not match"); // Simple validation for now
        return;
    }
    onCreate(name, passkey, email);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* CLOSE BUTTON */}
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
            <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <img src="/src/assets/icons/avatar-upload.svg" className="w-8 h-8 opacity-40" alt="New Avatar" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Create new identity</h2>
            <p className="text-gray-500 text-sm">This is how you will be attributed on Rater.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Designer Name</label>
                <Input 
                    placeholder="e.g. Sarah Design" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Passkey</label>
                     <Input 
                        type="password" 
                        placeholder="••••••" 
                        value={passkey}
                        onChange={(e) => setPasskey(e.target.value)}
                     />
                </div>
                <div>
                     <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Start Again</label>
                     <Input 
                        type="password" 
                        placeholder="••••••" 
                        value={confirmPasskey}
                        onChange={(e) => setConfirmPasskey(e.target.value)}
                     />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email (Optional)</label>
                <Input 
                    type="email" 
                    placeholder="For recovery only" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="pt-4 flex gap-3">
                 <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Back</Button>
                 <Button type="submit" variant="primary" className="flex-1">Create</Button>
            </div>
        </form>

      </div>
    </div>
  );
}

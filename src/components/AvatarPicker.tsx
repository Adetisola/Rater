import type { Avatar } from '../logic/mockData';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface AvatarPickerProps {
  avatars: Avatar[];
  selectedAvatarId?: string;
  onSelect: (avatar: Avatar) => void;
  onCreateNew: () => void;
}

export function AvatarPicker({ avatars, selectedAvatarId, onSelect, onCreateNew }: AvatarPickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {avatars.map((avatar) => {
           const isSelected = selectedAvatarId === avatar.id;
           const initials = avatar.name.substring(0, 2).toUpperCase();
           
           return (
             <div 
                key={avatar.id}
                onClick={() => !avatar.isBlocked && onSelect(avatar)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-gray-50",
                  isSelected ? "border-black bg-gray-50" : "border-gray-100",
                  avatar.isBlocked && "opacity-50 cursor-not-allowed grayscale"
                )}
             >
                {/* AVATAR CIRCLE */}
                <div 
                   className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-sm"
                   style={{ backgroundColor: avatar.avatarUrl ? 'transparent' : avatar.bgColor }}
                >
                   {avatar.avatarUrl ? (
                      <img src={avatar.avatarUrl} alt={avatar.name} className="w-full h-full rounded-full object-cover" />
                   ) : (
                      initials
                   )}
                   
                   {/* BLOCKED ICON OVERLAY */}
                   {avatar.isBlocked && (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/src/assets/icons/status-blocked.svg" className="w-6 h-6" alt="Blocked" />
                     </div>
                   )}
                </div>
                
                <span className="text-xs font-medium text-center truncate w-full">{avatar.name}</span>
             </div>
           );
        })}
      </div>
      
      <Button variant="secondary" className="w-full py-6 border-dashed" onClick={onCreateNew}>
         + Create new identity
      </Button>
    </div>
  );
}

import type { Avatar } from '../logic/mockData';

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
      <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
        {avatars.map((avatar) => {
           const isSelected = selectedAvatarId === avatar.id;
           const initials = avatar.name.substring(0, 2).toUpperCase();
           
           return (
             <div 
                key={avatar.id}
                onClick={() => !avatar.isBlocked && onSelect(avatar)}
                className={cn(
                  "flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-80",
                  avatar.isBlocked && "opacity-50 cursor-not-allowed grayscale"
                )}
             >
                {/* AVATAR CIRCLE */}
                <div 
                   className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-sm relative overflow-hidden transition-all duration-200",
                     isSelected ? "ring-2 ring-black ring-offset-2 scale-110" : ""
                   )}
                   style={{ backgroundColor: avatar.avatarUrl ? 'transparent' : avatar.bgColor }}
                >
                   {avatar.avatarUrl ? (
                      <img src={avatar.avatarUrl} alt={avatar.name} className="w-full h-full object-cover" />
                   ) : (
                      initials
                   )}
                   
                   {/* BLOCKED ICON OVERLAY */}
                   {avatar.isBlocked && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <img src="/icons/status-blocked.svg" className="w-6 h-6" alt="Blocked" />
                     </div>
                   )}
                </div>
                
                <span className="text-[10px] font-medium text-center truncate w-full text-[#111111]">{avatar.name}</span>
             </div>
           );
        })}

        {/* CREATE NEW BUTTON (Grid Item) */}
        <button 
            onClick={onCreateNew}
            className="flex flex-col items-center justify-center cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-[#FEC312] group-hover:text-[#FEC312] transition-colors mb-2">
                <span className="text-xl font-bold">+</span>
            </div>
            <span className="text-[10px] font-medium text-center text-gray-400 group-hover:text-[#FEC312] transition-colors">Create New</span>
        </button>
      </div>
    </div>
  );
}

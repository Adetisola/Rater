import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateThumbnail, extractPublicId } from '@/lib/cloudinary/transforms';
import { useMemo } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  className?: string;
  iconClassName?: string;
}

export function UserAvatar({ avatarUrl, className, iconClassName }: UserAvatarProps) {
  const optimizedUrl = useMemo(() => {
    if (!avatarUrl) return null;
    const publicId = extractPublicId(avatarUrl);
    if (publicId) {
      return generateThumbnail(publicId, 200, 200);
    }
    return avatarUrl;
  }, [avatarUrl]);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 overflow-hidden",
        !avatarUrl && "bg-gray-100 border border-gray-200/50",
        className
      )}
    >
      {optimizedUrl ? (
        <img 
          src={optimizedUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover rounded-full" 
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <User className={cn("w-1/2 h-1/2 text-gray-400", iconClassName)} strokeWidth={2.5} />
      )}
    </div>
  );
}

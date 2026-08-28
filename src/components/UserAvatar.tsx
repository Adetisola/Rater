"use client";

import { useState, useMemo } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type AvatarPreset, 
  AVATAR_PRESETS, 
  optimizeAvatarUrl 
} from '@/lib/cloudinary/transforms';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  size?: AvatarPreset;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
  alt?: string;
}

export function UserAvatar({ 
  avatarUrl, 
  size = 'md',
  priority = false,
  className, 
  iconClassName,
  alt = "User Avatar"
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const optimizedUrl = useMemo(() => {
    return optimizeAvatarUrl(avatarUrl, size);
  }, [avatarUrl, size]);

  const sizeConfig = AVATAR_PRESETS[size] || AVATAR_PRESETS.md;
  const showImage = Boolean(optimizedUrl && !hasError);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 overflow-hidden relative select-none",
        !showImage && "bg-gray-100 border border-gray-200/50",
        className
      )}
    >
      {showImage ? (
        <img 
          src={optimizedUrl!} 
          alt={alt}
          width={sizeConfig.containerSize}
          height={sizeConfig.containerSize}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full" 
        />
      ) : (
        <User className={cn("w-1/2 h-1/2 text-gray-400", iconClassName)} strokeWidth={2.5} />
      )}
    </div>
  );
}

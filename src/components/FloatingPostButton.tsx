"use client";

import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { CloudUpload } from 'lucide-react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { cn } from '../lib/utils';

export function FloatingPostButton() {
  const { currentAvatar } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // Only show on Avatar pages (/avatar, or /@username) for logged in users
  const isAvatarPage = pathname.startsWith('/avatar') || pathname.startsWith('/@');
  if (!currentAvatar || !isAvatarPage) return null;

  // If we are on an avatar page, we should only show the post button if it's OUR OWN profile
  // For /@username
  if (params.alias) {
      const routeAlias = decodeURIComponent(params.alias as string);
      if (routeAlias.startsWith('@')) {
          const routeUsername = routeAlias.slice(1).toLowerCase();
          if (routeUsername !== currentAvatar.username.toLowerCase()) return null;
      }
  }
  
  // For /avatar/[username] (legacy or secondary)
  if (params.username) {
      const routeUsername = (params.username as string).toLowerCase();
      if (routeUsername !== currentAvatar.username.toLowerCase()) return null;
  }
  
  // Also handle the base /avatar (which currently redirects but let's be safe)
  if (pathname === '/avatar' && !params.username && !params.alias) {
      // Just showing for the owner is implied here since it's the base route
  }

  return (
    <div className="fixed bottom-6 right-6 md:right-12 lg:right-18 xl:right-30 z-45 group pointer-events-none">
        <div className="pointer-events-auto">
            <Button
                variant="outline" 
                onClick={() => {
                  window.dispatchEvent(new Event('app-navigation-start'));
                  router.push('/submit', { scroll: false });
                }}
                className={cn(
                    "w-[56px] h-[56px] sm:w-auto sm:h-14 rounded-full px-4 sm:px-6 shadow-2xl border-2 border-[#FEC312] bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap",
                    "hover:bg-[#FEC312] hover:scale-105 active:scale-95"
                )}
            >
                <div className="flex items-center gap-2">
                    <CloudUpload 
                        strokeWidth={2.25} 
                        className="h-6 w-6 shrink-0 transition-colors group-hover:text-white" 
                    />
                    <span className="hidden sm:flex items-center text-lg font-medium text-black group-hover:text-white transition-colors">
                        Post
                        <span className="max-w-0 opacity-0 overflow-hidden xl:group-hover:max-w-[120px] xl:group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <span className="pl-1.5 whitespace-nowrap">your work</span>
                        </span>
                    </span>
                </div>
            </Button>
        </div>
    </div>
  );
}

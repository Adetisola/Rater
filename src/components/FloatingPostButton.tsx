"use client";

import { useAuthState } from '../context/AuthContext';
import { Button } from './ui/Button';
import { CloudUpload } from 'lucide-react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { cn } from '../lib/utils';

export function FloatingPostButton() {
  const { currentProfile } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  if (!currentProfile) return null;

  const isBrowsePage = pathname === '/browse' || pathname === '/browse/';
  const isProfilePage = pathname.startsWith('/@');

  // Show on Browse page for authenticated users
  if (isBrowsePage) {
    // allow rendering
  } else if (isProfilePage) {
    // Only show on OUR OWN profile
    if (params.alias) {
      const routeAlias = decodeURIComponent(params.alias as string);
      if (routeAlias.startsWith('@')) {
        const routeUsername = routeAlias.slice(1).toLowerCase();
        if (routeUsername !== currentProfile.username.toLowerCase()) return null;
      }
    }
  } else {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 md:right-8 lg:right-8 xl:right-10 z-45 group pointer-events-none">
        <div className="pointer-events-auto">
            <Button
                variant="outline" 
                onClick={() => {
                  window.dispatchEvent(new Event('app-navigation-start'));
                  router.push('/submit', { scroll: false });
                }}
                className={cn(
                    "w-14 h-14 sm:w-auto sm:h-14 rounded-full px-4 sm:px-6 shadow-2xl border-2 border-primary bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap",
                    "hover:bg-primary hover:scale-105 active:scale-95"
                )}
            >
                <div className="flex items-center gap-2">
                    <CloudUpload 
                        strokeWidth={2.25} 
                        className="h-6 w-6 shrink-0 transition-colors group-hover:text-white" 
                    />
                    <span className="hidden sm:flex items-center text-lg font-medium text-black group-hover:text-white transition-colors">
                        Publish
                        <span className="max-w-0 opacity-0 overflow-hidden xl:group-hover:max-w-30 xl:group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <span className="pl-1.5 whitespace-nowrap">your work</span>
                        </span>
                    </span>
                </div>
            </Button>
        </div>
    </div>
  );
}

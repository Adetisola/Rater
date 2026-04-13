"use client";

import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { CloudUpload } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

export function FloatingPostButton() {
  const { currentAvatar } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Only show on Avatar pages (/app/avatar or /app/avatar/[id]) for logged in users
  const isAvatarPage = pathname.startsWith('/app/avatar');
  if (!currentAvatar || !isAvatarPage) return null;

  return (
    <div className="fixed bottom-6 right-6 md:right-12 lg:right-18 xl:right-30 z-60 group pointer-events-none">
        <div className="pointer-events-auto">
            <Button
                variant="outline" 
                onClick={() => router.push('/app/submit')}
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
                    <span className="hidden sm:flex items-center text-lg font-medium text-[#111111] group-hover:text-white transition-colors">
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

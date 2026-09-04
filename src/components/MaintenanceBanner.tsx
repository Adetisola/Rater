"use client";

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getPlatformSettingPublic } from '@/lib/admin/server';

export function MaintenanceBanner() {
  const [bannerData, setBannerData] = useState<{ enabled?: boolean; message?: string } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    async function checkBanner() {
      try {
        const res = await getPlatformSettingPublic('maintenance_banner');
        if (res && res.enabled && res.message) {
          setBannerData(res);
        }
      } catch {
        // Silently continue
      }
    }
    checkBanner();
  }, []);

  if (!bannerData || !bannerData.enabled || !bannerData.message || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-[60] w-full bg-surface-interactive text-text-primary px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-border-default shadow-sm animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1 justify-center px-4">
        <Megaphone size={14} className="text-primary shrink-0" />
        <span className="leading-snug">{bannerData.message}</span>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-hover transition-colors shrink-0"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}

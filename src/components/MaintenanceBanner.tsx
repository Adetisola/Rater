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
    <div className="bg-black text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between z-50 relative border-b border-white/10 shadow-sm animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1 justify-center px-4">
        <Megaphone size={14} className="text-primary shrink-0" />
        <span className="leading-snug">{bannerData.message}</span>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
